/**
 * @file sell.ts
 * @description Handles selling tokens and related transactions
 */

import axios from "axios";
import { Connection, Keypair, VersionedTransaction, PublicKey } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";
import { config } from "../config";
import {
  QuoteResponse,
  SerializedQuoteResponse,
  createSellTransactionResponse
} from "../types";
import { removeHolding } from "../tracker/db";

export async function createSellTransaction(
  solMint: string,
  tokenMint: string,
  amount: string
): Promise<createSellTransactionResponse> {
  const quoteUrl = process.env.JUP_HTTPS_QUOTE_URI || "";
  const swapUrl = process.env.JUP_HTTPS_SWAP_URI || "";
  const rpcUrl = process.env.HELIUS_HTTPS_URI || "";
  const myWallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIV_KEY_WALLET || "")));
  const connection = new Connection(rpcUrl);

  try {
    // Verify token balance
    const tokenBalance = await verifyTokenBalance(connection, myWallet, tokenMint, amount);
    if (!tokenBalance.isValid) {
      throw new Error(tokenBalance.message);
    }

    // Get sell quote
    const quoteResponse = await getSellQuote(quoteUrl, tokenMint, solMint, amount);
    
    // Create and serialize swap transaction
    const swapTransaction = await createSwapTransaction(
      swapUrl,
      quoteResponse,
      myWallet.publicKey.toString()
    );

    // Process and send transaction
    const txid = await processTransaction(connection, swapTransaction, myWallet);
    await removeHolding(tokenMint);

    return {
      success: true,
      msg: null,
      tx: txid,
    };
  } catch (error: unknown) {
    return {
      success: false,
      msg: error instanceof Error ? error.message : "Unknown error",
      tx: null,
    };
  }
}

async function verifyTokenBalance(
  connection: Connection,
  wallet: Wallet,
  tokenMint: string,
  amount: string
) {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
    mint: new PublicKey(tokenMint),
  });

  const totalBalance = tokenAccounts.value.reduce((sum, account) => {
    const tokenAmount = account.account.data.parsed.info.tokenAmount.amount;
    return sum + BigInt(tokenAmount);
  }, BigInt(0));

  if (totalBalance <= 0n) {
    await removeHolding(tokenMint);
    return {
      isValid: false,
      message: "Token has 0 balance - Already sold elsewhere. Removing from tracking."
    };
  }

  if (totalBalance !== BigInt(amount)) {
    return {
      isValid: false,
      message: "Wallet and tracker balance mismatch. Sell manually and token will be removed during next price check."
    };
  }

  return { isValid: true };
}

async function getSellQuote(
  url: string,
  inputMint: string,
  outputMint: string,
  amount: string
): Promise<QuoteResponse> {
  const response = await axios.get<QuoteResponse>(url, {
    params: {
      inputMint,
      outputMint,
      amount,
      slippageBps: config.sell.slippageBps,
    },
    timeout: config.tx.get_timeout,
  });

  if (!response.data) {
    throw new Error("No valid quote for selling the token was received from Jupiter!");
  }

  return response.data;
}

async function createSwapTransaction(
  url: string,
  quoteResponse: QuoteResponse,
  publicKey: string
): Promise<SerializedQuoteResponse> {
  const response = await axios.post<SerializedQuoteResponse>(
    url,
    JSON.stringify({
      quoteResponse,
      userPublicKey: publicKey,
      wrapAndUnwrapSol: true,
      dynamicSlippage: {
        maxBps: 300,
      },
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: config.sell.prio_fee_max_lamports,
          priorityLevel: config.sell.prio_level,
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

  if (!response.data) {
    throw new Error("No valid swap transaction was received from Jupiter!");
  }

  return response.data;
}

async function processTransaction(
  connection: Connection,
  swapData: SerializedQuoteResponse,
  wallet: Wallet
): Promise<string> {
  const swapTransactionBuf = Buffer.from(swapData.swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  transaction.sign([wallet.payer]);

  const rawTransaction = transaction.serialize();
  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 2,
  });

  if (!txid) {
    throw new Error("Could not send transaction that was signed and serialized!");
  }

  const latestBlockHash = await connection.getLatestBlockhash();
  const conf = await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txid,
  });

  if (conf.value.err || conf.value.err !== null) {
    throw new Error("Transaction was not successfully confirmed!");
  }

  return txid;
}