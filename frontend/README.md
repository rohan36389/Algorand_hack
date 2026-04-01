# Algorand Prediction Market - Frontend

A decentralized prediction market platform built on Algorand TestNet using Next.js 15, AlgoSDK, and Pera Wallet.

## Features

- 🔐 Pera Wallet integration for secure transactions
- 📊 Real-time market data with automatic polling
- 💰 Place bets on prediction markets with ALGO
- 📈 Live odds calculation and pool distribution charts
- 🎯 Create custom prediction markets
- 🔍 LORA Explorer integration for transaction tracking
- 💱 Live cryptocurrency price feed

## Prerequisites

- Node.js 18+ and npm
- Pera Wallet browser extension or mobile app
- Algorand TestNet account with ALGO for testing
- Deployed smart contracts (App IDs)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment template:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your deployed contract App IDs:
```env
NEXT_PUBLIC_APP_ID=YOUR_MARKET_APP_ID
NEXT_PUBLIC_ORACLE_APP_ID=YOUR_ORACLE_APP_ID
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                      # Next.js 15 App Router
│   ├── layout.tsx           # Root layout with WalletProvider
│   ├── page.tsx             # Dashboard with market listings
│   └── markets/[id]/        # Market detail pages
├── components/
│   ├── lora/                # LORA Explorer link components
│   ├── markets/             # Market UI components
│   ├── oracle/              # Price feed components
│   └── wallet/              # Wallet connection components
├── context/
│   └── WalletContext.tsx    # Global wallet state
├── hooks/
│   ├── useMarket.ts         # Single market data hook
│   ├── useMarkets.ts        # All markets data hook
│   ├── usePeraWallet.ts     # Pera Wallet integration
│   └── usePriceFeed.ts      # CoinGecko price data
├── lib/
│   ├── algorand.ts          # Blockchain interaction layer
│   └── lora.ts              # LORA utilities
└── types/
    └── market.ts            # TypeScript interfaces
```

## Key Components

### AlgorandService (`lib/algorand.ts`)
Core service for blockchain interactions:
- Fetch market data from box storage
- Build and sign transactions
- Decode ARC-4 structs
- Wait for confirmations

### WalletContext (`context/WalletContext.tsx`)
Global wallet state management:
- Pera Wallet connection
- Account management
- Transaction signing
- WalletGuard for protected routes

### Market Components
- `MarketCard`: Summary card with countdown
- `MarketDetail`: Full market view
- `BetPanel`: Betting interface
- `PoolChart`: Recharts visualization
- `OddsDisplay`: Live odds calculation

## Smart Contract Integration

The frontend interacts with two smart contracts:

1. **PredictionMarket** (`NEXT_PUBLIC_APP_ID`)
   - Create markets
   - Place bets
   - Claim winnings/refunds
   - Read market state

2. **PredictionOracle** (`NEXT_PUBLIC_ORACLE_APP_ID`)
   - Submit attestations
   - Settle markets via quorum

## Transaction Flow

### Creating a Market
1. User fills out market form
2. Frontend builds transaction group (payment + app call)
3. Pera Wallet signs transactions
4. Transactions sent to network
5. Wait for confirmation
6. Market appears in listings

### Placing a Bet
1. User selects outcome and amount
2. Frontend builds transaction group (payment + app call)
3. Pera Wallet signs transactions
4. Bet recorded in box storage
5. Pool totals updated

### Claiming Winnings
1. Market must be settled by oracle
2. User clicks claim button
3. Frontend builds claim transaction
4. Smart contract calculates payout
5. ALGO transferred to user

## Environment Variables

```env
# Algorand Network
NEXT_PUBLIC_ALGOD_SERVER=https://testnet-api.4160.nodely.dev
NEXT_PUBLIC_ALGOD_PORT=443
NEXT_PUBLIC_INDEXER_SERVER=https://testnet-idx.4160.nodely.dev
NEXT_PUBLIC_INDEXER_PORT=443

# Smart Contracts (REQUIRED - update after deployment)
NEXT_PUBLIC_APP_ID=123456789
NEXT_PUBLIC_ORACLE_APP_ID=987654321

# Network
NEXT_PUBLIC_NETWORK=testnet
```

## Testing

1. Connect Pera Wallet to TestNet
2. Ensure your account has TestNet ALGO (get from [TestNet Dispenser](https://bank.testnet.algorand.network/))
3. Create a test market
4. Place bets on different outcomes
5. Monitor transactions on [LORA Explorer](https://lora.algokit.io/testnet)

## Build for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Wallet Connection Issues
- Ensure Pera Wallet is installed and unlocked
- Check that you're on TestNet in Pera Wallet settings
- Clear browser cache and reconnect

### Transaction Failures
- Verify sufficient ALGO balance (min 1 ALGO per bet + fees)
- Check that market is still active
- Ensure App IDs are correct in `.env.local`

### Market Data Not Loading
- Verify App IDs are deployed and correct
- Check Algod/Indexer endpoints are accessible
- Look for errors in browser console

## Technologies

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- AlgoSDK
- Pera Wallet Connect
- Recharts
- Lucide Icons

## License

MIT
