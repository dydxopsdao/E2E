import { BrowserContext, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { navigateToDydxPage } from "@dydx/general/actions/navigation.actions";
import {
  triggerWalletConnectionModal,
  selectWallet,
  sendRequest,
} from "@dydx/connect-wallet/actions/connect-wallet.actions";
import { MetamaskSelectors } from "@wallets/metamask/selectors/metamask-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { WALLET_CONSTANTS } from "@constants/wallet.constants";
import { getMetaMaskPage } from "@wallets/metamask/actions/open-metamask";

export interface ConnectMetaMaskOptions {
  timeout?: number;
  password?: string;
  dydxPage?: string;
}


export async function handlePasswordPrompt(page: Page): Promise<void> {
  logger.step("Handling MetaMask password prompt", {
    timeout: TEST_TIMEOUTS.NAVIGATION,
  });

  // Get the locator for the standard "Confirm" button.
  const confirmButton = page.locator(MetamaskSelectors.confirmButton);

  // Wait up to 2.5 seconds for the confirm button to appear.
  try {
    await confirmButton.waitFor({ state: "visible", timeout: 2500 });
  } catch (e) {
    // The confirm button did not appear within 2.5 seconds.
    // Proceed without failing.
  }

  // Check if the standard "Confirm" button is present and enabled.
  if ((await confirmButton.count()) > 0 && (await confirmButton.isEnabled())) {
    logger.info("Confirm button is enabled; skipping password prompt handling");
    return;
  }

  // Get the locator for the "Confirm Footer" button.
  const confirmButtonFooter = page.locator(
    MetamaskSelectors.confirmButtonFooter
  );

  // Check if the "Confirm Footer" button is present and enabled.
  if (
    (await confirmButtonFooter.count()) > 0 &&
    (await confirmButtonFooter.isEnabled())
  ) {
    logger.info(
      "Confirm footer button is enabled; skipping password prompt handling"
    );
    return;
  }


  // If no enabled button is found, proceed with password handling.
  const password = process.env.METAMASK_PASSWORD || "";
  try {
    await page.waitForSelector(MetamaskSelectors.passwordUnlock, {
      timeout: TEST_TIMEOUTS.NAVIGATION,
    });
    await page.fill(MetamaskSelectors.passwordUnlock, password);
    await page.click(MetamaskSelectors.metaMaskUnlockSubmit);
    logger.success("MetaMask password prompt handled");
  } catch (error) {
    logger.error(
      "MetaMask password prompt not found or handling failed",
      error as Error,
      { selector: MetamaskSelectors.passwordUnlock }
    );
  }
}

/**
 * Helper function to perform MetaMask confirmation steps.
 */
export async function confirmMetaMaskAction(
  context: BrowserContext,
  password: string,
  timeout: number = TEST_TIMEOUTS.DEFAULT,
  confirmSelector: string
): Promise<void> {
  logger.step("Confirming MetaMask action", {
    timeout,
    confirmSelector,
  });

  try {
    const metaMaskPage = await getMetaMaskPage(context, timeout);
    await metaMaskPage.bringToFront();
    await metaMaskPage.reload();
    await handlePasswordPrompt(metaMaskPage);

    // Attempt to click the confirmation selector
    await metaMaskPage.click(confirmSelector);
    logger.success("MetaMask action confirmed");
  } catch (error) {
    logger.error("Failed to confirm MetaMask action", error as Error, {
      timeout,
      confirmSelector,
    });
  }
}

export async function openDydxConnectMetaMask(
  page: Page,
  context: BrowserContext,
  options: ConnectMetaMaskOptions = {}
): Promise<Page> {
  const {
    timeout = TEST_TIMEOUTS.DEFAULT,
    password = process.env.METAMASK_PASSWORD ||
      WALLET_CONSTANTS.METAMASK.DEFAULT_PASSWORD,
    dydxPage = "/portfolio/overview",
  } = options;

  if (!password) {
    const error = new Error(
      "MetaMask password must be provided either via options or METAMASK_PASSWORD env variable."
    );
    logger.error("Missing MetaMask password", error);
    throw error;
  }

  logger.step("Starting connection process to dYdX");

  try {
    // Navigate to the specified dYdX page (defaults to /portfolio/overview)
    await page.bringToFront();
    await navigateToDydxPage(page, dydxPage, {
      waitUntil: "domcontentloaded",
    });

    // Trigger wallet connection modal and select MetaMask
    await triggerWalletConnectionModal(page);
    await selectWallet(page, WALLET_CONSTANTS.SUPPORTED_WALLETS[0]); // MetaMask

    // Perform sequential MetaMask confirmations
    await confirmMetaMaskAction(
      context,
      password,
      timeout,
      MetamaskSelectors.confirmButton
    );

    // Bring main page to front and send the request
    await page.bringToFront();
    await sendRequest(page);

    // Additional MetaMask confirmations if needed
    const confirmSelectors = [
      MetamaskSelectors.confirmButtonFooter,
      MetamaskSelectors.confirmButtonFooter,
    ];

    for (const selector of confirmSelectors) {
      await confirmMetaMaskAction(context, password, timeout, selector);
    }
    logger.success("MetaMask connection steps completed successfully", {
      url: page.url(),
    });
    await page.bringToFront();
    return page;
  } catch (error) {
    logger.error("MetaMask connection failed", error as Error, {
      timeout,
      hasPassword: !!password,
    });
    throw error;
  }
}
