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
}


export async function handlePasswordPrompt(
  page: Page,
  password: string
): Promise<void> {
  logger.step("Handling MetaMask password prompt", {
    timeout: TEST_TIMEOUTS.DEFAULT
  });
  try {
    const selector = MetamaskSelectors.passwordUnlock;
    await page.waitForSelector(selector, { 
      timeout: TEST_TIMEOUTS.DEFAULT 
    });
    await page.fill(selector, password);
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
    await handlePasswordPrompt(metaMaskPage, password);

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
    // Navigate to dYdX portfolio overview
    await navigateToDydxPage(page, "/portfolio/overview", {
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
    //await page.click((ConnectWalletSelectors.rememberMe);
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
    return page;
  } catch (error) {
    logger.error("MetaMask connection failed", error as Error, {
      timeout,
      hasPassword: !!password,
    });
    throw error;
  }
}