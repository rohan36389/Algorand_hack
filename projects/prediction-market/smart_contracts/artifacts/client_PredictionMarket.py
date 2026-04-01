# This file is auto-generated, do not modify
# flake8: noqa
# fmt: off
import typing

import algopy

class MarketState(algopy.arc4.Struct):
    title: algopy.arc4.String
    outcome_0: algopy.arc4.String
    outcome_1: algopy.arc4.String
    outcome_2: algopy.arc4.String
    outcome_3: algopy.arc4.String
    num_outcomes: algopy.arc4.UIntN[typing.Literal[8]]
    end_timestamp: algopy.arc4.UIntN[typing.Literal[64]]
    winning_index: algopy.arc4.UIntN[typing.Literal[8]]
    is_cancelled: algopy.arc4.Bool
    pool_0: algopy.arc4.UIntN[typing.Literal[64]]
    pool_1: algopy.arc4.UIntN[typing.Literal[64]]
    pool_2: algopy.arc4.UIntN[typing.Literal[64]]
    pool_3: algopy.arc4.UIntN[typing.Literal[64]]
    total_pool: algopy.arc4.UIntN[typing.Literal[64]]
    creator: algopy.arc4.Address

class BetRecord(algopy.arc4.Struct):
    option_index: algopy.arc4.UIntN[typing.Literal[8]]
    amount: algopy.arc4.UIntN[typing.Literal[64]]
    claimed: algopy.arc4.Bool

class PredictionMarket(algopy.arc4.ARC4Client, typing.Protocol):
    @algopy.arc4.abimethod(create='require')
    def bootstrap(
        self,
        oracle: algopy.arc4.Address,
        fee_sink: algopy.arc4.Address,
        fee_bps: algopy.arc4.UIntN[typing.Literal[64]],
    ) -> None:
        """
        Deploy and initialise the contract (called once by creator).
        """

    @algopy.arc4.abimethod
    def create_market(
        self,
        title: algopy.arc4.String,
        outcome_0: algopy.arc4.String,
        outcome_1: algopy.arc4.String,
        outcome_2: algopy.arc4.String,
        outcome_3: algopy.arc4.String,
        num_outcomes: algopy.arc4.UIntN[typing.Literal[8]],
        end_timestamp: algopy.arc4.UIntN[typing.Literal[64]],
        mbr_payment: algopy.gtxn.PaymentTransaction,
    ) -> algopy.arc4.UIntN[typing.Literal[64]]:
        """
        Create a new prediction market.
        mbr_payment must cover the MBR for the new Market box (≈ 0.1 ALGO base + 400 * box_size).  The frontend should calculate and send the exact amount.
        Returns the new market_id (1-indexed).
        """

    @algopy.arc4.abimethod
    def place_bet(
        self,
        market_id: algopy.arc4.UIntN[typing.Literal[64]],
        option_index: algopy.arc4.UIntN[typing.Literal[8]],
        payment: algopy.gtxn.PaymentTransaction,
    ) -> None:
        """
        Place a bet on a market outcome.
        payment.amount must be ≥ 1 000 000 microAlgos (1 ALGO). The payment must be sent to the contract address.
        """

    @algopy.arc4.abimethod
    def settle_market(
        self,
        market_id: algopy.arc4.UIntN[typing.Literal[64]],
        winning_index: algopy.arc4.UIntN[typing.Literal[8]],
    ) -> None:
        """
        Oracle-only: finalise a market with the winning outcome index.
        Also sends the 2 % platform fee to fee_sink via inner transaction.
        """

    @algopy.arc4.abimethod
    def cancel_market(
        self,
        market_id: algopy.arc4.UIntN[typing.Literal[64]],
    ) -> None:
        """
        Creator or oracle can cancel a market (full refund path).
        Bettors must call claim_refund() individually.
        """

    @algopy.arc4.abimethod
    def claim_winnings(
        self,
        market_id: algopy.arc4.UIntN[typing.Literal[64]],
    ) -> algopy.arc4.UIntN[typing.Literal[64]]:
        """
        Winning bettors call this to receive their payout.
        Payout = (bettor_stake / winning_pool) * (total_pool * (1 - fee%)) Returns the payout amount in microAlgos.
        """

    @algopy.arc4.abimethod
    def claim_refund(
        self,
        market_id: algopy.arc4.UIntN[typing.Literal[64]],
    ) -> algopy.arc4.UIntN[typing.Literal[64]]:
        """
        Bettors reclaim their original stake when a market is cancelled.
        """

    @algopy.arc4.abimethod(readonly=True)
    def get_market(
        self,
        market_id: algopy.arc4.UIntN[typing.Literal[64]],
    ) -> MarketState: ...

    @algopy.arc4.abimethod(readonly=True)
    def get_bet(
        self,
        market_id: algopy.arc4.UIntN[typing.Literal[64]],
        bettor: algopy.arc4.Address,
    ) -> BetRecord: ...

    @algopy.arc4.abimethod(readonly=True)
    def get_market_count(
        self,
    ) -> algopy.arc4.UIntN[typing.Literal[64]]: ...
