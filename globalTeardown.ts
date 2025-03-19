import { createDydxApiClient } from "./Interactions/dydx/trade/api/client";
import { DYDX_CONFIG, validateConfig } from "./Interactions/dydx/trade/api/config";
import { OrderManager } from "./Interactions/dydx/trade/api/order-manager";
import { createDydxTradeHelper, closePositions } from "./helpers/dydx-trade-helpers";
import { logger } from "./utils/logger/logging-utils";

// List of markets you want to ensure are closed
const MARKETS_TO_CLOSE = ["BTC-USD"];

async function globalTeardown() {
  logger.info("Running global teardown - cleaning up orders and positions");
  
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
    
    // First pass - cancel all orders across all markets
    logger.step("[Teardown] Canceling all open orders");
    await tradeHelper.cancelAllOrders();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Close positions for each market
    for (const market of MARKETS_TO_CLOSE) {
      await closePositions(tradeHelper, market, "[Teardown] ");
      // Add a small delay between markets
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Run a second pass to ensure everything is closed and canceled
    logger.info("Running second pass to ensure all positions are closed and orders canceled");
    
    // Cancel all orders again
    logger.step("[Teardown-Final] Canceling any remaining open orders");
    await tradeHelper.cancelAllOrders();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Close any remaining positions
    for (const market of MARKETS_TO_CLOSE) {
      await closePositions(tradeHelper, market, "[Teardown-Final] ");
    }
    
    logger.success("Successfully cleaned up all positions and orders during teardown");
  } catch (error) {
    logger.error("Failed during teardown cleanup:", error);
    // We don't want the teardown to fail the test if cleanup fails
  }
}

export default globalTeardown;
