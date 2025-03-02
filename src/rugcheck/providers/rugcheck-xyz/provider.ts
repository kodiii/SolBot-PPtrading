/**
 * @file RugCheck.xyz provider implementation
 */

import axios, { AxiosInstance } from 'axios';
import { IRugCheckProvider, TokenValidationResult, TokenMetadata } from '../../types';
import { RugCheckXYZConfig, RugCheckXYZError, RugCheckXYZResponse } from './types';
import { validateToken as validateTokenRules } from './validation-rules';

export class RugCheckXYZProvider implements IRugCheckProvider {
  private httpClient: AxiosInstance;
  private retryDelay: number;

  constructor(private readonly providerConfig: RugCheckXYZConfig) {
    this.httpClient = axios.create({
      baseURL: providerConfig.apiUrl,
      timeout: providerConfig.timeout,
    });
    this.retryDelay = providerConfig.retryConfig.initialDelay;
  }

  async validateToken(tokenMint: string): Promise<TokenValidationResult> {
    const retryConfig = this.providerConfig.retryConfig;
    let attempt = 0;

    while (attempt < retryConfig.maxRetries) {
      try {
        const response = await this.httpClient.get<RugCheckXYZResponse>(
          `/tokens/${tokenMint}/report`
        );

        if (!response.data) {
          throw new RugCheckXYZError('Empty response received');
        }

        // Apply validation rules
        const errors = validateTokenRules(response.data);

        return {
          isValid: errors.length === 0,
          tokenName: response.data.tokenMeta.name,
          tokenCreator: response.data.creator,
          score: response.data.score,
          errors,
          risks: response.data.risks?.map(risk => ({
            name: risk.name,
            value: risk.value,
            description: risk.description,
            score: risk.score,
            level: this.mapRiskLevel(risk.level)
          })) ?? [],
          metadata: {
            name: response.data.tokenMeta.name,
            symbol: response.data.tokenMeta.symbol,
            mintAuthority: response.data.token.mintAuthority,
            freezeAuthority: response.data.token.freezeAuthority,
            supply: response.data.token.supply,
            decimals: response.data.token.decimals,
            isInitialized: response.data.token.isInitialized,
            isMutable: response.data.tokenMeta.mutable
          }
        };
      } catch (error) {
        attempt++;
        
        if (attempt === retryConfig.maxRetries) {
          throw this.handleError(error);
        }

        // Exponential backoff
        await this.delay(Math.min(
          this.retryDelay * Math.pow(2, attempt),
          retryConfig.maxDelay
        ));
      }
    }

    throw new RugCheckXYZError('Max retries exceeded');
  }

  async getTokenMetadata(tokenMint: string): Promise<TokenMetadata> {
    const validation = await this.validateToken(tokenMint);
    return validation.metadata;
  }

  async checkDuplicate(name: string, creator: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get<{tokens: RugCheckXYZResponse[]}>('/tokens/search', {
        params: {
          name,
          creator
        }
      });

      return response.data.tokens.length > 0;
    } catch (error) {
      console.error('Failed to check for duplicates:', error);
      return false;
    }
  }

  private mapRiskLevel(level: string): 'good' | 'warning' | 'critical' {
    switch (level.toLowerCase()) {
      case 'good':
      case 'low':
        return 'good';
      case 'warning':
      case 'medium':
        return 'warning';
      default:
        return 'critical';
    }
  }

  private handleError(error: unknown): RugCheckXYZError {
    if (axios.isAxiosError(error)) {
      return new RugCheckXYZError(
        error.message,
        error.response?.status,
        error.response?.data
      );
    }
    return new RugCheckXYZError(error instanceof Error ? error.message : 'Unknown error');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}