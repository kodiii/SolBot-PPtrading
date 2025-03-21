// Define the configuration settings interface
export interface ConfigSettings {
  appearance: {
    theme: string;
    colorMode: string;
  };
  liquidityPool: {
    radiyumProgramId: string;
    pumpFunProgramId: string;
    wsolPcMint: string;
  };
  paperTrading: {
    initialBalance: number;
    dashboardRefresh: number;
    recentTradesLimit: number;
    verboseLogging: boolean;
    priceCheck: {
      maxRetries: number;
      initialDelay: number;
      maxDelay: number;
    };
    realDataUpdate: number;
    useNewProviders: boolean;
  };
  priceValidation: {
    enabled: boolean;
    windowSize: number;
    maxDeviation: number;
    minDataPoints: number;
    fallbackToSingleSource: boolean;
  };
  swap: {
    amount: number;
    slippageBps: number;
    maxOpenPositions: number;
    verboseLog: boolean;
    prioFeeMaxLamports: number;
    prioLevel: string;
    dbNameTrackerHoldings: string;
    tokenNotTradable400ErrorRetries: number;
    tokenNotTradable400ErrorDelay: number;
  };
  sell: {
    priceSource: string;
    prioFeeMaxLamports: number;
    prioLevel: string;
    slippageBps: number;
    autoSell: boolean;
    stopLossPercent: number;
    takeProfitPercent: number;
    trackPublicWallet: string;
  };
  strategies: {
    debug: boolean;
    liquidityDropEnabled: boolean;
    threshold: number;
  };
  rugCheck: {
    verboseLog: boolean;
    simulationMode: boolean;
    allowMintAuthority: boolean;
    allowNotInitialized: boolean;
    allowFreezeAuthority: boolean;
    allowRugged: boolean;
    allowMutable: boolean;
    blockReturningTokenNames: boolean;
    blockReturningTokenCreators: boolean;
    blockSymbols: string[];
    blockNames: string[];
    onlyContainString: boolean;
    containString: string[];
    allowInsiderTopholders: boolean;
    maxAllowedPctTopholders: number;
    maxAllowedPctAllTopholders: number;
    excludeLpFromTopholders: boolean;
    minTotalMarkets: number;
    minTotalLpProviders: number;
    minTotalMarketLiquidity: number;
    maxTotalMarketLiquidity: number;
    maxMarketcap: number;
    maxPriceToken: number;
    ignorePumpFun: boolean;
    maxScore: number;
    legacyNotAllowed: string[];
  };
  tx: {
    fetchTxMaxRetries: number;
    fetchTxInitialDelay: number;
    swapTxInitialDelay: number;
    getTimeout: number;
    concurrentTransactions: number;
    retryDelay: number;
  };
}

// Default settings
export const defaultSettings: ConfigSettings = {
  appearance: {
    theme: "system",
    colorMode: "system"
  },
  liquidityPool: {
    radiyumProgramId: "",
    pumpFunProgramId: "",
    wsolPcMint: ""
  },
  paperTrading: {
    initialBalance: 10,
    dashboardRefresh: 2000,
    recentTradesLimit: 12,
    verboseLogging: false,
    priceCheck: {
      maxRetries: 15,
      initialDelay: 3000,
      maxDelay: 5000
    },
    realDataUpdate: 5000,
    useNewProviders: false
  },
  priceValidation: {
    enabled: true,
    windowSize: 12,
    maxDeviation: 0.05,
    minDataPoints: 6,
    fallbackToSingleSource: true
  },
  swap: {
    amount: 500000000,
    slippageBps: 200,
    maxOpenPositions: 3,
    verboseLog: false,
    prioFeeMaxLamports: 10000000,
    prioLevel: "medium",
    dbNameTrackerHoldings: "src/tracker/holdings.db",
    tokenNotTradable400ErrorRetries: 5,
    tokenNotTradable400ErrorDelay: 2000
  },
  sell: {
    priceSource: "dex",
    prioFeeMaxLamports: 10000000,
    prioLevel: "medium",
    slippageBps: 200,
    autoSell: true,
    stopLossPercent: 30,
    takeProfitPercent: 26,
    trackPublicWallet: ""
  },
  strategies: {
    debug: false,
    liquidityDropEnabled: true,
    threshold: 20
  },
  rugCheck: {
    verboseLog: false,
    simulationMode: true,
    allowMintAuthority: false,
    allowNotInitialized: false,
    allowFreezeAuthority: false,
    allowRugged: false,
    allowMutable: true,
    blockReturningTokenNames: false,
    blockReturningTokenCreators: false,
    blockSymbols: ["XXX"],
    blockNames: ["XXX"],
    onlyContainString: false,
    containString: ["AI", "GPT", "AGENT"],
    allowInsiderTopholders: true,
    maxAllowedPctTopholders: 50,
    maxAllowedPctAllTopholders: 50,
    excludeLpFromTopholders: true,
    minTotalMarkets: 0,
    minTotalLpProviders: 0,
    minTotalMarketLiquidity: 10000,
    maxTotalMarketLiquidity: 100000,
    maxMarketcap: 25000000,
    maxPriceToken: 0.001,
    ignorePumpFun: false,
    maxScore: 30000,
    legacyNotAllowed: [
      "Freeze Authority still enabled",
      "Single holder ownership",
      "Copycat token"
    ]
  },
  tx: {
    fetchTxMaxRetries: 5,
    fetchTxInitialDelay: 1000,
    swapTxInitialDelay: 500,
    getTimeout: 10000,
    concurrentTransactions: 1,
    retryDelay: 500
  }
};