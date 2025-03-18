import { createDydxApiClient } from "./interactions/dydx/trade/api/client";
import { DYDX_CONFIG, validateConfig } from "./interactions/dydx/trade/api/config";
import { OrderManager } from "./interactions/dydx/trade/api/order-manager";
import { createDydxTradeHelper, closePositions } from "./helpers/dydx-trade-helpers";
import { logger } from "./utils/logger/logging-utils";

// List of markets you want to ensure are closed
const MARKETS_TO_CLOSE = ["ETH-USD", "BTC-USD", "SOL-USD", "LINK-USD", "MATIC-USD", "UNI-USD", "DOGE-USD", "AVAX-USD"];

async function globalTeardown() {
  logger.info("Running global teardown - closing any open positions");
  
  try {
    // Validate configuration first
    validateConfig();
    
    // Create the API client using the same approach as in the fixture
    const apiClient = await createDydxApiClient(DYDX_CONFIG);
    const client = await apiClient.getClient();
    const wallet = await apiClient.getWallet();
    const orderManager = new OrderManager(client, wallet);
    
    // Create trade helper
    const tradeHelper = createDydxTradeHelper(orderManager);
    
    // Add a small delay to allow any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Close positions for each market
    for (const market of MARKETS_TO_CLOSE) {
      await closePositions(tradeHelper, market, "[Teardown] ");
      // Add a small delay between markets
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Run a second pass to ensure everything is closed
    logger.info("Running second pass to ensure all positions are closed");
    for (const market of MARKETS_TO_CLOSE) {
      await closePositions(tradeHelper, market, "[Teardown-Final] ");
    }
    
    logger.success("Successfully closed all positions during teardown");
  } catch (error) {
    logger.error("Failed to close positions during teardown:", error);
    // We don't want the teardown to fail the test if cleanup fails
  }
}

export default globalTeardown;
