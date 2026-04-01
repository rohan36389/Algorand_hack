# Quick Start Guide

Get the Algorand Prediction Market frontend running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Pera Wallet installed and configured for TestNet
- TestNet ALGO in your wallet
- Deployed smart contracts (App IDs)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy template
cp .env.local.example .env.local

# Edit .env.local and add your App IDs
# NEXT_PUBLIC_APP_ID=<your-market-app-id>
# NEXT_PUBLIC_ORACLE_APP_ID=<your-oracle-app-id>
```

### 3. Verify Setup

```bash
# Check for TypeScript errors
npx tsc --noEmit
```

Should complete with no errors.

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Connect Wallet

1. Click "Connect Pera Wallet"
2. Approve connection
3. Start trading!

## Common Issues

### "Failed to fetch markets"
- Verify App IDs in `.env.local`
- Check contracts are deployed

### "Wallet connection failed"
- Ensure Pera Wallet is on TestNet
- Unlock your wallet

### "Transaction failed"
- Check you have enough TestNet ALGO
- Minimum bet is 1 ALGO

## Next Steps

- Create your first market
- Place test bets
- Monitor on LORA Explorer
- Read full documentation in README.md

## Get TestNet ALGO

https://bank.testnet.algorand.network/

## Need Help?

Check the main README.md and DEPLOYMENT.md for detailed instructions.
