import { metamaskEyesTest as test } from "@fixtures/metamaskEyesFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { navigateToDydxPage } from "@dydx/general/actions/navigation.actions";
import { Eyes } from "@applitools/eyes-playwright";
import { BrowserContext, Page } from "@playwright/test";
import { visualCheck } from "@utils/visual-check";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { waitForAnimations, waitForPageLoad } from "@interactions/dydx/general/actions/general.actions";

test("eth-usd market page connected landing page", async ({ metamaskContext, eyes, page }: { metamaskContext: BrowserContext, eyes: Eyes, page:Page }) => {
  try {
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
