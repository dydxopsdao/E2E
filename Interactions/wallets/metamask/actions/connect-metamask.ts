import { BrowserContext, Page } from "@playwright/test";
import { logger } from "../../../../utils/logger/logging-utils";
import { navigateToDydxPage } from "../../../dydx/general/actions/navigation.actions";
import {
  triggerWalletConnectionModal,
  selectWallet,
  sendRequest,
} from "../../../dydx/connect-wallet/actions/connect-wallet.actions";
import { MetamaskSelectors } from "../selectors/metamask-selectors";
import { TEST_TIMEOUTS, WALLET_CONSTANTS } from "../../../../constants";

export interface ConnectMetaMaskOptions {
  timeout?: number;
  password?: string;
}

export async function getMetaMaskPage(
  context: BrowserContext,
  timeout: number = TEST_TIMEOUTS.DEFAULT
): Promise<Page> {
  logger.step("Retrieving MetaMask popup page", { timeout });
  try {
    const page = await context.waitForEvent("page", { timeout });
    logger.success("MetaMask popup page retrieved");
    return page;
  } catch (error) {
    logger.error("Failed to retrieve MetaMask popup page", error as Error);
    const pages = context.pages();
    const metaMaskPage = pages.find(
      (p) =>
        p.url().startsWith(WALLET_CONSTANTS.METAMASK.EXTENSION_BASE_URL) && 
        p !== context.pages()[0]
    );
    if (!metaMaskPage) {
      logger.error(
        "Could not find MetaMask popup page after fallback",
        error as Error,
        { availablePages: pages.length }
      );
      throw new Error("Could not find MetaMask popup page");
    }
    logger.success("MetaMask popup page found from existing pages");
    return metaMaskPage;
  }
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
    confirmSelector
  });
  
  const metaMaskPage = await getMetaMaskPage(context, timeout);
  await metaMaskPage.bringToFront();
  await handlePasswordPrompt(metaMaskPage, password);
  await metaMaskPage.click(confirmSelector);
  
  logger.success("MetaMask action confirmed");
}

export async function openDydxConnectMetaMask(
  context: BrowserContext,
  options: ConnectMetaMaskOptions = {}
): Promise<Page> {
  const { 
    timeout = TEST_TIMEOUTS.DEFAULT,
    password = process.env.METAMASK_PASSWORD || WALLET_CONSTANTS.METAMASK.DEFAULT_PASSWORD 
  } = options;

  if (!password) {
    const error = new Error("MetaMask password must be provided either via options or METAMASK_PASSWORD env variable.");
    logger.error("Missing MetaMask password", error);
    throw error;
  }

  logger.step("Starting connection process to dYdX", { 
    timeout,
    hasPassword: !!password 
  });

  try {
    const page = await context.newPage();

    // Navigate to dYdX portfolio overview
    await navigateToDydxPage(page, "/portfolio/overview", {
      waitUntil: "domcontentloaded"
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
      url: page.url()
    });
    return page;
  } catch (error) {
    logger.error("MetaMask connection failed", error as Error, {
      timeout,
      hasPassword: !!password
    });
    throw error;
  }
}