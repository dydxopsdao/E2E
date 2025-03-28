import { createDydxApiClient } from "./Interactions/dydx/trade/api/client";
import { DYDX_CONFIG, validateConfig } from "./Interactions/dydx/trade/api/config";
import { OrderManager } from "./Interactions/dydx/trade/api/order-manager";
import { createDydxTradeHelper, closePositions } from "./helpers/dydx-trade-helpers";
import { logger } from "./utils/logger/logging-utils";

// List of markets you want to ensure are closed
const MARKETS_TO_CLOSE = ["BTC-USD"];

// Configuration for the second wallet
const SECOND_WALLET_CONFIG = {
  ...DYDX_CONFIG,
  address: "dydx1dk6n97ned9y5pghskc4n9jfsrmequkklywuapw",
  // You'll need to add the mnemonic for this wallet to your env variables
  mnemonic: process.env.DYDX_MNEMONIC_CANCEL_ORDER || "",
};

async function cleanupWallet(config: typeof DYDX_CONFIG, walletLabel: string) {
  try {
    // Create the API client for this wallet
    const apiClient = await createDydxApiClient(config);
    const client = await apiClient.getClient();
    const wallet = await apiClient.getWallet();
    const orderManager = new OrderManager(client, wallet);
    
    // Create trade helper
    const tradeHelper = createDydxTradeHelper(orderManager);
    
    logger.info(`[${walletLabel}] Starting cleanup`);
    
    // First pass - cancel all orders across all markets
    logger.step(`[${walletLabel}] Canceling all open orders`);
    await tradeHelper.cancelAllOrders();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Close positions for each market
    for (const market of MARKETS_TO_CLOSE) {
      await closePositions(tradeHelper, market, `[${walletLabel}] `);
      // Add a small delay between markets
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Run a second pass to ensure everything is closed and canceled
    logger.info(`[${walletLabel}] Running second pass to ensure all positions are closed and orders canceled`);
    
    // Cancel all orders again
    logger.step(`[${walletLabel}-Final] Canceling any remaining open orders`);
    await tradeHelper.cancelAllOrders();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Close any remaining positions
    for (const market of MARKETS_TO_CLOSE) {
      await closePositions(tradeHelper, market, `[${walletLabel}-Final] `);
    }
    
    logger.success(`[${walletLabel}] Successfully cleaned up all positions and orders`);
  } catch (error) {
    logger.error(`[${walletLabel}] Failed during cleanup:`, error);
    // We don't want the cleanup of one wallet to prevent cleanup of the other
  }
}

async function globalTeardown() {
  logger.info("Running global teardown - cleaning up orders and positions for all wallets");
  
  try {
    // Validate configurations first
    validateConfig(DYDX_CONFIG);
    validateConfig(SECOND_WALLET_CONFIG);
    
    // Add a small delay to allow any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Clean up both wallets in parallel
    await Promise.all([
      cleanupWallet(DYDX_CONFIG, "Primary Wallet"),
      cleanupWallet(SECOND_WALLET_CONFIG, "Cancel Order Wallet")
    ]);
    
    logger.success("Successfully completed cleanup for all wallets");
  } catch (error) {
    logger.error("Failed during teardown cleanup:", error);
    // We don't want the teardown to fail the test if cleanup fails
  }
}

export default globalTeardown;
