import { dydxApiTest } from "../../../fixtures/dydxClientFixture";
import { OrderSide, OrderTimeInForce } from "@dydxprotocol/v4-client-js";
import { logger } from "../../../utils/logger/logging-utils";

/**
 * These tests are designed to help debug issues with order fetching.
 * They include more detailed logging and assertions to identify where problems might be occurring.
 */
dydxApiTest.describe("dYdX Order Fetching Debugging", () => {
  const TEST_MARKET = "BTC-USD";

  dydxApiTest("should retrieve and log orders using different methods", async ({ 
    dydxTradeHelper, 
    dydxOrderManager,
    dydxClient,
    dydxWallet 
  }) => {
    // Log configuration information to help diagnose issues
    logger.info("Test configuration", {
      walletAddress: dydxWallet.address,
      indexerEndpoint: dydxClient.indexerClient.config.restEndpoint,
    });

    // First, let's place a test order to ensure we have at least one order to fetch
    logger.step("Placing a test order to ensure we have something to fetch");
    const order = await dydxTradeHelper.placeLimitOrder(
      TEST_MARKET,
      OrderSide.BUY,
      0.001,
      "40000", // Far from market price to avoid execution
      {
        postOnly: true,
        timeInForce: OrderTimeInForce.GTT,
        goodTilTimeInSeconds: 3600,
      }
    );

    logger.info(`Test order placed with ID: ${order.id}`);

    // Wait for a moment to allow the order to be indexed
    logger.step("Waiting for order to be indexed");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Try different approaches to fetch orders
    
    // 1. Direct fetch using OrderManager with status filter
    logger.step("Fetching OPEN orders with status filter");
    const openOrders = await dydxOrderManager.getOrders(0, undefined, "OPEN");
    logger.info(`Found ${openOrders.length} orders with OPEN status filter`);
    
    // 2. Fetch all orders without status filter
    logger.step("Fetching ALL orders without status filter");
    const allOrders = await dydxOrderManager.getOrders(0);
    logger.info(`Found ${allOrders.length} orders without status filter`);
    
    // 3. Using TradeHelper methods
    logger.step("Using TradeHelper.getOpenOrders()");
    const helperOpenOrders = await dydxTradeHelper.getOpenOrders();
    logger.info(`Found ${helperOpenOrders.length} orders with getOpenOrders()`);
    
    logger.step("Using TradeHelper.getOrders()");
    const helperAllOrders = await dydxTradeHelper.getOrders();
    logger.info(`Found ${helperAllOrders.length} orders with getOrders()`);
    
    // 4. Try explicitly for the market we placed the order in
    logger.step(`Fetching orders specifically for ${TEST_MARKET}`);
    const marketOrders = await dydxTradeHelper.getOrders({ market: TEST_MARKET });
    logger.info(`Found ${marketOrders.length} orders for ${TEST_MARKET}`);

    // 5. Try direct API request
    logger.step("Fetching orders with direct indexer API call");
    const indexerUrl = dydxClient.indexerClient.config.restEndpoint;
    const address = dydxWallet.address;
    
    // Log the actual URL being used - FIX: add /v4/ path segment
    const directUrl = `${indexerUrl}/v4/orders/?address=${address}&subaccountNumber=0&status=OPEN&returnLatestOrders=true`;
    logger.info(`Direct API URL: ${directUrl}`);
    
    try {
      const response = await fetch(directUrl);
      if (!response.ok) {
        logger.warning(`Direct API call failed: ${response.status} ${response.statusText}`);
      } else {
        const data = await response.json();
        logger.info("Direct API response:", {
          status: response.status,
          isArray: Array.isArray(data),
          itemCount: Array.isArray(data) ? data.length : 0,
          responseKeys: !Array.isArray(data) && typeof data === 'object' ? Object.keys(data) : 'N/A',
        });
        
        // If orders were found, log details of the first one
        if (Array.isArray(data) && data.length > 0) {
          logger.info("First order details:", {
            keys: Object.keys(data[0]),
            status: data[0].status,
            clientId: data[0].clientId,
            ticker: data[0].ticker,
          });
        }
      }
    } catch (error) {
      // Fix linter error by handling the unknown error type
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Direct API call failed with exception", new Error(errorMessage));
    }

    // 6. Try the new filtering options
    logger.step("Testing advanced filtering options");
    
    // Get latest BUY orders
    const latestBuyOrders = await dydxTradeHelper.getOrdersBySide('BUY', {
      limit: 5,
      returnLatestOrders: true
    });
    logger.info(`Found ${latestBuyOrders.length} latest BUY orders`);
    
    // Get LIMIT orders
    const limitOrders = await dydxTradeHelper.getOrdersByType('LIMIT', {
      status: 'OPEN'
    });
    logger.info(`Found ${limitOrders.length} open LIMIT orders`);
    
    // Get multiple statuses at once
    const recentCompletedOrders = await dydxTradeHelper.getOrdersByStatus(
      ['FILLED', 'CANCELED'],
      {
        limit: 10,
        returnLatestOrders: true
      }
    );
    logger.info(`Found ${recentCompletedOrders.length} recently filled or canceled orders`);

    // Clean up - cancel the test order
    await dydxTradeHelper.cancelOrder(order.id, TEST_MARKET);
    
    // Check if we found our test order in any of the results
    const foundInOpenOrders = openOrders.some((o: any) => o.clientId.toString() === order.id);
    const foundInAllOrders = allOrders.some((o: any) => o.clientId.toString() === order.id);
    const foundInHelperOpenOrders = helperOpenOrders.some((o: any) => o.clientId.toString() === order.id);
    const foundInHelperAllOrders = helperAllOrders.some((o: any) => o.clientId.toString() === order.id);
    const foundInMarketOrders = marketOrders.some((o: any) => o.clientId.toString() === order.id);
    
    logger.info("Test order search results:", {
      foundInOpenOrders,
      foundInAllOrders,
      foundInHelperOpenOrders,
      foundInHelperAllOrders,
      foundInMarketOrders,
    });
    
    // Final test assertion - our order should have been found in at least one of the queries
    const orderWasFound = foundInOpenOrders || foundInAllOrders || 
                          foundInHelperOpenOrders || foundInHelperAllOrders ||
                          foundInMarketOrders;
                          
    dydxApiTest.expect(orderWasFound, 
      "Test order was not found in any of the query methods"
    ).toBeTruthy();
  });
}); 