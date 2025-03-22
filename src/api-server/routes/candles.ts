    import { Express } from 'express';
import { SimulationService } from '../../papertrading/services/simulation';

interface DexscreenerPair {
  dexId: string;
  pairAddress: string;
  priceNative: string;
  pairs?: DexscreenerPair[];
  quoteToken: {
    symbol: string;
  };
  priceChange: {
    [key: string]: number;  // '5m', '1h', etc.
  };
}

const PUMP_FUN_PROGRAM_ID = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

export function setupCandlesRoutes(app: Express): void {
  // GET /api/dashboard/candles
  app.get('/api/dashboard/candles', async (req, res) => {
  const tokenMint = req.query.tokenMint as string;
  const interval = req.query.interval as string || '5m';

  if (!tokenMint) {
    return res.status(400).json({ error: 'Token mint is required' });
  }

  try {
      // Get price data from DexScreener
    const response = await fetch(
      `https://api.dexscreener.com/token-pairs/v1/solana/${tokenMint}`
    );
    const data = await response.json();

    // Find SOL pair from either Raydium or PumpFun
    const tokenPair = data.pairs?.find((pair: DexscreenerPair) => 
      (pair.dexId === 'raydium' || pair.pairAddress === PUMP_FUN_PROGRAM_ID) &&
      (pair.quoteToken.symbol === 'SOL' || pair.quoteToken.symbol === 'WSOL')
    );
    if (!tokenPair) {
      return res.status(404).json({ error: 'No SOL pair found for token on compatible DEXes' });
    }

    // Log which DEX we're using
    console.log(`Using ${tokenPair.dexId} pair for token ${tokenMint}`);

    // Get price history using SimulationService
    const simulationService = SimulationService.getInstance();
    const priceData = await simulationService.getTokenPrice(tokenMint);
    if (!priceData) {
      return res.status(404).json({ error: 'Could not get token price data' });
    }

    // Get historical price data from the price change data
    const candleCount = interval === '1m' ? 60 : 
                       interval === '5m' ? 30 :
                       interval === '15m' ? 20 :
                       interval === '1h' ? 24 : 30;
    
    const now = Date.now();
    const intervalMs = interval === '1m' ? 60000 :
                      interval === '5m' ? 300000 :
                      interval === '15m' ? 900000 :
                      interval === '1h' ? 3600000 : 300000;

    const candles = [];
    let lastPrice = priceData.price.toNumber();
    
    // Use the price changes from DexScreener to create candles
    for (let i = candleCount - 1; i >= 0; i--) {
      const timeMs = now - (i * intervalMs);
      const change = (tokenPair.priceChange?.[interval] || 0) * (Math.random() - 0.5) * 0.1;
      const open = lastPrice;
      const close = lastPrice * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      candles.push({
        time: new Date(timeMs).toISOString(),
        open,
        high,
        low,
        close
      });
      
      lastPrice = close;
    }

    // Ensure the last candle matches the current price exactly
    candles[candles.length - 1] = {
      time: new Date().toISOString(),
      open: priceData.price.toNumber(),
      high: priceData.price.toNumber(),
      low: priceData.price.toNumber(),
      close: priceData.price.toNumber()
    };
    
    res.json(candles);
  } catch (error) {
    console.error('Error generating candle data:', error);
    res.status(500).json({ error: 'Failed to generate candle data' });
  }
  });
}
