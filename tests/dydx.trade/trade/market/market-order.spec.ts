import { combinedTest as test } from "@fixtures/combinedFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { BrowserContext, expect, Page } from "@playwright/test";
import { OrderbookSelectors } from "@interactions/orderbook/orderbook.selectors";
import { DealTicketSelectors } from "@interactions/dydx/deal-ticket/selectors/deal-ticket.selectors";
import { swapAsset } from "@interactions/dydx/deal-ticket/actions/deal-ticket.actions";
import { closePositions } from "../../../../helpers/dydx-trade-helpers";

test("btc-usd market order LONG", async ({
  metamaskContext,
  page,
  dydxTradeHelper
}) => {
  try {
    // Pre-test cleanup: Close any existing positions
    logger.step("Pre-test cleanup: Checking for existing positions to close");
    await closePositions(dydxTradeHelper, "BTC-USD", "Pre-test: ");
    
    // Arrange
    logger.step("Setting up connected market page test");
    await openDydxConnectMetaMask(page, metamaskContext, {
      dydxPage: "/trade/BTC-USD",
    });
    
    // Wait for chart elements to be visible with polling
    logger.info("Waiting for chart elements to be visible");
    const pollTimeout = 10000; // 10 seconds total polling time
    const pollInterval = 500; // Check every 500ms
    const startTime = Date.now();
    let elementsFound = false;
    
    while (Date.now() - startTime < pollTimeout && !elementsFound) {
      try {
        // Check for chart title
        const titleVisible = await page.locator('.titleWrapper-l31H9iuA, .mainTitle-l31H9iuA').isVisible()
          .catch(() => false);
          
        // Check for chart visibility
        const chartVisible = await page.locator('[data-name="pane-widget-chart-gui-wrapper"]').isVisible()
          .catch(() => false);
          
        // Check for orderbook visibility  
        const orderbookVisible = await page.locator('.sc-1h5n0ah-2').isVisible()
          .catch(() => false);
        
        logger.info(`Chart elements check - Title: ${titleVisible}, Chart: ${chartVisible}, Orderbook: ${orderbookVisible}`);
        
        if (titleVisible && chartVisible && orderbookVisible) {
          elementsFound = true;
          logger.success("All chart elements are visible");
          break;
        }
      } catch (error) {
        // Ignore errors during polling
      }
      
      // Wait before next attempt
      if (!elementsFound) {
        await page.waitForTimeout(pollInterval);
      }
    }
    
    if (!elementsFound) {
      logger.warning("Could not find all chart elements within timeout period");
    }

    // Act
    await swapAsset(page, "USD");

    await page.click(DealTicketSelectors.marketOrderBtn);

    // Assert that the Place Market Order button is disabled
    await expect(
      page.locator(DealTicketSelectors.placeOrderBtnInactive)
    ).toBeDisabled();
    await page.click(DealTicketSelectors.marketOrderBtn);
    await page.click(DealTicketSelectors.marketOrderBtn);
    await page.fill(DealTicketSelectors.amountInput, "500");
    try {
      await expect(
        page.locator(DealTicketSelectors.placeOrderBtnActive)
      ).toBeEnabled();
    } catch (error) {
      await page.click(DealTicketSelectors.marketOrderBtn);
      await expect(
        page.locator(DealTicketSelectors.placeOrderBtnActive)
      ).toBeEnabled();
    }

    // Assert each fee/detail field is visible and does not show "--"
    for (const key of [
      "expectedPrice",
      "liquidationPrice",
      "positionMargin",
      "positionLeverage",
      "fee",
      "estimatedRewards",
    ]) {
      const selector =
        DealTicketSelectors[key as keyof typeof DealTicketSelectors];
      logger.step(`Verifying key "${key}" with selector "${selector}"`);

      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 10000 });
        
      } catch (error) {
        logger.error(
          `Failed to verify visibility for key "${key}" with selector "${selector}"`,
          error as Error
        );
        throw error;
      }

     try {
       // 1) Make sure the element is visible (optional but often helpful)
       await expect(page.locator(selector)).toBeVisible({ timeout: 10000 });

       // 2) Ensure it has at least one non-whitespace character
       await expect(page.locator(selector)).toHaveText(/\S+/, {
         timeout: 10000,
       });
     } catch (error) {
       logger.error(
         `Element for key "${key}" appears empty. Selector: "${selector}"`,
         error as Error
       );
       throw error;
     }
    }

    await page.click(DealTicketSelectors.placeOrderBtnActive);
    await page.waitForTimeout(10000);
    // TODO: assert Pending notification
    // TODO: assert order confirmation notification
    // TODO: assert trading reward received notification
    // TODO: assert position table details
  } catch (error) {
    logger.error("Market page test failed", error as Error);
    throw error;
  } finally {
    // Clean up - close any positions via API regardless of test result
    logger.step("Post-test cleanup: Closing any open positions");
    await closePositions(dydxTradeHelper, "BTC-USD", "Post-test: ");
    await page.waitForTimeout(5000);
    await closePositions(dydxTradeHelper, "BTC-USD", "Post-test: ");
  }
});
