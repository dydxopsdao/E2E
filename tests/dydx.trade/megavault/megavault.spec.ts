import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { metamaskEyesTest as test } from "@fixtures/metamaskEyesFixture";
import { navigateToViaHeader } from "@interactions/dydx/general/actions/navigation.actions";
import { vaultTransaction } from "@interactions/dydx/megavault/actions/megavault.actions";
import { logger } from "@utils/logger/logging-utils";

test.describe("Megavault flows", () => {
  // Set higher timeout for these long-running transactions
  test.describe.configure({ retries: 1, timeout: 300000 });
  
  test("megavault deposit and withdraw cycle", async ({ metamaskContext, page, eyes }) => {
    try {
      logger.step("Starting Megavault deposit and withdraw cycle test");
      
      // Connect to MetaMask once at the beginning using the page with MetaMask already configured
      logger.info("Connecting to MetaMask and navigating to vault page");
      await openDydxConnectMetaMask(page, metamaskContext);
      await page.bringToFront();
      await navigateToViaHeader(page, "VAULT");
      
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
