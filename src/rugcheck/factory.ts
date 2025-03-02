/**
 * @file RugCheck provider factory
 */

import { IRugCheckProvider } from './types';
import { RugCheckXYZProvider } from './providers/rugcheck-xyz/provider';
import { RugCheckXYZConfig } from './providers/rugcheck-xyz/types';
import { config } from '../config';

export type ProviderType = 'rugcheck-xyz' | 'honeypot' | 'custom';

export class RugCheckProviderFactory {
  private static instance: RugCheckProviderFactory;
  private providers: Map<ProviderType, IRugCheckProvider>;

  private constructor() {
    this.providers = new Map();
  }

  static getInstance(): RugCheckProviderFactory {
    if (!RugCheckProviderFactory.instance) {
      RugCheckProviderFactory.instance = new RugCheckProviderFactory();
    }
    return RugCheckProviderFactory.instance;
  }

  getProvider(type: ProviderType = 'rugcheck-xyz'): IRugCheckProvider {
    let provider = this.providers.get(type);

    if (!provider) {
      provider = this.createProvider(type);
      this.providers.set(type, provider);
    }

    return provider;
  }

  private createProvider(type: ProviderType): IRugCheckProvider {
    switch (type) {
      case 'rugcheck-xyz':
        return new RugCheckXYZProvider({
          apiUrl: 'https://api.rugcheck.xyz/v1',
          timeout: config.tx.get_timeout,
          retryConfig: {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 10000
          }
        } as RugCheckXYZConfig);

      case 'honeypot':
        throw new Error('Honeypot provider not yet implemented');

      case 'custom':
        throw new Error('Custom provider not yet implemented');

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}

/**
 * Get a rugcheck provider instance
 * @param type Provider type to use
 * @returns IRugCheckProvider instance
 */
export function getRugCheckProvider(type?: ProviderType): IRugCheckProvider {
  return RugCheckProviderFactory.getInstance().getProvider(type);
}