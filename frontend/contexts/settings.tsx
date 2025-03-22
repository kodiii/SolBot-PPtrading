"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"

// Define the settings interface based on the backend structure
export interface AppSettings {
  appearance: {
    theme: string;
    colorMode: string;
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
    /**
     * Source for price data:
     * - 'dex': Use decentralized exchange pricing
     * - 'jup': Use Jupiter aggregator pricing
     */
    priceSource: 'dex' | 'jup';
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
  liquidityPool: {
    radiyumProgramId: string;
    pumpFunProgramId: string;
    wsolPcMint: string;
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

// Default settings to use while loading
const defaultSettings: AppSettings = {
  "appearance": {
    "theme": "system",
    "colorMode": "system"
  },
  "paperTrading": {
    "initialBalance": 10,
    "dashboardRefresh": 2000,
    "recentTradesLimit": 12,
    "verboseLogging": false,
    "priceCheck": {
      "maxRetries": 15,
      "initialDelay": 3000,
      "maxDelay": 5000
    },
    "realDataUpdate": 5000,
    "useNewProviders": false
  },
  "priceValidation": {
    "enabled": true,
    "windowSize": 12,
    "maxDeviation": 0.05,
    "minDataPoints": 6,
    "fallbackToSingleSource": true
  },
  "swap": {
    "amount": 1000000000,
    "slippageBps": 200,
    "maxOpenPositions": 5,
    "verboseLog": false,
    "prioFeeMaxLamports": 10000000,
    "prioLevel": "medium",
    "dbNameTrackerHoldings": "src/tracker/holdings.db",
    "tokenNotTradable400ErrorRetries": 5,
    "tokenNotTradable400ErrorDelay": 2000
  },
  "sell": {
    "priceSource": "dex",
    "prioFeeMaxLamports": 10000000,
    "prioLevel": "medium",
    "slippageBps": 200,
    "autoSell": true,
    "stopLossPercent": 25,
    "takeProfitPercent": 30,
    "trackPublicWallet": ""
  },
  "strategies": {
    "debug": false,
    "liquidityDropEnabled": false,
    "threshold": 15
  },
  "rugCheck": {
    "verboseLog": false,
    "simulationMode": true,
    "allowMintAuthority": false,
    "allowNotInitialized": false,
    "allowFreezeAuthority": false,
    "allowRugged": false,
    "allowMutable": false,
    "blockReturningTokenNames": true,
    "blockReturningTokenCreators": false,
    "blockSymbols": [
      "XXX"
    ],
    "blockNames": [
      "XXX"
    ],
    "onlyContainString": false,
    "containString": [
      "AI",
      "GPT",
      "AGENT"
    ],
    "allowInsiderTopholders": true,
    "maxAllowedPctTopholders": 90,
    "maxAllowedPctAllTopholders": 90,
    "excludeLpFromTopholders": true,
    "minTotalMarkets": 0,
    "minTotalLpProviders": 0,
    "minTotalMarketLiquidity": 5000,
    "maxTotalMarketLiquidity": 10000000,
    "maxMarketcap": 1000000000,
    "maxPriceToken": 1,
    "ignorePumpFun": false,
    "maxScore": 30000,
    "legacyNotAllowed": [
      "Freeze Authority still enabled",
      "Single holder ownership",
      "Copycat token",
      "High holder concentration"
    ]
  },
  "liquidityPool": {
    "radiyumProgramId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "pumpFunProgramId": "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
    "wsolPcMint": "So11111111111111111111111111111111111111112"
  },
  "tx": {
    "fetchTxMaxRetries": 5,
    "fetchTxInitialDelay": 1000,
    "swapTxInitialDelay": 500,
    "getTimeout": 10000,
    "concurrentTransactions": 1,
    "retryDelay": 500
  }
};

interface SettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = React.createContext<SettingsContextType | undefined>(
  undefined
)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create a ref to track if the component is mounted
  const isMountedRef = React.useRef<boolean>(true);
  
  // Create a ref to store the current AbortController
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Function to fetch settings from the API
  const fetchSettings = useCallback(async () => {
    // Don't fetch if the component is unmounted
    if (!isMountedRef.current) {
      return;
    }
    
    // Abort any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Create a new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings', {
        signal, // Pass the abort signal to the fetch request
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      
      // Check if the request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) {
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check again if the request was aborted or component unmounted before updating state
      if (signal.aborted || !isMountedRef.current) {
        return;
      }
      
      setSettings(data);
    } catch (err) {
      // Only update error state if the error is not an abort error and component is mounted
      if (isMountedRef.current && err instanceof Error && err.name !== 'AbortError') {
        console.error('Error fetching settings:', err);
        setError(err.message);
      }
    } finally {
      // Only update loading state if the component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Function to update settings
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    // Don't update if the component is unmounted
    if (!isMountedRef.current) {
      return;
    }
    
    // Abort any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Create a new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Merge the new settings with the current settings
      const updatedSettings = {
        ...settings,
        ...newSettings,
        // Handle nested objects
        appearance: { ...settings.appearance, ...(newSettings.appearance || {}) },
        paperTrading: { ...settings.paperTrading, ...(newSettings.paperTrading || {}) },
        priceValidation: { ...settings.priceValidation, ...(newSettings.priceValidation || {}) },
        swap: { ...settings.swap, ...(newSettings.swap || {}) },
        strategies: { ...settings.strategies, ...(newSettings.strategies || {}) },
        rugCheck: { ...settings.rugCheck, ...(newSettings.rugCheck || {}) },
      };
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify(updatedSettings),
        signal, // Pass the abort signal to the fetch request
      });
      
      // Check if the request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) {
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to update settings: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Check again if the request was aborted or component unmounted before updating state
      if (signal.aborted || !isMountedRef.current) {
        return;
      }
      
      // Update local state with the new settings
      setSettings(updatedSettings);
      
      // Show a notification if restart is required
      if (result.requiresRestart) {
        console.log('Settings updated. Restart required for changes to take effect.');
        // You could add a toast notification here
      }
    } catch (err) {
      // Only update error state if the error is not an abort error and component is mounted
      if (isMountedRef.current && err instanceof Error && err.name !== 'AbortError') {
        console.error('Error updating settings:', err);
        setError(err.message);
        throw err; // Re-throw to allow handling by the caller
      }
    } finally {
      // Only update loading state if the component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [settings]);

  // Function to reset settings to default values
  const resetSettings = useCallback(async () => {
    // Don't reset if the component is unmounted
    if (!isMountedRef.current) {
      return;
    }
    
    // Abort any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Create a new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        signal, // Pass the abort signal to the fetch request
      });
      
      // Check if the request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) {
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to reset settings: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Check again if the request was aborted or component unmounted before updating state
      if (signal.aborted || !isMountedRef.current) {
        return;
      }
      
      // Update local state with the default settings
      if (result.settings) {
        setSettings(result.settings);
      } else {
        // Fallback to fetching settings again
        await fetchSettings();
      }
    } catch (err) {
      // Only update error state if the error is not an abort error and component is mounted
      if (isMountedRef.current && err instanceof Error && err.name !== 'AbortError') {
        console.error('Error resetting settings:', err);
        setError(err.message);
      }
    } finally {
      // Only update loading state if the component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchSettings]);

  // Function to refresh settings from the API with proper cleanup
  const refreshSettings = useCallback(async () => {
    // Just call fetchSettings which already has AbortController support
    // We don't return the controller here to match the Promise<void> return type
    await fetchSettings();
  }, [fetchSettings]);

  // Fetch settings on initial load with proper cleanup
  useEffect(() => {
    // Set mounted flag to true
    isMountedRef.current = true;
    
    // Call fetchSettings which will use abortControllerRef internally
    fetchSettings();
    
    // Cleanup function to abort any in-flight requests when the component unmounts
    return () => {
      // Set mounted flag to false to prevent state updates after unmount
      isMountedRef.current = false;
      
      // Abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchSettings]);
  
  return (
    <SettingsContext.Provider value={{
      settings,
      isLoading,
      error,
      updateSettings,
      resetSettings,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = React.useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
