import { test as base } from '@playwright/test';
import { DYDX_CONFIG, validateConfig } from '@dydx/trade/api/config';
import { WebSocketManager } from '@dydx/trade/api/websocket-manager';
import { CompositeClient, LocalWallet } from '@dydxprotocol/v4-client-js';
import { createDydxApiClient } from '@interactions/dydx/trade/api/client';
import { OrderManager } from '@interactions/dydx/trade/api/order-manager';
import { DydxTradeHelper, createDydxTradeHelper } from '../helpers/dydx-trade-helpers';

// Define the fixtures
type DydxApiFixtures = {
  dydxClient: CompositeClient;
  dydxWallet: LocalWallet;
  dydxOrderManager: OrderManager;
  dydxWebSocketManager: WebSocketManager;
  dydxTradeHelper: DydxTradeHelper;
  dydxCredentialsType: string; 
};

export async function createDydxFixtures(credentialsType = 'default') {
  // Determine which credentials to use
  let mnemonic = process.env.DYDX_MNEMONIC || '';
  let address = process.env.DYDX_ADDRESS || '';
  
  if (credentialsType === 'cancel-order') {
    mnemonic = process.env.DYDX_MNEMONIC_CANCEL_ORDER || process.env.DYDX_MNEMONIC || '';
    address = process.env.DYDX_ADDRESS_CANCEL_ORDER || process.env.DYDX_ADDRESS || '';
  }

  // Create a config object with the selected credentials
  const config = {
    ...DYDX_CONFIG,
    mnemonic, 
    address
  };

  // Validate configuration first
  validateConfig(config);

  // Create the API client and extract the required parts
  const apiClient = await createDydxApiClient(config);
  const client = await apiClient.getClient();
  const wallet = await apiClient.getWallet();
  const orderManager = new OrderManager(client, wallet);
  const webSocketManager = new WebSocketManager(client.indexerClient);
  const tradeHelper = createDydxTradeHelper(orderManager);

  return {
    dydxClient: client,
    dydxWallet: wallet,
    dydxOrderManager: orderManager,
    dydxWebSocketManager: webSocketManager,
    dydxTradeHelper: tradeHelper,
  };
}

// Create the fixture extension
export const dydxApiTest = base.extend<DydxApiFixtures>({
  dydxCredentialsType: ['default', { option: true }],
  
  dydxClient: async ({ dydxCredentialsType }, use) => {
    const fixtures = await createDydxFixtures(dydxCredentialsType);
    await use(fixtures.dydxClient);
  },
  
  dydxWallet: async ({ dydxCredentialsType }, use) => {
    const fixtures = await createDydxFixtures(dydxCredentialsType);
    await use(fixtures.dydxWallet);
  },
  
  dydxOrderManager: async ({ dydxCredentialsType }, use) => {
    const fixtures = await createDydxFixtures(dydxCredentialsType);
    await use(fixtures.dydxOrderManager);
  },
  
  dydxWebSocketManager: async ({ dydxCredentialsType }, use) => {
    const fixtures = await createDydxFixtures(dydxCredentialsType);
    await use(fixtures.dydxWebSocketManager);
    await fixtures.dydxWebSocketManager.disconnect();
  },
  
  dydxTradeHelper: async ({ dydxCredentialsType }, use) => {
    const fixtures = await createDydxFixtures(dydxCredentialsType);
    await use(fixtures.dydxTradeHelper);
  },
});

export default {
  dydxApiTest
}; 