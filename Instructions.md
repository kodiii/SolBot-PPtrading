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

3. Configure trading settings:
   - Copy `src/config.ts.backup` to `src/config.ts`
   - Customize the configuration parameters in `config.ts` according to your trading strategy:
     - `paper_trading`: Adjust simulation settings like initial balance and position limits
     - `swap`: Configure transaction parameters like amount and slippage
     - `sell`: Set stop-loss and take-profit percentages
     - `rug_check`: Customize security validation rules and risk thresholds

4. Build the project:
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

## Dashboard Options

### CLI Dashboard
To start the paper trading dashboard CLI:
```bash
npm run dashboard
```

### Web Dashboard

1. Configure frontend environment:
   - Copy `.env.local.example` to `.env.local` in the frontend directory
   - Configure the API endpoint if needed (defaults to localhost:3001)

2. Start both the frontend and API server:
```bash
./dev.sh
```
This script starts both the frontend application and the API server concurrently. 
The web dashboard will be available at `http://localhost:3000` with features including:
- Real-time position tracking
- Trade history visualization
- Configuration management
- Performance metrics

## Paper Trading

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

3. Web Dashboard Issues:
   - Ensure both frontend and API server started successfully with `./dev.sh`
   - Check browser console for error messages
   - Verify your `.env.local` configuration

4. For any other issues:
   - Check the console output for error messages
   - Ensure all environment variables are properly set
   - Verify your wallet has sufficient SOL for transactions
