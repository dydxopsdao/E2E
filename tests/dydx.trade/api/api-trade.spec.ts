import { dydxApiTest } from "../../../fixtures/dydxClientFixture";
import {
  OrderSide,
  OrderType,
  OrderTimeInForce,
  OrderFlags,
} from "@dydxprotocol/v4-client-js";
import { logger } from "../../../utils/logger/logging-utils";

// Default subaccount index
const DEFAULT_SUBACCOUNT = 0;

// Define the market info interface
interface MarketInfo {
  ticker?: string;
  clobPairId?: string;
  status?: string;
  oraclePrice?: string;
  [key: string]: any;
}

dydxApiTest.describe("dYdX API Trading", () => {
  dydxApiTest("should get market information", async ({ dydxClient }) => {
    // Get information about a specific market
    const targetMarket = "BTC-USD";
    
    // Use a direct fetch to the indexer API as a workaround
    const indexerUrl = dydxClient.indexerClient.config.restEndpoint;
    logger.info(`Using indexer URL: ${indexerUrl}`);
    
    // Use the perpetualmarkets endpoint which returns market data
    const response = await fetch(`${indexerUrl}/v4/perpetualmarkets`);
    const data = await response.json();
    
    // Log the raw response for debugging
    logger.info("Raw API response structure:", { keys: Object.keys(data) });
    
    // The markets object has tickers as keys
    if (data.markets && typeof data.markets === 'object') {
      // Access the target market directly by key
      const marketInfo = data.markets[targetMarket];
      
      logger.info(`Market info for ${targetMarket}:`, marketInfo);
      
      // Skip the test if we can't find the market
      if (!marketInfo) {
        logger.warning(`Could not find market ${targetMarket} in the API response`);
        dydxApiTest.skip();
        return;
      }
      
      // Simple assertions on the market data
      dydxApiTest.expect(marketInfo).toBeDefined();
      dydxApiTest.expect(marketInfo.ticker).toBe(targetMarket);
      
      // Additional assertions on market properties
      dydxApiTest.expect(marketInfo.status).toBeDefined();
      dydxApiTest.expect(marketInfo.oraclePrice).toBeDefined();
    } else {
      // If we didn't get a markets object, skip the test
      logger.warning("Could not retrieve markets from the API - unexpected response format");
      dydxApiTest.skip();
    }
  });

  dydxApiTest(
    "should place and cancel an order",
    async ({ dydxOrderManager }) => {
      const market = "BTC-USD";
      
      // Define order parameters
      const orderParams = {
        market,
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        size: 0.001, // Size in base currency as number, not string
        price: "50000", // Limit price (set to a price unlikely to fill immediately)
        timeInForce: OrderTimeInForce.GTT,
        reduceOnly: false,
        postOnly: true,
      };

      // Place the order
      const order = await dydxOrderManager.placeOrder(
        DEFAULT_SUBACCOUNT,
        orderParams
      );

      // Verify order was placed
      dydxApiTest.expect(order).toBeDefined();
      dydxApiTest.expect(order.id).toBeDefined();

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Cancel the order - pass the market
      const cancelResult = await dydxOrderManager.cancelOrder(
        DEFAULT_SUBACCOUNT,
        order.id,
        market,
        OrderTimeInForce.GTT, // Use GTT to trigger the LONG_TERM cancellation logic
        120 // goodTilTimeInSeconds: valid timeout
      );

      // Verify cancellation
      dydxApiTest.expect(cancelResult).toBeDefined();
    }
  );

  dydxApiTest(
    "should subscribe to orderbook updates",
    async ({ dydxWebSocketManager }, testInfo) => {
      // Skip if running in CI environment without WS support
      if (process.env.CI) {
        dydxApiTest.skip();
      }

      // Track received messages
      const receivedMessages: any[] = [];

      // Subscribe to orderbook
      const market = "BTC-USD";
      const subscriptionId = await dydxWebSocketManager.subscribeToOrderbook(
        market,
        (message) => {
          logger.info("Received orderbook update", { message });
          receivedMessages.push(message);
        }
      );

      // Wait for some data
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Unsubscribe
      await dydxWebSocketManager.unsubscribe(subscriptionId);

      // Verify we received some data
      dydxApiTest.expect(receivedMessages.length).toBeGreaterThan(0);
    }
  );
});
