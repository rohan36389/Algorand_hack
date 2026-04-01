# Algorand Prediction Market

A full-stack decentralized prediction market platform built on Algorand TestNet. Users can create markets, place bets on outcomes, and claim winnings when markets settle.

## Architecture

### Smart Contracts (AlgoPy)
- **PredictionMarket**: Core contract managing markets, bets, and payouts
- **PredictionOracle**: Multi-source oracle for trustless market settlement

### Frontend (Next.js 15)
- Modern React application with Pera Wallet integration
- Real-time market data and live odds calculation
- Responsive UI with Tailwind CSS and Recharts

## Features

✅ Create custom prediction markets with 2-4 outcomes  
✅ Place bets using ALGO cryptocurrency  
✅ Automated odds calculation based on pool distribution  
✅ Multi-source oracle for decentralized settlement  
✅ Claim winnings or refunds through smart contracts  
✅ Real-time price feeds and market countdowns  
✅ LORA Explorer integration for transaction tracking  
✅ Box storage for efficient on-chain data management  

## Project Structure

```
prediction-market/
├── projects/prediction-market/
│   └── smart_contracts/          # AlgoPy smart contracts
│       ├── prediction_market.py  # Main market contract
│       ├── oracle.py             # Oracle contract
│       ├── deploy_config.py      # Deployment script
│       └── tests/                # Contract tests
└── frontend/                     # Next.js application
    ├── src/
    │   ├── app/                  # App Router pages
    │   ├── components/           # React components
    │   ├── hooks/                # Custom hooks
    │   ├── lib/                  # Core services
    │   └── types/                # TypeScript types
    └── package.json
```

## Quick Start

### 1. Deploy Smart Contracts

```bash
cd projects/prediction-market

# Install dependencies
poetry install

# Compile contracts
algokit compile python

# Deploy to TestNet
algokit deploy
```

Note the deployed App IDs from the output.

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your App IDs

# Run development server
npm run dev
```

### 3. Connect Wallet

1. Install [Pera Wallet](https://perawallet.app/)
2. Switch to TestNet in wallet settings
3. Get TestNet ALGO from [dispenser](https://bank.testnet.algorand.network/)
4. Connect wallet in the app

## Smart Contract Details

### PredictionMarket Contract

**Key Methods:**
- `bootstrap()`: Initialize contract with oracle and fee settings
- `create_market()`: Create a new prediction market
- `place_bet()`: Place a bet on a market outcome
- `settle_market()`: Oracle-only method to finalize market
- `claim_winnings()`: Claim payout for winning bets
- `claim_refund()`: Claim refund for cancelled markets
- `cancel_market()`: Cancel market (creator/oracle only)

**Storage:**
- Global state: market counter, oracle address, fee configuration
- Box storage: market data and individual bet records

### PredictionOracle Contract

**Key Methods:**
- `bootstrap()`: Initialize with market app ID and providers
- `submit_attestation()`: Providers submit outcome votes
- `update_quorum()`: Admin adjusts quorum threshold

**Consensus:**
- Requires quorum of provider attestations
- Automatically settles market when quorum reached
- Supports up to 8 whitelisted providers

## Market Lifecycle

1. **Creation**: User creates market with title, outcomes, and end time
2. **Betting**: Users place bets on outcomes (min 1 ALGO)
3. **Closing**: Market closes at end timestamp
4. **Settlement**: Oracle providers submit attestations
5. **Payout**: Winners claim proportional share of pool (minus 2% fee)

## Odds Calculation

Odds are calculated using a parimutuel system:

```
Odds for outcome X = Total Pool / Pool for outcome X
Payout = (Bet Amount / Winning Pool) × (Total Pool × 0.98)
```

The 2% platform fee is sent to the fee sink address.

## Development

### Smart Contracts

```bash
# Compile
algokit compile python

# Run tests
pytest smart_contracts/tests/

# Deploy to LocalNet
algokit localnet start
algokit deploy --network localnet
```

### Frontend

```bash
# Development
npm run dev

# Type checking
npm run build

# Linting
npm run lint
```

## Testing on TestNet

1. Deploy contracts and note App IDs
2. Update frontend `.env.local` with App IDs
3. Connect Pera Wallet (TestNet mode)
4. Create a test market
5. Place bets from multiple accounts
6. Submit oracle attestation to settle
7. Claim winnings

## Security Considerations

- Smart contracts use ARC-4 for standardized encoding
- Box storage prevents state bloat
- Oracle requires quorum for settlement
- Platform fee prevents zero-sum attacks
- Minimum bet amount (1 ALGO) prevents spam

## Deployment Checklist

- [ ] Compile smart contracts without errors
- [ ] Deploy PredictionMarket contract
- [ ] Deploy PredictionOracle contract
- [ ] Fund market contract with ALGO for inner txns
- [ ] Update frontend environment variables
- [ ] Test market creation
- [ ] Test betting flow
- [ ] Test oracle settlement
- [ ] Test claiming winnings
- [ ] Verify transactions on LORA Explorer

## Resources

- [Algorand Developer Portal](https://developer.algorand.org/)
- [AlgoPy Documentation](https://algorandfoundation.github.io/puya/)
- [Pera Wallet](https://perawallet.app/)
- [LORA Explorer](https://lora.algokit.io/)
- [TestNet Dispenser](https://bank.testnet.algorand.network/)

## License

MIT

## Support

For issues or questions:
1. Check the frontend and smart contract READMEs
2. Review LORA Explorer for transaction details
3. Verify environment configuration
4. Check browser console for errors

---

Built with ❤️ using Algorand, AlgoPy, and Next.js
