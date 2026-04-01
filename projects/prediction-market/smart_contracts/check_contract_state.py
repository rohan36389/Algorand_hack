#!/usr/bin/env python3
"""
Check the current state of the PredictionMarket contract on TestNet
"""
from algosdk.v2client import algod
import algosdk

# TestNet configuration
ALGOD_SERVER = "https://testnet-api.4160.nodely.dev"
ALGOD_TOKEN = ""
APP_ID = 758027223

def check_contract_state():
    """Check the global state and boxes of the contract"""
    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_SERVER)
    
    print("=" * 60)
    print(f"PredictionMarket Contract State (App ID: {APP_ID})")
    print("=" * 60)
    print()
    
    try:
        # Get application info
        app_info = algod_client.application_info(APP_ID)
        
        # Print global state
        print("GLOBAL STATE:")
        print("-" * 60)
        global_state = app_info['params'].get('global-state', [])
        for item in global_state:
            key_b64 = item['key']
            key = algosdk.encoding.base64.b64decode(key_b64).decode('utf-8')
            
            if 'bytes' in item['value']:
                value_b64 = item['value']['bytes']
                value_bytes = algosdk.encoding.base64.b64decode(value_b64)
                # Try to decode as address
                if len(value_bytes) == 32:
                    value = algosdk.encoding.encode_address(value_bytes)
                else:
                    value = value_bytes.hex()
            else:
                value = item['value']['uint']
            
            print(f"  {key}: {value}")
        
        print()
        
        # Get market count
        market_count = 0
        for item in global_state:
            key_b64 = item['key']
            key = algosdk.encoding.base64.b64decode(key_b64).decode('utf-8')
            if key == 'mc':
                market_count = item['value']['uint']
                break
        
        print(f"MARKET COUNT: {market_count}")
        print()
        
        # List all boxes
        print("BOXES:")
        print("-" * 60)
        try:
            boxes_response = algod_client.application_boxes(APP_ID)
            boxes = boxes_response.get('boxes', [])
            
            if not boxes:
                print("  No boxes found")
            else:
                for box in boxes:
                    box_name_b64 = box['name']
                    box_name = algosdk.encoding.base64.b64decode(box_name_b64)
                    
                    # Try to decode box name
                    if box_name.startswith(b'mkt'):
                        market_id = int.from_bytes(box_name[3:], 'big')
                        print(f"  Market {market_id}: {box_name.hex()}")
                    elif box_name.startswith(b'bet'):
                        market_id = int.from_bytes(box_name[3:11], 'big')
                        user_addr = algosdk.encoding.encode_address(box_name[11:])
                        print(f"  Bet (Market {market_id}, User {user_addr[:8]}...): {box_name.hex()}")
                    else:
                        print(f"  Unknown: {box_name.hex()}")
        except Exception as e:
            print(f"  Error listing boxes: {e}")
        
        print()
        
        # Try to read each market
        if market_count > 0:
            print("MARKETS:")
            print("-" * 60)
            for i in range(1, market_count + 1):
                try:
                    box_key = b"mkt" + i.to_bytes(8, 'big')
                    box_response = algod_client.application_box_by_name(APP_ID, box_key)
                    box_data_b64 = box_response['value']
                    box_data = algosdk.encoding.base64.b64decode(box_data_b64)
                    
                    # Quick decode to get title
                    title_offset = int.from_bytes(box_data[0:2], 'big')
                    title_len = int.from_bytes(box_data[title_offset:title_offset+2], 'big')
                    title = box_data[title_offset+2:title_offset+2+title_len].decode('utf-8')
                    
                    # Get num_outcomes
                    num_outcomes = box_data[10]
                    
                    # Get end_timestamp
                    end_timestamp = int.from_bytes(box_data[11:19], 'big')
                    
                    # Get winning_index
                    winning_index = box_data[19]
                    
                    # Get is_cancelled
                    is_cancelled = box_data[20] != 0
                    
                    # Get total_pool
                    total_pool = int.from_bytes(box_data[53:61], 'big')
                    
                    print(f"  Market {i}:")
                    print(f"    Title: {title}")
                    print(f"    Outcomes: {num_outcomes}")
                    print(f"    End Time: {end_timestamp}")
                    print(f"    Status: {'Cancelled' if is_cancelled else ('Settled' if winning_index != 255 else 'Active')}")
                    print(f"    Total Pool: {total_pool / 1_000_000:.2f} ALGO")
                    print()
                    
                except Exception as e:
                    print(f"  Market {i}: Error reading - {e}")
                    print()
        
        print("=" * 60)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_contract_state()
