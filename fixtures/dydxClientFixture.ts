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
};

export async function createDydxFixtures() {
  // Validate configuration first
  validateConfig();

  // Create the API client and extract the required parts
  const apiClient = await createDydxApiClient(DYDX_CONFIG);
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
  dydxClient: async ({}, use) => {
    // Validate configuration
    validateConfig();
    
    // Create API client
    const apiClient = await createDydxApiClient(DYDX_CONFIG);
    const client = await apiClient.getClient();
    
    // Use the client in the test
    await use(client);
  },
  
  dydxWallet: async ({}, use) => {
    // Create API client and get wallet
    const apiClient = await createDydxApiClient(DYDX_CONFIG);
    const wallet = await apiClient.getWallet();
    
    // Use the wallet in the test
    await use(wallet);
  },
  
  dydxOrderManager: async ({ dydxClient, dydxWallet }, use) => {
    // Create order manager with both client and wallet
    const orderManager = new OrderManager(dydxClient, dydxWallet);
    
    // Use the order manager in the test
    await use(orderManager);
  },
  
  dydxWebSocketManager: async ({ dydxClient }, use) => {
    // Create websocket manager
    const webSocketManager = new WebSocketManager(dydxClient.indexerClient);
    
    // Use the websocket manager in the test
    await use(webSocketManager);
    
    // Clean up
    await webSocketManager.disconnect();
  },
  
  dydxTradeHelper: async ({ dydxOrderManager }, use) => {
    // Create trade helper
    const tradeHelper = createDydxTradeHelper(dydxOrderManager);
    
    // Use the trade helper in the test
    await use(tradeHelper);
  },
});

export default {
  dydxApiTest
}; 