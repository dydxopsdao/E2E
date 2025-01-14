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
    logger.success(`Navigated to dYdX page: ${url}`);
  } catch (error) {
    logger.error(`Failed to navigate to dYdX page: ${url}`, error as Error);
    throw error;
  }
}
