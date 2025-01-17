import { metamaskVisualTest as test } from "@fixtures/metamaskVisualFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { navigateToDydxPage } from "@dydx/general/actions/navigation.actions";
import { BrowserContext, Page } from "@playwright/test";
import { VisualTestingHelper } from "@utils/visual-check";

test("eth-usd market page connected landing page", async ({ metamaskContext, visualTest, page }: { metamaskContext: BrowserContext, visualTest: VisualTestingHelper, page:Page }) => {
  try {
    // Arrange
    logger.step("Setting up connected market page test");
    await openDydxConnectMetaMask(page, metamaskContext);
    await navigateToDydxPage(page, "/trade/ETH-USD", {
      waitUntil: "networkidle"
    });
    // Act
    await visualTest.check(page, {
      name: "eth-usd market page connected landing page"
    });
    
  } catch (error) {
    logger.error("Market page test failed", error as Error);
    throw error;
  }
});
