#!/usr/bin/env python3
"""
Inspect box data from TestNet to debug decoding issues
"""
from algosdk.v2client import algod
import algosdk

# TestNet configuration
ALGOD_SERVER = "https://testnet-api.4160.nodely.dev"
ALGOD_TOKEN = ""
APP_ID = 758027223

def inspect_market_box(market_id: int):
    """Inspect a market box and print its raw data"""
    algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_SERVER)
    
    # Construct box key: "mkt" + market_id (8 bytes)
    box_key = b"mkt" + market_id.to_bytes(8, 'big')
    
    print(f"Inspecting market {market_id}")
    print(f"Box key (hex): {box_key.hex()}")
    print(f"Box key (bytes): {box_key}")
    print()
    
    try:
        # Get box value
        box_response = algod_client.application_box_by_name(APP_ID, box_key)
        box_data_b64 = box_response['value']
        
        # Decode from base64
        import base64
        box_data = base64.b64decode(box_data_b64)
        
        print(f"Box data length: {len(box_data)} bytes")
        print(f"Box data (hex): {box_data.hex()}")
        print()
        
        # Try to decode step by step
        offset = 0
        
        # Title (arc4.String = 2-byte length + UTF-8 bytes)
        title_len = int.from_bytes(box_data[offset:offset+2], 'big')
        offset += 2
        print(f"Title length: {title_len}")
        
        if offset + title_len > len(box_data):
            print(f"ERROR: Title length {title_len} exceeds remaining data!")
            return
            
        title = box_data[offset:offset+title_len].decode('utf-8')
        offset += title_len
        print(f"Title: '{title}'")
        print(f"Offset after title: {offset}")
        print()
        
        # Outcome 0
        outcome0_len = int.from_bytes(box_data[offset:offset+2], 'big')
        offset += 2
        print(f"Outcome 0 length: {outcome0_len}")
        
        if offset + outcome0_len > len(box_data):
            print(f"ERROR: Outcome 0 length {outcome0_len} exceeds remaining data!")
            return
            
        outcome0 = box_data[offset:offset+outcome0_len].decode('utf-8')
        offset += outcome0_len
        print(f"Outcome 0: '{outcome0}'")
        print(f"Offset after outcome 0: {offset}")
        print()
        
        # Outcome 1
        outcome1_len = int.from_bytes(box_data[offset:offset+2], 'big')
        offset += 2
        print(f"Outcome 1 length: {outcome1_len}")
        
        if offset + outcome1_len > len(box_data):
            print(f"ERROR: Outcome 1 length {outcome1_len} exceeds remaining data!")
            return
            
        outcome1 = box_data[offset:offset+outcome1_len].decode('utf-8')
        offset += outcome1_len
        print(f"Outcome 1: '{outcome1}'")
        print(f"Offset after outcome 1: {offset}")
        print()
        
        # Outcome 2
        outcome2_len = int.from_bytes(box_data[offset:offset+2], 'big')
        offset += 2
        print(f"Outcome 2 length: {outcome2_len}")
        outcome2 = box_data[offset:offset+outcome2_len].decode('utf-8')
        offset += outcome2_len
        print(f"Outcome 2: '{outcome2}'")
        print(f"Offset after outcome 2: {offset}")
        print()
        
        # Outcome 3
        outcome3_len = int.from_bytes(box_data[offset:offset+2], 'big')
        offset += 2
        print(f"Outcome 3 length: {outcome3_len}")
        outcome3 = box_data[offset:offset+outcome3_len].decode('utf-8')
        offset += outcome3_len
        print(f"Outcome 3: '{outcome3}'")
        print(f"Offset after outcome 3: {offset}")
        print()
        
        # num_outcomes (uint8 = 1 byte)
        num_outcomes = box_data[offset]
        offset += 1
        print(f"Num outcomes: {num_outcomes}")
        print(f"Offset after num_outcomes: {offset}")
        print()
        
        # end_timestamp (uint64 = 8 bytes)
        end_timestamp = int.from_bytes(box_data[offset:offset+8], 'big')
        offset += 8
        print(f"End timestamp: {end_timestamp}")
        print(f"Offset after end_timestamp: {offset}")
        print()
        
        # winning_index (uint8 = 1 byte)
        winning_index = box_data[offset]
        offset += 1
        print(f"Winning index: {winning_index}")
        print()
        
        # is_cancelled (bool = 1 byte)
        is_cancelled = box_data[offset] != 0
        offset += 1
        print(f"Is cancelled: {is_cancelled}")
        print()
        
        # pool_0 (uint64 = 8 bytes)
        pool_0 = int.from_bytes(box_data[offset:offset+8], 'big')
        offset += 8
        print(f"Pool 0: {pool_0}")
        
        # pool_1
        pool_1 = int.from_bytes(box_data[offset:offset+8], 'big')
        offset += 8
        print(f"Pool 1: {pool_1}")
        
        # pool_2
        pool_2 = int.from_bytes(box_data[offset:offset+8], 'big')
        offset += 8
        print(f"Pool 2: {pool_2}")
        
        # pool_3
        pool_3 = int.from_bytes(box_data[offset:offset+8], 'big')
        offset += 8
        print(f"Pool 3: {pool_3}")
        
        # total_pool
        total_pool = int.from_bytes(box_data[offset:offset+8], 'big')
        offset += 8
        print(f"Total pool: {total_pool}")
        print()
        
        # creator (address = 32 bytes)
        creator_bytes = box_data[offset:offset+32]
        offset += 32
        creator = algosdk.encoding.encode_address(creator_bytes)
        print(f"Creator: {creator}")
        print(f"Final offset: {offset}")
        print(f"Remaining bytes: {len(box_data) - offset}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Inspect market ID 1 (the one that was just created)
    inspect_market_box(1)
