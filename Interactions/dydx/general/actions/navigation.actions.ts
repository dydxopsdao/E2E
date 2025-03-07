import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";

export async function navigateToDydxPage(
  page: Page,
  path: string,
  options: {
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<void> {
  const { 
    waitUntil = "domcontentloaded", 
    maxRetries = 3,
    retryDelay = 1000 
  } = options;
  
  const url = `https://dydx.trade${path}`;
  logger.step(`Navigating to dYdX page: ${url}`);
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      if (attempt > 1) {
        logger.info(`Retry attempt ${attempt - 1} of ${maxRetries} for navigation to ${url}`);
        // Exponential backoff: 1s, 2s, 4s
        const delay = retryDelay * Math.pow(2, attempt - 2);
        await page.waitForTimeout(delay);
      }
      
      await page.goto(url, { waitUntil });
      await page.bringToFront();
      
      logger.success(`Navigated to dYdX page: ${url}${attempt > 1 ? ` on attempt ${attempt}` : ''}`);
      return; // Success - exit the function
      
    } catch (error) {
      lastError = error as Error;
      logger.warning(
        `Navigation attempt ${attempt} failed for ${url}: ${(error as Error).message}`
      );
      
      // If this was the last attempt, we'll exit the loop and throw the error below
      if (attempt > maxRetries) {
        break;
      }
      
      // Otherwise, we'll try again
    }
  }
  
  // If we got here, all attempts failed
  logger.error(`Failed to navigate to dYdX page after ${maxRetries + 1} attempts: ${url}`, lastError as Error);
  throw lastError;
}

export async function navigateToViaHeader(
  page: Page,
  menuItem: string
): Promise<void> {
  logger.step(`Navigating to dYdX menu item: ${menuItem}`);
  try {
    const selector = `li[data-item="${menuItem.toUpperCase()}"]`;

    // Wait for the selector to appear and click it
    await page.waitForSelector(selector, { state: "visible", timeout: 5000 });
    await page.click(selector);

    logger.success(`Navigated to dYdX menu item: ${menuItem}`);
  } catch (error) {
    logger.error(
      `Failed to navigate to dYdX menu item: ${menuItem}`,
      error as Error
    );
    throw error;
  }
}