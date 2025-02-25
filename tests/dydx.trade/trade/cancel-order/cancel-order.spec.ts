import { combinedTest } from "@fixtures/combinedFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { expect } from "@playwright/test";
import { OrderbookSelectors } from "@interactions/orderbook/orderbook.selectors";
import { OrderSide, OrderTimeInForce } from "@dydxprotocol/v4-client-js";
import { OrdersTableSelectors } from "@interactions/dydx/orders/selectors/orders-table.selectors";
import { checkNotificationAppearance } from "@interactions/dydx/notifications/actions/notification-actions";
import { NotificationSelectors } from "@interactions/dydx/notifications/selectors/notification-selectors";


// Define the cancel button selectors based on the screenshot
const CancelButtonSelectors = {
  cancelButton:
    "button.sc-l0nx5c-0.hXySKe.sc-1xochuw-0.wjDMP.sc-mg0yzv-0.fpsZnf.sc-1389rbw-0.bOJleK",
  cancelAllButton:
    "button.sc-l0nx5c-0.jpRLbK.sc-1xochuw-0.kwYHWz.sc-jsj259-0.hyRwUc",
  cancelContainer: "div.sc-1drcyj-9.kFEJXg",
  confirmCancelAllButton: ".sc-l0nx5c-0.kvCeBH.sc-1xochuw-0.jbIjRq.sc-16lhsa0-0.JlMLV",
};

/**
 * Tests for canceling different types of orders via the UI after placing them with the API
 */
