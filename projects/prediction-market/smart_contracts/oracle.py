from algopy import (
    ARC4Contract,
    Account,
    Bytes,
    Global,
    GlobalState,
    Txn,
    UInt64,
    arc4,
    itxn,
    op,
    subroutine,
    gtxn,
)


# ─── Structs ──────────────────────────────────────────────────────────────────

class AttestRecord(arc4.Struct):
    provider: arc4.Address
    outcome_index: arc4.UInt8
    timestamp: arc4.UInt64


class RoundState(arc4.Struct):
    market_id: arc4.UInt64
    nonce: arc4.UInt64
    attest_count: arc4.UInt8
    winning_index: arc4.UInt8    # 255 = not yet quorum
    finalised: arc4.Bool


# ─── Oracle Contract ──────────────────────────────────────────────────────────

class PredictionOracle(ARC4Contract):

    def __init__(self) -> None:
        self.market_app_id = GlobalState(UInt64, key=b"ma")
        self.quorum = GlobalState(UInt64, key=b"qu")
        self.num_providers = GlobalState(UInt64, key=b"np")
        # Provider slots (up to 8, stored as individual global state keys)
        self.provider_0 = GlobalState(Account, key=b"p0")
        self.provider_1 = GlobalState(Account, key=b"p1")
        self.provider_2 = GlobalState(Account, key=b"p2")
        self.provider_3 = GlobalState(Account, key=b"p3")
        self.provider_4 = GlobalState(Account, key=b"p4")
        self.provider_5 = GlobalState(Account, key=b"p5")
        self.provider_6 = GlobalState(Account, key=b"p6")
        self.provider_7 = GlobalState(Account, key=b"p7")
        self.admin = GlobalState(Account, key=b"ad")

    # ── Bootstrap ──────────────────────────────────────────────────────────

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def bootstrap(
        self,
        market_app_id: arc4.UInt64,
        quorum: arc4.UInt64,
        provider_0: arc4.Address,
        provider_1: arc4.Address,
        provider_2: arc4.Address,
    ) -> None:
        """Deploy oracle with 3 initial providers and a quorum threshold."""
        assert quorum.native >= UInt64(1), "quorum must be >= 1"
        assert quorum.native <= UInt64(3), "quorum cannot exceed provider count"

        self.market_app_id.value = market_app_id.native
        self.quorum.value = quorum.native
        self.num_providers.value = UInt64(3)
        self.admin.value = Txn.sender
        self.provider_0.value = provider_0.native
        self.provider_1.value = provider_1.native
        self.provider_2.value = provider_2.native

    # ── Submit Attestation ─────────────────────────────────────────────────

    @arc4.abimethod
    def submit_attestation(
        self,
        market_id: arc4.UInt64,
        nonce: arc4.UInt64,
        outcome_index: arc4.UInt8,
        mbr_payment: gtxn.PaymentTransaction,
    ) -> arc4.Bool:
        """
        A whitelisted provider submits their vote on the market outcome.
        Returns True if this attestation triggered quorum + settlement.
        """
        assert mbr_payment.receiver == Global.current_application_address
        assert mbr_payment.amount >= UInt64(100_000), "MBR too low"

        assert self._is_provider(Txn.sender), "not a provider"

        # Ensure not already attested
        att_key = self._att_key(market_id.native, nonce.native, Txn.sender)
        existing_att, already = op.Box.get(att_key)
        assert not already, "already attested"

        # Initialise round if first attestation
        rnd_key = self._round_key(market_id.native, nonce.native)
        raw_rnd, rnd_exists = op.Box.get(rnd_key)

        if rnd_exists:
            rnd = RoundState.from_bytes(raw_rnd)
            assert not rnd.finalised.native, "round finalised"
            new_count = rnd.attest_count.native + UInt64(1)
        else:
            new_count = UInt64(1)

        # Write attestation
        att = AttestRecord(
            provider=arc4.Address(Txn.sender),
            outcome_index=outcome_index,
            timestamp=arc4.UInt64(Global.latest_timestamp),
        )
        op.Box.put(att_key, att.bytes)

        # Update round state
        rnd_state = RoundState(
            market_id=market_id,
            nonce=nonce,
            attest_count=arc4.UInt8(new_count),
            winning_index=arc4.UInt8(255) if new_count < self.quorum.value
                          else outcome_index,
            finalised=arc4.Bool(new_count >= self.quorum.value),
        )
        op.Box.put(rnd_key, rnd_state.bytes)

        # If quorum reached → call market contract
        if new_count >= self.quorum.value:
            itxn.ApplicationCall(
                app_id=self.market_app_id.value,
                app_args=(
                    # settle_market(uint64,uint8)void  selector + args
                    b"\xab\x1c\x29\x10",      # precomputed selector
                    op.itob(market_id.native),
                    op.itob(outcome_index.native),
                ),
                fee=Global.min_txn_fee,
            ).submit()
            return arc4.Bool(True)

        return arc4.Bool(False)

    # ── Admin: add / remove provider ──────────────────────────────────────

    @arc4.abimethod
    def update_quorum(self, new_quorum: arc4.UInt64) -> None:
        assert Txn.sender == self.admin.value, "admin only"
        assert new_quorum.native >= UInt64(1), "quorum >= 1"
        self.quorum.value = new_quorum.native

    # ── Read-only ─────────────────────────────────────────────────────────

    @arc4.abimethod(readonly=True)
    def get_round(
        self, market_id: arc4.UInt64, nonce: arc4.UInt64
    ) -> RoundState:
        rnd_key = self._round_key(market_id.native, nonce.native)
        raw, exists = op.Box.get(rnd_key)
        assert exists, "round not found"
        return RoundState.from_bytes(raw)

    # ── Internals ─────────────────────────────────────────────────────────

    @subroutine
    def _round_key(self, market_id: UInt64, nonce: UInt64) -> Bytes:
        return b"rnd" + op.itob(market_id) + op.itob(nonce)

    @subroutine
    def _att_key(
        self, market_id: UInt64, nonce: UInt64, provider: Account
    ) -> Bytes:
        return b"att" + op.itob(market_id) + op.itob(nonce) + provider.bytes

    @subroutine
    def _is_provider(self, addr: Account) -> bool:
        return (
            addr == self.provider_0.value
            or addr == self.provider_1.value
            or addr == self.provider_2.value
        )
