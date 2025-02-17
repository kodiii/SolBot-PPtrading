# Solana Token Sniper - Setup and Usage Instructions

## Initial Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.backup` to `.env`
   - Fill in the required values:
     - `PRIV_KEY_WALLET`: Your wallet's private key
     - `HELIUS_HTTPS_URI`: Helius RPC endpoint with API key
     - `HELIUS_WSS_URI`: Helius WebSocket endpoint with API key
     - `HELIUS_HTTPS_URI_TX`: Helius transaction API endpoint with API key
     - Other API endpoints should work as provided

3. Build the project:
```bash
npm run build
```

## Running the Trading Bot

### Development Mode
To run the bot in development mode with live TypeScript compilation:
```bash
npm run dev
```

### Production Mode
To run the compiled version:
```bash
npm run build
npm start
```

## Paper Trading

### Launch Dashboard
To start the paper trading dashboard:
```bash
npm run dashboard
```

### Reset Paper Trading Data
To reset all paper trading data and start fresh:
```bash
npm run reset-paper
```

## Additional Commands

### Running Tests
Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run unit tests only:
```bash
npm run test:unit
```

### Linting
Check code style and find potential issues:
```bash
npm run lint
```

## Troubleshooting

1. If you encounter WebSocket connection errors:
   - Verify your Helius API key is valid
   - Check your internet connection
   - Ensure the WebSocket URI is correctly formatted

2. Paper trading data issues:
   - Use `npm run reset-paper` to clear all paper trading data
   - Check database connectivity if dashboard fails to load

3. For any other issues:
   - Check the console output for error messages
   - Ensure all environment variables are properly set
   - Verify your wallet has sufficient SOL for transactions