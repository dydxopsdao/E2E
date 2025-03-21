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
    useDom: true,
  },
  {
    url: "https://dydx.trade/markets",
    name: "Markets page",
    elementLocator: '[data-key="BTC-USD-priceChange24HChart"]',
    useDom: true,
  },
  {
    url: "https://dydx.trade/portfolio",
    name: "Portfolio page",
    elementLocator: "text=Connect your wallet to deposit funds & start trading.",
  },
  {
    url: "https://dydx.trade/vault",
    name: "Megavault page",
    elementLocator: '[data-key="ZRX-USD-pnl-sparkline"]',
    elementLocator2: ".sc-17stuub-0.sc-17stuub-1.eqFWVL.hsAYsL.sc-3i56se-5.hcfdxE",
    clickBeforeCheck: true,
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
    elementLocator2: ".sc-17stuub-0.sc-17stuub-1.eqFWVL.hsAYsL.sc-3i56se-5.hcfdxE",
  },
];

// Single test that runs all visual checks in sequence to reuse browser context
test(`Visual check for all not-connected pages`, async ({ page, eyes }) => {
  logger.info("Running all not-connected visual checks in a single browser instance");
  
  for (const { url, name, elementLocator, elementLocator2, useDom, clickBeforeCheck } of urls) {
    let attempt = 0;
    const maxAttempts = 2;
    let testPassed = false;
    // Start with the provided page
    let currentPage: Page = page;
    
    while (attempt < maxAttempts && !testPassed) {
      attempt++;
      try {
        logger.step(`=== Testing ${name} (Attempt ${attempt}) ===`);
        logger.info(`Navigating to ${url} on attempt ${attempt}`);
        await currentPage.goto(url, { timeout: TEST_TIMEOUTS.PAGE_LOAD, waitUntil: "domcontentloaded" });
        
        // Allow waitForAnimations to fail without breaking the test
        try {
          await waitForAnimations(currentPage, TEST_TIMEOUTS.DEFAULT);
        } catch (error) {
          logger.warning(`waitForAnimations failed: ${(error as Error).message}. Continuing without waiting for animations.`);
        }
        
        await waitForPageLoad(currentPage, elementLocator);

        // Check primary element visibility
        const element = currentPage.locator(elementLocator);
        await expect(element).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
        
        // If a secondary locator is provided, check its visibility too
        if (elementLocator2) {
          const element2 = currentPage.locator(elementLocator2);
          await expect(element2).toBeVisible({ timeout: TEST_TIMEOUTS.ELEMENT });
        }
        
        // If required, perform a click action (e.g., on Megavault page)
        if (clickBeforeCheck && name === "Megavault page") {
          logger.info("Clicking on Market element before visual check");
          const marketElement = currentPage.locator('text=Market >> xpath=//ancestor::div[contains(@class, "sc-1drcdyj-9") and contains(@class, "kFEJXg")]');
          await marketElement.waitFor({ state: "visible", timeout: 10000 });
          await marketElement.click();
          // Wait for any animations or page updates
          await currentPage.waitForTimeout(1000);
        }
        
        // Perform the visual check
        await visualCheck(eyes, { 
          name,
          useDom: Boolean(useDom)
        });
        
        logger.success(`Completed visual check for ${name} on attempt ${attempt}`);
        testPassed = true;
      } catch (error) {
        logger.error(`Attempt ${attempt} failed for ${name}`, error as Error);
        if (attempt < maxAttempts) {
          logger.info(`Retrying ${name} in a new browser tab/window...`);
          // Open a new page from the same browser context
          currentPage = await page.context().newPage();
        } else {
          logger.error(`Final attempt failed for ${name}, moving on to the next page.`);
        }
      }
    }
  }
  
  logger.success("Completed all not-connected visual checks");
});
