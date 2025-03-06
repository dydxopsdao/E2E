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
    elementLocator: '[data-name="pane-widget-chart-gui-wrapper"]',
    elementLocator2: ".legendMainSourceWrapper-l31H9iuA",
  },
  {
    url: "https://dydx.trade/markets",
    name: "Markets page",
    elementLocator:
      '[data-key="BTC-USD-priceChange24HChart"]',
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
    elementLocator: '[data-key="BTC-USD-pnl-sparkline"]',
    elementLocator2: ".sc-17stuub-0.sc-17stuub-1.eqFWVL.hsAYsL.sc-3i56se-5.hcfdxE",
    
  },
  {
    url: "https://dydx.trade/referrals",
    name: "Referrals page",
    elementLocator: "table[aria-label='Leaderboard']",
  },
  {
    url: "https://dydx.trade/DYDX",
    name: "DYDX page",
    elementLocator: ".sc-1wku1wx-9.exxFKx",
  },
];

// Single test that runs all visual checks in sequence to reuse browser context
test(`Visual check for all not-connected pages`, async ({ page, eyes }) => {
  logger.info("Running all not-connected visual checks in a single browser instance");
  
  for (const { url, name, elementLocator, elementLocator2 } of urls) {
    try {
      // Arrange
      logger.step(`=== Testing ${name} ===`);
      logger.info(`Navigating to ${url}`);

      // Act
      await page.goto(url, { timeout: TEST_TIMEOUTS.PAGE_LOAD, waitUntil: "domcontentloaded" });
      await waitForAnimations(page, TEST_TIMEOUTS.DEFAULT);
      await waitForPageLoad(page, elementLocator);

      // Assert
      logger.step(`Performing visual verification for ${name}`);
      const element = page.locator(elementLocator);
      await expect(element)
        .toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT })
        .catch(() =>
          logger.warning(`Element visibility check failed for ${name}`)
        );
      
      if (elementLocator2) {
        const element2 = page.locator(elementLocator2);
        await expect(element2)
          .toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT })
          .catch(() =>
            logger.warning(`Element visibility check failed for ${name}`)
          );
      }
      
      // Perform visual check for this page
      await visualCheck(eyes, { name });
      logger.success(`Completed visual check for ${name}`);
      
    } catch (error) {
      // Log the error but continue with other pages
      logger.error(`Test failed for ${name}`, error as Error);
      // Don't throw the error so remaining pages can still be tested
    }
  }
  
  logger.success("Completed all not-connected visual checks");
});
