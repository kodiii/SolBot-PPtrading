import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

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
    "GRPC_ENDPOINT",
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
   * @param {boolean} checkApiKey - Whether to verify presence of api-key parameter for Helius URLs
   * @throws {Error} If API key is missing when required
   */
  const validateUrl = (envVar: string, checkApiKey: boolean = false) => {
    const value = process.env[envVar];
    if (!value) return;

    try {
      new URL(value); // Check if it's a valid URL (without enforcing HTTPS/WSS)
    } catch (error) {
      throw new Error(`🚫 ${envVar} is not a valid URL: ${value}`);
    }

    // Only check for api-key if it's a Helius URL
    if (checkApiKey && value.includes("helius")) {
      const url = new URL(value);
      const apiKey = url.searchParams.get("api-key");
      if (!apiKey || apiKey.trim() === "") {
        throw new Error(`🚫 The 'api-key' parameter is missing or empty in the Helius URL: ${value}`);
      }
    }
  };

  validateUrl("HELIUS_HTTPS_URI", true);
  validateUrl("HELIUS_WSS_URI", true);
  validateUrl("HELIUS_HTTPS_URI_TX", true);
  validateUrl("JUP_HTTPS_QUOTE_URI");
  validateUrl("JUP_HTTPS_SWAP_URI");
  validateUrl("JUP_HTTPS_PRICE_URI");
  validateUrl("DEX_HTTPS_LATEST_TOKENS");

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
