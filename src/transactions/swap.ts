/**
 * @file swap.ts
 * @description Handles swap transaction creation and execution
 */

import axios from "axios";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";
import { config } from "../config";
import { QuoteResponse, SerializedQuoteResponse } from "../types";
import { getOpenPositionsCount } from "../tracker/db";

export async function createSwapTransaction(solMint: string, tokenMint: string): Promise<string | null> {
  // Check open positions limit
  const openPositions = await getOpenPositionsCount();
  if (openPositions >= config.swap.max_open_positions) {
    console.log(`❌ Maximum open positions limit (${config.swap.max_open_positions}) reached`);
    return null;
  }

  const quoteUrl = process.env.JUP_HTTPS_QUOTE_URI || "";
  const swapUrl = process.env.JUP_HTTPS_SWAP_URI || "";
  const rpcUrl = process.env.HELIUS_HTTPS_URI || "";
  let quoteResponseData: QuoteResponse | null = null;
  let serializedQuoteResponseData: SerializedQuoteResponse | null = null;
  const connection = new Connection(rpcUrl);
  const myWallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIV_KEY_WALLET || "")));

  // Get Swap Quote
  let retryCount = 0;
  while (retryCount < config.swap.token_not_tradable_400_error_retries) {
    try {
      // Request a quote to swap SOL for new token
      const quoteResponse = await axios.get<QuoteResponse>(quoteUrl, {
        params: {
          inputMint: solMint,
          outputMint: tokenMint,
          amount: config.swap.amount,
          slippageBps: config.swap.slippageBps,
        },
        timeout: config.tx.get_timeout,
      });

      if (!quoteResponse.data) return null;

      if (config.swap.verbose_log) {
        console.log("\nVerbose log:");
        console.log(quoteResponse.data);
      }

      quoteResponseData = quoteResponse.data;
      break;
    } catch (error: unknown) {
      // Retry when error is TOKEN_NOT_TRADABLE
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errorCode === "TOKEN_NOT_TRADABLE") {
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, config.swap.token_not_tradable_400_error_delay));
          continue;
        }
      }

      console.error("Error while requesting a new swap quote:", error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  if (quoteResponseData) console.log("✅ Swap quote recieved.");

  // Serialize the quote into a swap transaction
  try {
    if (!quoteResponseData) return null;

    const swapResponse = await axios.post<SerializedQuoteResponse>(
      swapUrl,
      JSON.stringify({
        quoteResponse: quoteResponseData,
        userPublicKey: myWallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicSlippage: {
          maxBps: 300,
        },
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: config.swap.prio_fee_max_lamports,
            priorityLevel: config.swap.prio_level,
          },
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: config.tx.get_timeout,
      }
    );

    if (!swapResponse.data) return null;
    serializedQuoteResponseData = swapResponse.data;
  } catch (error: unknown) {
    console.error("Error while sending the swap quote:", error instanceof Error ? error.message : String(error));
    return null;
  }

  if (serializedQuoteResponseData) console.log("✅ Swap quote serialized.");

  // Process and send transaction
  try {
    if (!serializedQuoteResponseData) return null;
    const swapTransactionBuf = Buffer.from(serializedQuoteResponseData.swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    transaction.sign([myWallet.payer]);

    const latestBlockHash = await connection.getLatestBlockhash();
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });

    if (!txid) {
      console.log("🚫 No id received for sent raw transaction.");
      return null;
    }

    console.log("✅ Raw transaction id received.");

    const conf = await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txid,
    });

    console.log("🔎 Checking transaction confirmation ...");

    if (conf.value.err || conf.value.err !== null) {
      console.log("🚫 Transaction confirmation failed.");
      return null;
    }

    return txid;
  } catch (error: unknown) {
    console.error("Error while signing and sending the transaction:", error instanceof Error ? error.message : String(error));
    return null;
  }
}