/**
 * Trade Executor Service for paper trading simulation
 * Handles simulated buy/sell operations and trade recording
 */

import { config } from '../../config';
import { Decimal } from '../../utils/decimal';
import { TokenTracking } from '../../types';
import { recordSimulatedTrade, getVirtualBalance, getOpenPositionsCount } from '../paper_trading';
import { PriceTracker } from './price-tracker';
import { TokenPriceData } from './types';

export class TradeExecutor {
  private priceTracker: PriceTracker;

  constructor() {
    this.priceTracker = new PriceTracker();
  }

  /**
   * Execute a simulated buy order
   */
  public async executeBuy(
    tokenMint: string,
    tokenName: string,
    currentPrice: Decimal
  ): Promise<boolean> {
    // Check positions limit
    const openPositions = await getOpenPositionsCount();
    if (openPositions >= config.swap.max_open_positions) {
      console.log(`❌ Maximum open positions limit (${config.swap.max_open_positions}) reached`);
      return false;
    }

    const balance = await getVirtualBalance();
    if (!balance) {
      console.log('❌ Could not get virtual balance');
      return false;
    }

    // Convert amount to SOL
    const amountInSol = new Decimal(config.swap.amount).divide(Decimal.LAMPORTS_PER_SOL);
    const fees = new Decimal(config.swap.prio_fee_max_lamports).divide(Decimal.LAMPORTS_PER_SOL);

    if (balance.balance_sol.lessThan(amountInSol.add(fees))) {
      console.log('❌ Insufficient virtual balance for trade');
      return false;
    }

    // Apply slippage
    const slippageBps = new Decimal(config.swap.slippageBps);
    const maxSlippage = slippageBps.divide(10000);
    const randomSlippage = maxSlippage.multiply(new Decimal(Math.random()));
    const priceWithSlippage = currentPrice.multiply(Decimal.ONE.add(randomSlippage));

    // Calculate token amount
    const amountTokens = amountInSol.divide(priceWithSlippage);
    console.log(`💱 Token price in SOL: ${currentPrice.toString(8)} SOL`);

    // Get DexScreener data
    const priceData = await this.priceTracker.getTokenPrice(tokenMint);
    if (!priceData) {
      console.log('❌ Could not get token price data');
      return false;
    }

    return await recordSimulatedTrade({
      token_name: priceData.symbol || tokenName,
      token_mint: tokenMint,
      amount_sol: amountInSol,
      amount_token: amountTokens,
      buy_price: priceWithSlippage,
      buy_fees: fees,
      buy_slippage: randomSlippage,
      time_buy: Date.now(),
      dex_data: {
        volume_m5: priceData.dexData?.volume_m5 || 0,
        marketCap: priceData.dexData?.marketCap || 0,
        liquidity_buy_usd: priceData.dexData?.liquidity_usd || 0
      }
    });
  }

  /**
   * Execute a simulated sell order
   */
  public async executeSell(
    token: TokenTracking,
    reason: string
  ): Promise<boolean> {
    const slippageBps = new Decimal(config.sell.slippageBps);
    const maxSlippage = slippageBps.divide(10000);
    const randomSlippage = maxSlippage.multiply(new Decimal(Math.random()));
    const priceWithSlippage = token.current_price.multiply(Decimal.ONE.subtract(randomSlippage));

    const amountInSol = token.amount.multiply(priceWithSlippage);
    const fees = new Decimal(config.sell.prio_fee_max_lamports).divide(Decimal.LAMPORTS_PER_SOL);

    console.log(`🎮 Paper Trade: ${reason}`);
    console.log(`📈 Selling ${token.amount.toString(8)} ${token.token_name} tokens`);
    console.log(`💰 Final price after ${randomSlippage.multiply(100).toString(4)}% slippage:`);
    console.log(`   Original: ${token.current_price.toString(8)} SOL`);
    console.log(`   Adjusted w/slippage: ${priceWithSlippage.toString(8)} SOL`);
    console.log(`🏦 Total received: ${amountInSol.toString(8)} SOL (- ${fees.toString(8)} SOL fees)`);

    const priceData = await this.priceTracker.getTokenPrice(token.token_mint);
    if (!priceData) {
      console.log('❌ Could not fetch token price data for sell');
      return false;
    }

    return await recordSimulatedTrade({
      token_name: token.token_name,
      token_mint: token.token_mint,
      amount_sol: amountInSol,
      amount_token: token.amount,
      buy_price: token.buy_price,
      buy_fees: token.buy_fees,
      buy_slippage: token.buy_slippage,
      sell_price: priceWithSlippage,
      sell_fees: fees,
      sell_slippage: randomSlippage,
      time_buy: token.time_buy,
      time_sell: Date.now(),
      dex_data: {
        volume_m5: priceData.dexData?.volume_m5 || 0,
        marketCap: priceData.dexData?.marketCap || 0,
        liquidity_buy_usd: priceData.dexData?.liquidity_usd || 0,
        liquidity_sell_usd: priceData.dexData?.liquidity_usd || 0
      }
    });
  }
}