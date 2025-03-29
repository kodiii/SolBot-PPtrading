import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BACKEND_API_ENDPOINTS } from '@/lib/api-config';

// Define the settings file path - we'll use this only as a fallback
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Get the backend settings URL
const getBackendSettingsUrl = (): string => {
  // Get the base URL from the BACKEND_API_ENDPOINTS
  const baseUrl = BACKEND_API_ENDPOINTS.dashboard.split('/api/dashboard')[0];
  return `${baseUrl}/api/settings`;
};

// Define the configuration settings interface
interface ConfigSettings {
  appearance: {
    theme: string;
    colorMode: string;
  };
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
  appearance: {
    theme: "system",
    colorMode: "system"
  },
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

// Helper function to read settings from the backend API
async function readSettingsFromBackend(): Promise<ConfigSettings | null> {
  try {
    const response = await fetch(getBackendSettingsUrl(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error reading settings from backend:', error);
    return null;
  }
}

// Helper function to read settings from local file (fallback only)
function readLocalSettings(): ConfigSettings {
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
    
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local settings:', error);
    return defaultSettings;
  }
}

// Helper function to write settings to the backend API
async function writeSettingsToBackend(settings: ConfigSettings): Promise<boolean> {
  try {
    console.log('Attempting to update backend settings at:', getBackendSettingsUrl());
    
    const response = await fetch(getBackendSettingsUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
      // Add a longer timeout for the request
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update settings: ${response.status} ${response.statusText}`);
    }
    
    console.log('Backend settings updated successfully');
    return true;
  } catch (error) {
    console.error('Error writing settings to backend:', error);
    return false;
  }
}

// GET handler for retrieving settings - prioritize backend API
export async function GET(): Promise<Response> {
  try {
    // Try to get settings from backend first
    const backendSettings = await readSettingsFromBackend();
    
    if (backendSettings) {
      console.log('Retrieved settings from backend API');
      return NextResponse.json(backendSettings);
    }
    
    // Fallback to local settings if backend is unavailable
    console.log('Backend unavailable, using local settings');
    const localSettings = readLocalSettings();
    return NextResponse.json(localSettings);
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

// POST handler for updating settings - prioritize backend API
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const settings = await request.json();
    
    // Validate settings (basic validation)
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }
    
    // First, save to local file to ensure we have a copy
    try {
      // Ensure the data directory exists
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Write settings to local file
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
      console.log('Saved settings to local file');
    } catch (error) {
      console.error('Error saving settings to local file:', error);
      // Continue to try backend update even if local save fails
    }
    
    // Write settings to backend API
    const success = await writeSettingsToBackend(settings);
    
    if (success) {
      // Try to restart the application to apply settings
      try {
        console.log('Attempting to restart the application to apply settings');
        const restartResponse = await fetch(`${getBackendSettingsUrl().split('/api/settings')[0]}/api/restart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: 'Settings updated' }),
        });
        
        if (restartResponse.ok) {
          console.log('Restart request sent successfully');
        } else {
          console.warn('Restart request failed, but settings were saved');
        }
      } catch (restartError) {
        console.error('Error requesting restart:', restartError);
        // Continue even if restart fails, as we've already saved the settings
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Settings saved successfully. Please restart the bot for changes to take effect.',
        requiresRestart: true
      });
    } else {
      // If backend update fails, at least we saved to the local file
      return NextResponse.json({ 
        success: true, 
        message: 'Settings saved to frontend only. Backend update failed. Changes may not be fully applied until the backend is updated.',
        requiresRestart: true,
        backendUpdateFailed: true
      });
    }
  } catch (error) {
    console.error('Error in POST /api/settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Helper function to reset settings to default values
async function resetSettingsToBackend(): Promise<boolean> {
  try {
    const response = await fetch(getBackendSettingsUrl() + '/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to reset settings: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting settings to backend:', error);
    return false;
  }
}

// POST handler for resetting settings to default values
export async function PATCH(): Promise<Response> {
  try {
    // Reset settings to default values
    const success = await resetSettingsToBackend();
    
    if (success) {
      // Get the updated settings
      const response = await fetch(getBackendSettingsUrl(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }
      
      const settings = await response.json();
      
      // Also save to local file as a fallback
      try {
        // Ensure the data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Write settings to local file
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        console.log('Saved reset settings to local file as fallback');
      } catch (error) {
        console.error('Error saving reset settings to local file:', error);
        // Continue even if local save fails, as we've already saved to the backend
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Settings reset to default values successfully.',
        requiresRestart: false,
        settings
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to reset settings to default values' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in PATCH /api/settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset settings' },
      { status: 500 }
    );
  }
}
