/**
 * Solana Wallet Keypair Generator
 * 
 * This utility generates a new Solana wallet keypair for use in the trading bot.
 * The keypair consists of a private key (for signing transactions) and a public key
 * (for receiving funds and identifying the wallet).
 * 
 * Key formats:
 * - Private Key: Output in Base64 format for easy storage in environment variables
 * - Public Key: Output in Base58 format (standard Solana address format)
 * 
 * Usage:
 * 1. Run this script to generate a new wallet
 * 2. Save the private key in your .env file as PRIV_KEY_WALLET
 * 3. Use the public key as your bot's wallet address
 * 
 * Security note: Keep the private key secure and never share it.
 * The private key provides full access to the wallet's funds.
 */

import { Keypair } from "@solana/web3.js";

// Generate a new random keypair for use as a Solana wallet
const keypair = Keypair.generate();

// Convert and display the private key in Base64 format
// This format is used in the .env file for the PRIV_KEY_WALLET variable
console.log(
  "Private Key (Base64):",
  Buffer.from(keypair.secretKey).toString("base64")
);

// Display the public key in Base58 format
// This is the wallet's address on the Solana network
console.log("Public Key:", keypair.publicKey.toBase58());
