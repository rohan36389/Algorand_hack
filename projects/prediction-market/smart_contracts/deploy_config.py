import algokit_utils
import algosdk
from algosdk.atomic_transaction_composer import (
    AtomicTransactionComposer,
    TransactionWithSigner,
)
from algosdk.transaction import PaymentTxn


def deploy(
    algod_client: algosdk.v2client.algod.AlgodClient,
    indexer_client: algosdk.v2client.indexer.IndexerClient,
    deployer: algokit_utils.Account,
) -> None:
    from smart_contracts.artifacts.prediction_market.prediction_market_client import (
        PredictionMarketClient,
    )
    from smart_contracts.artifacts.oracle.oracle_client import (
        PredictionOracleClient,
    )

    # ── 1. Deploy Prediction Market ────────────────────────────────────────
    market_client = PredictionMarketClient(
        algod_client,
        creator=deployer,
        indexer_client=indexer_client,
    )

    sp = algod_client.suggested_params()
    fee_sink = deployer.address  # In prod, use a multisig treasury address

    market_client.deploy(
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
        on_update=algokit_utils.OnUpdate.AppendApp,
        create_args=algokit_utils.ABICall(
            market_client.bootstrap,
            oracle=deployer.address,   # Will be replaced by oracle contract address
            fee_sink=fee_sink,
            fee_bps=200,               # 2%
        ),
    )
    market_app_id = market_client.app_id
    market_app_address = market_client.app_address

    print(f"✅ PredictionMarket deployed — App ID: {market_app_id}")
    print(f"   App Address: {market_app_address}")
    print(f"   LORA: https://lora.algokit.io/testnet/application/{market_app_id}")

    # Fund the market contract for inner transactions (MBR + fee buffer)
    algokit_utils.ensure_funded(
        algod_client,
        algokit_utils.EnsureBalanceParameters(
            account_to_fund=market_app_address,
            min_spending_balance_micro_algos=5_000_000,  # 5 ALGO
            min_funding_increment_micro_algos=1_000_000,
            funding_source=deployer,
        ),
    )

    # ── 2. Deploy Oracle ───────────────────────────────────────────────────
    oracle_client = PredictionOracleClient(
        algod_client,
        creator=deployer,
        indexer_client=indexer_client,
    )

    # For testnet demo, deployer acts as all 3 providers
    oracle_client.deploy(
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
        on_update=algokit_utils.OnUpdate.AppendApp,
        create_args=algokit_utils.ABICall(
            oracle_client.bootstrap,
            market_app_id=market_app_id,
            quorum=1,                       # 1-of-1 for dev/testnet
            provider_0=deployer.address,
            provider_1=deployer.address,
            provider_2=deployer.address,
        ),
    )
    oracle_app_id = oracle_client.app_id
    print(f"✅ PredictionOracle deployed — App ID: {oracle_app_id}")
    print(f"   LORA: https://lora.algokit.io/testnet/application/{oracle_app_id}")

    # ── 3. Update market contract to use oracle address as the settler ─────
    # (In a real deploy the oracle contract address would be set as oracle_address)
    print("\n📝 Next steps:")
    print(f"   Set NEXT_PUBLIC_APP_ID={market_app_id} in .env.local")
    print(f"   Set NEXT_PUBLIC_ORACLE_APP_ID={oracle_app_id} in .env.local")
    print(f"   Fund market contract: {market_app_address}")
