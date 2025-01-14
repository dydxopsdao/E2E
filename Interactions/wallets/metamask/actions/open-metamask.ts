import { BrowserContext, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { WALLET_CONSTANTS } from "@constants/wallet.constants";
import { metamaskState } from "@wallets/metamask/actions/metamask-state";

/**
 * Gets the MetaMask page from the browser context
 * @param context - Playwright BrowserContext
 * @param timeout - Timeout for waiting for the MetaMask page
 * @returns Promise<Page> - The MetaMask page
 */
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

/**
 * Opens the MetaMask extension in a new tab
 * @param context - Playwright BrowserContext
 * @returns Promise<void>
 */
export async function openMetaMask(context: BrowserContext): Promise<void> {
  logger.step("Opening MetaMask extension");

  try {
    let extensionId: string;

    // First try to get the stored extension ID
    if (metamaskState.hasExtensionId()) {
      extensionId = metamaskState.getExtensionId();
      logger.debug("Using stored MetaMask extension ID", { extensionId });
    } else {
      // Fallback to finding it from existing pages
      const pages = context.pages();
      const existingMetaMaskPage = pages.find((p) =>
        p.url().startsWith(WALLET_CONSTANTS.METAMASK.EXTENSION_BASE_URL)
      );

      if (!existingMetaMaskPage) {
        throw new Error("Could not find MetaMask extension ID");
      }

      extensionId = existingMetaMaskPage.url().split("/")[2];
      metamaskState.setExtensionId(extensionId);
      logger.debug("Extracted and stored MetaMask extension ID", {
        extensionId,
      });
    }

    // Create new page and navigate to MetaMask home
    const newPage = await context.newPage();
    const metamaskUrl = `${WALLET_CONSTANTS.METAMASK.EXTENSION_BASE_URL}${extensionId}/home.html`;

    logger.debug("Navigating to MetaMask", { url: metamaskUrl });
    await newPage.goto(metamaskUrl);

    // Wait for the page to be ready
    await newPage.waitForLoadState("domcontentloaded");

    logger.success("MetaMask extension opened successfully", {
      url: metamaskUrl,
    });
  } catch (error) {
    logger.error("Failed to open MetaMask extension", error as Error);
    throw error;
  }
}
