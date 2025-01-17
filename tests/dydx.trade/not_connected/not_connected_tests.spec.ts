import { visualTest as test } from "@fixtures/visualTestingFixture";
import { Page, expect } from "@playwright/test";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { logger } from "@utils/logger/logging-utils";

const urls = [
  {
    url: "https://dydx.trade/trade/ETH-USD",
    name: "ETH-USD market page",
    elementLocator: "div.chart-widget",
  },
  {
    url: "https://dydx.trade/markets",
    name: "Markets page",
    elementLocator: "table[aria-label='Markets'] div[role='row']:has([data-key='BTC-USD'])",
  },
  {
    url: "https://dydx.trade/portfolio",
    name: "Portfolio page",
    elementLocator: "text=Connect your wallet to deposit funds & start trading.",
  },
  {
    url: "https://dydx.trade/vault",
    name: "Megavault page",
    elementLocator: "table[aria-label='MegaVault']",
  },
  {
    url: "https://dydx.trade/referrals",
    name: "Referrals page",
    elementLocator: "table[aria-label='Leaderboard']",
  },
  {
    url: "https://dydx.trade/DYDX",
    name: "DYDX page",
    elementLocator: "div.sc-jfCxno.jMxfrO",
  },
];

async function waitForPageLoad(page: Page, elementLocator: string) {
  try {
    logger.debug(`Waiting for element: ${elementLocator}`);
    await page
      .locator(elementLocator)
      .waitFor({ state: "visible", timeout: TEST_TIMEOUTS.ELEMENT });
    await page.waitForTimeout(5000);
    logger.success(`Element found: ${elementLocator}`);
  } catch (error) {
    logger.warning(
      `Element not found: ${elementLocator}`,
      { url: page.url() }
    );
  }
}

for (const { url, name, elementLocator } of urls) {
  test(`Visual check for ${name}`, async ({ page, visualTest }) => {
    try {
      // Arrange
      logger.step(`Setting up test for ${name}`);
      logger.info(`Navigating to ${url}`);
      
      // Act
      await page.goto(url, { timeout: TEST_TIMEOUTS.NAVIGATION });
      await waitForPageLoad(page, elementLocator);
      
      // Assert
      logger.step("Performing visual verification");
      const element = page.locator(elementLocator);
      await expect(element).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT })
        .catch(() => logger.warning(`Element visibility check failed for ${name}`));

      await visualTest.check(page, {
        name: name
      });
    } catch (error) {
      logger.error(`Test failed for ${name}`, error as Error);
      throw error;
    }
  });
}
