import { combinedTest } from "@fixtures/combinedFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { expect } from "@playwright/test";
import { OrderbookSelectors } from "@interactions/orderbook/orderbook.selectors";
import { OrderSide, OrderTimeInForce } from "@dydxprotocol/v4-client-js";
import { OrdersTableSelectors } from "@interactions/dydx/orders/selectors/orders-table.selectors";
import { checkMultiOrderCancellationNotification, checkNotificationAppearance } from "@interactions/dydx/notifications/actions/notification-actions";
import { NotificationSelectors } from "@interactions/dydx/notifications/selectors/notification-selectors";
import { BrowserContext, Page } from "@playwright/test";
import { TIMEOUT } from "dns";
import { TEST_TIMEOUTS } from "@constants/test.constants";

/**
 * Tests for canceling different types of orders via the UI after placing them with the API
 * 
 * IMPORTANT: This is a special implementation that uses a single-test approach to
 * ensure we only create one browser instance for all test cases.
 */

// Single test that runs all our test cases in sequence
combinedTest('All cancel order tests', async ({ metamaskContext, dydxTradeHelper }) => {
  let firstOrderId = '';
  let firstOrderHash = '';
  
  // Start placing the first order immediately via API (in parallel with browser setup)
  logger.info("Starting first order placement in parallel with browser setup");
  const firstOrderPromise = (async () => {
    try {
      const market = "BTC-USD";
      logger.step("Placing a buy limit order via API (in parallel)");
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
      firstOrderId = order.id;
      if (order.hash) {
        firstOrderHash = order.hash;
      }
      
      logger.info(`First order placed with ID: ${firstOrderId}`);
      if (firstOrderHash) {
        logger.info(`First order hash: ${firstOrderHash}`);
      }
      
      // Log entire order object to debug
      logger.info('First order response details:', { orderDetails: order });
      
      // Wait for the order to be indexed
      logger.step(`Waiting for order ${firstOrderId} to be indexed as OPEN`);
      const openOrder = await dydxTradeHelper.waitForOrderStatus(firstOrderId, "OPEN", {
        timeoutMs: 30000,
        pollIntervalMs: 2000,
      });
      
      if (!openOrder) {
        throw new Error(`Order ${firstOrderId} was not found or did not reach OPEN status`);
      }
      
      logger.info(`Order ${firstOrderId} confirmed as OPEN in the API`);
      return order;
    } catch (error) {
      logger.error("Failed to place first order in parallel", error as Error);
      throw error;
    }
  })();
  
  // In parallel, set up the browser context
  logger.info("Creating shared MetaMask page for all test cases");
  const sharedPage = await metamaskContext.newPage();
  
  // Connect to MetaMask just once for all test cases
  logger.info("Connecting to MetaMask once for all test cases");
  const metaMaskPromise = openDydxConnectMetaMask(sharedPage, metamaskContext, {
    dydxPage: "/trade/BTC-USD",
  });
  
  // Wait for both operations to complete
  logger.info("Waiting for both MetaMask connection and first order placement to complete");
  try {
    await Promise.all([metaMaskPromise, firstOrderPromise]);
    logger.success("Successfully completed both MetaMask connection and first order placement");
  } catch (error) {
    logger.error("Failed during parallel operations", error as Error);
    // Continue with the test - we'll check for firstOrderId later
  }
  
  // Wait for page to load completely
  await sharedPage.waitForSelector(OrderbookSelectors.orderbook, {
    state: "visible",
    timeout: 30000
  });
  
  logger.success("MetaMask connection established - will be used for all test cases");
  
  // Navigate to orders tab once for all tests
  logger.info("Navigating to orders tab for all test cases");
  await sharedPage.click(OrdersTableSelectors.ordersTab);
  await sharedPage.waitForSelector(OrdersTableSelectors.ordersTable, {
    state: "visible",
  });
  
  // Helper function to clean up after each test case
  async function cleanupOrders() {
    logger.step("Cleaning up any remaining orders");
    await dydxTradeHelper.cancelAllOrders();
  }
  
  try {
    //-------------------------------------------------------------------------
    // TEST CASE 1: Cancel buy limit order
    //-------------------------------------------------------------------------
    logger.info("======= STARTING TEST CASE: Cancel buy limit order =======");
    
    try {
      // First order was already placed in parallel with browser setup
      if (!firstOrderId) {
        throw new Error("First order ID is not available. Order placement may have failed.");
      }
      
      logger.info(`Using already placed order ID: ${firstOrderId}`);
      const orderId = firstOrderId;
      const market = "BTC-USD";
      const displayMarket = "BTC"; // Only the base asset is shown in the UI
      
      // Find our order in the table
      logger.step("Finding and canceling the order");
      
      // Verify order is visible in the table - updated to match actual UI values
      const orderRow = sharedPage
        .locator(OrdersTableSelectors.orderRow)
        .filter({ hasText: displayMarket })
        .filter({ hasText: "Buy" })
        .filter({ hasText: "0.0001" }) 
        .first();
      
      await expect(orderRow).toBeVisible();
      
      const cancelButton = orderRow.locator(OrdersTableSelectors.cancelButton);
      await sharedPage.waitForTimeout(2500)
      
      // Implement retry logic for cancel button
      let maxRetries = 3;
      let retryCount = 0;
      let notificationResult;
      
      do {
        if (retryCount > 0) {
          logger.info(`Retrying cancel button click (attempt ${retryCount})`);
          await sharedPage.waitForTimeout(1000); // Wait before retry
        }
        
        await cancelButton.click();
        
        // Wait for cancellation notification
        notificationResult = await checkNotificationAppearance(
          sharedPage,
          NotificationSelectors.cancelOrderToast,
          NotificationSelectors.cancelOrderHeader,
          NotificationSelectors.cancelOrderMessage,
          "Limit Order",
          "Canceled",
          120000
        );
        
        if (!notificationResult.success) {
          logger.warning(`Error detected in notification: ${notificationResult.errorMessage}`);
        }
        
        retryCount++;
      } while (!notificationResult.success && retryCount < maxRetries);
      
      // If we still have an error after max retries, throw an error
      if (!notificationResult.success) {
        throw new Error(`Failed to cancel order after ${maxRetries} attempts: ${notificationResult.errorMessage}`);
      }
      
      // Verify order is no longer active in the API
      logger.step("Verifying order cancellation via API");
      const canceledOrder = await dydxTradeHelper.waitForOrderStatus(orderId, "CANCELED", {
        timeoutMs: 10000,
        pollIntervalMs: 1000,
      });
      
      expect(canceledOrder?.status).toBe("CANCELED");
      logger.success("======= COMPLETED TEST CASE: Cancel buy limit order =======");
    } catch (error) {
      logger.error("Cancel buy limit order test case failed", error as Error);
      await cleanupOrders();
      throw error;
    }
    
    //-------------------------------------------------------------------------
    // TEST CASE 2: Cancel sell limit order
    //-------------------------------------------------------------------------
    logger.info("======= STARTING TEST CASE: Cancel sell limit order =======");
    
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
      
      // Find our order in the table
      logger.step("Finding and canceling the order");
      
      // Verify order is visible in the table - updated to match actual UI values
      const orderRow = sharedPage
        .locator(OrdersTableSelectors.orderRow)
        .filter({ hasText: displayMarket })
        .filter({ hasText: "Sell" }) 
        .filter({ hasText: "0.0001" }) 
        .first();

      await expect(orderRow).toBeVisible();
      await sharedPage.waitForTimeout(2500)
      const cancelButton = orderRow.locator(OrdersTableSelectors.cancelButton);
      await sharedPage.waitForTimeout(2500)
      
      // Implement retry logic for cancel button
      let maxRetries = 3;
      let retryCount = 0;
      let notificationResult;
      
      do {
        if (retryCount > 0) {
          logger.info(`Retrying cancel button click (attempt ${retryCount})`);
          await sharedPage.waitForTimeout(1000); // Wait before retry
        }
        
        await cancelButton.click();
        
        // Wait for cancellation notification
        notificationResult = await checkNotificationAppearance(
          sharedPage,
          NotificationSelectors.cancelOrderToast,
          NotificationSelectors.cancelOrderHeader,
          NotificationSelectors.cancelOrderMessage,
          "Limit Order",
          "Canceled",
          120000
        );
        
        if (!notificationResult.success) {
          logger.warning(`Error detected in notification: ${notificationResult.errorMessage}`);
        }
        
        retryCount++;
      } while (!notificationResult.success && retryCount < maxRetries);
      
      // If we still have an error after max retries, throw an error
      if (!notificationResult.success) {
        throw new Error(`Failed to cancel order after ${maxRetries} attempts: ${notificationResult.errorMessage}`);
      }

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
      logger.success("======= COMPLETED TEST CASE: Cancel sell limit order =======");
    } catch (error) {
      logger.error("Cancel sell limit order test case failed", error as Error);
      await cleanupOrders();
      throw error;
    }
    
    //-------------------------------------------------------------------------
    // TEST CASE 3: Cancel multiple orders at once
    //-------------------------------------------------------------------------
    logger.info("======= STARTING TEST CASE: Cancel multiple orders at once =======");
    
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
      
      // Use the "Cancel All" button - using the selector from the screenshot
      logger.step("Canceling all orders");
      await sharedPage.waitForTimeout(2500);
      await sharedPage.locator(OrdersTableSelectors.cancelAllButton).click({ timeout: TEST_TIMEOUTS.ACTION });
      await sharedPage.waitForTimeout(500);
      await sharedPage.locator(OrdersTableSelectors.confirmCancelAllButton).click();

      // Wait for cancellation notification
      await checkMultiOrderCancellationNotification(
        sharedPage,
        NotificationSelectors.cancelOrderToast,
        "Canceling all orders",
        "Orders Canceled",
        2,
        15000
      );

      await expect(sharedPage.locator(OrdersTableSelectors.youHaveNoOrders)).toBeVisible();
      
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
      
      await cleanupOrders();
      logger.success("======= COMPLETED TEST CASE: Cancel multiple orders at once =======");
    } catch (error) {
      logger.error("Cancel multiple orders test case failed", error as Error);
      await cleanupOrders();
      throw error;
    }
    
  } finally {
    // We intentionally do not close the page here to allow reuse by future test suites
    logger.info("All test cases completed, shared page is being maintained for potential future tests");
  }
});
