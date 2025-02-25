import { metamaskTest } from "./metamaskFixture";
import { CompositeClient, LocalWallet } from "@dydxprotocol/v4-client-js";
import { OrderManager } from "../Interactions/dydx/trade/api/order-manager";
import { WebSocketManager } from "../Interactions/dydx/trade/api/websocket-manager";
import { DydxTradeHelper } from "../helpers/dydx-trade-helpers";
import { createDydxFixtures } from "./dydxClientFixture";

// Define the type for dYdX API fixtures
type DydxApiFixtures = {
  dydxClient: CompositeClient;
  dydxWallet: LocalWallet;
  dydxOrderManager: OrderManager;
  dydxWebSocketManager: WebSocketManager;
  dydxTradeHelper: DydxTradeHelper;
};

// Define an internal worker fixture that holds all dYdX objects
type WorkerFixtures = {
  _dydxFixturesWorker: DydxApiFixtures;
};

// Extend metamaskTest with dYdX fixtures
export const combinedTest = metamaskTest.extend<
  DydxApiFixtures,
  WorkerFixtures
>({
  // Worker-scoped fixture: create dYdX fixtures once per worker
  _dydxFixturesWorker: [
    async ({}, use) => {
      const fixtures = await createDydxFixtures();
      await use(fixtures);
      await fixtures.dydxWebSocketManager.disconnect();
    },
    { scope: "worker" },
  ],

  // Map each dYdX fixture from the worker fixture into the test context
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
