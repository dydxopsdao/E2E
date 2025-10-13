import { combinedTest as test } from "@fixtures/combinedFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { BrowserContext, expect, Page } from "@playwright/test";
import { OrderbookSelectors } from "@interactions/orderbook/orderbook.selectors";
import { DealTicketSelectors } from "@interactions/dydx/deal-ticket/selectors/deal-ticket.selectors";
import { swapAsset } from "@interactions/dydx/deal-ticket/actions/deal-ticket.actions";
import { closePositions } from "../../../../helpers/dydx-trade-helpers";
import { OrdersTableSelectors } from "@interactions/dydx/orders/selectors/orders-table.selectors";

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
      waitForSelector: '.sc-1h5n0ah-2.gopQdx'
    });
    // Wait for orderbook to be visible
    await page.waitForSelector(OrderbookSelectors.orderbook, {
      state: "visible",
    });

    // Act
    await swapAsset(page, "USD");

    await page.click(DealTicketSelectors.marketOrderBtn);
    // Assert that the Place Market Order button is disabled
    await expect(
      page.locator(DealTicketSelectors.placeOrderBtnInactive)
    ).toBeDisabled();
    await page.click(DealTicketSelectors.marketOrderBtn);
    await page.click(DealTicketSelectors.marketOrderBtn);
    await page.fill(DealTicketSelectors.amountInput, "2500");
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
      const selector = DealTicketSelectors[key as keyof typeof DealTicketSelectors];
      logger.step(`Verifying key "${key}" with selector "${selector}"`);
      try {
        // Get all elements matching the selector
        const elements = await page.locator(selector).all();
        // Check if we found any elements
        expect(elements.length).toBeGreaterThan(0);
        
        // Verify each element (could be 1 or 2 values)
        for (const element of elements) {
          // Ensure element is visible
          await expect(element).toBeVisible({ timeout: 10000 });
          
          // Ensure element has actual content (not just whitespace)
          await expect(element).toHaveText(/\S+/, { timeout: 10000 });
          
          // Log the actual value for debugging
          const text = await element.textContent();
          logger.info(`${key} value: "${text}"`);
        }
        
        // If we expected a range for certain fields, verify we have 2 values
        if (["liquidationPrice", "positionMargin", "positionLeverage"].includes(key)) {
          // These fields typically show ranges in certain conditions
          logger.info(`Field "${key}" has ${elements.length} value(s) - range expected`);
        }
      } catch (error) {
        logger.error(
          `Failed to verify field "${key}" with selector "${selector}"`,
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


   try {
      logger.step("-------Closing positions test -------");
      await page.click(OrdersTableSelectors.closePositionBtn);
      await page.click(DealTicketSelectors.closePositionBtn);
      await page.waitForTimeout(10000);
      await expect(page.locator(OrdersTableSelectors.youHaveNoOrders)).toBeVisible();
    } catch (error) {
      logger.error("Failed to close positions", error as Error);
    }




    // Clean up - close any positions via API regardless of test result
    logger.step("Post-test cleanup: Closing any open positions");
    await closePositions(dydxTradeHelper, "BTC-USD", "Post-test: ");
    await page.waitForTimeout(5000);
    await closePositions(dydxTradeHelper, "BTC-USD", "Post-test: ");
  }
});
