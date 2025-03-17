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

## Running the System

1. Start the web interface and API server:
```bash
./dev.sh
```
This will start:
- The API server for data management (port 3002)
- The frontend web dashboard (port 3010)

2. In a separate terminal, start the trading bot:
```bash
npm run dev
```

The system components work together as follows:
- Trading Bot: Monitors new tokens and executes trades
- API Server: Manages data flow between components
- Web Dashboard: Provides trading interface and monitoring
- CLI Dashboard: Optional command-line monitoring tool

## Dashboard Options

### CLI Dashboard
If you prefer a command-line interface, you can use:
```bash
npm run dashboard
```

### Web Dashboard
The web dashboard provides:
- Real-time position tracking
- Trade history visualization
- Configuration management
- Performance metrics

Access the web dashboard at http://localhost:3010

## Paper Trading

### Reset Paper Trading Data
To reset all paper trading data and start fresh:
```bash
npm run reset-paper
```

## Additional Commands

### Running Tests
```bash
npm test                # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:unit      # Run unit tests only
```

### Linting
```bash
npm run lint           # Check code style and find potential issues
```

## Logging Configuration

By default, only important notifications and errors are shown in the terminal. To see detailed trade information:

1. Set `verbose_log: true` in the `paper_trading` section of `config.ts`
2. Restart the bot to apply changes

## Troubleshooting

1. If you encounter WebSocket connection errors:
   - Verify your Helius API key is valid
   - Check your internet connection
   - Ensure the WebSocket URI is correctly formatted

2. Paper trading data issues:
   - Use `npm run reset-paper` to clear all paper trading data
   - Check database connectivity if dashboard fails to load

3. System Startup Issues:
   - Check that Node.js version 18.17.0 or higher is installed
   - Ensure ports 3002 (API) and 3010 (frontend) are available
   - Start components in the recommended order: web interface, then bot
   - Look for any error messages in the console output

4. For any other issues:
   - Check the console output for error messages
   - Ensure all environment variables are properly set
   - Verify your wallet has sufficient SOL for transactions
