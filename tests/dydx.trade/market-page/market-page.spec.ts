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
    
    // Add a small wait to ensure page is fully loaded
    await page.waitForTimeout(2000);
    
    // Act - perform visual check only once
    await visualCheck(eyes, {
      name: "eth-usd market page connected landing page",
      matchLevel: "Layout"
    });
    
  } catch (error) {
    logger.error("Market page test failed", error as Error);
    throw error;
  }
});

