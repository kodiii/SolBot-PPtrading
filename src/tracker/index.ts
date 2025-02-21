/**
 * Token Price Tracking and Portfolio Management System
 * 
 * This module implements a real-time token price tracking and portfolio management system
 * that monitors token holdings, calculates unrealized PnL, and executes automated
 * trading strategies based on configurable take-profit and stop-loss levels.
 * 
 * Key Features:
 * - Multi-source price aggregation (Jupiter and DexScreener)
 * - Price validation with configurable parameters
 * - Automated take-profit and stop-loss execution
 * - Real-time portfolio value tracking
 * - SQLite-based position tracking
 */

import { config } from "./../config";
import axios from "axios";
import * as sqlite3 from "sqlite3";
import dotenv from "dotenv";
import { open } from "sqlite";
import { createTableHoldings, getOpenPositionsCount } from "./db";

export { getOpenPositionsCount };

import { createSellTransactionResponse, HoldingRecord, LastPriceDexReponse } from "../types";
import { DateTime } from "luxon";
import { Decimal } from "../utils/decimal";
import { createSellTransaction } from "../transactions";
import { PriceValidator } from "../papertrading/price_validation";

// Load environment variables from the .env file
dotenv.config();

// Action logs store system events and trading actions
const actionsLogs: string[] = [];

// Initialize price validator with configuration parameters
const priceValidator = new PriceValidator({
  windowSize: config.price_validation.window_size,
  maxDeviation: config.price_validation.max_deviation,
  minDataPoints: config.price_validation.min_data_points
});

/**
 * Interface defining the structure of Jupiter Aggregator price data
 * Contains nested price information including the last swap price
 */
interface JupiterPriceData {
  data: Record<string, {
    extraInfo: {
      lastSwappedPrice: {
        lastJupiterSellPrice: number;
      };
    };
  }>;
}

/**
 * Main tracking loop that monitors token holdings and executes trading strategies
 * - Fetches current prices from multiple sources
 * - Validates prices using configured thresholds
 * - Calculates unrealized PnL
 * - Executes automated take-profit/stop-loss orders
 * - Updates tracking display
 */
