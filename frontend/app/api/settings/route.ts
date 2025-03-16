import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the settings file path
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Define the configuration settings interface
interface ConfigSettings {
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

// Default settings
const defaultSettings: ConfigSettings = {
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
    maxOpenPositions: 3
  },
  strategies: {
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
      "Copycat token",
      "High holder concentration",
      "Large Amount of LP Unlocked",
      "Low Liquidity",
      "Low amount of LP Providers",
    ]
  }
};

// Helper function to ensure the settings file exists
function ensureSettingsFile() {
  try {
    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Check if the settings file exists
    if (!fs.existsSync(SETTINGS_FILE)) {
      // Create the settings file with default settings
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    }
  } catch (error) {
    console.error('Error ensuring settings file:', error);
  }
}

// Helper function to read settings
function readSettings(): ConfigSettings {
  try {
    ensureSettingsFile();
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading settings:', error);
    return defaultSettings;
  }
}

// Helper function to write settings
function writeSettings(settings: ConfigSettings) {
  try {
    ensureSettingsFile();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing settings:', error);
    return false;
  }
}

// GET handler for retrieving settings
export async function GET() {
  try {
    const settings = readSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

// POST handler for updating settings
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    
    // Validate settings (basic validation)
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }
    
    // Write settings to file
    const success = writeSettings(settings);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Settings saved successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
