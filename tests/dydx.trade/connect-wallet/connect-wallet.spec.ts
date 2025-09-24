import { navigateToDydxPage } from "@dydx/general/actions/navigation.actions";
import { triggerWalletConnectionModal } from "@dydx/connect-wallet/actions/connect-wallet.actions";
import { ConnectWalletSelectors } from "@dydx/connect-wallet/selectors/connect-wallet-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants.js";
import { logger } from "@utils/logger/logging-utils";
import { Page } from "@playwright/test";
import { Eyes } from "@applitools/eyes-playwright";
import { eyesTest as test } from "@fixtures/eyesFixture";
import { visualCheck } from "@utils/visual-check";

test.skip("Language Dropdown Works", async ({ page, eyes }: { page: Page, eyes: Eyes }) => {
  try {
    // Arrange
    await navigateToDydxPage(page, "/portfolio/overview");

    // Act
    await triggerWalletConnectionModal(page);
    await page
      .locator(ConnectWalletSelectors.walletConnectModal)
      .waitFor({ state: "visible", timeout: TEST_TIMEOUTS.DEFAULT });
    logger.success("Wallet connection modal opened");
    logger.step("Testing language dropdown");
    await page.locator(ConnectWalletSelectors.languageDropdown).click();

    // Assert
    logger.step("Verifying dropdown visibility");
    await page
      .locator(ConnectWalletSelectors.languageDropdownMenu)
      .waitFor({ state: "visible", timeout: TEST_TIMEOUTS.DEFAULT });
    logger.success("Language dropdown menu is visible");

  
    await visualCheck(eyes, {
      name: "Language Dropdown Open"
    });
    logger.success("Visual check completed");
  } catch (error) {
    logger.error("Language dropdown test failed", error as Error);
    throw error;
  }
});

