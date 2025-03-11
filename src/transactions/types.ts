/**
 * Types for transaction processing and response handling
 */

interface ProgramInfo {
  source: string;
  account?: string;
}

interface TokenInfo {
  mint: string;
  tokenAmount: string;
}

/**
 * Structure for transaction details response
 */
export interface TransactionDetailsResponse {
  blockTime: number;
  slot: number;
  tx_type: string;
  mint?: string;
  amount?: string;
  program: string;
  token_name?: string;
  instructions?: TransactionInstruction[];
}

/**
 * Array type for transaction details responses
 */
export type TransactionDetailsResponseArray = TransactionDetailsResponse[];

/**
 * Structure for token mint data response
 * Simplified to match actual usage in code
 */
export interface MintsDataReponse {
  tokenMint: string;  // The actual token mint address
  solMint: string;    // The SOL token account
}

/**
 * Details for swap event processing
 */
export interface SwapEventDetailsResponse {
  programInfo: ProgramInfo;
  tokenInputs: TokenInfo[];
  tokenOutputs: TokenInfo[];
  fee: string;
  slot: number;
  timestamp: number;
  description?: string;
}

/**
 * Instruction interface for transaction processing
 */
export interface TransactionInstruction {
  programId: string;
  data: string;
  accounts: string[];
  keys: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
}