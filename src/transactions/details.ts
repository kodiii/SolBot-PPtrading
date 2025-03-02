/**
 * @file details.ts
 * @description Functions for fetching and processing transaction details
 */

import axios from "axios";
import { config } from "../config";
import {
  TransactionDetailsResponseArray,
  MintsDataReponse,
  SwapEventDetailsResponse,
  HoldingRecord,
  NewTokenRecord,
} from "../types";
import { Decimal } from "../utils/decimal";
import { insertHolding, selectTokenByMint } from "../tracker/db";

export async function fetchTransactionDetails(signature: string): Promise<MintsDataReponse | null> {
  const txUrl = process.env.HELIUS_HTTPS_URI_TX || "";
  const maxRetries = config.tx.fetch_tx_max_retries;
  let retryCount = 0;

  console.log("Waiting " + config.tx.fetch_tx_initial_delay / 1000 + " seconds for transaction to be confirmed...");
  await new Promise((resolve) => setTimeout(resolve, config.tx.fetch_tx_initial_delay));

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1} of ${maxRetries} to fetch transaction details...`);

      const response = await axios.post<TransactionDetailsResponseArray>(
        txUrl,
        {
          transactions: [signature],
          commitment: "finalized",
          encoding: "jsonParsed",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: config.tx.get_timeout,
        }
      );

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error("Invalid response data");
      }

      const transactions: TransactionDetailsResponseArray = response.data;
      const transaction = transactions[0];
      
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const instructions = transaction.instructions;
      if (!instructions?.length) {
        throw new Error("No instructions found in transaction");
      }

      const instruction = instructions.find((ix) => ix.programId === config.liquidity_pool.radiyum_program_id);
      if (!instruction?.accounts || instruction.accounts.length < 10) {
        throw new Error("Invalid market maker instruction");
      }

      const [accountOne, accountTwo] = [instruction.accounts[8], instruction.accounts[9]];
      if (!accountOne || !accountTwo) {
        throw new Error("Required accounts not found");
      }

      const [solTokenAccount, newTokenAccount] = accountOne === config.liquidity_pool.wsol_pc_mint
        ? [accountOne, accountTwo]
        : [accountTwo, accountOne];

      console.log("Successfully fetched transaction details!");
      console.log(`SOL Token Account: ${solTokenAccount}`);
      console.log(`New Token Account: ${newTokenAccount}`);

      console.log(`[32mPHOTON TRACKER: https://photon-sol.tinyastro.io/en/lp/${newTokenAccount}[0m`);
      console.log(`[94mDEXSCREENER TRACKER: https://dexscreener.com/solana/${newTokenAccount}[0m`);

      return {
        tokenMint: newTokenAccount,
        solMint: solTokenAccount,
      };
    } catch (error: unknown) {
      console.log(`Attempt ${retryCount + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
      retryCount++;

      if (retryCount < maxRetries) {
        const delay = Math.min(4000 * Math.pow(1.5, retryCount), 15000);
        console.log(`Waiting ${delay / 1000} seconds before next attempt...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.log("All attempts to fetch transaction details failed");
  return null;
}

export async function fetchAndSaveSwapDetails(tx: string): Promise<boolean> {
  const txUrl = process.env.HELIUS_HTTPS_URI_TX || "";
  const priceUrl = process.env.JUP_HTTPS_PRICE_URI || "";

  try {
    // Fetch transaction details
    const response = await axios.post<TransactionDetailsResponseArray>(
      txUrl,
      { transactions: [tx] },
      {
        headers: { "Content-Type": "application/json" },
        timeout: config.tx.get_timeout,
      }
    );

    if (!response.data?.length) {
      console.log("⛔ Could not fetch swap details: No response received from API.");
      return false;
    }

    const swapTransactionData: SwapEventDetailsResponse = extractSwapData(response.data[0]);

    // Get SOL price for calculations
    const solPrice = await getSolPrice(priceUrl);
    if (!solPrice) return false;

    // Calculate values
    const {
      solAmount,
      tokenAmount,
      feeInSol,
      solPaidUsdc,
      solFeePaidUsdc,
      perTokenUsdcPrice
    } = calculateSwapValues(swapTransactionData, solPrice);

    // Get token name
    const tokenName = await getTokenName(swapTransactionData.tokenOutputs[0].mint);

    // Create and save holding record
    const newHolding: HoldingRecord = {
      Time: swapTransactionData.timestamp,
      Token: swapTransactionData.tokenOutputs[0].mint,
      TokenName: tokenName,
      Balance: tokenAmount,
      SolPaid: solAmount,
      SolFeePaid: feeInSol,
      SolPaidUSDC: solPaidUsdc,
      SolFeePaidUSDC: solFeePaidUsdc,
      PerTokenPaidUSDC: perTokenUsdcPrice,
      Slot: swapTransactionData.slot,
      Program: swapTransactionData.programInfo?.source || "N/A",
    };

    await insertHolding(newHolding);
    return true;
  } catch (error: unknown) {
    console.error("Error during request:", error instanceof Error ? error.message : String(error));
    return false;
  }
}

function extractSwapData(transaction: any): SwapEventDetailsResponse {
  return {
    programInfo: transaction?.events.swap.innerSwaps[0].programInfo,
    tokenInputs: transaction?.events.swap.innerSwaps[0].tokenInputs,
    tokenOutputs: transaction?.events.swap.innerSwaps[0].tokenOutputs,
    fee: transaction?.fee,
    slot: transaction?.slot,
    timestamp: transaction?.timestamp,
    description: transaction?.description,
  };
}

async function getSolPrice(priceUrl: string): Promise<number | null> {
  const solMint = config.liquidity_pool.wsol_pc_mint;
  const response = await axios.get<{data: {[key: string]: {price: number}}}>(
    priceUrl,
    {
      params: { ids: solMint },
      timeout: config.tx.get_timeout,
    }
  );
  return response.data.data[solMint]?.price || null;
}

function calculateSwapValues(data: SwapEventDetailsResponse, solPrice: number) {
  const solUsdcPrice = new Decimal(solPrice);
  const solAmount = new Decimal(data.tokenInputs[0].tokenAmount);
  const tokenAmount = new Decimal(data.tokenOutputs[0].tokenAmount);
  const feeInSol = new Decimal(data.fee).divide('1000000000');
  const solPaidUsdc = solAmount.multiply(solUsdcPrice);
  const solFeePaidUsdc = feeInSol.multiply(solUsdcPrice);
  const perTokenUsdcPrice = solPaidUsdc.divide(tokenAmount);

  return {
    solAmount,
    tokenAmount,
    feeInSol,
    solPaidUsdc,
    solFeePaidUsdc,
    perTokenUsdcPrice
  };
}

async function getTokenName(mint: string): Promise<string> {
  const tokenData: NewTokenRecord[] = await selectTokenByMint(mint);
  return tokenData?.[0]?.name || "N/A";
}