async function main() {
  const priceUrl = process.env.JUP_HTTPS_PRICE_URI || "";
  const dexPriceUrl = process.env.DEX_HTTPS_LATEST_TOKENS || "";
  const priceSource = config.sell.price_source || "jup";
  const solMint = config.liquidity_pool.wsol_pc_mint;

  // Connect to database and create if not exists
  const db = await open({
    filename: config.swap.db_name_tracker_holdings,
    driver: sqlite3.Database,
  });

  // Create Table if not exists
  const holdingsTableExist = await createTableHoldings(db);
  if (!holdingsTableExist) {
    console.log("Holdings table not present.");
    // Close the database connection when done
    await db.close();
  }

  // Proceed with tracker
  if (holdingsTableExist) {
    // Create const for holdings and action logs.
    const holdingLogs: string[] = [];
    let currentPriceSource = "Jupiter Agregator";

    // Create regional functions to push holdings and logs to const
    const saveLogTo = (logsArray: string[], ...args: unknown[]): void => {
      const message = args.map((arg) => String(arg)).join(" ");
      logsArray.push(message);
    };

    // Get all our current holdings
    const holdings = await db.all("SELECT * FROM holdings");
    if (holdings.length !== 0) {
      // Get all token ids
      const tokenValues = holdings.map((holding) => holding.Token).join(",");

      let jupiterPrices: Record<string, { extraInfo: { lastSwappedPrice: { lastJupiterSellPrice: number } } }> = {};
      let dexRaydiumPairs: LastPriceDexReponse['pairs'] | null = null;

      // Jupiter Agregator Price
      try {
        const priceResponse = await axios.get<JupiterPriceData>(priceUrl, {
          params: {
            ids: tokenValues + "," + solMint,
            showExtraInfo: true,
          },
          timeout: config.tx.get_timeout,
        });
        jupiterPrices = priceResponse.data.data;
        if (!jupiterPrices) {
          saveLogTo(actionsLogs, `⛔ Latest prices from Jupiter Agregator could not be fetched. ${config.price_validation.fallback_to_single_source ? 'Trying Dexscreener...' : 'Skipping update...'}`);
          if (!config.price_validation.fallback_to_single_source) return;
        }
      } catch (error) {
        saveLogTo(actionsLogs, `⛔ Error fetching Jupiter prices: ${error instanceof Error ? error.message : String(error)}`);
        if (!config.price_validation.fallback_to_single_source) return;
      }

      // DexScreener Agregator Price
      if (priceSource !== "jup") {
        try {
          const dexPriceUrlPairs = `${dexPriceUrl}${tokenValues}`;
          const priceResponseDex = await axios.get<LastPriceDexReponse>(dexPriceUrlPairs, {
            timeout: config.tx.get_timeout,
          });

          // Get raydium legacy pairs prices
          dexRaydiumPairs = priceResponseDex.data.pairs
            .filter((pair) => pair.dexId === "raydium")
            .reduce<LastPriceDexReponse['pairs']>((uniquePairs, pair) => {
              const exists = uniquePairs.some((p) => p.baseToken.address === pair.baseToken.address);
              if (!exists || (pair.labels && pair.labels.length === 0)) {
                return uniquePairs.filter((p) => p.baseToken.address !== pair.baseToken.address).concat(pair);
              }
              return uniquePairs;
            }, []);

          if (!dexRaydiumPairs || dexRaydiumPairs.length === 0) {
            saveLogTo(actionsLogs, `⛔ Latest prices from Dexscreener Tokens API could not be fetched. ${config.price_validation.fallback_to_single_source ? 'Using Jupiter prices...' : 'Skipping update...'}`);
            if (!config.price_validation.fallback_to_single_source && !jupiterPrices) return;
          }
        } catch (error) {
          saveLogTo(actionsLogs, `⛔ Error fetching Dexscreener prices: ${error instanceof Error ? error.message : String(error)}`);
          if (!config.price_validation.fallback_to_single_source && !jupiterPrices) return;
        }
      }

      // Loop through all our current holdings
      await Promise.all(
        holdings.map(async (row) => {
          const holding: HoldingRecord = row;
          const token = holding.Token;
          const tokenName = holding.TokenName === "N/A" ? token : holding.TokenName;
          const tokenTime = holding.Time;
          const tokenBalance = holding.Balance;
          const tokenPerTokenPaidUSDC = holding.PerTokenPaidUSDC;

          // Convert Trade Time
          const centralEuropenTime = DateTime.fromMillis(tokenTime).toLocal();
          const hrTradeTime = centralEuropenTime.toFormat("HH:mm:ss");

          // Get current price from both sources if available
          let tokenCurrentPrice: number | undefined;
          const priceFromJupiter = jupiterPrices[token]?.extraInfo?.lastSwappedPrice?.lastJupiterSellPrice;
          let priceFromDex: number | undefined;

          if (dexRaydiumPairs && dexRaydiumPairs.length !== 0) {
            currentPriceSource = "Dexscreener Tokens API";
            const pair = dexRaydiumPairs.find((p) => p.baseToken.address === token);
            if (pair) {
              priceFromDex = parseFloat(pair.priceUsd);
            }
          }

          // Add prices to validator
          const currentTime = Date.now();
          if (priceFromJupiter) {
            priceValidator.addPricePoint(token, {
              price: new Decimal(priceFromJupiter),
              timestamp: currentTime,
              source: 'jupiter'
            });
          }
          if (priceFromDex) {
            priceValidator.addPricePoint(token, {
              price: new Decimal(priceFromDex),
              timestamp: currentTime,
              source: 'dexscreener'
            });
          }

          // Determine which price to use based on configuration and validation
          if (priceSource === "dex" && priceFromDex) {
            const validation = priceValidator.validatePrice(token, priceFromDex, 'dexscreener');
            if (validation.isValid) {
              tokenCurrentPrice = priceFromDex;
            } else {
              saveLogTo(actionsLogs, `⚠️ Invalid Dexscreener price for ${tokenName}: ${validation.reason}`);
              if (priceFromJupiter) {
                const jupiterValidation = priceValidator.validatePrice(token, priceFromJupiter, 'jupiter');
                if (jupiterValidation.isValid) {
                  tokenCurrentPrice = priceFromJupiter;
                  currentPriceSource = "Jupiter (Fallback)";
                }
              }
            }
          } else if (priceFromJupiter) {
            const validation = priceValidator.validatePrice(token, priceFromJupiter, 'jupiter');
            if (validation.isValid) {
              tokenCurrentPrice = priceFromJupiter;
            } else {
              saveLogTo(actionsLogs, `⚠️ Invalid Jupiter price for ${tokenName}: ${validation.reason}`);
              if (priceFromDex) {
                const dexValidation = priceValidator.validatePrice(token, priceFromDex, 'dexscreener');
                if (dexValidation.isValid) {
                  tokenCurrentPrice = priceFromDex;
                  currentPriceSource = "Dexscreener (Fallback)";
                }
              }
            }
          }

          if (!tokenCurrentPrice) {
            saveLogTo(actionsLogs, `⛔ No valid price available for ${tokenName}. Skipping update.`);
            return;
          }
          // Convert current price to Decimal and calculate PnL
          const currentPriceDecimal = new Decimal(tokenCurrentPrice);
          const unrealizedPnLUSDC = currentPriceDecimal.subtract(tokenPerTokenPaidUSDC).multiply(tokenBalance);
          const unrealizedPnLPercentage = unrealizedPnLUSDC.divide(tokenPerTokenPaidUSDC.multiply(tokenBalance)).multiply(new Decimal(100));
          const iconPnl = unrealizedPnLUSDC.isPositive() ? "🟢" : "🔴";

          // Check SL/TP
          if (config.sell.auto_sell && config.sell.auto_sell === true) {
            const shouldSell =
              unrealizedPnLPercentage.greaterThan(new Decimal(config.sell.take_profit_percent)) ||
              unrealizedPnLPercentage.lessThan(new Decimal(-config.sell.stop_loss_percent));

            if (shouldSell) {
              try {
                const result: createSellTransactionResponse = await createSellTransaction(
                  config.liquidity_pool.wsol_pc_mint,
                  token,
                  tokenBalance.toString()
                );

                // Add success to log output
                if (result.success) {
                  const actionType = unrealizedPnLPercentage.greaterThan(Decimal.ZERO) ? "Took profit" : "Triggered Stop Loss";
                  saveLogTo(actionsLogs, `✅${iconPnl} ${hrTradeTime}: ${actionType} for ${tokenName}\nTx: ${result.tx}`);
                } else {
                  saveLogTo(actionsLogs, `⚠️ ERROR when ${unrealizedPnLPercentage.greaterThan(Decimal.ZERO) ? 'taking profit' : 'triggering Stop Loss'} for ${tokenName}: ${result.msg}`);
                }
              } catch (error) {
                saveLogTo(actionsLogs, `⚠️ ERROR when ${unrealizedPnLPercentage.greaterThan(Decimal.ZERO) ? 'taking profit' : 'triggering Stop Loss'} for ${tokenName}: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
          }

          // Get the current price
          saveLogTo(
            holdingLogs,
            `${hrTradeTime}: Buy $${holding.SolPaidUSDC.toString(2)} | ${iconPnl} Unrealized PnL: $${unrealizedPnLUSDC.toString(
              2
            )} (${unrealizedPnLPercentage.toString(2)}%) | ${tokenBalance} ${tokenName}`
          );
        })
      );
    }

    // Output Current Holdings
    console.clear();
    console.log(`📈 Current Holdings via ✅ ${currentPriceSource}`);
    console.log("================================================================================");
    if (holdings.length === 0) console.log("No token holdings yet as of", new Date().toISOString());
    console.log(holdingLogs.join("\n"));

    // Output Action Logs
    console.log("\n\n📜 Action Logs");
    console.log("================================================================================");
    console.log("Last Update: ", new Date().toISOString());
    console.log(actionsLogs.join("\n"));

    // Output wallet tracking if set in config
    if (config.sell.track_public_wallet) {
      console.log("\nCheck your wallet: https://gmgn.ai/sol/address/" + config.sell.track_public_wallet);
    }

    await db.close();
  }

  setTimeout(main, 5000); // Call main again after 5 seconds
}

// Start the main tracking loop with error handling
main().catch((err) => {
  console.error(err);
});
