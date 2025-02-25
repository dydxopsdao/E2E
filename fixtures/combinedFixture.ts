import { metamaskTest } from "./metamaskFixture";
import { CompositeClient, LocalWallet } from "@dydxprotocol/v4-client-js";
import { OrderManager } from "../Interactions/dydx/trade/api/order-manager";
import { WebSocketManager } from "../Interactions/dydx/trade/api/websocket-manager";
import { DydxTradeHelper } from "../helpers/dydx-trade-helpers";
import { createDydxFixtures } from "./dydxClientFixture";

// This is a two-part process:
// 1. Define the base type for dYdX fixtures
type DydxApiFixtures = {
  dydxClient: CompositeClient;
  dydxWallet: LocalWallet;
  dydxOrderManager: OrderManager;
  dydxWebSocketManager: WebSocketManager;
  dydxTradeHelper: DydxTradeHelper;
};

// 2. Define the internal worker fixture type
type WorkerFixtures = {
  _dydxFixturesWorker: DydxApiFixtures;
};

// Create the combined test by extending metamaskTest
export const combinedTest = metamaskTest.extend<DydxApiFixtures, WorkerFixtures>({
  // Create a worker-scoped fixture that initializes all dYdX dependencies once
  _dydxFixturesWorker: [
    async ({}, use) => {
      // Create all the dYdX fixtures at once
      const fixtures = await createDydxFixtures();
      
      // Provide the fixtures to tests
      await use(fixtures);
      
      // Clean up after all tests are done
      await fixtures.dydxWebSocketManager.disconnect();
    },
    { scope: 'worker' } // This fixture is created once per worker
  ],
  
  // Now map each dYdX fixture to its corresponding value from the worker fixture
  dydxClient: async ({ _dydxFixturesWorker }, use) => {
    await use(_dydxFixturesWorker.dydxClient);
  },
  
  dydxWallet: async ({ _dydxFixturesWorker }, use) => {
    await use(_dydxFixturesWorker.dydxWallet);
  },
  
  dydxOrderManager: async ({ _dydxFixturesWorker }, use) => {
    await use(_dydxFixturesWorker.dydxOrderManager);
  },
  
  dydxWebSocketManager: async ({ _dydxFixturesWorker }, use) => {
    await use(_dydxFixturesWorker.dydxWebSocketManager);
  },
  
  dydxTradeHelper: async ({ _dydxFixturesWorker }, use) => {
    await use(_dydxFixturesWorker.dydxTradeHelper);
  },
});

export default combinedTest;
