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
  
  // First, check if the MetaMask popup is already open
  const existingPages = context.pages();
  const existingMetaMaskPage = existingPages.find(
    (p) =>
      p.url().startsWith(WALLET_CONSTANTS.METAMASK.EXTENSION_BASE_URL) &&
      p !== context.pages()[0]
  );
  
  if (existingMetaMaskPage) {
    logger.success("Found existing MetaMask popup page", { url: existingMetaMaskPage.url() });
    return existingMetaMaskPage;
  }
  
  // If no existing page, set up a Promise race between waiting for a new page
  // and a timeout with periodic checks for MetaMask pages
  const newPagePromise = context.waitForEvent("page", { timeout });
  
  try {
    // Start the race with periodic checks
    const metaMaskPage = await Promise.race([
      newPagePromise,
      checkPeriodically(async () => {
        const pages = context.pages();
        const metaMaskPage = pages.find(
          (p) =>
            p.url().startsWith(WALLET_CONSTANTS.METAMASK.EXTENSION_BASE_URL) &&
            p !== context.pages()[0]
        );
        if (metaMaskPage) return metaMaskPage;
        throw new Error("MetaMask page not found yet");
      }, 500, timeout) // Check every 500ms up to the timeout
    ]);
    
    logger.success("MetaMask popup page retrieved", { url: metaMaskPage.url() });
    return metaMaskPage;
  } catch (error) {
    logger.error("Error finding MetaMask popup", error as Error);
    
    // Final attempt - check all pages one more time
    const pages = context.pages();
    logger.debug("Available pages:", { 
      count: pages.length, 
      urls: pages.map(p => p.url()) 
    });
    
    const metaMaskPage = pages.find(
      (p) =>
        p.url().startsWith(WALLET_CONSTANTS.METAMASK.EXTENSION_BASE_URL) &&
        p !== context.pages()[0]
    );
    
    if (!metaMaskPage) {
      logger.error(
        "Could not find MetaMask popup page after all attempts",
        error as Error,
        { availablePages: pages.length }
      );
      throw new Error("Could not find MetaMask popup page: " + (error as Error).message);
    }
    
    logger.success("MetaMask popup page found after retry", { url: metaMaskPage.url() });
    return metaMaskPage;
  }
}

// Helper function to check periodically for a condition
async function checkPeriodically<T>(
  checkFn: () => Promise<T>,
  interval: number,
  timeout: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = async () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timed out after ${timeout}ms`));
        return;
      }
      
      try {
        const result = await checkFn();
        resolve(result);
      } catch (error) {
        setTimeout(check, interval);
      }
    };
    
    check();
  });
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
