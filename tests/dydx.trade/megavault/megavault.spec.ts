import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { metamaskEyesTest as test } from "@fixtures/metamaskEyesFixture";
import { navigateToViaHeader } from "@interactions/dydx/general/actions/navigation.actions";
import { vaultTransaction } from "@interactions/dydx/megavault/actions/megavault.actions";
import { NotificationSelectors } from "@interactions/dydx/notifications/selectors/notification-selectors";
import { logger } from "@utils/logger/logging-utils";

// Override the default seed phrase for all tests in this file
test.use({ seedPhraseEnvKey: "SEED_PHRASE_MEGAVAULT" });

test.describe("Megavault flows", () => {
  // Set higher timeout for these long-running transactions
  test.describe.configure({ retries: 1, timeout: 300000 });
  
  test.skip("megavault deposit and withdraw cycle", async ({ metamaskContext, page, eyes }) => {
    try {
      logger.step("Starting Megavault deposit and withdraw cycle test");
      
      // Connect to MetaMask once at the beginning using the page with MetaMask already configured
      logger.info("Connecting to MetaMask and navigating to vault page");
      await openDydxConnectMetaMask(page, metamaskContext);
      await page.bringToFront();
      await navigateToViaHeader(page, "VAULT");
      try {
        // Click on any instant deposit toast notifications that appear

          await page.locator(".sc-tbzx68-0.bMrJvQ.sc-w1wpg0-1.bfKQCL").click();
          await page.waitForTimeout(250);
          await page.locator(".sc-tbzx68-0.bMrJvQ.sc-w1wpg0-1.jEYdsf").click();
          await page.waitForTimeout(250);
      } catch (error) {
        logger.info("Nonotifications found or failed to click");
      }
      
      // Step 1: Perform deposit
      const depositAmount = 12;
      logger.step(`Performing deposit of $${depositAmount}`);
      await vaultTransaction(page, depositAmount, { eyes, performEyesCheck: false });
      logger.success(`Successfully deposited $${depositAmount} to MegaVault`);
      
      await navigateToViaHeader(page, "PORTFOLIO");
      await page.waitForTimeout(1000);
      await navigateToViaHeader(page, "VAULT");
      await page.waitForTimeout(1000);
      // Step 2: Perform withdrawal (using the same amount for simplicity)
      const withdrawAmount = -12; // Negative for withdrawal
      logger.step(`Performing withdrawal of $${Math.abs(withdrawAmount)}`);
      await vaultTransaction(page, withdrawAmount, { eyes, performEyesCheck: false });
      logger.success(`Successfully withdrew $${Math.abs(withdrawAmount)} from MegaVault`);
      
      logger.success("Megavault deposit and withdraw cycle completed successfully");
    } catch (error) {
      logger.error("Megavault flow test failed", error as Error);
      throw error;
    }
  });
});
