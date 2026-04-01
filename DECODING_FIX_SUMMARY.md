# Market Decoding Fix Summary

## Issues Fixed

### 1. ARC-4 Struct Decoding (CRITICAL FIX)
**Problem**: The frontend was trying to decode ARC-4 structs sequentially, but ARC-4 uses offset-based encoding for dynamic types.

**Root Cause**: 
- ARC-4 structs with dynamic fields (like `arc4.String`) use a special encoding:
  - First: Offset pointers (uint16) for each dynamic field
  - Then: All static fields (uint8, uint64, bool, address)
  - Finally: The actual dynamic data at the end

**Fix Applied**:
```typescript
// OLD (WRONG): Sequential decoding
const title = decodeString(data, 0);
const outcome0 = decodeString(data, title.nextOffset);
// This read offset values as string lengths → overflow!

// NEW (CORRECT): Offset-based decoding
const titleOffset = (data[0] << 8) | data[1];
const outcome0Offset = (data[2] << 8) | data[3];
// ... read all offsets first
// ... then read static fields
// ... finally read strings at their offsets
const title = decodeStringAtOffset(data, titleOffset);
```

### 2. Market ID Fallback Logic (CRITICAL FIX)
**Problem**: If fetching market count failed, code would fallback to ID 1, causing box key mismatches.

**Fix Applied**:
```typescript
// OLD (DANGEROUS):
let nextMarketId = 1;
try {
  nextMarketId = marketCount + 1;
} catch {
  console.warn('Using default ID 1'); // ❌ Wrong!
}

// NEW (SAFE):
try {
  nextMarketId = marketCount + 1;
} catch (error) {
  throw new Error('Unable to determine next market ID'); // ✅ Fail fast
}
```

### 3. Base64 Decoding for Box Values
**Problem**: Box values from the Algorand API are base64-encoded strings, not raw Uint8Arrays.

**Fix Applied**:
```typescript
const boxResponse = await algodClient.getApplicationBoxByName(appId, boxName).do();
const boxData = typeof boxResponse.value === 'string' 
  ? new Uint8Array(Buffer.from(boxResponse.value, 'base64'))
  : boxResponse.value;
```

## Current Status

### ✅ Working
- Market decoding from box storage
- Box key encoding (matches smart contract)
- Box references in transactions
- Transaction group creation
- Pera Wallet integration

### ⚠️ User Action Required
When creating a market:
1. Fill in the market details
2. Click "Create Market"
3. **IMPORTANT**: Approve the transaction in Pera Wallet mobile app
4. Wait for confirmation (~4 seconds)
5. Market will appear on the homepage

### Common Errors and Solutions

#### Error: "invalid Box reference"
**Cause**: Transaction doesn't include the box reference (but this is now fixed in code)
**Solution**: Already fixed - box references are automatically included

#### Error: "user rejected" (code 4100)
**Cause**: User clicked reject in Pera Wallet or closed the popup
**Solution**: Try again and approve the transaction

#### Error: "overspend"
**Cause**: Insufficient ALGO balance
**Solution**: Get more TestNet ALGO from dispenser

#### Error: "assert failed pc=270"
**Cause**: Smart contract assertion failed (e.g., invalid parameters)
**Solution**: Check that:
- End time is in the future
- 2-4 outcomes provided
- All fields filled correctly

## Testing the Fix

### Test Market 1 (Already Created)
- Market ID: 1
- Title: "Will GT win today?"
- Outcomes: "Yes", "No"
- Status: Should display correctly now

### Creating Market 2
1. Open the app: http://localhost:3000
2. Connect Pera Wallet
3. Click "Create Market"
4. Fill in details:
   - Title: Any question
   - Outcomes: 2-4 options
   - End date/time: Future timestamp
5. Submit and approve in Pera Wallet
6. Should succeed with correct box reference

## Technical Details

### Box Storage Structure
```
MarketState (126 bytes for market 1):
- Bytes 0-1:   titleOffset (0x005d = 93)
- Bytes 2-3:   outcome0Offset (0x0071 = 113)
- Bytes 4-5:   outcome1Offset (0x0076 = 118)
- Bytes 6-7:   outcome2Offset (0x007a = 122)
- Bytes 8-9:   outcome3Offset (0x007c = 124)
- Byte 10:     numOutcomes (0x02 = 2)
- Bytes 11-18: endTimestamp (uint64)
- Byte 19:     winningIndex (0xff = 255 = unsettled)
- Byte 20:     isCancelled (0x00 = false)
- Bytes 21-28: pool0 (uint64)
- Bytes 29-36: pool1 (uint64)
- Bytes 37-44: pool2 (uint64)
- Bytes 45-52: pool3 (uint64)
- Bytes 53-60: totalPool (uint64)
- Bytes 61-92: creator (32-byte address)
- Bytes 93+:   Dynamic string data
```

### Box Key Encoding
```typescript
// Market box: "mkt" + market_id (8 bytes big-endian)
// Example: "mkt\x00\x00\x00\x00\x00\x00\x00\x01" for market 1

// Bet box: "bet" + market_id (8 bytes) + user_address (32 bytes)
```

## Next Steps

1. ✅ Decoding fixed
2. ✅ Box references fixed
3. ✅ Market ID logic fixed
4. 🔄 User should test creating a new market
5. ⏳ Deploy oracle contract (needs more TestNet ALGO)
6. ⏳ Test full betting flow

## Files Modified

- `prediction-market/frontend/src/lib/algorand.ts`
  - Fixed `decodeMarketState()` method
  - Fixed `buildCreateMarketTxns()` method
  - Added `decodeStringAtOffset()` helper
  - Added base64 decoding for box values
  - Removed dangerous fallback logic

## Verification

Run the Python inspection script to see raw box data:
```bash
cd prediction-market/projects/prediction-market/smart_contracts
python inspect_box.py
```

This will show the actual box structure and verify decoding is correct.
