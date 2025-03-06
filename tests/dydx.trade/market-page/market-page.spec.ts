import { completeCombinedTest as test } from "@fixtures/completeCombinedFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { visualCheck } from "@utils/visual-check";

test("eth-usd market page connected landing page", async ({ metamaskContext, eyes, page, dydxTradeHelper }) => {
  try {
    
    try {
        await dydxTradeHelper.cancelAllOrders();
    } catch (error) {
      logger.error("Failed to cleanup orders", error as Error);
    }
      // Arrange
      logger.step("Setting up connected market page test");
    await openDydxConnectMetaMask(page, metamaskContext, {
      dydxPage: "/trade/ETH-USD"
    });
    // Act
    await visualCheck(eyes, {
      name: "eth-usd market page connected landing page"
    });
    
  } catch (error) {
    logger.error("Market page test failed", error as Error);
    throw error;
  }
});

