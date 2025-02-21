/**
 * @file index.ts
 * @description Service layer entry point for paper trading simulation functionality.
 * Exports the SimulationService which provides core paper trading capabilities including:
 * - Price tracking and monitoring
 * - Trade simulation (buy/sell)
 * - Stop loss and take profit automation
 * - Virtual balance management
 * - Integration with external price feeds (DexScreener, CoinDesk)
 */

export { SimulationService } from './simulation';