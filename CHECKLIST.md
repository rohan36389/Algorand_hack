# Deployment Checklist

Use this checklist to deploy and test your Algorand Prediction Market.

## Pre-Deployment

### Environment Setup
- [ ] Python 3.12+ installed
- [ ] Node.js 18+ installed
- [ ] AlgoKit CLI installed (`algokit --version`)
- [ ] Poetry installed
- [ ] Pera Wallet installed (browser or mobile)

### TestNet Preparation
- [ ] Pera Wallet configured for TestNet
- [ ] TestNet account created
- [ ] TestNet ALGO obtained (https://bank.testnet.algorand.network/)
- [ ] At least 10 ALGO in account for testing

## Smart Contract Deployment

### Compilation
- [ ] Navigate to `prediction-market/projects/prediction-market`
- [ ] Run `poetry install`
- [ ] Run `algokit compile python`
- [ ] Verify no compilation errors

### Deployment
- [ ] Run `algokit deploy --network testnet`
- [ ] Note PredictionMarket App ID: _______________
- [ ] Note PredictionOracle App ID: _______________
- [ ] Note Market Contract Address: _______________
- [ ] Verify contracts on LORA Explorer

### Contract Verification
- [ ] Visit LORA link for PredictionMarket
- [ ] Verify global state initialized
- [ ] Check contract has balance for inner txns
- [ ] Visit LORA link for PredictionOracle
- [ ] Verify oracle providers set

## Frontend Setup

### Installation
- [ ] Navigate to `prediction-market/frontend`
- [ ] Run `npm install`
- [ ] Verify all packages installed

### Configuration
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Update `NEXT_PUBLIC_APP_ID` with PredictionMarket App ID
- [ ] Update `NEXT_PUBLIC_ORACLE_APP_ID` with Oracle App ID
- [ ] Verify Algod/Indexer endpoints are correct

### Verification
- [ ] Run `npx tsc --noEmit`
- [ ] Verify 0 TypeScript errors
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Verify page loads without errors

## Testing

### Wallet Connection
- [ ] Click "Connect Pera Wallet"
- [ ] Approve connection in Pera Wallet
- [ ] Verify address appears in header
- [ ] Check LORA link for your address works

### Create Market
- [ ] Click "Create Market" button
- [ ] Fill in market details:
  - Title: _______________
  - Outcomes: _______________, _______________
  - End Date: _______________
  - End Time: _______________
- [ ] Click "Create Market"
- [ ] Approve transaction (0.2 ALGO)
- [ ] Wait for confirmation
- [ ] Verify market appears in dashboard
- [ ] Click on market to view details
- [ ] Check LORA link for market creation transaction

### Place Bets
- [ ] Select an outcome
- [ ] Enter bet amount (min 1 ALGO)
- [ ] Click "Place Bet"
- [ ] Approve transaction
- [ ] Wait for confirmation
- [ ] Verify pool distribution updated
- [ ] Check odds recalculated
- [ ] Verify transaction on LORA

### Multiple Accounts (Optional)
- [ ] Create second TestNet account
- [ ] Fund with TestNet ALGO
- [ ] Connect second account
- [ ] Place bet on different outcome
- [ ] Verify odds change
- [ ] Check pool chart updates

### Market Settlement (Advanced)
- [ ] Wait for market to close OR
- [ ] Submit oracle attestation manually
- [ ] Verify market status changes to "Settled"
- [ ] Check winning outcome displayed

### Claim Winnings
- [ ] Navigate to settled market
- [ ] If you won, click "Claim Winnings"
- [ ] Approve transaction
- [ ] Verify payout received
- [ ] Check transaction on LORA

## Monitoring

### LORA Explorer
- [ ] Bookmark your market contract URL
- [ ] Bookmark your oracle contract URL
- [ ] Monitor transaction history
- [ ] Check box storage data
- [ ] Verify inner transactions

### Browser Console
- [ ] Open browser DevTools
- [ ] Check for JavaScript errors
- [ ] Monitor network requests
- [ ] Verify API responses

## Troubleshooting

### If Market Creation Fails
- [ ] Check you have at least 0.2 ALGO
- [ ] Verify App ID is correct in .env.local
- [ ] Check end time is in the future
- [ ] Look for errors in browser console

### If Betting Fails
- [ ] Verify market is still active
- [ ] Check you have at least 1 ALGO
- [ ] Ensure wallet is connected
- [ ] Verify transaction approval in Pera

### If Data Doesn't Load
- [ ] Check App IDs in .env.local
- [ ] Verify Algod endpoint is accessible
- [ ] Check browser console for errors
- [ ] Try refreshing the page

## Production Readiness (Future)

### Security Audit
- [ ] Smart contracts audited by security firm
- [ ] Penetration testing completed
- [ ] Code review by multiple developers
- [ ] Security best practices verified

### MainNet Preparation
- [ ] Test extensively on TestNet
- [ ] Configure production oracle providers
- [ ] Set up multisig for fee sink
- [ ] Prepare deployment scripts
- [ ] Update frontend for MainNet

### Deployment
- [ ] Deploy contracts to MainNet
- [ ] Update frontend environment variables
- [ ] Deploy frontend to hosting platform
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure monitoring and alerts

## Documentation Review

- [ ] Read `README.md`
- [ ] Review `DEPLOYMENT.md`
- [ ] Check `frontend/README.md`
- [ ] Follow `frontend/QUICKSTART.md`
- [ ] Review `IMPLEMENTATION_SUMMARY.md`

## Support

If you encounter issues:

1. Check the troubleshooting section in DEPLOYMENT.md
2. Review browser console for errors
3. Verify all environment variables are set
4. Check LORA Explorer for transaction details
5. Ensure Pera Wallet is on TestNet

## Success Criteria

✅ Smart contracts deployed and verified  
✅ Frontend running without errors  
✅ Wallet connection working  
✅ Market creation successful  
✅ Betting functional  
✅ Odds calculation correct  
✅ Transactions confirmed on-chain  
✅ LORA Explorer links working  

---

**Congratulations!** Once all items are checked, your Algorand Prediction Market is fully operational! 🎉
