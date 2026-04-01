# Deployment Guide - Algorand Prediction Market

Complete step-by-step guide to deploy and test the prediction market platform on Algorand TestNet.

## Prerequisites

### Required Software
- Python 3.12+ with Poetry
- Node.js 18+ with npm
- AlgoKit CLI
- Pera Wallet (browser extension or mobile app)

### Install AlgoKit
```bash
# macOS/Linux
brew install algorandfoundation/tap/algokit

# Windows
winget install algorandfoundation.algokit

# Verify installation
algokit --version
```

### Get TestNet ALGO
1. Install Pera Wallet: https://perawallet.app/
2. Create/import an account
3. Switch to TestNet in settings
4. Get free TestNet ALGO: https://bank.testnet.algorand.network/

## Step 1: Deploy Smart Contracts

### 1.1 Navigate to Smart Contracts Directory
```bash
cd prediction-market/projects/prediction-market
```

### 1.2 Install Python Dependencies
```bash
poetry install
```

### 1.3 Compile Contracts
```bash
algokit compile python
```

Expected output:
```
✅ Compiled prediction_market.py
✅ Compiled oracle.py
```

### 1.4 Configure Deployment

Edit `smart_contracts/deploy_config.py` if needed to adjust:
- Fee sink address (defaults to deployer)
- Platform fee (defaults to 2% = 200 basis points)
- Oracle quorum (defaults to 1 for testnet)

### 1.5 Deploy to TestNet

```bash
algokit deploy --network testnet
```

You'll be prompted to:
1. Select or create a deployer account
2. Confirm deployment

**IMPORTANT**: Save the output App IDs:
```
✅ PredictionMarket deployed — App ID: 123456789
   App Address: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   LORA: https://lora.algokit.io/testnet/application/123456789

✅ PredictionOracle deployed — App ID: 987654321
   LORA: https://lora.algokit.io/testnet/application/987654321
```

### 1.6 Verify Deployment

Visit the LORA Explorer links to verify:
- Contracts are created
- Global state is initialized
- Contract has sufficient balance for inner transactions

## Step 2: Setup Frontend

### 2.1 Navigate to Frontend Directory
```bash
cd ../../frontend
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Configure Environment

Copy the environment template:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your deployed App IDs:
```env
# Algorand Network Configuration
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.4160.nodely.dev
NEXT_PUBLIC_ALGOD_PORT=443
NEXT_PUBLIC_ALGOD_TOKEN=
NEXT_PUBLIC_INDEXER_SERVER=https://testnet-idx.4160.nodely.dev
NEXT_PUBLIC_INDEXER_PORT=443
NEXT_PUBLIC_INDEXER_TOKEN=

# Smart Contract App IDs (REPLACE WITH YOUR IDs)
NEXT_PUBLIC_APP_ID=123456789
NEXT_PUBLIC_ORACLE_APP_ID=987654321

# Network
NEXT_PUBLIC_NETWORK=testnet
```

### 2.4 Verify TypeScript Compilation
```bash
npx tsc --noEmit
```

Should output: `Exit Code: 0` (no errors)

### 2.5 Start Development Server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 3: Test the Platform

### 3.1 Connect Wallet

1. Click "Connect Pera Wallet" button
2. Approve connection in Pera Wallet
3. Verify your address appears in the header

### 3.2 Create a Test Market

1. Click "Create Market" button
2. Fill in the form:
   - **Title**: "Will Bitcoin reach $100k by end of 2024?"
   - **Outcomes**: "Yes", "No"
   - **End Date**: Select a future date
   - **End Time**: Select a time
3. Click "Create Market"
4. Approve transaction in Pera Wallet (0.2 ALGO for storage)
5. Wait for confirmation
6. Market should appear in the dashboard

### 3.3 Place a Bet

1. Click on the market card
2. Select an outcome (e.g., "Yes")
3. Enter bet amount (minimum 1 ALGO)
4. Click "Place Bet"
5. Approve transaction in Pera Wallet
6. Wait for confirmation
7. Pool distribution should update

### 3.4 Test with Multiple Accounts

To fully test the platform:

1. Create 2-3 TestNet accounts in Pera Wallet
2. Fund each with TestNet ALGO
3. Place bets from different accounts on different outcomes
4. Observe odds changing based on pool distribution

### 3.5 Settle a Market (Oracle)

To settle a market, you need to submit an oracle attestation:

```bash
# Using AlgoKit
algokit goal app call \
  --app-id <ORACLE_APP_ID> \
  --from <PROVIDER_ADDRESS> \
  --app-arg "str:submit_attestation" \
  --app-arg "int:<MARKET_ID>" \
  --app-arg "int:0" \
  --app-arg "int:0" \
  --network testnet