combinedTest.describe("Cancel Orders UI", () => {
  
  // Test for canceling a buy limit order
  combinedTest("Cancel buy limit order", async ({
    metamaskContext,
    page,
    dydxTradeHelper
  }) => {
    try {
      // Arrange - place order via API
      const market = "BTC-USD";
      const displayMarket = "BTC"; // Only the base asset is shown in the UI
      logger.step("Placing a buy limit order via API");
      const order = await dydxTradeHelper.placeLimitOrder(
        market,
        OrderSide.BUY,
        0.0001, // Small size
        "10", // Price below market to avoid fills
        {
          timeInForce: OrderTimeInForce.GTT,
          goodTilTimeInSeconds: 3600, // 1 hour
          postOnly: true,
        }
      );
      
      logger.info(`Order placed with ID: ${order.id}`);
      
      // Wait for the order to be indexed
      await dydxTradeHelper.waitForOrderStatus(order.id, "OPEN", {
        timeoutMs: 10000,
        pollIntervalMs: 1000,
      });
      
      // Open UI and navigate to orders page
      logger.step("Opening dYdX UI and navigating to btc-usd page");
      await openDydxConnectMetaMask(page, metamaskContext, {
        dydxPage: "/trade/BTC-USD",
      });
      
      // Wait for page to load
      await page.waitForSelector(OrderbookSelectors.orderbook, {
        state: "visible",
      });
      
      // Navigate to the orders tab
      logger.step("Navigating to orders tab");
      await page.click(OrdersTableSelectors.ordersTab);
      
      // Find our order in the table
      logger.step("Finding and canceling the order");
      await page.waitForSelector(OrdersTableSelectors.ordersTable);
      
      // Verify order is visible in the table - updated to match actual UI values
      const orderRow = page
        .locator(OrdersTableSelectors.orderRow)
        .filter({ hasText: displayMarket })
        .filter({ hasText: "Buy" })
        .filter({ hasText: "0.0001" }) 
        .first();
      
      await expect(orderRow).toBeVisible();
      
      const cancelButton = orderRow.locator(CancelButtonSelectors.cancelButton);
      await cancelButton.click();
      
      
      // Wait for cancellation notification
      await checkNotificationAppearance(
        page,
        NotificationSelectors.cancelOrderToast,
        NotificationSelectors.cancelOrderHeader,
        NotificationSelectors.cancelOrderMessage,
        "Limit Order",
        "Canceled",
        10000
      );
      
      // Verify order is no longer active in the API
      logger.step("Verifying order cancellation via API");
      const canceledOrder = await dydxTradeHelper.waitForOrderStatus(order.id, "CANCELED", {
        timeoutMs: 10000,
        pollIntervalMs: 1000,
      });
      
      expect(canceledOrder?.status).toBe("CANCELED");
      
      // Clean up - make sure all orders are canceled
      await dydxTradeHelper.cancelAllOrders();
      
    } catch (error) {
      logger.error("Cancel buy limit order test failed", error as Error);
      throw error;
    }
  });
  
  // Test for canceling a sell limit order
  combinedTest("Cancel sell limit order", async ({
    metamaskContext,
    page,
    dydxTradeHelper
  }) => {
    try {
      // Arrange - place order via API
      const market = "BTC-USD";
      const displayMarket = "BTC"; // Only the base asset is shown in the UI
      logger.step("Placing a sell limit order via API");
      const order = await dydxTradeHelper.placeLimitOrder(
        market,
        OrderSide.SELL,
        0.0001, // Small size
        "999999999", // Price above market to avoid fills
        {
          timeInForce: OrderTimeInForce.GTT,
          goodTilTimeInSeconds: 3600, // 1 hour
          postOnly: true,
        }
      );

      logger.info(`Order placed with ID: ${order.id}`);

      // Wait for the order to be indexed
      await dydxTradeHelper.waitForOrderStatus(order.id, "OPEN", {
        timeoutMs: 10000,
        pollIntervalMs: 1000,
      });

      // Open UI and navigate to orders page
      logger.step("Opening dYdX UI and navigating to btc-usd page");
      await openDydxConnectMetaMask(page, metamaskContext, {
        dydxPage: "/trade/BTC-USD",
      });

      // Wait for page to load
      await page.waitForSelector(OrderbookSelectors.orderbook, {
        state: "visible",
      });

      // Navigate to the orders tab
      logger.step("Navigating to orders tab");
      await page.click(OrdersTableSelectors.ordersTab);

      // Find our order in the table
      logger.step("Finding and canceling the order");
      await page.waitForSelector(OrdersTableSelectors.ordersTable);

      // Verify order is visible in the table - updated to match actual UI values
      const orderRow = page
        .locator(OrdersTableSelectors.orderRow)
        .filter({ hasText: displayMarket }) // Just "BTC" not "BTC-USD"
        .filter({ hasText: "Sell" }) // "Buy" not "BUY"
        .filter({ hasText: "0.0001" }) // Format shown in UI with trailing zero
        .first();

      await expect(orderRow).toBeVisible();

      const cancelButton = orderRow.locator(CancelButtonSelectors.cancelButton);
      await cancelButton.click();

      // Wait for cancellation notification
      await checkNotificationAppearance(
        page,
        NotificationSelectors.cancelOrderToast,
        NotificationSelectors.cancelOrderHeader,
        NotificationSelectors.cancelOrderMessage,
        "Limit Order",
        "Canceled",
        10000
      );

      // Verify order is no longer active in the API
      logger.step("Verifying order cancellation via API");
      const canceledOrder = await dydxTradeHelper.waitForOrderStatus(
        order.id,
        "CANCELED",
        {
          timeoutMs: 10000,
          pollIntervalMs: 1000,
        }
      );

      expect(canceledOrder?.status).toBe("CANCELED");

      // Clean up - make sure all orders are canceled
      await dydxTradeHelper.cancelAllOrders();
    } catch (error) {
      logger.error("Cancel sell limit order test failed", error as Error);
      throw error;
    }
  });
  
  // Test for canceling multiple orders at once
  combinedTest("Cancel multiple orders at once", async ({
    metamaskContext,
    page,
    dydxTradeHelper
  }) => {
    try {
      // Arrange - place multiple orders via API
      const market = "BTC-USD";
      const displayMarket = "BTC"; // Only the base asset is shown in the UI
      logger.step("Placing multiple orders via API");

      // Place a buy limit order
      const buyOrder = await dydxTradeHelper.placeLimitOrder(
        market,
        OrderSide.BUY,
        0.0001,
        "10",
        {
          timeInForce: OrderTimeInForce.GTT,
          goodTilTimeInSeconds: 3600,
          postOnly: true,
        }
      );

      // Place a sell limit order
      const sellOrder = await dydxTradeHelper.placeLimitOrder(
        market,
        OrderSide.SELL,
        0.0001,
        "999999999",
        {
          timeInForce: OrderTimeInForce.GTT,
          goodTilTimeInSeconds: 3600,
          postOnly: true,
        }
      );

      logger.info(`Buy order placed with ID: ${buyOrder.id}`);
      logger.info(`Sell order placed with ID: ${sellOrder.id}`);

      // Wait for the orders to be indexed
      await Promise.all([
        dydxTradeHelper.waitForOrderStatus(buyOrder.id, "OPEN", {
          timeoutMs: 10000,
        }),
        dydxTradeHelper.waitForOrderStatus(sellOrder.id, "OPEN", {
          timeoutMs: 10000,
        }),
      ]);

      // Open UI and navigate to btc-usd page
      logger.step("Opening dYdX UI and navigating to btc-usd page");
      await openDydxConnectMetaMask(page, metamaskContext, {
        dydxPage: "/trade/BTC-USD",
      });

      logger.step("Navigating to orders tab");
      await page.click(OrdersTableSelectors.ordersTab);

      // Use the "Cancel All" button - using the selector from the screenshot
      logger.step("Canceling all orders");
      await page.locator(CancelButtonSelectors.cancelAllButton).click();

      await page.locator(CancelButtonSelectors.confirmCancelAllButton).click();

      // Wait for cancellation notification
      await checkNotificationAppearance(
        page,
        NotificationSelectors.cancelOrderToast,
        NotificationSelectors.cancelOrderHeader,
        NotificationSelectors.cancelOrderMessage,
        "Orders",
        "Canceled",
        10000
      );

      // Verify orders are no longer active in the API
      logger.step("Verifying orders cancellation via API");

      // Wait for all orders to be canceled
      const openOrders = await dydxTradeHelper.getOpenOrders({ market });
      expect(openOrders.length).toBe(0);

      // Specifically check our placed orders
      const buyOrderFinal = await dydxTradeHelper.waitForOrderStatus(
        buyOrder.id,
        "CANCELED",
        { timeoutMs: 10000 }
      );
      const sellOrderFinal = await dydxTradeHelper.waitForOrderStatus(
        sellOrder.id,
        "CANCELED",
        { timeoutMs: 10000 }
      );

      expect(buyOrderFinal?.status).toBe("CANCELED");
      expect(sellOrderFinal?.status).toBe("CANCELED");
    } catch (error) {
      logger.error("Cancel multiple orders test failed", error as Error);
      throw error;
    }
  });
  
  // Clean up after all tests - cancel any remaining orders
  combinedTest.afterEach(async ({ dydxTradeHelper }) => {
    logger.step("Cleaning up any remaining orders");
    await dydxTradeHelper.cancelAllOrders();
  });
});
