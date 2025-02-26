import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";

export async function navigateToDydxPage(
  page: Page,
  path: string,
  options: {
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  } = {}
): Promise<void> {
  const { waitUntil = "domcontentloaded" } = options;
  const url = `https://dydx.trade${path}`;

  logger.step(`Navigating to dYdX page: ${url}`);
  try {
    await page.goto(url, { waitUntil });
    await page.bringToFront();
    logger.success(`Navigated to dYdX page: ${url}`);
  } catch (error) {
    logger.error(`Failed to navigate to dYdX page: ${url}`, error as Error);
    throw error;
  }
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