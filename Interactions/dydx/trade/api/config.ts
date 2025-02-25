import dotenv from 'dotenv';
import { logger } from '@utils/logger/logging-utils';

// Load environment variables
dotenv.config({ path: process.env.ENV_PATH || '.env' });

// Default values for testing
export const DYDX_TEST_MNEMONIC = 'your test mnemonic here';
export const DYDX_TEST_ADDRESS = 'your test address here';

// Export configuration
export const DYDX_CONFIG = {
  networkType: (process.env.DYDX_NETWORK_TYPE || 'testnet') as 'testnet' | 'mainnet',
  mnemonic: process.env.DYDX_MNEMONIC || DYDX_TEST_MNEMONIC,
  address: process.env.DYDX_ADDRESS || DYDX_TEST_ADDRESS,
};

// Validate configuration
export function validateConfig() {
  logger.info('Validating dYdX configuration');
  
  if (!DYDX_CONFIG.mnemonic) {
    logger.error('DYDX_MNEMONIC environment variable is required');
    throw new Error('DYDX_MNEMONIC environment variable is required');
  }
  
  if (!DYDX_CONFIG.address) {
    logger.error('DYDX_ADDRESS environment variable is required');
    throw new Error('DYDX_ADDRESS environment variable is required');
  }
  
  logger.success('dYdX configuration is valid');
} 