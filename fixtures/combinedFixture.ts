// fixtures/combinedFixture.ts

import { metamaskTest } from "./metamaskFixture";
import { CompositeClient, LocalWallet } from "@dydxprotocol/v4-client-js";
import { OrderManager } from "../Interactions/dydx/trade/api/order-manager";
import { WebSocketManager } from "../Interactions/dydx/trade/api/websocket-manager";
import { DydxTradeHelper } from "../helpers/dydx-trade-helpers";
import { createDydxFixtures } from "./dydxClientFixture";
import { logger } from "@utils/logger/logging-utils"; // Assuming your logger is here

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
    async ({}, use, workerInfo) => { // Added workerInfo for more context in logs
      const workerId = workerInfo?.workerIndex ?? 'unknown_worker';
      logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Setup - START`);
      const dYdXFixtures = await createDydxFixtures();
      logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Setup - dYdX fixtures created.`);
      
      await use(dYdXFixtures); // Test(s) on this worker run here
      
      logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - START after all tests on this worker completed.`);
      try {
        // 1. Disconnect WebSocketManager (manages IndexerClient WebSockets, if any were truly active)
        if (dYdXFixtures.dydxWebSocketManager && typeof dYdXFixtures.dydxWebSocketManager.disconnect === 'function') {
          logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - Calling dydxWebSocketManager.disconnect()...`);
          await dYdXFixtures.dydxWebSocketManager.disconnect();
          logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - dydxWebSocketManager.disconnect() RETURNED.`);
        } else {
          logger.warn(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - WebSocketManager or its disconnect method not found.`);
        }

        // 2. Attempt to disconnect the Tendermint37Client within ValidatorClient (part of CompositeClient)
        // This is speculative as _tendermint37Client is private.
        if (dYdXFixtures.dydxClient && dYdXFixtures.dydxClient.validatorClient) {
          const validatorClientInstance = dYdXFixtures.dydxClient.validatorClient as any; // Cast to any to access potential private members
          
          if (validatorClientInstance._tendermint37Client && 
              typeof validatorClientInstance._tendermint37Client.disconnect === 'function') {
            logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - Attempting to disconnect internal Tendermint37Client of ValidatorClient...`);
            validatorClientInstance._tendermint37Client.disconnect(); // This is synchronous based on Tendermint37Client code
            logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - Internal Tendermint37Client disconnected.`);
          } else if (typeof validatorClientInstance.disconnect === 'function') {
            // If ValidatorClient itself had a public disconnect method (it doesn't in the code shown)
            logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - Calling disconnect() on ValidatorClient itself...`);
            validatorClientInstance.disconnect();
            logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - ValidatorClient.disconnect() called.`);
          }
          else {
            logger.warn(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - No direct disconnect method found for ValidatorClient or its internal Tendermint37Client.`);
          }
        } else {
            logger.warn(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - dYdXClient or dYdXClient.validatorClient not found.`);
        }
        
        // 3. Check IndexerClient for any explicit close/disconnect (less likely to have persistent connections unless using WebSockets not managed by WebSocketManager)
        if (dYdXFixtures.dydxClient && dYdXFixtures.dydxClient.indexerClient) {
            const indexerClientInstance = dYdXFixtures.dydxClient.indexerClient as any;
            if (typeof indexerClientInstance.close === 'function') { 
               logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - Closing IndexerClient via close()...`);
               indexerClientInstance.close();
               logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - IndexerClient closed.`);
            } else if (typeof indexerClientInstance.disconnect === 'function') {
               logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - Disconnecting IndexerClient via disconnect()...`);
               indexerClientInstance.disconnect();
               logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - IndexerClient disconnected.`);
            } else {
              // IndexerClient (as shown) primarily uses HTTP REST, so an explicit disconnect is often not needed unless it also spins up WebSockets internally.
              // logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - No explicit close/disconnect for IndexerClient found.`);
            }
        }

      } catch (e) {
        logger.error(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - Error during dYdX client cleanup:`, e as Error);
      }
      logger.info(`WORKER_FIXTURE [_dydxFixturesWorker - Worker ${workerId}]: Teardown - FINISHED.`);
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