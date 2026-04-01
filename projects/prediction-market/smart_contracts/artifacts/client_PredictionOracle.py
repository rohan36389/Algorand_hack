# This file is auto-generated, do not modify
# flake8: noqa
# fmt: off
import typing

import algopy

class RoundState(algopy.arc4.Struct):
    market_id: algopy.arc4.UIntN[typing.Literal[64]]
    nonce: algopy.arc4.UIntN[typing.Literal[64]]
    attest_count: algopy.arc4.UIntN[typing.Literal[8]]
    winning_index: algopy.arc4.UIntN[typing.Literal[8]]
    finalised: algopy.arc4.Bool

class PredictionOracle(algopy.arc4.ARC4Client, typing.Protocol):
    @algopy.arc4.abimethod(create='require')
    def bootstrap(
        self,
        market_app_id: algopy.arc4.UIntN[typing.Literal[64]],
        quorum: algopy.arc4.UIntN[typing.Literal[64]],
        provider_0: algopy.arc4.Address,
        provider_1: algopy.arc4.Address,
        provider_2: algopy.arc4.Address,
    ) -> None:
        """
        Deploy oracle with 3 initial providers and a quorum threshold.
        """

    @algopy.arc4.abimethod
    def submit_attestation(
        self,
        market_id: algopy.arc4.UIntN[typing.Literal[64]],
        nonce: algopy.arc4.UIntN[typing.Literal[64]],
        outcome_index: algopy.arc4.UIntN[typing.Literal[8]],
        mbr_payment: algopy.gtxn.PaymentTransaction,
    ) -> algopy.arc4.Bool:
        """
        A whitelisted provider submits their vote on the market outcome.
        Returns True if this attestation triggered quorum + settlement.
        """

    @algopy.arc4.abimethod
    def update_quorum(
        self,
        new_quorum: algopy.arc4.UIntN[typing.Literal[64]],
    ) -> None: ...

    @algopy.arc4.abimethod(readonly=True)
    def get_round(
        self,
        market_id: algopy.arc4.UIntN[typing.Literal[64]],
        nonce: algopy.arc4.UIntN[typing.Literal[64]],
    ) -> RoundState: ...
