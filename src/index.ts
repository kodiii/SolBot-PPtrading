import { config } from "./config"; // System configuration
import { fetchTransactionDetails, createSwapTransaction, getRugCheckConfirmed, fetchAndSaveSwapDetails } from "./transactions";
import { validateEnv } from "./utils/env-validator";
import { SimulationService } from "./papertrading/services";
import { ConnectionManager } from "./papertrading/db/connection_manager";
import { initializePaperTradingDB } from "./papertrading/paper_trading";
import { getClient } from "./utils/grpcClient";
import { SubscribeRequest, SubscribeUpdateTransaction } from "@triton-one/yellowstone-grpc";
import base58 from "bs58";

// Initialize paper trading simulation service if enabled
const simulationService = config.rug_check.simulation_mode ? SimulationService.getInstance() : null;

let activeTransactions = 0;
const MAX_CONCURRENT = config.tx.concurrent_transactions;

async function processTransaction(signature: string) {
  console.log("=============================================");
  console.log("🔎 New Liquidity Pool found.");
  console.log("🔃 Fetching transaction details ...");

  const data = await fetchTransactionDetails(signature);
  if (!data || !data.solMint || !data.tokenMint) {
    console.log("⛔ Transaction aborted. No data returned.");
    console.log("🟢 Resuming looking for new tokens...\n");
    return;
  }

  const isRugCheckPassed = await getRugCheckConfirmed(data.tokenMint);
  if (!isRugCheckPassed) {
    console.log("🚫 Rug Check not passed! Transaction aborted.");
    console.log("🟢 Resuming looking for new tokens...\n");
    return;
  }

  console.log("Token found");
  console.log("👽 GMGN: https://gmgn.ai/sol/token/" + data.tokenMint);
  console.log("😈 BullX: https://neo.bullx.io/terminal?chainId=1399811149&address=" + data.tokenMint);

  if (config.rug_check.simulation_mode && simulationService) {
    console.log("🎮 Paper Trading Mode: Simulating trade for new token");
    const tokenPrice = await simulationService.getTokenPrice(data.tokenMint);
    if (tokenPrice) {
      console.log(`💰 Found Raydium price: $${tokenPrice.price}`);
      const success = await simulationService.executeBuy(data.tokenMint, data.tokenMint, tokenPrice.price);
      console.log(success ? "🟢 Paper trade executed successfully" : "❌ Failed to execute paper trade");
    } else {
      console.log("❌ Could not fetch token price for paper trading");
    }
    console.log("🟢 Resuming looking for new tokens..\n");
    return;
  }

  await new Promise(resolve => setTimeout(resolve, config.tx.swap_tx_initial_delay));

  const tx = await createSwapTransaction(data.solMint, data.tokenMint);
  if (!tx) {
    console.log("⛔ Transaction aborted.");
    console.log("🟢 Resuming looking for new tokens...\n");
    return;
  }

  console.log("🚀 Swapping SOL for Token.");
  console.log("Swap Transaction: ", "https://solscan.io/tx/" + tx);

  const saveConfirmation = await fetchAndSaveSwapDetails(tx);
  if (!saveConfirmation) {
    console.log("❌ Warning: Transaction not saved for tracking! Track Manually!");
  }
}

async function grpcHandler() {
  validateEnv();
  const connectionManager = ConnectionManager.getInstance("src/papertrading/db/paper_trading.db");
  await connectionManager.initialize();

  if (!(await initializePaperTradingDB())) {
    console.error("Failed to initialize paper trading database");
    process.exit(1);
  }
  console.log("🎮 Paper Trading DB initialized successfully");

  if (config.rug_check.simulation_mode) {
    SimulationService.getInstance();
    console.log("🎯 Paper Trading Simulation Mode enabled");
  }

  const programId = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
  const createPoolFeeAccount = '7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5';

const client = getClient();
const rpcConnInfo = await client.subscribe();

// ✅ Added explicit connection logging
rpcConnInfo.on("connect", () => console.log("✅ gRPC Connected!"));
rpcConnInfo.on("error", (err) => console.error("❌ gRPC Error:", err));
rpcConnInfo.on("close", () => console.log("❌ gRPC Disconnected. Reconnecting..."));

rpcConnInfo.on("data", (data) => {
  callback(data, programId);
});

await new Promise<void>((resolve, reject) => {
  if (!rpcConnInfo) throw Error('RPC connection error');

  rpcConnInfo.write({
    slots: {},
    accounts: {},
    transactions: {
      transactionsSubKey: {
        accountInclude: [createPoolFeeAccount],
        accountExclude: [],
        accountRequired: []
      }
    },
    transactionsStatus: {},
    blocks: {},
    blocksMeta: {},
    accountsDataSlice: [],
    entry: {},
    commitment: 0
  } as SubscribeRequest, (err: Error) => {
    if (!err) {
      resolve();
    } else {
      reject(err);
    }
  });
}).catch((reason) => {
  console.error("❌ Subscription failed:", reason);
  throw reason;
});

  async function subscribe() {
    console.log("🔗 Connecting to gRPC Logs Stream...");
  
    const stream = await client.subscribe(); // No request object needed
  
    stream.on("data", async (response: SubscribeUpdateTransaction) => {
      try {
        const logs = response.transaction?.meta?.logMessages || [];
        const signature = response.transaction?.transaction?.signatures?.[0];
  
        if (!signature) return;
  
        // ✅ Check if `initialize2: InitializeInstruction2` is present
        const isInitialize2 = logs.some((log) => log.includes("initialize2: InitializeInstruction2"));
        if (!isInitialize2) return;
  
        if (activeTransactions >= MAX_CONCURRENT) {
          console.log("⏳ Max concurrent transactions reached, skipping...");
          return;
        }
  
        activeTransactions++;
        processTransaction(signature.toString())
          .catch(error => console.error("❌ Error processing transaction:", error))
          .finally(() => activeTransactions--);
      } catch (error) {
        console.error("💥 Error processing log message:", error);
      }
    });
  
    stream.on("error", (err) => {
      console.error("❌ gRPC Stream Error:", err);
    });
  
    stream.on("end", () => {
      console.log("📴 gRPC stream ended");
    });
  }
  
  await subscribe();
}

async function callback(data: any, programId: string) {
  if (!data.filters.includes('transactionsSubKey')) return;

  const info = data.transaction;
  if (info.transaction.meta.err !== undefined) return;

  const txid = base58.encode(info.transaction.signature);

  const formatData = {
    updateTime: new Date().getTime(),
    slot: info.slot,
    txid: txid,
  };

  const accounts = info.transaction.transaction.message.accountKeys.map((i: Buffer) => base58.encode(i));

  for (const item of [...info.transaction.transaction.message.instructions, ...info.transaction.meta.innerInstructions.map((i: any) => i.instructions).flat()]) {
    if (accounts[item.programIdIndex] !== programId) continue;
    if ([...(item.data as Buffer).values()][0] !== 1) continue;

    // ✅ Pass txid (which is the signature) to processTransaction
    processTransaction(formatData.txid)
      .catch(error => console.error("❌ Error processing transaction:", error));
  }
}


grpcHandler().catch(err => console.error("🚨 gRPC Init Error:", err));
