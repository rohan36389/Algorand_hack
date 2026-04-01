from algopy import (
    ARC4Contract,
    Account,
    Bytes,
    Global,
    GlobalState,
    String,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
    op,
    subroutine,
    urange,
)

# ─── ARC-4 Structs ────────────────────────────────────────────────────────────

class MarketState(arc4.Struct):
    title: arc4.String
    outcome_0: arc4.String
    outcome_1: arc4.String
    outcome_2: arc4.String
    outcome_3: arc4.String
    num_outcomes: arc4.UInt8
    end_timestamp: arc4.UInt64
    winning_index: arc4.UInt8          # 255 = unsettled
    is_cancelled: arc4.Bool
    pool_0: arc4.UInt64
    pool_1: arc4.UInt64
    pool_2: arc4.UInt64
    pool_3: arc4.UInt64
    total_pool: arc4.UInt64
    creator: arc4.Address


class BetRecord(arc4.Struct):
    option_index: arc4.UInt8
    amount: arc4.UInt64
    claimed: arc4.Bool


# ─── Contract ────────────────────────────────────────────────────────────────

class PredictionMarket(ARC4Contract):

    def __init__(self) -> None:
        self.market_counter = GlobalState(UInt64, key=b"mc")
        self.oracle_address = GlobalState(Account, key=b"oa")
        self.fee_sink = GlobalState(Account, key=b"fs")
        self.platform_fee_bps = GlobalState(UInt64, key=b"fb")

    # ── Bootstrap ─────────────────────────────────────────────────────────

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def bootstrap(
        self,
        oracle: arc4.Address,
        fee_sink: arc4.Address,
        fee_bps: arc4.UInt64,
    ) -> None:
        """Deploy and initialise the contract (called once by creator)."""
        self.market_counter.value = UInt64(0)
        self.oracle_address.value = oracle.native
        self.fee_sink.value = fee_sink.native
        self.platform_fee_bps.value = fee_bps.native

    # ── Create Market ─────────────────────────────────────────────────────

    @arc4.abimethod
    def create_market(
        self,
        title: arc4.String,
        outcome_0: arc4.String,
        outcome_1: arc4.String,
        outcome_2: arc4.String,
        outcome_3: arc4.String,
        num_outcomes: arc4.UInt8,
        end_timestamp: arc4.UInt64,
        mbr_payment: gtxn.PaymentTransaction,
    ) -> arc4.UInt64:
        """
        Create a new prediction market.

        mbr_payment must cover the MBR for the new Market box
        (≈ 0.1 ALGO base + 400 * box_size).  The frontend should
        calculate and send the exact amount.

        Returns the new market_id (1-indexed).
        """
        # Validate caller sent enough ALGO for the box MBR
        assert mbr_payment.receiver == Global.current_application_address, "payment must go to app"
        assert mbr_payment.amount >= UInt64(200_000), "MBR payment too low (min 0.2 ALGO)"

        # Validate timestamps
        assert end_timestamp.native > Global.latest_timestamp, "end time must be in future"

        # Validate num_outcomes
        assert num_outcomes.native >= UInt64(2), "need at least 2 outcomes"
        assert num_outcomes.native <= UInt64(4), "max 4 outcomes supported"

        # Assign market ID
        new_id = self.market_counter.value + UInt64(1)
        self.market_counter.value = new_id

        # Build market state
        market = MarketState(
            title=title,
            outcome_0=outcome_0,
            outcome_1=outcome_1,
            outcome_2=outcome_2,
            outcome_3=outcome_3,
            num_outcomes=num_outcomes,
            end_timestamp=end_timestamp,
            winning_index=arc4.UInt8(255),      # 255 = unsettled
            is_cancelled=arc4.Bool(False),
            pool_0=arc4.UInt64(0),
            pool_1=arc4.UInt64(0),
            pool_2=arc4.UInt64(0),
            pool_3=arc4.UInt64(0),
            total_pool=arc4.UInt64(0),
            creator=arc4.Address(Txn.sender),
        )

        # Write to box storage
        box_key = self._market_box_key(new_id)
        op.Box.put(box_key, market.bytes)

        return arc4.UInt64(new_id)

    # ── Place Bet ─────────────────────────────────────────────────────────

    @arc4.abimethod
    def place_bet(
        self,
        market_id: arc4.UInt64,
        option_index: arc4.UInt8,
        payment: gtxn.PaymentTransaction,
    ) -> None:
        """
        Place a bet on a market outcome.

        payment.amount must be ≥ 1 000 000 microAlgos (1 ALGO).
        The payment must be sent to the contract address.
        """
        assert payment.receiver == Global.current_application_address, "pay to app"
        assert payment.amount >= UInt64(1_000_000), "min bet 1 ALGO"

        # Load and validate market
        market = self._load_market(market_id.native)

        assert not market.is_cancelled.native, "market cancelled"
        assert market.winning_index.native == UInt64(255), "market already settled"
        assert Global.latest_timestamp < market.end_timestamp.native, "market closed"
        assert option_index.native < market.num_outcomes.native, "invalid option"

        # Check for existing bet — accumulate if re-betting
        bet_key = self._bet_box_key(market_id.native, Txn.sender)
        existing, exists = op.Box.get(bet_key)

        amount = payment.amount

        if exists:
            old_bet = BetRecord.from_bytes(existing)
            assert old_bet.option_index.native == option_index.native, "cannot change option"
            assert not old_bet.claimed.native, "already claimed"
            new_amount = old_bet.amount.native + amount
            new_bet = BetRecord(
                option_index=option_index,
                amount=arc4.UInt64(new_amount),
                claimed=arc4.Bool(False),
            )
            op.Box.put(bet_key, new_bet.bytes)
        else:
            # Create MBR for bet box — caller must have enough min balance
            # (box creation is paid from contract's MBR balance via the mbr_payment
            #  in create_market; for bets the extra box cost is small and already
            #  covered by the bet amount exceeding 1 ALGO)
            new_bet = BetRecord(
                option_index=option_index,
                amount=arc4.UInt64(amount),
                claimed=arc4.Bool(False),
            )
            op.Box.put(bet_key, new_bet.bytes)

        # Update pool tallies
        updated_market = self._add_to_pool(market, option_index.native, amount)
        op.Box.put(self._market_box_key(market_id.native), updated_market.bytes)

    # ── Settle Market ─────────────────────────────────────────────────────

    @arc4.abimethod
    def settle_market(
        self,
        market_id: arc4.UInt64,
        winning_index: arc4.UInt8,
    ) -> None:
        """
        Oracle-only: finalise a market with the winning outcome index.
        Also sends the 2 % platform fee to fee_sink via inner transaction.
        """
        assert Txn.sender == self.oracle_address.value, "oracle only"

        market = self._load_market(market_id.native)
        assert not market.is_cancelled.native, "cancelled"
        assert market.winning_index.native == UInt64(255), "already settled"
        assert winning_index.native < market.num_outcomes.native, "bad winning index"

        # Take platform fee
        total = market.total_pool.native
        fee_bps = self.platform_fee_bps.value
        fee_amount = (total * fee_bps) // UInt64(10_000)

        if fee_amount > UInt64(0):
            itxn.Payment(
                receiver=self.fee_sink.value,
                amount=fee_amount,
                fee=Global.min_txn_fee,
            ).submit()

        # Write settled market back to box
        settled = MarketState(
            title=market.title,
            outcome_0=market.outcome_0,
            outcome_1=market.outcome_1,
            outcome_2=market.outcome_2,
            outcome_3=market.outcome_3,
            num_outcomes=market.num_outcomes,
            end_timestamp=market.end_timestamp,
            winning_index=winning_index,
            is_cancelled=market.is_cancelled,
            pool_0=market.pool_0,
            pool_1=market.pool_1,
            pool_2=market.pool_2,
            pool_3=market.pool_3,
            total_pool=market.total_pool,
            creator=market.creator,
        )
        op.Box.put(self._market_box_key(market_id.native), settled.bytes)

    # ── Cancel Market ─────────────────────────────────────────────────────

    @arc4.abimethod
    def cancel_market(self, market_id: arc4.UInt64) -> None:
        """
        Creator or oracle can cancel a market (full refund path).
        Bettors must call claim_refund() individually.
        """
        market = self._load_market(market_id.native)
        assert (
            Txn.sender == market.creator.native
            or Txn.sender == self.oracle_address.value
        ), "not authorised"
        assert market.winning_index.native == UInt64(255), "already settled"

        cancelled = MarketState(
            title=market.title,
            outcome_0=market.outcome_0,
            outcome_1=market.outcome_1,
            outcome_2=market.outcome_2,
            outcome_3=market.outcome_3,
            num_outcomes=market.num_outcomes,
            end_timestamp=market.end_timestamp,
            winning_index=market.winning_index,
            is_cancelled=arc4.Bool(True),
            pool_0=market.pool_0,
            pool_1=market.pool_1,
            pool_2=market.pool_2,
            pool_3=market.pool_3,
            total_pool=market.total_pool,
            creator=market.creator,
        )
        op.Box.put(self._market_box_key(market_id.native), cancelled.bytes)

    # ── Claim Winnings ────────────────────────────────────────────────────

    @arc4.abimethod
    def claim_winnings(self, market_id: arc4.UInt64) -> arc4.UInt64:
        """
        Winning bettors call this to receive their payout.
        Payout = (bettor_stake / winning_pool) * (total_pool * (1 - fee%))
        Returns the payout amount in microAlgos.
        """
        market = self._load_market(market_id.native)
        assert not market.is_cancelled.native, "use claim_refund for cancelled markets"
        assert market.winning_index.native != UInt64(255), "not settled yet"

        bet_key = self._bet_box_key(market_id.native, Txn.sender)
        raw_bet, exists = op.Box.get(bet_key)
        assert exists, "no bet found"

        bet = BetRecord.from_bytes(raw_bet)
        assert not bet.claimed.native, "already claimed"
        assert bet.option_index.native == market.winning_index.native, "not a winner"

        # Calculate payout
        winning_pool = self._get_pool(market, market.winning_index.native)
        assert winning_pool > UInt64(0), "zero winning pool"

        total = market.total_pool.native
        fee_bps = self.platform_fee_bps.value
        net_pool = total - (total * fee_bps // UInt64(10_000))
        payout = (bet.amount.native * net_pool) // winning_pool

        # Mark as claimed
        claimed_bet = BetRecord(
            option_index=bet.option_index,
            amount=bet.amount,
            claimed=arc4.Bool(True),
        )
        op.Box.put(bet_key, claimed_bet.bytes)

        # Send payout
        itxn.Payment(
            receiver=Txn.sender,
            amount=payout,
            fee=Global.min_txn_fee,
        ).submit()

        return arc4.UInt64(payout)

    # ── Claim Refund (cancelled market) ───────────────────────────────────

    @arc4.abimethod
    def claim_refund(self, market_id: arc4.UInt64) -> arc4.UInt64:
        """
        Bettors reclaim their original stake when a market is cancelled.
        """
        market = self._load_market(market_id.native)
        assert market.is_cancelled.native, "market not cancelled"

        bet_key = self._bet_box_key(market_id.native, Txn.sender)
        raw_bet, exists = op.Box.get(bet_key)
        assert exists, "no bet found"

        bet = BetRecord.from_bytes(raw_bet)
        assert not bet.claimed.native, "already claimed"

        refund = bet.amount.native

        claimed_bet = BetRecord(
            option_index=bet.option_index,
            amount=bet.amount,
            claimed=arc4.Bool(True),
        )
        op.Box.put(bet_key, claimed_bet.bytes)

        itxn.Payment(
            receiver=Txn.sender,
            amount=refund,
            fee=Global.min_txn_fee,
        ).submit()

        return arc4.UInt64(refund)

    # ── Read-only ABI methods ──────────────────────────────────────────────

    @arc4.abimethod(readonly=True)
    def get_market(self, market_id: arc4.UInt64) -> MarketState:
        return self._load_market(market_id.native)

    @arc4.abimethod(readonly=True)
    def get_bet(
        self, market_id: arc4.UInt64, bettor: arc4.Address
    ) -> BetRecord:
        bet_key = self._bet_box_key(market_id.native, bettor.native)
        raw, exists = op.Box.get(bet_key)
        assert exists, "no bet"
        return BetRecord.from_bytes(raw)

    @arc4.abimethod(readonly=True)
    def get_market_count(self) -> arc4.UInt64:
        return arc4.UInt64(self.market_counter.value)

    # ── Internal subroutines ──────────────────────────────────────────────

    @subroutine
    def _market_box_key(self, market_id: UInt64) -> Bytes:
        return b"mkt" + op.itob(market_id)

    @subroutine
    def _bet_box_key(self, market_id: UInt64, bettor: Account) -> Bytes:
        return b"bet" + op.itob(market_id) + bettor.bytes

    @subroutine
    def _load_market(self, market_id: UInt64) -> MarketState:
        box_key = self._market_box_key(market_id)
        raw, exists = op.Box.get(box_key)
        assert exists, "market not found"
        return MarketState.from_bytes(raw)

    @subroutine
    def _get_pool(self, market: MarketState, idx: UInt64) -> UInt64:
        pool_value: UInt64
        if idx == UInt64(0):
            pool_value = market.pool_0.native
        elif idx == UInt64(1):
            pool_value = market.pool_1.native
        elif idx == UInt64(2):
            pool_value = market.pool_2.native
        else:
            pool_value = market.pool_3.native
        return pool_value

    @subroutine
    def _add_to_pool(
        self, market: MarketState, idx: UInt64, amount: UInt64
    ) -> MarketState:
        new_total = market.total_pool.native + amount
        if idx == UInt64(0):
            return MarketState(
                title=market.title,
                outcome_0=market.outcome_0,
                outcome_1=market.outcome_1,
                outcome_2=market.outcome_2,
                outcome_3=market.outcome_3,
                num_outcomes=market.num_outcomes,
                end_timestamp=market.end_timestamp,
                winning_index=market.winning_index,
                is_cancelled=market.is_cancelled,
                pool_0=arc4.UInt64(market.pool_0.native + amount),
                pool_1=market.pool_1,
                pool_2=market.pool_2,
                pool_3=market.pool_3,
                total_pool=arc4.UInt64(new_total),
                creator=market.creator,
            )
        elif idx == UInt64(1):
            return MarketState(
                title=market.title,
                outcome_0=market.outcome_0,
                outcome_1=market.outcome_1,
                outcome_2=market.outcome_2,
                outcome_3=market.outcome_3,
                num_outcomes=market.num_outcomes,
                end_timestamp=market.end_timestamp,
                winning_index=market.winning_index,
                is_cancelled=market.is_cancelled,
                pool_0=market.pool_0,
                pool_1=arc4.UInt64(market.pool_1.native + amount),
                pool_2=market.pool_2,
                pool_3=market.pool_3,
                total_pool=arc4.UInt64(new_total),
                creator=market.creator,
            )
        elif idx == UInt64(2):
            return MarketState(
                title=market.title,
                outcome_0=market.outcome_0,
                outcome_1=market.outcome_1,
                outcome_2=market.outcome_2,
                outcome_3=market.outcome_3,
                num_outcomes=market.num_outcomes,
                end_timestamp=market.end_timestamp,
                winning_index=market.winning_index,
                is_cancelled=market.is_cancelled,
                pool_0=market.pool_0,
                pool_1=market.pool_1,
                pool_2=arc4.UInt64(market.pool_2.native + amount),
                pool_3=market.pool_3,
                total_pool=arc4.UInt64(new_total),
                creator=market.creator,
            )
        else:
            return MarketState(
                title=market.title,
                outcome_0=market.outcome_0,
                outcome_1=market.outcome_1,
                outcome_2=market.outcome_2,
                outcome_3=market.outcome_3,
                num_outcomes=market.num_outcomes,
                end_timestamp=market.end_timestamp,
                winning_index=market.winning_index,
                is_cancelled=market.is_cancelled,
                pool_0=market.pool_0,
                pool_1=market.pool_1,
                pool_2=market.pool_2,
                pool_3=arc4.UInt64(market.pool_3.native + amount),
                total_pool=arc4.UInt64(new_total),
                creator=market.creator,
            )
