"""
Deployment script for TestNet
"""
import algosdk
from algosdk.v2client import algod
from algosdk.abi import ABIType
from pathlib import Path
import json
import os

# TestNet configuration
ALGOD_ADDRESS = "https://testnet-api.4160.nodely.dev"
ALGOD_TOKEN = ""

def deploy():
    # Connect to TestNet
    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
    
    # Get deployer account from environment or prompt
    print("=" * 60)
    print("TESTNET DEPLOYMENT")
    print("=" * 60)
    print("\nYou need a TestNet account with ALGO to deploy.")
    print("Get TestNet ALGO from: https://bank.testnet.algorand.network/")
    print()
    
    mnemonic = input("Enter your 25-word mnemonic phrase: ").strip()
    
    try:
        deployer = algosdk.mnemonic.to_private_key(mnemonic)
        deployer_address = algosdk.account.address_from_private_key(deployer)
        print(f"\nDeploying from: {deployer_address}")
        
        # Check balance
        account_info = algod_client.account_info(deployer_address)
        balance = account_info['amount'] / 1_000_000
        print(f"Balance: {balance} ALGO")
        
        if balance < 1:
            print("\n❌ ERROR: Insufficient balance. You need at least 1 ALGO for deployment.")
            print("Get TestNet ALGO from: https://bank.testnet.algorand.network/")
            return
            
    except Exception as e:
        print(f"\n❌ ERROR: Invalid mnemonic - {e}")
        return
    
    print()
    
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
    print("📝 Compiling contracts...")
    market_approval = algod_client.compile(market_approval_teal)["result"]
    market_clear = algod_client.compile(market_clear_teal)["result"]
    oracle_approval = algod_client.compile(oracle_approval_teal)["result"]
    oracle_clear = algod_client.compile(oracle_clear_teal)["result"]
    print("✅ Contracts compiled\n")
    
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
    oracle_arg = address_type.encode(algosdk.encoding.decode_address(deployer_address))
    fee_sink_arg = address_type.encode(algosdk.encoding.decode_address(deployer_address))
    fee_bps_arg = uint64_type.encode(200)
    
    # Create application WITH bootstrap call
    market_txn = algosdk.transaction.ApplicationCreateTxn(
        sender=deployer_address,
        sp=params,
        on_complete=algosdk.transaction.OnComplete.NoOpOC,
        approval_program=algosdk.encoding.base64.b64decode(market_approval),
        clear_program=algosdk.encoding.base64.b64decode(market_clear),
        global_schema=algosdk.transaction.StateSchema(num_uints=2, num_byte_slices=2),
        local_schema=algosdk.transaction.StateSchema(num_uints=0, num_byte_slices=0),
        extra_pages=3,
        app_args=[bootstrap_selector, oracle_arg, fee_sink_arg, fee_bps_arg],
    )
    
    signed_txn = market_txn.sign(deployer)
    tx_id = algod_client.send_transaction(signed_txn)
    result = algosdk.transaction.wait_for_confirmation(algod_client, tx_id, 4)
    market_app_id = result["application-index"]
    market_app_address = algosdk.logic.get_application_address(market_app_id)
    
    print(f"✅ PredictionMarket deployed and bootstrapped!")
    print(f"   App ID: {market_app_id}")
    print(f"   App Address: {market_app_address}")
    print(f"   LORA: https://lora.algokit.io/testnet/application/{market_app_id}\n")
    
    # Fund the market contract
    print("💰 Funding market contract...")
    
    # Check remaining balance
    account_info = algod_client.account_info(deployer_address)
    remaining_balance = account_info['amount']
    
    # Fund with 1 ALGO (enough for testing) if we have enough balance
    if remaining_balance > 1_100_000:  # 1.1 ALGO (1 for funding + 0.1 for fees)
        fund_txn = algosdk.transaction.PaymentTxn(
            sender=deployer_address,
            sp=params,
            receiver=market_app_address,
            amt=1_000_000,  # 1 ALGO
        )
        signed_fund = fund_txn.sign(deployer)
        fund_tx_id = algod_client.send_transaction(signed_fund)
        algosdk.transaction.wait_for_confirmation(algod_client, fund_tx_id, 4)
        print(f"✅ Funded with 1 ALGO\n")
    else:
        print(f"⚠️  Skipping funding - insufficient balance. Contract may need manual funding.\n")
    
    # Deploy PredictionOracle contract
    print("📝 Deploying PredictionOracle contract...")
    
    # Method selector for bootstrap(uint64,uint64,address,address,address)void
    oracle_bootstrap_selector = bytes.fromhex("c3c1f207")
    
    # Encode oracle bootstrap arguments
    market_app_id_arg = uint64_type.encode(market_app_id)
    quorum_arg = uint64_type.encode(1)
    provider0_arg = address_type.encode(algosdk.encoding.decode_address(deployer_address))
    provider1_arg = address_type.encode(algosdk.encoding.decode_address(deployer_address))
    provider2_arg = address_type.encode(algosdk.encoding.decode_address(deployer_address))
    
    oracle_txn = algosdk.transaction.ApplicationCreateTxn(
        sender=deployer_address,
        sp=params,
        on_complete=algosdk.transaction.OnComplete.NoOpOC,
        approval_program=algosdk.encoding.base64.b64decode(oracle_approval),
        clear_program=algosdk.encoding.base64.b64decode(oracle_clear),
        global_schema=algosdk.transaction.StateSchema(num_uints=3, num_byte_slices=9),
        local_schema=algosdk.transaction.StateSchema(num_uints=0, num_byte_slices=0),
        extra_pages=1,
        app_args=[oracle_bootstrap_selector, market_app_id_arg, quorum_arg, provider0_arg, provider1_arg, provider2_arg],
    )
    
    signed_oracle = oracle_txn.sign(deployer)
    oracle_tx_id = algod_client.send_transaction(signed_oracle)
    oracle_result = algosdk.transaction.wait_for_confirmation(algod_client, oracle_tx_id, 4)
    oracle_app_id = oracle_result["application-index"]
    oracle_app_address = algosdk.logic.get_application_address(oracle_app_id)
    
    print(f"✅ PredictionOracle deployed and bootstrapped!")
    print(f"   App ID: {oracle_app_id}")
    print(f"   App Address: {oracle_app_address}")
    print(f"   LORA: https://lora.algokit.io/testnet/application/{oracle_app_id}\n")
    
    # Print summary
    print("=" * 60)
    print("🎉 DEPLOYMENT SUCCESSFUL!")
    print("=" * 60)
    print(f"\nPredictionMarket App ID: {market_app_id}")
    print(f"PredictionOracle App ID: {oracle_app_id}")
    print(f"\nUpdate your frontend .env.local with:")
    print(f"NEXT_PUBLIC_APP_ID={market_app_id}")
    print(f"NEXT_PUBLIC_ORACLE_APP_ID={oracle_app_id}")
    print("\nLORA Explorer:")
    print(f"https://lora.algokit.io/testnet/application/{market_app_id}")
    print(f"https://lora.algokit.io/testnet/application/{oracle_app_id}")
    print("=" * 60)

if __name__ == "__main__":
    deploy()
