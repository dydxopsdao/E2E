import { navigateToDydxPage } from "@dydx/general/actions/navigation.actions";
import { triggerWalletConnectionModal } from "@dydx/connect-wallet/actions/connect-wallet.actions";
import { ConnectWalletSelectors } from "@dydx/connect-wallet/selectors/connect-wallet-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants.js";
import { logger } from "@utils/logger/logging-utils";
import { Page, expect } from "@playwright/test";
import { visualTest as test } from "@fixtures/visualTestingFixture";
import type { VisualTestingHelper } from "@utils/visual-check";

interface TestContext {
  page: Page;
  visualTest: VisualTestingHelper;
}

/**
 * Helper function to perform a single step with visual verification
 */
async function performStep(
  context: TestContext,
  stepLabel: string,
  action: () => Promise<void>,
  visualCheckName?: string
): Promise<void> {
  const { page, visualTest } = context;

  logger.step(stepLabel);
  await action();
  logger.success(`Completed: ${stepLabel}`);

  if (visualCheckName) {
    await visualTest.check(page, { name: visualCheckName });
    logger.success(`Visual check completed: ${visualCheckName}`);
  }
}

test("Language Dropdown Works", async ({ page, visualTest }: TestContext) => {
  try {
    // Navigate to the portfolio page
    await performStep(
      { page, visualTest },
      "Navigating to portfolio overview page",
      async () => {
        await navigateToDydxPage(page, "/portfolio/overview");
      }
    );

    // Open the wallet connection modal
    await performStep(
      { page, visualTest },
      "Opening wallet connection modal",
      async () => {
        await triggerWalletConnectionModal(page);
        await expect(
          page.locator(ConnectWalletSelectors.walletConnectModal)
        ).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
      }
    );

    // Test the language dropdown
    await performStep(
      { page, visualTest },
      "Opening language dropdown",
      async () => {
        await page.locator(ConnectWalletSelectors.languageDropdown).click();
        await expect(
          page.locator(ConnectWalletSelectors.languageDropdownMenu)
        ).toBeVisible({ timeout: TEST_TIMEOUTS.DEFAULT });
      },
      "Language Dropdown Open"
    );
  } catch (error) {
    logger.error("Language dropdown test failed", error as Error);
    throw error;
  }
});
