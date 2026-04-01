"""
Simple deployment script for LocalNet
"""
import algosdk
from algosdk.v2client import algod
from algokit_utils import get_localnet_default_account
from algosdk.abi import ABIType
from pathlib import Path
import json

# LocalNet configuration
ALGOD_ADDRESS = "http://localhost:4001"
ALGOD_TOKEN = "a" * 64

def deploy():
    # Connect to LocalNet
    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
    
    # Get default LocalNet account (has plenty of ALGO)
    deployer = get_localnet_default_account(algod_client)
    print(f"Deploying from: {deployer.address}")
    print(f"Balance: {algod_client.account_info(deployer.address)['amount'] / 1_000_000} ALGO\n")
    
    # Load compiled contracts
    artifacts_dir = Path(__file__).parent / "artifacts"
    
    # Read TEAL files
    with open(artifacts_dir / "PredictionMarket.approval.teal", "r") as f:
        market_approval_teal = f.read()
    with open(artifacts_dir / "PredictionMarket.clear.teal", "r") as f:
        market_clear_teal = f.read()
    with open(artifacts_dir / "PredictionOracle.approval.teal", "r") as f:
        oracle_approval_teal = f.read()
    with open(artifacts_dir / "PredictionOracle.clear.teal", "r") as f:
        oracle_clear_teal = f.read()
    
    # Compile TEAL to bytecode
    market_approval = algod_client.compile(market_approval_teal)["result"]
    market_clear = algod_client.compile(market_clear_teal)["result"]
    oracle_approval = algod_client.compile(oracle_approval_teal)["result"]
    oracle_clear = algod_client.compile(oracle_clear_teal)["result"]
    
    # Get suggested params
    params = algod_client.suggested_params()
    
    # Prepare ABI types for encoding
    address_type = ABIType.from_string("address")
    uint64_type = ABIType.from_string("uint64")
    
    # Deploy PredictionMarket contract
    print("📝 Deploying PredictionMarket contract...")
    
    # Method selector for bootstrap(address,address,uint64)void
    bootstrap_selector = bytes.fromhex("280825d8")
    
    # Encode bootstrap arguments
    oracle_arg = address_type.encode(algosdk.encoding.decode_address(deployer.address))
    fee_sink_arg = address_type.encode(algosdk.encoding.decode_address(deployer.address))
    fee_bps_arg = uint64_type.encode(200)
    
    # Create application WITH bootstrap call
    market_txn = algosdk.transaction.ApplicationCreateTxn(
        sender=deployer.address,
        sp=params,
        on_complete=algosdk.transaction.OnComplete.NoOpOC,
        approval_program=algosdk.encoding.base64.b64decode(market_approval),
        clear_program=algosdk.encoding.base64.b64decode(market_clear),
        global_schema=algosdk.transaction.StateSchema(num_uints=2, num_byte_slices=2),
        local_schema=algosdk.transaction.StateSchema(num_uints=0, num_byte_slices=0),
        extra_pages=3,
        app_args=[bootstrap_selector, oracle_arg, fee_sink_arg, fee_bps_arg],
    )
    
    signed_txn = market_txn.sign(deployer.private_key)
    tx_id = algod_client.send_transaction(signed_txn)
    result = algosdk.transaction.wait_for_confirmation(algod_client, tx_id, 4)
    market_app_id = result["application-index"]
    market_app_address = algosdk.logic.get_application_address(market_app_id)
    
    print(f"✅ PredictionMarket deployed and bootstrapped!")
    print(f"   App ID: {market_app_id}")
    print(f"   App Address: {market_app_address}\n")
    
    # Fund the market contract
    print("💰 Funding market contract...")
    fund_txn = algosdk.transaction.PaymentTxn(
        sender=deployer.address,
        sp=params,
        receiver=market_app_address,
        amt=5_000_000,
    )
    signed_fund = fund_txn.sign(deployer.private_key)
    fund_tx_id = algod_client.send_transaction(signed_fund)
    algosdk.transaction.wait_for_confirmation(algod_client, fund_tx_id, 4)
    print(f"✅ Funded with 5 ALGO\n")
    
    # Deploy PredictionOracle contract
    print("📝 Deploying PredictionOracle contract...")
    
    # Method selector for bootstrap(uint64,uint64,address,address,address)void
    oracle_bootstrap_selector = bytes.fromhex("c3c1f207")
    
    # Encode oracle bootstrap arguments
    market_app_id_arg = uint64_type.encode(market_app_id)
    quorum_arg = uint64_type.encode(1)
    provider0_arg = address_type.encode(algosdk.encoding.decode_address(deployer.address))
    provider1_arg = address_type.encode(algosdk.encoding.decode_address(deployer.address))
    provider2_arg = address_type.encode(algosdk.encoding.decode_address(deployer.address))
    
    oracle_txn = algosdk.transaction.ApplicationCreateTxn(
        sender=deployer.address,
        sp=params,
        on_complete=algosdk.transaction.OnComplete.NoOpOC,
        approval_program=algosdk.encoding.base64.b64decode(oracle_approval),
        clear_program=algosdk.encoding.base64.b64decode(oracle_clear),
        global_schema=algosdk.transaction.StateSchema(num_uints=3, num_byte_slices=9),
        local_schema=algosdk.transaction.StateSchema(num_uints=0, num_byte_slices=0),
        extra_pages=1,
        app_args=[oracle_bootstrap_selector, market_app_id_arg, quorum_arg, provider0_arg, provider1_arg, provider2_arg],
    )
    
    signed_oracle = oracle_txn.sign(deployer.private_key)
    oracle_tx_id = algod_client.send_transaction(signed_oracle)
    oracle_result = algosdk.transaction.wait_for_confirmation(algod_client, oracle_tx_id, 4)
    oracle_app_id = oracle_result["application-index"]
    oracle_app_address = algosdk.logic.get_application_address(oracle_app_id)
    
    print(f"✅ PredictionOracle deployed and bootstrapped!")
    print(f"   App ID: {oracle_app_id}")
    print(f"   App Address: {oracle_app_address}\n")
    
    # Print summary
    print("=" * 60)
    print("🎉 DEPLOYMENT SUCCESSFUL!")
    print("=" * 60)
    print(f"\nPredictionMarket App ID: {market_app_id}")
    print(f"PredictionOracle App ID: {oracle_app_id}")
    print(f"\nUpdate your frontend .env.local with:")
    print(f"NEXT_PUBLIC_APP_ID={market_app_id}")
    print(f"NEXT_PUBLIC_ORACLE_APP_ID={oracle_app_id}")
    print("\nLocalNet Explorer:")
    print(f"http://localhost:4001/v2/applications/{market_app_id}")
    print(f"http://localhost:4001/v2/applications/{oracle_app_id}")
    print("=" * 60)

if __name__ == "__main__":
    deploy()
