import dotenv from "dotenv";

/**
 * Environment Validator Module
 * 
 * This module provides functionality to validate environment variables required for the Solana Bot Trading application.
 * It ensures all necessary API endpoints and credentials are properly configured before the application starts.
 * 
 * Key features:
 * - Validates presence of required environment variables
 * - Checks URL formats and protocols
 * - Validates Helius API key presence
 * - Verifies wallet private key format
 */

// Load environment variables from .env file
dotenv.config();

/**
 * Configuration interface defining required environment variables
 * 
 * @interface EnvConfig
 * @property {string} PRIV_KEY_WALLET - Private key for the Solana wallet (optional but must be valid if provided)
 * @property {string} HELIUS_HTTPS_URI - Helius HTTPS RPC endpoint with API key
 * @property {string} HELIUS_WSS_URI - Helius WebSocket endpoint with API key
 * @property {string} HELIUS_HTTPS_URI_TX - Helius transaction API endpoint with API key
 * @property {string} JUP_HTTPS_QUOTE_URI - Jupiter aggregator quote API endpoint
 * @property {string} JUP_HTTPS_SWAP_URI - Jupiter aggregator swap API endpoint
 * @property {string} JUP_HTTPS_PRICE_URI - Jupiter price API endpoint
 * @property {string} DEX_HTTPS_LATEST_TOKENS - DEX screener API endpoint for latest tokens
 */
export interface EnvConfig {
  PRIV_KEY_WALLET: string;
  HELIUS_HTTPS_URI: string;
  HELIUS_WSS_URI: string;
  HELIUS_HTTPS_URI_TX: string;
  JUP_HTTPS_QUOTE_URI: string;
  JUP_HTTPS_SWAP_URI: string;
  JUP_HTTPS_PRICE_URI: string;
  DEX_HTTPS_LATEST_TOKENS: string;
}

/**
 * Validates all required environment variables and their formats
 * 
 * This function performs the following validations:
 * 1. Checks if all required environment variables are present
 * 2. Validates private key wallet format if provided
 * 3. Verifies URL formats and protocols for all API endpoints
 * 4. Ensures Helius endpoints have valid API keys
 * 
 * @throws {Error} If any validation fails with a descriptive error message
 * @returns {EnvConfig} Object containing all validated environment variables
 */
export function validateEnv(): EnvConfig {
  const requiredEnvVars = [
    "PRIV_KEY_WALLET",
    "HELIUS_HTTPS_URI",
    "HELIUS_WSS_URI",
    "HELIUS_HTTPS_URI_TX",
    "JUP_HTTPS_QUOTE_URI",
    "JUP_HTTPS_SWAP_URI",
    "JUP_HTTPS_PRICE_URI",
    "DEX_HTTPS_LATEST_TOKENS",
  ] as const;

  const missingVars = requiredEnvVars.filter((envVar) => {
    if (envVar === "PRIV_KEY_WALLET" && !process.env[envVar]) {
      return false; // Allow PRIV_KEY_WALLET to be empty
    }
    return !process.env[envVar];
  });

  if (missingVars.length > 0) {
    throw new Error(`🚫 Missing required environment variables: ${missingVars.join(", ")}`);
  }

  const privKeyWallet = process.env.PRIV_KEY_WALLET;
  if (privKeyWallet && ![87, 88].includes(privKeyWallet.length)) {
    throw new Error(`🚫 PRIV_KEY_WALLET must be 87 or 88 characters long (got ${privKeyWallet.length})`);
  }

  /**
   * Helper function to validate URL format and optional API key
   * 
   * @param {string} envVar - Name of the environment variable to validate
   * @param {string} protocol - Expected protocol (https: or wss:)
   * @param {boolean} checkApiKey - Whether to verify presence of api-key parameter for Helius URLs
   * @throws {Error} If URL format is invalid or API key is missing when required
   */
  const validateUrl = (envVar: string, protocol: string, checkApiKey: boolean = false) => {
    const value = process.env[envVar];
    if (!value) return;

    const url = new URL(value);
    if (value && url.protocol !== protocol) {
      throw new Error(`🚫 ${envVar} must start with ${protocol}`);
    }
    
    // Only check for api-key if it's a Helius URL
    if (checkApiKey && value && value.includes("helius")) {
      const apiKey = url.searchParams.get("api-key");
      if (!apiKey || apiKey.trim() === "") {
        throw new Error(`🚫 The 'api-key' parameter is missing or empty in the Helius URL: ${value}`);
      }
    }
  };

  validateUrl("HELIUS_HTTPS_URI", "https:", true);
  validateUrl("HELIUS_WSS_URI", "wss:", true);
  validateUrl("HELIUS_HTTPS_URI_TX", "https:", true);
  validateUrl("JUP_HTTPS_QUOTE_URI", "https:");
  validateUrl("JUP_HTTPS_SWAP_URI", "https:");
  validateUrl("JUP_HTTPS_PRICE_URI", "https:");
  validateUrl("DEX_HTTPS_LATEST_TOKENS", "https:");

  if (process.env.HELIUS_HTTPS_URI_TX?.includes("{function}")) {
    throw new Error("🚫 HELIUS_HTTPS_URI_TX contains {function}. Check your configuration.");
  }

  return {
    PRIV_KEY_WALLET: process.env.PRIV_KEY_WALLET!,
    HELIUS_HTTPS_URI: process.env.HELIUS_HTTPS_URI!,
    HELIUS_WSS_URI: process.env.HELIUS_WSS_URI!,
    HELIUS_HTTPS_URI_TX: process.env.HELIUS_HTTPS_URI_TX!,
    JUP_HTTPS_QUOTE_URI: process.env.JUP_HTTPS_QUOTE_URI!,
    JUP_HTTPS_SWAP_URI: process.env.JUP_HTTPS_SWAP_URI!,
    JUP_HTTPS_PRICE_URI: process.env.JUP_HTTPS_PRICE_URI!,
    DEX_HTTPS_LATEST_TOKENS: process.env.DEX_HTTPS_LATEST_TOKENS!,
  };
}
