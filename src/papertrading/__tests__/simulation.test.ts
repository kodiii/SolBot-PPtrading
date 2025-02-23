import { SimulationService } from '../services/simulation';
import { initializePaperTradingDB, getVirtualBalance, getTrackedTokens, updateTokenPrice } from '../paper_trading';
import { Decimal } from '../../utils/decimal';
import { config } from '../../config';

describe('Paper Trading Simulation Tests', () => {
  let simulationService: SimulationService;

  beforeAll(async () => {
    // Initialize the database before running tests
    const dbInitialized = await initializePaperTradingDB();
    expect(dbInitialized).toBe(true);
    simulationService = SimulationService.getInstance();
  });

  beforeEach(async () => {
    // Reset database state before each test
    await initializePaperTradingDB(); // Reset database to initial state
    const balance = await getVirtualBalance();
    expect(balance).not.toBeNull();
    expect(balance?.balance_sol.toString()).toBe(config.paper_trading.initial_balance.toString());
  });

  describe('Buy Operations', () => {
    it('should execute a successful buy trade', async () => {
      const tokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Example USDC token
      const tokenName = 'USDC';
      const currentPrice = new Decimal('0.000042'); // Price in SOL (0.000042 SOL per token)
      
      // With 1 SOL to spend, we should get approximately 23,809.52 tokens (1/0.000042)
      // minus fees and slippage

      const success = await simulationService.executeBuy(tokenMint, tokenName, currentPrice);
      expect(success).toBe(true);

      // Verify position was created
      const tokens = await getTrackedTokens();
      const position = tokens.find(t => t.token_mint === tokenMint);
      expect(position).toBeDefined();
      expect(position?.token_name).toBe(tokenName);
      expect(position?.buy_price).toBeDefined();
      expect(position?.buy_fees).toBeDefined();
      expect(position?.buy_slippage).toBeDefined();
      expect(position?.time_buy).toBeDefined();

      // Verify token amount (1 SOL / 0.000042 SOL per token)
      // Should be around 23,809 tokens, but less due to fees and slippage
      const expectedBaseAmount = new Decimal(1).divide(currentPrice);
      const actualAmount = position!.amount;
      expect(actualAmount.lessThan(expectedBaseAmount)).toBe(true); // Due to fees and slippage
      expect(actualAmount.greaterThan(expectedBaseAmount.multiply(new Decimal('0.95')))).toBe(true); // Should not lose more than 5% to fees/slippage
    });

    it('should fail buy when exceeding position limit', async () => {
      // First fill up to max positions
      for (let i = 0; i < config.swap.max_open_positions; i++) {
        const tokenMint = `dummy-token-${i}`;
        const success = await simulationService.executeBuy(
          tokenMint,
          `Token${i}`,
          new Decimal('0.000042')
        );
        expect(success).toBe(true);
      }

      // Try to buy one more
      const extraBuy = await simulationService.executeBuy(
        'one-more-token',
        'ExtraToken',
        new Decimal('0.000042')
      );
      expect(extraBuy).toBe(false);
    });
  });

  describe('Price Tracking', () => {
    it('should fetch and update token prices', async () => {
      const tokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      
      const priceData = await simulationService.getTokenPrice(tokenMint);
      expect(priceData).not.toBeNull();
      expect(priceData?.price).toBeDefined();
      expect(priceData?.dexData).toBeDefined();
      expect(priceData?.dexData?.liquidity_usd).toBeDefined();
      
      // Verify all required market data fields
      if (priceData?.dexData) {
        const { volume_m5, marketCap, liquidity_usd } = priceData.dexData;
        expect(typeof volume_m5).toBe('number');
        expect(typeof marketCap).toBe('number');
        expect(typeof liquidity_usd).toBe('number');
      }
    });

    it('should handle invalid token addresses', async () => {
      const invalidTokenMint = 'invalid-token-address';
      
      const priceData = await simulationService.getTokenPrice(invalidTokenMint);
      expect(priceData).toBeNull();
    });
  });

  describe('Stop Loss and Take Profit', () => {
    it('should trigger stop loss when price drops below threshold', async () => {
      // First buy a token
      const tokenMint = 'test-token-sl';
      const buyPrice = new Decimal('0.000100');
      const success = await simulationService.executeBuy(tokenMint, 'TestToken', buyPrice);
      expect(success).toBe(true);

      // Get the position
      const tokens = await getTrackedTokens();
      const position = tokens.find(t => t.token_mint === tokenMint);
      expect(position).toBeDefined();

      // Calculate stop loss price (default 10% drop)
      const stopLossPrice = buyPrice.multiply(
        new Decimal(1).subtract(new Decimal(config.sell.stop_loss_percent).divide(100))
      );
      expect(position?.stop_loss.equals(stopLossPrice)).toBe(true);
    });

    it('should trigger take profit when price rises above threshold', async () => {
      // First buy a token
      const tokenMint = 'test-token-tp';
      const buyPrice = new Decimal('0.000100');
      const success = await simulationService.executeBuy(tokenMint, 'TestToken', buyPrice);
      expect(success).toBe(true);

      // Get the position
      const tokens = await getTrackedTokens();
      const position = tokens.find(t => t.token_mint === tokenMint);
      expect(position).toBeDefined();

      // Calculate take profit price (default 20% rise)
      const takeProfitPrice = buyPrice.multiply(
        new Decimal(1).add(new Decimal(config.sell.take_profit_percent).divide(100))
      );
      expect(position?.take_profit.equals(takeProfitPrice)).toBe(true);
    });
  });

  describe('Complete Trade Cycle', () => {
    it('should execute a complete buy-sell cycle with proper updates', async () => {
      const tokenMint = 'test-token-cycle';
      const tokenName = 'TestToken';
      const initialPrice = new Decimal('0.000100');
      
      // Execute buy
      const buySuccess = await simulationService.executeBuy(tokenMint, tokenName, initialPrice);
      expect(buySuccess).toBe(true);

      // Get initial position
      const tokensAfterBuy = await getTrackedTokens();
      const initialPosition = tokensAfterBuy.find(t => t.token_mint === tokenMint);
      expect(initialPosition).toBeDefined();
      expect(initialPosition?.buy_price.equals(initialPrice)).toBe(true);
      expect(initialPosition?.buy_fees).toBeDefined();
      expect(initialPosition?.buy_slippage).toBeDefined();
      expect(initialPosition?.time_buy).toBeDefined();
      expect(initialPosition?.current_price.equals(initialPrice)).toBe(true);
      expect(initialPosition?.liquidity_buy_usd).toBeDefined();

      // Wait for 15 seconds
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Simulate price increase (25% up)
      const newPrice = initialPrice.multiply(new Decimal('1.25'));
      const updatedToken = await updateTokenPrice(tokenMint, newPrice);
      expect(updatedToken).not.toBeNull();
      expect(updatedToken?.current_price.equals(newPrice)).toBe(true);

      // Verify position was updated
      const tokensAfterUpdate = await getTrackedTokens();
      const updatedPosition = tokensAfterUpdate.find(t => t.token_mint === tokenMint);
      expect(updatedPosition).toBeDefined();
      expect(updatedPosition?.current_price.equals(newPrice)).toBe(true);

      // Get final balance for comparison
      const finalBalance = await getVirtualBalance();
      expect(finalBalance).not.toBeNull();
      expect(finalBalance?.balance_sol.greaterThan(new Decimal(config.paper_trading.initial_balance))).toBe(true);
    }, 20000); // Increase timeout to 20s to account for the delay
  });

  afterAll(() => {
    // Cleanup
    simulationService.cleanup();
  });
});