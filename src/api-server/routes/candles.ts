import { Express } from 'express';

export function setupCandlesRoutes(app: Express): void {
  // GET /api/dashboard/candles
  app.get('/api/dashboard/candles', async (req, res) => {
  const tokenMint = req.query.tokenMint as string;
  const interval = req.query.interval as string || '5m';

  if (!tokenMint) {
    return res.status(400).json({ error: 'Token mint is required' });
  }

  try {
    // Generate mock candle data
    const now = Date.now();
    const candles = [];
    
    // Different number of candles based on interval
    let numCandles = 30;
    let intervalMs = 300000; // 5 minutes in ms
    
    switch (interval) {
      case '1s':
        numCandles = 60;
        intervalMs = 1000;
        break;
      case '1m':
        numCandles = 60;
        intervalMs = 60000;
        break;
      case '5m':
        numCandles = 30;
        intervalMs = 300000;
        break;
      case '15m':
        numCandles = 20;
        intervalMs = 900000;
        break;
      case '1h':
        numCandles = 24;
        intervalMs = 3600000;
        break;
    }
    
    // Mock current price - in a real implementation, this would come from a database or API
    const currentPrice = 0.0001 + Math.random() * 0.0001;
    
    // Generate candles with some randomness but trending toward current price
    let price = currentPrice * 0.8 + (Math.random() * 0.4 * currentPrice);
    
    for (let i = 0; i < numCandles; i++) {
      const time = new Date(now - (numCandles - i) * intervalMs).toISOString();
      const change = (Math.random() - 0.5) * 0.02 * price; // -1% to +1% change
      
      // Trend toward current price
      if (i > numCandles / 2) {
        price = price + (currentPrice - price) * 0.1 + change;
      } else {
        price = price + change;
      }
      
      const open = price;
      const close = price + (Math.random() - 0.5) * 0.01 * price;
      const high = Math.max(open, close) + Math.random() * 0.005 * price;
      const low = Math.min(open, close) - Math.random() * 0.005 * price;
      
      candles.push({
        time,
        open,
        high,
        low,
        close
      });
    }
    
    res.json(candles);
  } catch (error) {
    console.error('Error generating candle data:', error);
    res.status(500).json({ error: 'Failed to generate candle data' });
  }
  });
}
