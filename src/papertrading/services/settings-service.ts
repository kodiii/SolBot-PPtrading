import { ConnectionManager } from '../db/connection_manager';
import path from 'path';

// Define the settings database path
const SETTINGS_DB_PATH = path.resolve(__dirname, '../db/paper_trading.db');

/**
 * Interface for application settings
 */
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

/**
 * Default settings to use when initializing the database
 */
export const defaultSettings: AppSettings = {
  "appearance": {
    "theme": "exquisite-turquoise-giraffe",
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
    "stopLossPercent": 15,
    "takeProfitPercent": 24,
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
    "maxAllowedPctTopholders": 10,
    "maxAllowedPctAllTopholders": 30,
    "excludeLpFromTopholders": true,
    "minTotalMarkets": 0,
    "minTotalLpProviders": 0,
    "minTotalMarketLiquidity": 25000,
    "maxTotalMarketLiquidity": 1000000,
    "maxMarketcap": 100000000,
    "maxPriceToken": 0.001,
    "ignorePumpFun": false,
    "maxScore": 12000,
    "legacyNotAllowed": [
      "Freeze Authority still enabled",
      "Single holder ownership",
      "Copycat token"
    ]
  },
  "liquidityPool": {
    "radiyumProgramId": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    "pumpFunProgramId": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
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

/**
 * Service for managing application settings in the database
 */
export class SettingsService {
  private static instance: SettingsService;
  private connectionManager: ConnectionManager;
  private initialized: boolean = false;
  private dbPath: string;

  /**
   * Private constructor to enforce singleton pattern
   * @param dbPath Optional custom database path (mainly for testing)
   */
  private constructor(dbPath?: string) {
    this.dbPath = dbPath || SETTINGS_DB_PATH;
    this.connectionManager = ConnectionManager.getInstance(this.dbPath);
  }

  /**
   * Get the singleton instance of SettingsService
   * @param dbPath Optional custom database path (mainly for testing)
   * @returns The singleton instance
   */
  public static getInstance(dbPath?: string): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService(dbPath);
    }
    return SettingsService.instance;
  }

  /**
   * Reset the singleton instance (mainly for testing)
   */
  public static resetInstance(): void {
    SettingsService.instance = null as any;
  }

  /**
   * Reset settings to default values
   * @returns Promise that resolves when settings are reset
   */
  public async resetSettings(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Save default settings
    await this.saveSettings(defaultSettings);
    
    console.log('Settings reset to default values');
  }

  /**
   * Initialize the settings service and database table
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.connectionManager.initialize();

      // Create settings table if it doesn't exist
      const db = await this.connectionManager.getConnection();
      try {
        await db.exec(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `);

        // Check if we need to initialize with default settings
        const count = await db.get('SELECT COUNT(*) as count FROM settings');
        if (count && count.count === 0) {
          // Use direct database operations instead of calling saveSettings
          const flattenedSettings = this.flattenObject(defaultSettings);
          const timestamp = Date.now();

          // Begin transaction
          await db.exec('BEGIN TRANSACTION');

          try {
            // Insert or update each setting
            for (const [key, value] of Object.entries(flattenedSettings)) {
              await db.run(
                'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
                [key, JSON.stringify(value), timestamp]
              );
            }

            // Commit transaction
            await db.exec('COMMIT');
          } catch (error) {
            // Rollback transaction on error
            await db.exec('ROLLBACK');
            throw error;
          }
        }

        this.initialized = true;
      } finally {
        this.connectionManager.releaseConnection(db);
      }
    } catch (error) {
      console.error('Error initializing settings service:', error);
      // Set initialized to true to prevent infinite recursion
      this.initialized = true;
      
      // Try to update the JSON files directly as a fallback
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Update the main settings file
        const mainSettingsPath = path.resolve(__dirname, '../../../data/settings.json');
        fs.writeFileSync(mainSettingsPath, JSON.stringify(defaultSettings, null, 2));
        
        // Update the frontend settings file
        const frontendSettingsPath = path.resolve(__dirname, '../../../frontend/data/settings.json');
        fs.writeFileSync(frontendSettingsPath, JSON.stringify(defaultSettings, null, 2));
        
        console.log('Settings files updated successfully as fallback');
      } catch (fileError) {
        console.error('Error updating settings files:', fileError);
      }
    }
  }

  /**
   * Get all application settings
   * @returns Promise that resolves to the application settings
   */
  public async getSettings(): Promise<AppSettings> {
    if (!this.initialized) {
      await this.initialize();
    }

    const db = await this.connectionManager.getConnection();
    try {
      // Get all settings from the database
      const rows = await db.all('SELECT key, value FROM settings');
      
      // If no settings were found, return default settings
      if (!rows || rows.length === 0) {
        return JSON.parse(JSON.stringify(defaultSettings));
      }
      
      // Start with default settings
      const settings = JSON.parse(JSON.stringify(defaultSettings));
      
      // Update settings with values from the database
      for (const row of rows) {
        try {
          const value = JSON.parse(row.value);
          const keys = row.key.split('.');
          
          if (keys.length === 1) {
            // Top-level setting
            (settings as any)[keys[0]] = value;
          } else if (keys.length === 2) {
            // Nested setting
            if (!settings[keys[0] as keyof AppSettings]) {
              (settings as any)[keys[0]] = {};
            }
            
            // Ensure boolean values are properly handled
            if (typeof (settings[keys[0] as keyof AppSettings] as any)[keys[1]] === 'boolean') {
              (settings[keys[0] as keyof AppSettings] as any)[keys[1]] = Boolean(value);
            } else if (typeof (settings[keys[0] as keyof AppSettings] as any)[keys[1]] === 'number') {
              // Ensure numeric values are properly handled
              (settings[keys[0] as keyof AppSettings] as any)[keys[1]] = Number(value) || 0;
            } else {
              (settings[keys[0] as keyof AppSettings] as any)[keys[1]] = value;
            }
          }
        } catch (error) {
          console.error(`Error parsing setting ${row.key}:`, error);
        }
      }
      
      return settings;
    } finally {
      this.connectionManager.releaseConnection(db);
    }
  }

  /**
   * Save application settings
   * @param settings The settings to save
   * @returns Promise that resolves when settings are saved
   */
  public async saveSettings(settings: AppSettings): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Sanitize settings to ensure proper types
    const sanitizedSettings = JSON.parse(JSON.stringify(settings, (key, value) => {
      // Handle NaN values
      if (typeof value === 'number' && isNaN(value)) {
        return 0;
      }
      
      // Ensure boolean values are properly handled
      if (typeof value === 'boolean') {
        return Boolean(value);
      }
      
      return value;
    }));

    console.log('Saving settings to database and files...');

    // First, update the JSON files to ensure they're always updated
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Update the main settings file
      const mainSettingsPath = path.resolve(__dirname, '../../../data/settings.json');
      fs.writeFileSync(mainSettingsPath, JSON.stringify(sanitizedSettings, null, 2));
      console.log('Main settings file updated successfully:', mainSettingsPath);
      
      // Update the frontend settings file
      const frontendSettingsPath = path.resolve(__dirname, '../../../frontend/data/settings.json');
      fs.writeFileSync(frontendSettingsPath, JSON.stringify(sanitizedSettings, null, 2));
      console.log('Frontend settings file updated successfully:', frontendSettingsPath);
      
      // Update the default settings in the TypeScript files
      this.updateDefaultSettingsInSourceFiles(sanitizedSettings);
    } catch (fileError) {
      console.error('Error updating settings files:', fileError);
      // Continue to try database update even if file update fails
    }
    
    // Then, update the database
    try {
      const db = await this.connectionManager.getConnection();
      try {
        // Flatten the settings object into key-value pairs
        const flattenedSettings = this.flattenObject(sanitizedSettings);
        const timestamp = Date.now();

        // Begin transaction
        await db.exec('BEGIN TRANSACTION');

        try {
          // Insert or update each setting
          for (const [key, value] of Object.entries(flattenedSettings)) {
            await db.run(
              'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
              [key, JSON.stringify(value), timestamp]
            );
          }

          // Commit transaction
          await db.exec('COMMIT');
          console.log('Settings saved to database successfully');
        } catch (error) {
          // Rollback transaction on error
          await db.exec('ROLLBACK');
          console.error('Database transaction failed, rolled back:', error);
          throw error;
        }
      } finally {
        this.connectionManager.releaseConnection(db);
      }
    } catch (dbError) {
      console.error('Error saving settings to database:', dbError);
      // We don't throw here since we've already updated the files
    }
  }

  /**
   * Update specific settings
   * @param partialSettings Partial settings to update
   * @returns Promise that resolves when settings are updated
   */
  public async updateSettings(partialSettings: Partial<AppSettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    const updatedSettings = this.mergeSettings(currentSettings, partialSettings);
    await this.saveSettings(updatedSettings);
  }

  /**
   * Flatten a nested object into key-value pairs with dot notation
   * @param obj The object to flatten
   * @param prefix The prefix for keys
   * @returns Flattened object
   */
  private flattenObject(obj: any, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          Object.assign(result, this.flattenObject(value, newKey));
        } else {
          result[newKey] = value;
        }
      }
    }

    return result;
  }

  /**
   * Merge settings objects
   * @param target The target settings object
   * @param source The source settings object
   * @returns Merged settings object
   */
  private mergeSettings(target: AppSettings, source: Partial<AppSettings>): AppSettings {
    const result = { ...target };

    // Merge appearance settings
    if (source.appearance) {
      result.appearance = { ...result.appearance, ...source.appearance };
    }
    
    // Merge paperTrading settings
    if (source.paperTrading) {
      result.paperTrading = { ...result.paperTrading, ...source.paperTrading };
    }

    // Merge priceValidation settings
    if (source.priceValidation) {
      result.priceValidation = { ...result.priceValidation, ...source.priceValidation };
    }

    // Merge swap settings
    if (source.swap) {
      result.swap = { ...result.swap, ...source.swap };
    }

    // Merge strategies settings
    if (source.strategies) {
      result.strategies = { ...result.strategies, ...source.strategies };
    }

    // Merge rugCheck settings
    if (source.rugCheck) {
      result.rugCheck = { ...result.rugCheck, ...source.rugCheck };
    }

    return result;
  }

  /**
   * Update the default settings in the TypeScript source files
   * @param settings The new settings to use as defaults
   */
  private updateDefaultSettingsInSourceFiles(settings: AppSettings): void {
    try {
      const fs = require('fs');
      const path = require('path');

      // Update the settings service file (this file)
      const settingsServicePath = path.resolve(__dirname, 'settings-service.ts');
      this.updateDefaultSettingsInFile(
        settingsServicePath,
        settings,
        'export const defaultSettings: AppSettings = ',
        ';'
      );

      // Update the frontend context file
      const frontendContextPath = path.resolve(__dirname, '../../../frontend/contexts/settings.tsx');
      this.updateDefaultSettingsInFile(
        frontendContextPath,
        settings,
        'const defaultSettings: AppSettings = ',
        ';'
      );

      console.log('Default settings in TypeScript files updated successfully');
    } catch (error) {
      console.error('Error updating default settings in TypeScript files:', error);
    }
  }

  /**
   * Update the default settings in a specific file
   * @param filePath The path to the file
   * @param settings The new settings to use as defaults
   * @param startMarker The marker that indicates the start of the default settings
   * @param endMarker The marker that indicates the end of the default settings
   */
  private updateDefaultSettingsInFile(
    filePath: string,
    settings: AppSettings,
    startMarker: string,
    endMarker: string
  ): void {
    try {
      const fs = require('fs');
      
      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Find the start and end positions of the default settings
      const startPos = fileContent.indexOf(startMarker);
      if (startPos === -1) {
        console.error(`Start marker "${startMarker}" not found in ${filePath}`);
        return;
      }
      
      const contentStartPos = startPos + startMarker.length;
      let contentEndPos = fileContent.indexOf(endMarker, contentStartPos);
      if (contentEndPos === -1) {
        console.error(`End marker "${endMarker}" not found after start marker in ${filePath}`);
        return;
      }
      
      // Format the new default settings
      const formattedSettings = JSON.stringify(settings, null, 2);
      
      // Replace the default settings in the file
      const newContent = 
        fileContent.substring(0, contentStartPos) + 
        formattedSettings + 
        fileContent.substring(contentEndPos);
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      console.log(`Default settings updated in ${filePath}`);
    } catch (error) {
      console.error(`Error updating default settings in ${filePath}:`, error);
    }
  }
}
