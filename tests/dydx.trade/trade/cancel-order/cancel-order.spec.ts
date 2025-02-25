import { combinedTest } from "@fixtures/combinedFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { expect } from "@playwright/test";
import { OrderbookSelectors } from "@interactions/orderbook/orderbook.selectors";
import { OrderSide, OrderTimeInForce } from "@dydxprotocol/v4-client-js";
import { OrdersTableSelectors } from "@interactions/dydx/orders/selectors/orders-table.selectors";
import { checkMultiOrderCancellationNotification, checkNotificationAppearance } from "@interactions/dydx/notifications/actions/notification-actions";
import { NotificationSelectors } from "@interactions/dydx/notifications/selectors/notification-selectors";

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
          clientId: Math.floor(Math.random() * 900000) + 100000 // 6-digit number
        }
      );
      
      
      // Store the client ID from the order response
      const orderId = order.id;
      logger.info(`Order placed with clientId: ${orderId}`);
      
      if (order.hash) {
        logger.info(`Order hash: ${order.hash}`);
      }
      
      // Log entire order object to debug
      logger.info('Order response details:', { orderDetails: order });
      
      // Wait for the order to be indexed
      logger.step(`Waiting for order ${orderId} to be indexed as OPEN`);
      const openOrder = await dydxTradeHelper.waitForOrderStatus(orderId, "OPEN", {
        timeoutMs: 30000,
        pollIntervalMs: 2000,
      });
      
      if (!openOrder) {
        throw new Error(`Order ${orderId} was not found or did not reach OPEN status`);
      }
      
      logger.info(`Order ${orderId} confirmed as OPEN in the API`);
      
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
      
      const cancelButton = orderRow.locator(OrdersTableSelectors.cancelButton);
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
      const canceledOrder = await dydxTradeHelper.waitForOrderStatus(orderId, "CANCELED", {
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
          // Generate a specific client ID to make tracking easier
          clientId: Math.floor(Math.random() * 900000) + 100000 // 6-digit number
        }
      );
       await openDydxConnectMetaMask(page, metamaskContext, {
         dydxPage: "/trade/BTC-USD",
       });
      await page.pause();

      // Store the client ID from the order response
      const orderId = order.id;
      logger.info(`Order placed with clientId: ${orderId}`);
      
      if (order.hash) {
        logger.info(`Order hash: ${order.hash}`);
      }
      
      // Log entire order object to debug
      logger.info('Order response details:', { orderDetails: order });
      
      // Wait for the order to be indexed
      logger.step(`Waiting for order ${orderId} to be indexed as OPEN`);
      const openOrder = await dydxTradeHelper.waitForOrderStatus(orderId, "OPEN", {
        timeoutMs: 30000,
        pollIntervalMs: 2000,
      });
      
      if (!openOrder) {
        throw new Error(`Order ${orderId} was not found or did not reach OPEN status`);
      }
      
      logger.info(`Order ${orderId} confirmed as OPEN in the API`);
      
      // Open UI and navigate to orders page
      logger.step("Opening dYdX UI and navigating to btc-usd page");
     

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

      const cancelButton = orderRow.locator(OrdersTableSelectors.cancelButton);
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
        orderId,
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
          // Generate a specific client ID to make tracking easier
          clientId: Math.floor(Math.random() * 900000) + 100000 // 6-digit number
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
          // Generate a specific client ID to make tracking easier
          clientId: Math.floor(Math.random() * 900000) + 100000 // 6-digit number
        }
      );

      // Store order IDs consistently
      const buyOrderId = buyOrder.id;
      const sellOrderId = sellOrder.id;
      logger.info(`Buy order placed with clientId: ${buyOrderId}`);
      logger.info(`Sell order placed with clientId: ${sellOrderId}`);

      // Wait for the orders to be indexed
      logger.step(`Waiting for both orders to be indexed as OPEN`);
      const [buyOpenOrder, sellOpenOrder] = await Promise.all([
        dydxTradeHelper.waitForOrderStatus(buyOrderId, "OPEN", {
          timeoutMs: 15000,
          pollIntervalMs: 1000,
        }),
        dydxTradeHelper.waitForOrderStatus(sellOrderId, "OPEN", {
          timeoutMs: 15000,
          pollIntervalMs: 1000,
        }),
      ]);
      
      if (!buyOpenOrder || !sellOpenOrder) {
        throw new Error(`Not all orders were found or reached OPEN status`);
      }
      
      logger.info(`Both orders confirmed as OPEN in the API`);
      
      // Open UI and navigate to btc-usd page
      logger.step("Opening dYdX UI and navigating to btc-usd page");
      await openDydxConnectMetaMask(page, metamaskContext, {
        dydxPage: "/trade/BTC-USD",
      });

      logger.step("Navigating to orders tab");
      await page.click(OrdersTableSelectors.ordersTab);

      // Use the "Cancel All" button - using the selector from the screenshot
      logger.step("Canceling all orders");
      await page.locator(OrdersTableSelectors.cancelAllButton).click();

        await page.locator(OrdersTableSelectors.confirmCancelAllButton).click();

      // Wait for cancellation notification
      await checkMultiOrderCancellationNotification(
        page,
        NotificationSelectors.cancelOrderToast,
        "Canceling all orders",
        "Orders Canceled",
        2,
        15000
      );

      expect(page.locator(OrdersTableSelectors.youHaveNoOrders)).toBeVisible();
      
      // Verify specific orders are canceled via API
      logger.step("Verifying specific orders are canceled via API");
      
      // Wait for specific orders to be canceled
      const [buyOrderCanceled, sellOrderCanceled] = await Promise.all([
        dydxTradeHelper.waitForOrderStatus(buyOrderId, "CANCELED", {
          timeoutMs: 15000,
          pollIntervalMs: 1000,
        }),
        dydxTradeHelper.waitForOrderStatus(sellOrderId, "CANCELED", {
          timeoutMs: 15000,
          pollIntervalMs: 1000,
        }),
      ]);
      
      // Check if both specific orders were canceled
      expect(buyOrderCanceled?.status).toBe("CANCELED");
      expect(sellOrderCanceled?.status).toBe("CANCELED");
      
      logger.info(`Confirmed buy order ${buyOrderId} status: ${buyOrderCanceled?.status}`);
      logger.info(`Confirmed sell order ${sellOrderId} status: ${sellOrderCanceled?.status}`);
      
      // Double-check that there are no open orders left
      const openOrders = await dydxTradeHelper.getOpenOrders({ market });
      expect(openOrders.length).toBe(0);
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
