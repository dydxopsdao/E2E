import { completeCombinedTest as test } from "@fixtures/completeCombinedFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { visualCheck } from "@utils/visual-check";
import { expect } from "@playwright/test";

test("eth-usd market page connected landing page", async ({ metamaskContext, eyes, page, dydxTradeHelper }) => {
  try {
    try {
        await dydxTradeHelper.cancelAllOrders();
    } catch (error) {
      logger.error("Failed to cleanup orders", error as Error);
    }
    
    // Arrange
    logger.step("Setting up connected market page test");
    await openDydxConnectMetaMask(page, metamaskContext, {
      dydxPage: "/trade/ETH-USD",
      waitForSelector: ".sc-1h5n0ah-2.fQXTnK"
    });//Market Price
    
    // Poll for top layout elements with basic retry logic
    logger.info("Waiting for top layout elements");
    const pollTimeout = 10000; // 10 seconds total polling time
    const pollInterval = 500; // Check every 500ms
    const startTime = Date.now();
    let foundElements = false;
    
    while (Date.now() - startTime < pollTimeout && !foundElements) {
      try {
        await page.waitForSelector('#tv-price-chart iframe', { state: 'attached' });

    // Create a FrameLocator pointing at that iframe
        const chartFrame = page.frameLocator('#tv-price-chart iframe');
        const topLayoutElements = await chartFrame.locator('.layout__area--top .value-gwXludjS').all();
        logger.info(`Found ${topLayoutElements.length} elements in top layout area (expecting 3)`);
        
        if (topLayoutElements.length === 3) {
          foundElements = true;
          logger.success("Found expected 3 elements in top layout area");
          break;
        }
      } catch (error) {
        // Ignore errors during polling
      }
      
      // Wait before next attempt
      if (!foundElements) {
        await page.waitForTimeout(pollInterval);
      }
    }
    
    if (!foundElements) {
      logger.warning("Could not find the expected 3 elements in top layout area within timeout period");
    }
    
    // Add a small wait to ensure page is fully loaded
    await page.waitForTimeout(2000);
    
    try{ await page.hover(".sc-6q7ny7-4.bQbFa-d");}
      catch(error){
        logger.warning(`Hover action failed for ${name}: ${(error as Error).message}. Proceeding.`);
      }
    await page.waitForSelector('#tv-price-chart iframe', { state: 'attached' });

    // Create a FrameLocator pointing at that iframe
    const chartFrame = page.frameLocator('#tv-price-chart iframe');

    // Now assert that the canvas inside the frame is attached
    await expect(
      chartFrame.locator('canvas[aria-label^="Chart for"]')
    ).toBeAttached({ timeout: 30_000 });
    await expect(page.locator(".sc-1ihv8zl-9.fa-djxL")).toBeAttached();
    await expect(page.locator(".sc-1ea9mg3-0.sc-1ihv8zl-6.ZlGxv.RTcMI").first()).toBeAttached();
    // Act - perform visual check only once
    await visualCheck(eyes, {
      name: "eth-usd market page connected landing page",
      matchLevel: "Layout",
      useDom: false
    });
    
    
    
  } catch (error) {
    logger.error("Market page test failed", error as Error);
    throw error;
  }
});

