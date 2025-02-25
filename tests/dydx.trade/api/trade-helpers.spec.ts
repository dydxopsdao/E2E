import { dydxApiTest } from "../../../fixtures/dydxClientFixture";
import { OrderSide, OrderTimeInForce } from "@dydxprotocol/v4-client-js";
import { logger } from "../../../utils/logger/logging-utils";

dydxApiTest.describe("dYdX Trade Helper Functions", () => {
  // Market to use for tests
  const TEST_MARKET = "BTC-USD";

  // Before each test, cancel all existing orders to start with a clean state
  dydxApiTest.beforeEach(async ({ dydxTradeHelper }) => {
    await dydxTradeHelper.cancelAllOrders();
  });

  dydxApiTest("should place and cancel a limit order", async ({ dydxTradeHelper }) => {
    // Place a limit order
    const order = await dydxTradeHelper.placeLimitOrder(
      TEST_MARKET,
      OrderSide.BUY,
      0.001, // Size
      "50000", // Price - set to a price unlikely to fill immediately
      {
        postOnly: true,
        timeInForce: OrderTimeInForce.GTT,
        goodTilTimeInSeconds: 3600, 
      }
    );

    // Verify order was placed
    dydxApiTest.expect(order).toBeDefined();
    dydxApiTest.expect(order.id).toBeDefined();
    logger.info(`Order placed with ID: ${order.id}`);

    // Get orders and verify our order exists
    const orders = await dydxTradeHelper.getOrders();
    const placedOrder = orders.find((o) => o.clientId.toString() === order.id);
    dydxApiTest.expect(placedOrder).toBeDefined();

    // Cancel the order
    const cancelResult = await dydxTradeHelper.cancelOrder(order.id, TEST_MARKET);
    dydxApiTest.expect(cancelResult).toBeDefined();
  });

  dydxApiTest("should place multiple orders and cancel all orders", async ({ dydxTradeHelper }) => {
    // Place multiple limit orders
    const order1 = await dydxTradeHelper.placeLimitOrder(
      TEST_MARKET,
      OrderSide.BUY,
      0.001,
      "48000"
    );

    const order2 = await dydxTradeHelper.placeLimitOrder(
      TEST_MARKET,
      OrderSide.BUY,
      0.001,
      "47000"
    );

    const order3 = await dydxTradeHelper.placeLimitOrder(
      TEST_MARKET,
      OrderSide.SELL,
      0.001,
      "52000"
    );

    // Verify orders were placed
    dydxApiTest.expect(order1.id).toBeDefined();
    dydxApiTest.expect(order2.id).toBeDefined();
    dydxApiTest.expect(order3.id).toBeDefined();

    // Get orders and verify all orders exist
    const orders = await dydxTradeHelper.getOrders();
    dydxApiTest.expect(orders.length).toBeGreaterThanOrEqual(3);

    // Cancel all orders
    const cancelResults = await dydxTradeHelper.cancelAllOrders();
    dydxApiTest.expect(cancelResults.length).toBeGreaterThanOrEqual(3);

    // Verify all orders are canceled
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for cancellations to be processed
    const remainingOrders = await dydxTradeHelper.getOrders();
    
    // Check if any of our placed orders are still open
    const stillOpenOrders = remainingOrders.filter(
      (o) => 
        (o.clientId.toString() === order1.id ||
        o.clientId.toString() === order2.id ||
        o.clientId.toString() === order3.id) &&
        (o.status === "OPEN" || o.status === "PENDING")
    );
    
    dydxApiTest.expect(stillOpenOrders.length).toBe(0);
  });

  dydxApiTest("should wait for order status", async ({ dydxTradeHelper }) => {
    // Place a limit order that's unlikely to fill
    const order = await dydxTradeHelper.placeLimitOrder(
      TEST_MARKET,
      OrderSide.BUY,
      0.001,
      "40000", // Price much lower than market
      {
        timeInForce: OrderTimeInForce.GTT,
        goodTilTimeInSeconds: 120, // 2 minutes
      }
    );

    // Wait for the order to be confirmed (status should be OPEN)
    const confirmedOrder = await dydxTradeHelper.waitForOrderStatus(
      order.id,
      "OPEN",
      {
        timeoutMs: 10000, // 10 seconds
        pollIntervalMs: 1000, // 1 second
      }
    );

    dydxApiTest.expect(confirmedOrder).toBeDefined();
    dydxApiTest.expect(confirmedOrder?.status).toBe("OPEN");

    // Cancel the order
    await dydxTradeHelper.cancelOrder(order.id, TEST_MARKET);

    // Wait for the order to be canceled
    const canceledOrder = await dydxTradeHelper.waitForOrderStatus(
      order.id,
      "CANCELED",
      {
        timeoutMs: 10000,
        pollIntervalMs: 1000,
      }
    );

    dydxApiTest.expect(canceledOrder).toBeDefined();
    dydxApiTest.expect(canceledOrder?.status).toBe("CANCELED");
  });

  // This test demonstrates placing a market order
  // Note: Market orders may actually execute in a testnet/mainnet environment
  // Use with caution, preferably in testnet only
  dydxApiTest.skip("should place a market order", async ({ dydxTradeHelper }) => {
    // Place a market order
    const order = await dydxTradeHelper.placeMarketOrder(
      TEST_MARKET,
      OrderSide.BUY,
      0.0001, // Very small size to minimize impact
    );

    // Verify order was placed
    dydxApiTest.expect(order).toBeDefined();
    dydxApiTest.expect(order.id).toBeDefined();

    // Wait for the order to be filled (market orders should fill quickly)
    const filledOrder = await dydxTradeHelper.waitForOrderStatus(
      order.id,
      "FILLED",
      {
        timeoutMs: 15000,
        pollIntervalMs: 1000,
      }
    );

    // Market orders should typically fill or fail quickly
    dydxApiTest.expect(filledOrder).toBeDefined();
    dydxApiTest.expect(
      ["FILLED", "FAILED"].includes(filledOrder?.status)
    ).toBeTruthy();
  });
}); 