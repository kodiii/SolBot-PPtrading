import { ConnectionManager } from '../db/connection_manager';
import { Database } from 'sqlite';
import path from 'path';

// Define the settings database path
const SETTINGS_DB_PATH = path.resolve(__dirname, '../db/paper_trading.db');

/**
 * Interface for application settings
 */
export interface AppSettings {
  paperTrading: {
    initialBalance: number;
    dashboardRefresh: number;
    recentTradesLimit: number;
    verboseLogging: boolean;
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
  };
  strategies: {
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
}

/**
 * Default settings to use when initializing the database
 */
export const defaultSettings: AppSettings = {
  paperTrading: {
    initialBalance: 5,
    dashboardRefresh: 2000,
    recentTradesLimit: 12,
    verboseLogging: false
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
    maxOpenPositions: 5
  },
  strategies: {
    liquidityDropEnabled: false,
    threshold: 20
  },
  rugCheck: {
    verboseLog: false,
    simulationMode: true,
    allowMintAuthority: false,
    allowNotInitialized: false,
    allowFreezeAuthority: false,
    allowRugged: false,
    allowMutable: false,
    blockReturningTokenNames: false,
    blockReturningTokenCreators: false,
    blockSymbols: ["XXX"],
    blockNames: ["XXX"],
    onlyContainString: false,
    containString: ["AI", "GPT", "AGENT"],
    allowInsiderTopholders: true,
    maxAllowedPctTopholders: 90,
    maxAllowedPctAllTopholders: 90,
    excludeLpFromTopholders: true,
    minTotalMarkets: 0,
    minTotalLpProviders: 0,
    minTotalMarketLiquidity: 5000,
    maxTotalMarketLiquidity: 10000000,
    maxMarketcap: 1000000000,
    maxPriceToken: 1,
    ignorePumpFun: false,
    maxScore: 30000,
    legacyNotAllowed: [
      "Freeze Authority still enabled",
      "Single holder ownership",
      "Copycat token",
      "High holder concentration",
      "Large Amount of LP Unlocked",
      "Low Liquidity",
      "Low amount of LP Providers",
    ]
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
        } catch (error) {
          // Rollback transaction on error
          await db.exec('ROLLBACK');
          throw error;
        }
      } finally {
        this.connectionManager.releaseConnection(db);
      }
    } catch (dbError) {
      console.error('Error saving settings to database:', dbError);
    }
    
    // Always update the JSON files, even if database save fails
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Update the main settings file
      const mainSettingsPath = path.resolve(__dirname, '../../../data/settings.json');
      fs.writeFileSync(mainSettingsPath, JSON.stringify(sanitizedSettings, null, 2));
      
      // Update the frontend settings file
      const frontendSettingsPath = path.resolve(__dirname, '../../../frontend/data/settings.json');
      fs.writeFileSync(frontendSettingsPath, JSON.stringify(sanitizedSettings, null, 2));
      
      console.log('Settings files updated successfully');
    } catch (fileError) {
      console.error('Error updating settings files:', fileError);
      throw fileError; // Re-throw if we can't even save to files
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
}
