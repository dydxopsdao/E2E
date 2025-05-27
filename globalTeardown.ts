import { FullConfig } from '@playwright/test';
import { createDydxApiClient } from "./Interactions/dydx/trade/api/client";
import { DYDX_CONFIG, validateConfig } from "./Interactions/dydx/trade/api/config";
import { OrderManager } from "./Interactions/dydx/trade/api/order-manager";
import { createDydxTradeHelper, closePositions } from "./helpers/dydx-trade-helpers";
import { logger } from "./utils/logger/logging-utils";
import { getSharedRunner } from './config/applitools.config';

const MARKETS_TO_CLOSE = ["BTC-USD"];

const SECOND_WALLET_CONFIG = {
  ...DYDX_CONFIG,
  address: "dydx1dk6n97ned9y5pghskc4n9jfsrmequkklywuapw",
  mnemonic: process.env.DYDX_MNEMONIC_CANCEL_ORDER || "",
};

async function cleanupWallet(config: typeof DYDX_CONFIG, walletLabel: string) {
  try {
    const apiClient = await createDydxApiClient(config);
    const client = await apiClient.getClient();
    const wallet = await apiClient.getWallet();
    const orderManager = new OrderManager(client, wallet);
    const tradeHelper = createDydxTradeHelper(orderManager);

    logger.info(`[${walletLabel}] Starting cleanup`);
    logger.step(`[${walletLabel}] Canceling all open orders`);
    await tradeHelper.cancelAllOrders();
    await new Promise(resolve => setTimeout(resolve, 3000));

    for (const market of MARKETS_TO_CLOSE) {
      await closePositions(tradeHelper, market, `[${walletLabel}] `);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info(`[${walletLabel}] Running second pass to ensure all positions are closed and orders canceled`);
    logger.step(`[${walletLabel}-Final] Canceling any remaining open orders`);
    await tradeHelper.cancelAllOrders();
    await new Promise(resolve => setTimeout(resolve, 3000));

    for (const market of MARKETS_TO_CLOSE) {
      await closePositions(tradeHelper, market, `[${walletLabel}-Final] `);
    }

    logger.success(`[${walletLabel}] Successfully cleaned up all positions and orders`);
  } catch (error) {
    logger.error(`[${walletLabel}] Failed during cleanup:`, error as Error);
  }
}

async function globalTeardown(config: FullConfig) {
  console.log("!!!!!!!! GLOBAL TEARDOWN HAS BEEN ENTERED !!!!!!!");
  logger.info("Running global teardown...");

  logger.info("[Applitools Global Teardown] Starting Applitools runner finalization...");
  const useApplitools = process.env.USE_APPLITOOLS === 'true';
  if (useApplitools) {
    const runner = getSharedRunner();
    if (runner) {
      try {
        logger.info("[Applitools Global Teardown] Getting all test results from runner...");
        const allResults = await runner.getAllTestResults(false);
        logger.info(`[Applitools Global Teardown] All test results from runner processed. Summary: ${allResults.toString()}`);
      } catch (e) {
        logger.error('[Applitools Global Teardown] Error getting all test results from runner:', e as Error);
      }
    } else {
        logger.warn('[Applitools Global Teardown] Shared runner was not initialized. Skipping getAllTestResults.');
    }
  } else {
    logger.info('[Applitools Global Teardown] Applitools not used in this run. Skipping runner.getAllTestResults().');
  }
  logger.info("[Applitools Global Teardown] Applitools runner finalization complete.");

  /*logger.info("[dYdX Global Teardown] Starting cleanup of orders and positions for all wallets...");
  try {
    validateConfig(DYDX_CONFIG);
    validateConfig(SECOND_WALLET_CONFIG);

    await Promise.all([
      cleanupWallet(DYDX_CONFIG, "Primary Wallet"),
      cleanupWallet(SECOND_WALLET_CONFIG, "Cancel Order Wallet")
    ]);

    logger.success("[dYdX Global Teardown] Successfully completed cleanup for all wallets");
  } catch (error) {
    logger.error("[dYdX Global Teardown] Failed during dYdX cleanup:", error as Error);
  } */

  logger.info("GLOBAL TEARDOWN: Process Finished (dYdX cleanup skipped for debug).");
}

export default globalTeardown;