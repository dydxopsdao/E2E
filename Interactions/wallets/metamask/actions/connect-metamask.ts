import { BrowserContext, expect, Page } from "@playwright/test";
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
import { NotificationSelectors } from "@interactions/dydx/notifications/selectors/notification-selectors";
import { waitForAnimations } from "@interactions/dydx/general/actions/general.actions";

export interface ConnectMetaMaskOptions {
  timeout?: number;
  password?: string;
  dydxPage?: string;
  waitForSelector?: string | string[];
}


export async function handlePasswordPrompt(page: Page): Promise<void> {
  logger.step("Handling MetaMask password prompt", {
    timeout: TEST_TIMEOUTS.ACTION,
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
      timeout: TEST_TIMEOUTS.DEFAULT,
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
export async function   confirmMetaMaskAction(
  context: BrowserContext,
  password: string,
  timeout: number = TEST_TIMEOUTS.ACTION,
  confirmSelector: string
): Promise<void> {
  logger.step("Confirming MetaMask action", {
    timeout,
    confirmSelector,
  });

  try {
    const metaMaskPage = await getMetaMaskPage(context, timeout);
    await metaMaskPage.bringToFront();
    // Keep the reload as it's necessary to make the signature request appear
    await metaMaskPage.reload();
    // Check for and handle password prompt with a shorter timeout
    //await handlePasswordPrompt(metaMaskPage);

    // Use a faster approach to click the confirmation button
    // First check if it exists without waiting the full timeout
    const confirmButton = metaMaskPage.locator(confirmSelector);
    
    // Use a shorter polling interval to check for the button more frequently
    const shortPollingInterval = 100; // milliseconds
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (await confirmButton.count() > 0 && await confirmButton.isVisible()) {
        await metaMaskPage.waitForTimeout(300);
        await confirmButton.click();
        logger.success(`MetaMask action confirmed on attempt ${attempt + 1}`);
        return;
      }
      // Short wait before checking again
      await metaMaskPage.waitForTimeout(shortPollingInterval);
    }
    // If we reach here, try the standard approach as fallback
    await metaMaskPage.click(confirmSelector, { timeout: timeout / 2 });
    logger.success("MetaMask action confirmed with fallback approach");
  } catch (error) {
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
    waitForSelector = null
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
      waitForSelector: waitForSelector || undefined
    });
    //wait for orderbook to be visible
    await waitForAnimations(page, TEST_TIMEOUTS.PAGE_LOAD);
    if (dydxPage === "/portfolio/overview") {
      const element = page.locator("text=Connect your wallet to deposit funds & start trading.");
      await expect(element).toBeVisible({ timeout: TEST_TIMEOUTS.NAVIGATION });
    }
    // Trigger wallet connection modal and select MetaMask
    await triggerWalletConnectionModal(page);
    await selectWallet(page, WALLET_CONSTANTS.SUPPORTED_WALLETS[0]); // MetaMask
    // Perform first MetaMask confirmation with faster detection
    await confirmMetaMaskAction(
      context,
      password,
      timeout,
      MetamaskSelectors.confirmButton
    );

    // Bring main page to front and send the request
    await page.bringToFront();
    await sendRequest(page);
    await confirmMetaMaskAction(
      context,
      password,
      timeout,
      MetamaskSelectors.confirmButtonFooter
    );
    

    /* // Perform subsequent MetaMask confirmations with faster detection
    const confirmSelectors = [
      MetamaskSelectors.confirmButtonFooter,
      MetamaskSelectors.confirmButtonFooter,
    ];

    for (const selector of confirmSelectors) {
      await confirmMetaMaskAction(context, password, timeout, selector);
    } */
    
    logger.success("MetaMask connection steps completed successfully", {
      url: page.url(),
    });
    await page.locator(".sc-1awgn7r-0.klQslm").waitFor({ state: "visible", timeout: TEST_TIMEOUTS.DEPOSIT_SUCCESS });
    await page.bringToFront();
    try {
      await page.click(NotificationSelectors.withdrawalMessage);
    } catch (error) {
    }
    return page;
  } catch (error) {
    logger.error("MetaMask connection failed", error as Error, {
      timeout,
      hasPassword: !!password,
    });
    throw error;
  }
}
