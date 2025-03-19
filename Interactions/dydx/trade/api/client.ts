import {
  CompositeClient,
  LocalWallet,
  Network,
  BECH32_PREFIX,
} from '@dydxprotocol/v4-client-js';
import { logger } from '../../../../utils/logger/logging-utils';

// Network configurations
const NETWORK_CONFIGS = {
  testnet: () => Network.testnet(),
  mainnet: () => Network.mainnet(),
};

export interface DydxClientConfig {
  networkType: 'testnet' | 'mainnet';
  mnemonic: string;
  address?: string;
  transactionTimeoutMs?: 30000;
}

export class DydxApiClient {
  private client: CompositeClient | null = null;
  private wallet: LocalWallet | null = null;
  private config: DydxClientConfig;
  
  constructor(config: DydxClientConfig) {
    this.config = config;
  }
  
  async initialize(): Promise<CompositeClient> {
    if (this.client) {
      return this.client;
    }
    
    logger.step('Initializing dYdX API client');
    
    try {
      // Initialize a local wallet with the provided mnemonic
      this.wallet = await LocalWallet.fromMnemonic(
        this.config.mnemonic,
        BECH32_PREFIX
      );
      
      // Get network configuration
      const networkFunc = NETWORK_CONFIGS[this.config.networkType];
      const network = networkFunc();
      
      // Create and connect the client
      this.client = await CompositeClient.connect(network);
      
      logger.success(`Connected to dYdX ${this.config.networkType}`);
      
      return this.client;
    } catch (error) {
      logger.error('Failed to initialize dYdX API client', error as Error);
      throw error;
    }
  }
  
  async getClient(): Promise<CompositeClient> {
    if (!this.client) {
      return this.initialize();
    }
    return this.client;
  }
  
  async getWallet(): Promise<LocalWallet> {
    if (!this.wallet) {
      await this.initialize();
    }
    return this.wallet!;
  }
}

// Helper function to create a client
export async function createDydxApiClient(config: DydxClientConfig): Promise<DydxApiClient> {
  const client = new DydxApiClient(config);
  await client.initialize();
  return client;
}
