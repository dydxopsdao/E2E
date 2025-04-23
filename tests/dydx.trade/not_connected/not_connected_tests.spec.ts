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
    elementLocator2: ".sc-17stuub-0.sc-17stuub-1.eqFWVL.hsAYsL.sc-ouscis-0.dyeDYY",
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

async function performVisualCheck({
  page,
  eyes,
  url,
  name,
  elementLocator,
  elementLocator2,
  useDom,
  clickBeforeCheck,
}: {
  page: Page;
  eyes: any;
  url: string;
  name: string;
  elementLocator: string;
  elementLocator2?: string;
  useDom?: boolean;
  clickBeforeCheck?: boolean;
}): Promise<void> {
  let attempt = 0;
  const maxAttempts = 2;
  let testPassed = false;
  let currentPage: Page = page;

  while (attempt < maxAttempts && !testPassed) {
    attempt++;
    try {
      logger.step(`=== Testing ${name} (Attempt ${attempt}) ===`);
      logger.info(`Navigating to ${url} on attempt ${attempt}`);
      await currentPage.goto(url, { timeout: TEST_TIMEOUTS.PAGE_LOAD, waitUntil: "domcontentloaded" });

      // Wait for animations; failures here are logged but not fatal.
      try {
        await waitForAnimations(currentPage, TEST_TIMEOUTS.ELEMENT);
      } catch (error) {
        logger.warning(`waitForAnimations failed: ${(error as Error).message}. Continuing without waiting for animations.`);
      }

      // Optionally perform a click action before the visual check.
      if (clickBeforeCheck && name === "Megavault page") {
        try {
          logger.info("Clicking on Market element before visual check");
          const marketElement = currentPage.locator(
            'text=Market >> xpath=//ancestor::div[contains(@class, "sc-1drcdyj-9") and contains(@class, "kFEJXg")]'
          );
          await marketElement.waitFor({ state: "visible", timeout: 10000 });
          await marketElement.click();
          await currentPage.waitForTimeout(1000);
        } catch (error) {
          logger.warning(`Click action failed for ${name}: ${(error as Error).message}. Continuing.`);
        }
      }

      // Wait for page load; log but proceed if it fails.
      try {
        await waitForPageLoad(currentPage, elementLocator);
      } catch (error) {
        logger.warning(`waitForPageLoad failed for ${name}: ${(error as Error).message}. Proceeding.`);
      }

      // Check primary element visibility
      try {
        const element = currentPage.locator(elementLocator);
        await expect(element).toBeAttached({ timeout: TEST_TIMEOUTS.ACTION });
      } catch (error) {
        logger.warning(`Primary element check failed for ${name}: ${(error as Error).message}. Proceeding.`);
      }

      // Check secondary element visibility if provided.
      if (elementLocator2) {
        try {
          const element2 = currentPage.locator(elementLocator2);
          await expect(element2).toBeAttached({ timeout: TEST_TIMEOUTS.ACTION });
        } catch (error) {
          logger.warning(`Secondary element check failed for ${name}: ${(error as Error).message}. Proceeding.`);
        }
      }

      try{ await page.hover(".sc-6q7ny7-4.bQbFa-d");}
      catch(error){
        logger.warning(`Hover action failed for ${name}: ${(error as Error).message}. Proceeding.`);
      }

      // Perform the visual check.
      await visualCheck(eyes, { name, useDom: Boolean(useDom) });
      logger.success(`Completed visual check for ${name} on attempt ${attempt}`);
      testPassed = true;
    } catch (error) {
      logger.error(`Attempt ${attempt} failed for ${name}`, error as Error);
      if (attempt < maxAttempts) {
        logger.info(`Retrying ${name} in a new browser tab/window...`);
        currentPage = await page.context().newPage();
      } else {
        logger.error(`Final attempt failed for ${name}, moving on.`);
        throw error;
      }
    }
  }
}

// Create a separate test for each URL
urls.forEach(({ url, name, elementLocator, elementLocator2, useDom, clickBeforeCheck }) => {
  test(`${name} visual check`, async ({ page, eyes }) => {
    await performVisualCheck({
      page,
      eyes,
      url,
      name,
      elementLocator,
      elementLocator2,
      useDom,
      clickBeforeCheck,
    });
  });
});