```

Or use the AlgoSDK to build the transaction programmatically.

### 3.6 Claim Winnings

After market settlement:

1. Navigate to the settled market
2. If you bet on the winning outcome, click "Claim Winnings"
3. Approve transaction in Pera Wallet
4. Receive your payout

## Step 4: Monitor on LORA Explorer

### View Transactions
Every transaction link in the app opens LORA Explorer:
- Market creation transactions
- Bet placement transactions
- Settlement transactions
- Claim transactions

### View Contract State
Visit your contract on LORA:
```
https://lora.algokit.io/testnet/application/<APP_ID>
```

You can see:
- Global state (market counter, oracle address, fees)
- Box storage (market data, bet records)
- Transaction history
- Inner transactions

## Troubleshooting

### Contract Deployment Fails

**Error**: "Insufficient balance"
- **Solution**: Ensure deployer account has at least 5 ALGO

**Error**: "Logic error"
- **Solution**: Recompile contracts with `algokit compile python`

### Frontend Connection Issues

**Error**: "Failed to fetch markets"
- **Solution**: Verify App IDs in `.env.local` are correct
- **Solution**: Check Algod endpoint is accessible

**Error**: "Wallet connection failed"
- **Solution**: Ensure Pera Wallet is installed and unlocked
- **Solution**: Switch to TestNet in Pera Wallet settings

### Transaction Failures

**Error**: "Insufficient balance"
- **Solution**: Get more TestNet ALGO from dispenser

**Error**: "Transaction rejected"
- **Solution**: Check market is still active
- **Solution**: Verify minimum bet amount (1 ALGO)

**Error**: "Box not found"
- **Solution**: Market may not exist, check market ID

## Production Deployment

### Smart Contracts

For MainNet deployment:

1. Audit smart contracts thoroughly
2. Test extensively on TestNet
3. Use a multisig account for oracle providers
4. Set appropriate quorum threshold (e.g., 3-of-5)
5. Configure production fee sink address
6. Deploy with `--network mainnet`

### Frontend

For production hosting:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to hosting platform:
   - Vercel (recommended for Next.js)
   - Netlify
   - AWS Amplify
   - Self-hosted with Docker

3. Update environment variables for MainNet:
   ```env
   NEXT_PUBLIC_ALGOD_SERVER=https://mainnet-api.4160.nodely.dev
   NEXT_PUBLIC_INDEXER_SERVER=https://mainnet-idx.4160.nodely.dev
   NEXT_PUBLIC_NETWORK=mainnet
   NEXT_PUBLIC_APP_ID=<MAINNET_APP_ID>
   NEXT_PUBLIC_ORACLE_APP_ID=<MAINNET_ORACLE_APP_ID>
   ```

4. Configure custom domain and SSL

## Security Checklist

- [ ] Smart contracts audited by security firm
- [ ] Oracle providers are trusted and distributed
- [ ] Fee sink is a secure multisig account
- [ ] Frontend uses HTTPS only
- [ ] Environment variables are not exposed
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all user inputs
- [ ] Transaction signing happens client-side only
- [ ] No private keys stored in frontend
- [ ] Regular security updates for dependencies

## Maintenance

### Monitor Contract Health
- Check contract balance regularly
- Monitor for unusual transaction patterns
- Review oracle attestations for accuracy

### Update Frontend
```bash
npm update
npm audit fix
```

### Update Smart Contracts
If updates are needed:
1. Deploy new version
2. Update App IDs in frontend
3. Migrate existing markets if necessary

## Support Resources

- **Algorand Developer Portal**: https://developer.algorand.org/
- **AlgoPy Docs**: https://algorandfoundation.github.io/puya/
- **Pera Wallet Support**: https://perawallet.app/support
- **LORA Explorer**: https://lora.algokit.io/
- **Discord**: Algorand Developer Discord

---

**Congratulations!** You've successfully deployed a decentralized prediction market on Algorand. 🎉


## LocalNet Deployment Status

✅ **Successfully Deployed to LocalNet**

### Current Configuration
- **PredictionMarket App ID**: `1003`
- **PredictionOracle App ID**: `1005`
- **Network**: LocalNet (http://localhost:4001)
- **Frontend**: http://localhost:3000
- **Status**: Running and ready for testing

### Deployment Details
- Market contract funded with 5 ALGO
- Oracle configured with 1 provider (quorum = 1)
- Frontend environment variables updated
- Dev server restarted with new App IDs

### Issues Resolved

#### Oracle Deployment Error (Fixed)
**Problem**: Oracle contract deployment was failing with "logic eval error: err opcode executed" at pc=89

**Root Causes**:
1. Incorrect ABI method selector: `0xf8c0364e` 
2. Incorrect global schema: `num_uints=11`

**Solution Applied**:
- Updated method selector to `0xc3c1f207` (correct selector from ARC56 spec)
- Fixed global schema to `num_uints=3` (market_app_id, quorum, num_providers)
- File: `prediction-market/projects/prediction-market/smart_contracts/deploy_localnet.py`

### Next Steps for Testing

1. **Connect Pera Wallet** to LocalNet:
   - Open Pera Wallet mobile app
   - Scan QR code from http://localhost:3000
   - Approve connection

2. **Create Test Market**:
   - Click "Create Market" button
   - Fill in market details
   - Approve transaction (0.2 ALGO for storage)

3. **Place Bets**:
   - Select a market
   - Choose an outcome
   - Enter bet amount (minimum 1 ALGO)
   - Approve transaction

4. **Monitor on LocalNet**:
   - View contract state: http://localhost:4001/v2/applications/1003
   - Check transactions in browser console

### LocalNet Commands

```bash
# Check LocalNet status
algokit localnet status

# View contract info
algokit goal app info --app-id 1003

# Reset LocalNet (if needed)
algokit localnet reset
algokit localnet start

# Redeploy contracts
cd prediction-market/projects/prediction-market
python smart_contracts/deploy_localnet.py
```
