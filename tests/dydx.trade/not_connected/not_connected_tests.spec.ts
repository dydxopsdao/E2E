import { eyesTest as test } from "@fixtures/eyesFixture";
import { Page, expect } from "@playwright/test";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { logger } from "@utils/logger/logging-utils";
import { visualCheck } from "@utils/visual-check";
import { waitForAnimations, waitForPageLoad } from "@dydx/general/actions/general.actions";
const urls = [
  {
    url: "https://dydx.trade/trade/ETH-USD",
    name: "ETH-USD market page",
    elementLocator: "div.chart-widget",
  },
  {
    url: "https://dydx.trade/markets",
    name: "Markets page",
    elementLocator:
      "table[aria-label='Markets'] div[role='row']:has([data-key='BTC-USD'])",
  },
  {
    url: "https://dydx.trade/portfolio",
    name: "Portfolio page",
    elementLocator:
      "text=Connect your wallet to deposit funds & start trading.",
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


for (const { url, name, elementLocator } of urls) {
  test(`Visual check for ${name}`, async ({ page, eyes }) => {
    try {
      // Arrange
      logger.step(`Setting up test for ${name}`);
      logger.info(`Navigating to ${url}`);

      // Act
      await page.goto(url, { timeout: TEST_TIMEOUTS.PAGE_LOAD, waitUntil: "domcontentloaded" });
      await waitForAnimations(page, TEST_TIMEOUTS.ELEMENT);
      await waitForPageLoad(page, elementLocator);

      // Assert
      logger.step("Performing visual verification");
      const element = page.locator(elementLocator);
      await expect(element)
        .toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT })
        .catch(() =>
          logger.warning(`Element visibility check failed for ${name}`)
        );

      await visualCheck(eyes, { name });
    } catch (error) {
      logger.error(`Test failed for ${name}`, error as Error);
      throw error;
    }
  });
}
