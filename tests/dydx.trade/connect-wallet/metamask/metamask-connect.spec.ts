import { metamaskEyesTest as test} from "@fixtures/metamaskEyesFixture";
import { confirmMetaMaskAction } from "@wallets/metamask/actions/connect-metamask";
import { MetamaskSelectors } from "@wallets/metamask/selectors/metamask-selectors";
import { expect } from "@playwright/test";
import { navigateToDydxPage } from "@dydx/general/actions/navigation.actions";
import {
  selectWallet,
  sendRequest,
  triggerWalletConnectionModal,
} from "@dydx/connect-wallet/actions/connect-wallet.actions";
import { ConnectWalletSelectors } from "@dydx/connect-wallet/selectors/connect-wallet-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { logger } from "@utils/logger/logging-utils";
import { visualCheck } from "@utils/visual-check";

test("Connect MetaMask Wallet", async ({ metamaskContext, page, eyes }) => {
  try {
    // Arrange
    logger.step("Setting up test environment");
    const password = process.env.METAMASK_PASSWORD || "";
    await navigateToDydxPage(page, "/portfolio/overview", {
      waitUntil: "domcontentloaded",
    });
    logger.info("Navigated to portfolio overview page");
    // Act
    logger.step("Initiating wallet connection flow");
    await triggerWalletConnectionModal(page);
    if (eyes) {
      await visualCheck(eyes, {
        name: "Connect Wallet Modal with Options"
      });
    }

    logger.step("Connecting MetaMask wallet");
    await selectWallet(page, "MetaMask");
    await confirmMetaMaskAction(
      metamaskContext,
      password,
      TEST_TIMEOUTS.DEFAULT,
      MetamaskSelectors.confirmButton
    );
    logger.success("Initial MetaMask connection confirmed");

    logger.step("Processing signature request");
    await page.waitForTimeout(5000);
    await page.bringToFront();
    if (eyes) {
      await visualCheck(eyes, {
        name: "Sign Message Modal"
        });
    }
    await page.waitForTimeout(3000);
    if (await page.getByText("Switch network").isVisible()) {
      await page.getByText("Switch network").click();
      logger.success("Switch network button found, skipping signature request");
    }
    else {
      await sendRequest(page);
      logger.success("Signature request sent");
    }




    

    logger.step("Confirming additional MetaMask actions");
    const confirmSelectors = [
      MetamaskSelectors.confirmButtonFooter,
      MetamaskSelectors.confirmButtonFooter,
    ];
    for (const [index, selector] of confirmSelectors.entries()) {
      logger.debug(`Processing confirmation step ${index + 1}`);
      await confirmMetaMaskAction(
        metamaskContext,
        password,
        TEST_TIMEOUTS.DEFAULT,
        selector
      );
    }
    logger.success("All MetaMask confirmations completed");

    // Assert
    logger.step("Verifying wallet connection");
    const walletWithFunds = page.locator(
      ConnectWalletSelectors.metamaskWalletWithFunds
    );
    await expect(walletWithFunds).toBeVisible();
    logger.success("MetaMask wallet successfully connected");
  } catch (error) {
    try {
      await confirmMetaMaskAction(
      metamaskContext,
      "",
      TEST_TIMEOUTS.DEFAULT,
      MetamaskSelectors.confirmButton
    );
    const walletWithFunds = page.locator(ConnectWalletSelectors.metamaskWalletWithFunds);
    await expect(walletWithFunds).toBeVisible();
    } catch (error) {
      logger.error("MetaMask connection test failed", error as Error);
      throw error;
    }
  }
});
/* test("metamask connect", async ({ context }) => {
  const page = await openDydxConnectMetaMask(context);
}); */