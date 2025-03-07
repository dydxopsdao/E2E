import {
  OrderSide,
  OrderType,
  OrderTimeInForce,
  OrderExecution,
} from "@dydxprotocol/v4-client-js";
import { OrderManager, OrderParams, OrderResponseObject } from "../Interactions/dydx/trade/api/order-manager";
import { logger } from "../utils/logger/logging-utils";

// Default subaccount index - can be overridden in function calls
const DEFAULT_SUBACCOUNT = 0;

/**
 * Helper class for dYdX trading functions in E2E tests
 */
export class DydxTradeHelper {
  private orderManager: OrderManager;

  constructor(orderManager: OrderManager) {
    this.orderManager = orderManager;
  }

  /**
   * Place a limit order
   * @param market The market to place the order on (e.g., "BTC-USD")
   * @param side Buy or sell
   * @param size The size in base currency
   * @param price The limit price
   * @param options Additional options for the order
   * @returns The order response
   */
  async placeLimitOrder(
    market: string,
    side: OrderSide,
    size: number,
    price: string,
    options: {
      subaccountNumber?: number;
      timeInForce?: OrderTimeInForce;
      reduceOnly?: boolean;
      postOnly?: boolean;
      clientId?: number;
      goodTilTimeInSeconds?: number;
    } = {}
  ): Promise<OrderResponseObject> {
    const {
      subaccountNumber = DEFAULT_SUBACCOUNT,
      timeInForce = OrderTimeInForce.GTT,
      reduceOnly = false,
      postOnly = true,
      clientId,
      goodTilTimeInSeconds,
    } = options;

    logger.step(`Placing ${side} limit order for ${size} ${market} @ ${price}`);

    const orderParams: OrderParams = {
      market,
      side,
      type: OrderType.LIMIT,
      size,
      price,
      timeInForce,
      reduceOnly,
      postOnly,
      clientId,
      goodTilTimeInSeconds,
    };

    return this.orderManager.placeOrder(subaccountNumber, orderParams);
  }

  /**
   * Place a market order
   * @param market The market to place the order on (e.g., "BTC-USD")
   * @param side Buy or sell
   * @param size The size in base currency
   * @param options Additional options for the order
   * @returns The order response
   */
  async placeMarketOrder(
    market: string,
    side: OrderSide,
    size: number,
    options: {
      subaccountNumber?: number;
      reduceOnly?: boolean;
      clientId?: number;
    } = {}
  ): Promise<OrderResponseObject> {
    const {
      subaccountNumber = DEFAULT_SUBACCOUNT,
      reduceOnly = false,
      clientId,
    } = options;

    logger.step(`Placing ${side} market order for ${size} ${market}`);

    const orderParams: OrderParams = {
      market,
      side,
      type: OrderType.MARKET,
      size,
      timeInForce: OrderTimeInForce.IOC, // Market orders use IOC
      reduceOnly,
      postOnly: false, // Market orders cannot be post-only
      clientId,
      goodTilTimeInSeconds: 3000,
    };

    return this.orderManager.placeOrder(subaccountNumber, orderParams);
  }

  /**
   * Cancel a specific order
   * @param orderId The ID of the order to cancel
   * @param market The market of the order
   * @param options Additional options
   * @returns The cancellation response
   */
  async cancelOrder(
    orderId: string,
    market: string,
    options: {
      subaccountNumber?: number;
      timeInForce?: OrderTimeInForce;
      goodTilTimeInSeconds?: number;
    } = {}
  ): Promise<any> {
    const {
      subaccountNumber = DEFAULT_SUBACCOUNT,
      timeInForce = OrderTimeInForce.GTT,
      goodTilTimeInSeconds = 120,
    } = options;

    logger.step(`Canceling order ${orderId} for market ${market}`);

    return this.orderManager.cancelOrder(
      subaccountNumber,
      orderId,
      market,
      timeInForce,
      goodTilTimeInSeconds
    );
  }

  /**
   * Get all orders for a subaccount with advanced filtering options
   * @param options Filtering and pagination options
   * @returns Array of orders
   */
  async getOrders(
    options: {
      subaccountNumber?: number;
      market?: string;
      status?: string | string[];
      limit?: number;
      side?: 'BUY' | 'SELL';
      type?: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
      goodTilBlockBeforeOrAt?: number;
      goodTilBlockTimeBeforeOrAt?: string;
      returnLatestOrders?: boolean;
    } = {}
  ): Promise<any[]> {
    const { 
      subaccountNumber = DEFAULT_SUBACCOUNT, 
      market, 
      status,
      ...otherOptions 
    } = options;

    logger.step(`Getting orders for subaccount ${subaccountNumber}`);

    return this.orderManager.getOrders(subaccountNumber, market, status, otherOptions);
  }

  /**
   * Get open orders for a subaccount
   * @param options Additional filtering options
   * @returns Array of open orders
   */
  async getOpenOrders(
    options: {
      subaccountNumber?: number;
      market?: string;
      limit?: number;
      side?: 'BUY' | 'SELL';
      type?: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
      returnLatestOrders?: boolean;
    } = {}
  ): Promise<any[]> {
    const { 
      subaccountNumber = DEFAULT_SUBACCOUNT, 
      market,
      ...otherOptions 
    } = options;

    logger.step(`Getting open orders for subaccount ${subaccountNumber}`);

    return this.orderManager.getOrders(
      subaccountNumber, 
      market, 
      "OPEN",
      otherOptions
    );
  }

  /**
   * Get orders by status
   * @param status The order status or statuses to filter by
   * @param options Additional filtering options
   * @returns Array of orders with the specified status
   */
  async getOrdersByStatus(
    status: string | string[],
    options: {
      subaccountNumber?: number;
      market?: string;
      limit?: number;
      side?: 'BUY' | 'SELL';
      type?: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
      returnLatestOrders?: boolean;
    } = {}
  ): Promise<any[]> {
    const { 
      subaccountNumber = DEFAULT_SUBACCOUNT, 
      market,
      ...otherOptions 
    } = options;

    const statusLabel = Array.isArray(status) ? status.join('/') : status;
    logger.step(`Getting ${statusLabel} orders for subaccount ${subaccountNumber}`);

    return this.orderManager.getOrders(
      subaccountNumber, 
      market, 
      status,
      otherOptions
    );
  }

  /**
   * Get orders by side (BUY or SELL)
   * @param side The order side (BUY or SELL)
   * @param options Additional filtering options
   * @returns Array of orders with the specified side
   */
  async getOrdersBySide(
    side: 'BUY' | 'SELL',
    options: {
      subaccountNumber?: number;
      market?: string;
      status?: string | string[];
      limit?: number;
      type?: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
      returnLatestOrders?: boolean;
    } = {}
  ): Promise<any[]> {
    const { 
      subaccountNumber = DEFAULT_SUBACCOUNT, 
      market,
      status,
      ...otherOptions 
    } = options;

    logger.step(`Getting ${side} orders for subaccount ${subaccountNumber}`);

    return this.orderManager.getOrders(
      subaccountNumber, 
      market, 
      status,
      {
        side,
        ...otherOptions
      }
    );
  }

  /**
   * Get orders by type (LIMIT, MARKET, etc)
   * @param type The order type
   * @param options Additional filtering options
   * @returns Array of orders with the specified type
   */
  async getOrdersByType(
    type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET',
    options: {
      subaccountNumber?: number;
      market?: string;
      status?: string | string[];
      limit?: number;
      side?: 'BUY' | 'SELL';
      returnLatestOrders?: boolean;
    } = {}
  ): Promise<any[]> {
    const { 
      subaccountNumber = DEFAULT_SUBACCOUNT, 
      market,
      status,
      ...otherOptions 
    } = options;

    logger.step(`Getting ${type} orders for subaccount ${subaccountNumber}`);

    return this.orderManager.getOrders(
      subaccountNumber, 
      market, 
      status,
      {
        type,
        ...otherOptions
      }
    );
  }

  /**
   * Get latest orders (most recent first)
   * @param limit Maximum number of orders to return
   * @param options Additional filtering options
   * @returns Array of orders sorted by recency
   */
  async getLatestOrders(
    limit: number = 10,
    options: {
      subaccountNumber?: number;
      market?: string;
      status?: string | string[];
      side?: 'BUY' | 'SELL';
      type?: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
    } = {}
  ): Promise<any[]> {
    const { 
      subaccountNumber = DEFAULT_SUBACCOUNT, 
      market,
      status,
      ...otherOptions 
    } = options;

    logger.step(`Getting latest ${limit} orders for subaccount ${subaccountNumber}`);

    return this.orderManager.getOrders(
      subaccountNumber, 
      market, 
      status,
      {
        limit,
        returnLatestOrders: true,
        ...otherOptions
      }
    );
  }

  /**
   * Cancel all open orders for a specific market
   * @param market The market to cancel orders for (or undefined for all markets)
   * @param options Additional options
   * @returns Array of cancellation responses
   */
  async cancelAllOrders(
    market?: string,
    options: {
      subaccountNumber?: number;
      timeInForce?: OrderTimeInForce;
      goodTilTimeInSeconds?: number;
      side?: 'BUY' | 'SELL';
      type?: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
    } = {}
  ): Promise<any[]> {
    const {
      subaccountNumber = DEFAULT_SUBACCOUNT,
      timeInForce = OrderTimeInForce.GTT,
      goodTilTimeInSeconds = 120,
      side,
      type
    } = options;

    const marketLabel = market ? market : "all markets";
    const sideLabel = side ? ` ${side}` : '';
    const typeLabel = type ? ` ${type}` : '';
    
    logger.step(`Canceling all${sideLabel}${typeLabel} orders for ${marketLabel}`);

    try {
      // Get open orders with additional filters
      const orderOptions = {
        side,
        type,
        limit: 100 // Reasonable limit for canceling orders
      };
      
      const openOrders = await this.orderManager.getOrders(
        subaccountNumber, 
        market, 
        "OPEN",
        orderOptions
      );

      logger.info(`Found ${openOrders.length} open orders to cancel`);

      // If no orders, log and return
      if (openOrders.length === 0) {
        logger.info("No open orders found to cancel");
        return [];
      }

      // Cancel each order - use the order's ticker field as the market
      const cancellationPromises = openOrders.map((order: any) => {
        const orderId = order.clientId?.toString();
        const orderMarket = order.ticker; // Use the ticker field as the market
        
        if (!orderId || !orderMarket) {
          logger.warning("Order missing required fields", { 
            hasClientId: !!order.clientId, 
            hasTicker: !!order.ticker,
            orderFields: Object.keys(order)
          });
          return Promise.resolve({ error: "Invalid order data", orderId, skipped: true });
        }
        
        return this.orderManager
          .cancelOrder(
            subaccountNumber,
            orderId,
            orderMarket,
            timeInForce,
            goodTilTimeInSeconds
          )
          .catch((error) => {
            logger.warning(
              `Failed to cancel order ${orderId} for ${orderMarket}`,
              error
            );
            return { error, orderId };
          });
      });

      const results = await Promise.all(cancellationPromises);
      logger.success(`Canceled ${results.length} orders`);
      return results;
    } catch (error) {
      logger.error(`Failed to cancel all orders`, error as Error);
      throw error;
    }
  }

  /**
   * Wait for order to reach a specific status
   * @param orderId The order ID to check (client ID)
   * @param targetStatus The status to wait for
   * @param options Additional options
   * @returns The final order object or null if not found
   */
  async waitForOrderStatus(
    orderId: string | number,
    targetStatus: string,
    options: {
      subaccountNumber?: number;
      market?: string;
      timeoutMs?: number;
      pollIntervalMs?: number;
    } = {}
  ): Promise<any | null> {
    const {
      subaccountNumber = DEFAULT_SUBACCOUNT,
      market,
      timeoutMs = 30000,
      pollIntervalMs = 2000,
    } = options;

    // Add initial delay to allow time for order to be indexed
    logger.info(`Adding initial delay of 2.5s to allow order ${orderId} to be indexed...`);
    await waitForTimeout(2500);
    
    // Validate target status
    const validStatuses = ["OPEN", "FILLED", "CANCELED", "BEST_EFFORT_CANCELED", "UNTRIGGERED", "BEST_EFFORT_OPENED", "PENDING"];
    if (!validStatuses.includes(targetStatus)) {
      logger.warning(`Invalid target status: ${targetStatus}. Valid statuses are: ${validStatuses.join(", ")}`);
    }

    logger.step(
      `Waiting for order with ID ${orderId} to reach status: ${targetStatus}`
    );

    const startTime = Date.now();
    const orderIdStr = String(orderId); // Ensure orderId is a string for consistent comparison
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        // First approach: Get all orders without filtering by status to catch orders in any state
        // This matches how cancelAllOrders finds orders
        logger.info(`Searching for order ${orderIdStr} in all available orders`);
        const allOrders = await this.orderManager.getOrders(
          subaccountNumber, 
          market, 
          undefined, // No status filter
          { limit: 100, returnLatestOrders: true }
        );
        
        logger.info(`Retrieved ${allOrders.length} orders from API`);
        
        if (allOrders.length > 0) {
          
          // Check all possible ID fields that might contain our order ID
          const matchingOrder = allOrders.find((o: any) => {
            // Convert all possible ID fields to strings for comparison
            const possibleIds = [
              o.id?.toString(),
              o.clientId?.toString(),
              o.cid?.toString(),
              o.orderId?.toString()
            ].filter(Boolean); // Remove nulls/undefined
            
            return possibleIds.includes(orderIdStr);
          });
          
          if (matchingOrder) {
            logger.info(`Found order ${orderIdStr} with status: ${matchingOrder.status}`);
            
            // If it's in the target status, we're done
            if (matchingOrder.status === targetStatus) {
              logger.success(`Order ${orderIdStr} has reached target status: ${targetStatus}`);
              return matchingOrder;
            }
            
            // If it's in a terminal state that's not what we want, return it anyway
            if (["FILLED", "CANCELED", "BEST_EFFORT_CANCELED"].includes(matchingOrder.status) &&
                matchingOrder.status !== targetStatus) {
              logger.warning(`Order ${orderIdStr} reached terminal status ${matchingOrder.status} instead of ${targetStatus}`);
              return matchingOrder;
            }
            
            logger.info(`Order ${orderIdStr} is in status ${matchingOrder.status}, waiting for ${targetStatus}`);
          }
        }
        
        // Second approach: Try status-specific searches
        // Try the target status first
        logger.info(`Specifically searching for order ${orderIdStr} with status=${targetStatus}`);
        const targetStatusOrders = await this.orderManager.getOrders(
          subaccountNumber, 
          market, 
          targetStatus,
          { limit: 100 }
        );
        
        // Check for a match with the target status
        const targetMatch = targetStatusOrders.find((o: any) => {
          const possibleIds = [
            o.id?.toString(),
            o.clientId?.toString(),
            o.cid?.toString(),
            o.orderId?.toString()
          ].filter(Boolean);
          
          return possibleIds.includes(orderIdStr);
        });
        
        if (targetMatch) {
          logger.success(`Found order ${orderIdStr} with target status ${targetStatus}`);
          return targetMatch;
        }
        
        // If looking for a specific status and we didn't find it, try checking other relevant statuses
        if (targetStatus === "OPEN") {
          // Check PENDING status which might be a transition state
          const pendingOrders = await this.orderManager.getOrders(
            subaccountNumber, 
            market, 
            "PENDING",
            { limit: 100 }
          );
          
          const pendingMatch = pendingOrders.find((o: any) => {
            const possibleIds = [
              o.id?.toString(),
              o.clientId?.toString(),
              o.cid?.toString(),
              o.orderId?.toString()
            ].filter(Boolean);
            
            return possibleIds.includes(orderIdStr);
          });
          
          if (pendingMatch) {
            logger.info(`Order ${orderIdStr} is currently PENDING, waiting for it to become OPEN`);
          }
        }
        
        // If we're looking for CANCELED, also check OPEN orders to see if they're still active
        if (targetStatus === "CANCELED") {
          const openOrders = await this.orderManager.getOrders(
            subaccountNumber, 
            market, 
            "OPEN",
            { limit: 100 }
          );
          
          const stillOpen = openOrders.find((o: any) => {
            const possibleIds = [
              o.id?.toString(),
              o.clientId?.toString(),
              o.cid?.toString(),
              o.orderId?.toString()
            ].filter(Boolean);
            
            return possibleIds.includes(orderIdStr);
          });
          
          if (stillOpen) {
            logger.info(`Order ${orderIdStr} is still OPEN, waiting for CANCELED status`);
          }
        }
      } catch (error) {
        logger.warning(`Error checking order status: ${(error as Error).message}`);
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    // One final check before giving up
    try {
      logger.warning(`Timeout reached. Final attempt to find order ${orderIdStr}`);
      
      // Get all orders without status filtering, with a higher limit
      const finalOrders = await this.orderManager.getOrders(
        subaccountNumber, 
        market, 
        undefined,
        { limit: 200, returnLatestOrders: true }
      );
      
      const finalMatch = finalOrders.find((o: any) => {
        const possibleIds = [
          o.id?.toString(),
          o.clientId?.toString(),
          o.cid?.toString(),
          o.orderId?.toString()
        ].filter(Boolean);
        
        return possibleIds.includes(orderIdStr);
      });
      
      if (finalMatch) {
        logger.warning(`Found order ${orderIdStr} with status ${finalMatch.status} in final check (wanted ${targetStatus})`);
        return finalMatch;
      }
      
      // If not found at all, do a specific check for the target status
      const finalStatusOrders = await this.orderManager.getOrders(
        subaccountNumber, 
        market, 
        targetStatus,
        { limit: 200 }
      );
      
      const finalStatusMatch = finalStatusOrders.find((o: any) => {
        const possibleIds = [
          o.id?.toString(),
          o.clientId?.toString(),
          o.cid?.toString(),
          o.orderId?.toString()
        ].filter(Boolean);
        
        return possibleIds.includes(orderIdStr);
      });
      
      if (finalStatusMatch) {
        logger.success(`Found order ${orderIdStr} with target status ${targetStatus} in final status check`);
        return finalStatusMatch;
      }
    } catch (error) {
      logger.error(`Error in final order status check: ${(error as Error).message}`);
    }
    
    logger.warning(`Order ${orderIdStr} not found with status=${targetStatus} after timeout`);
    return null;
  }

  /**
   * Get open positions for a subaccount
   * @param options Additional filtering options
   * @returns Array of positions
   */
  async getPositions(
    options: {
      subaccountNumber?: number;
      market?: string;
    } = {}
  ): Promise<any[]> {
    const { 
      subaccountNumber = DEFAULT_SUBACCOUNT,
      market
    } = options;

    logger.step(`Getting positions for subaccount ${subaccountNumber}${market ? ` in market ${market}` : ''}`);

    try {
      // Get the client's indexer and wallet info
      const indexerClient = this.orderManager['client'].indexerClient;
      const address = this.orderManager['wallet'].address;

      // Build API URL for positions
      let url = `${indexerClient.config.restEndpoint}/v4/perpetualPositions?address=${address}&subaccountNumber=${subaccountNumber}`;
      
      // Log the request URL
      logger.info(`Fetching positions from: ${url}`);
      
      // Make the API request
      const response = await fetch(url);
      
      if (!response.ok) {
        logger.warning(`API returned status ${response.status}: ${response.statusText}`);
        return [];
      }
      
      // Parse the response
      const data = await response.json();
      
      // Handle the positions array from the response
      let positions = data?.positions || [];
      
      // Filter by market if specified
      if (market && positions.length > 0) {
        positions = positions.filter((position: any) => position.market === market);
      }
      
      // Log the result
      logger.success(`Retrieved ${positions.length} positions${market ? ` for ${market}` : ''}`);
      
      // Log details about positions
      if (positions.length > 0) {
        positions.forEach((position: any) => {
          logger.info(`Position: ${position.market} ${position.side} ${position.size} @ ${position.entryPrice}`);
        });
      } else {
        logger.info("No positions found");
      }
      
      return positions;
    } catch (error) {
      logger.error(`Failed to fetch positions`, error as Error);
      throw error;
    }
  }
}

/**
 * Helper function to close any open positions for a market
 * @param dydxTradeHelper The trade helper instance
 * @param market The market to close positions for (e.g., "BTC-USD")
 * @param logPrefix Optional prefix for log messages
 */
export async function closePositions(
  dydxTradeHelper: DydxTradeHelper, 
  market: string, 
  logPrefix: string = ""
): Promise<void> {
  try {
    // Cancel any open orders first
    await dydxTradeHelper.cancelAllOrders();
    
    // Get positions for the market
    logger.info(`${logPrefix}Checking for open positions in ${market}`);
    const positions = await dydxTradeHelper.getPositions({ market });
    
    if (positions && positions.length > 0) {
      logger.info(`${logPrefix}Found ${positions.length} positions to close`);
      
      for (const position of positions) {
        if (position.size === "0" || parseFloat(position.size) === 0) {
          logger.info(`${logPrefix}Position for ${position.market} has zero size, skipping`);
          continue;
        }
        
        logger.info(`${logPrefix}Closing position for ${position.market} with size ${position.size}`);
        
        // Determine the closing side (opposite of position side)
        const side = position.side === 'LONG' ? OrderSide.SELL : OrderSide.BUY;
        
        // Place a market order to close the position
        await dydxTradeHelper.placeMarketOrder(
          position.market,
          side,
          Math.abs(parseFloat(position.size)),
          { reduceOnly: true }
        );
        
        logger.success(`${logPrefix}Position for ${position.market} closed successfully`);
      }
    } else {
      logger.info(`${logPrefix}No open positions found for ${market}`);
    }
  } catch (error) {
    logger.warning(`${logPrefix}Failed to close positions`, { error: (error as Error).message });
    // Don't throw the error, as this is cleanup logic
  }
}


/**
 * Create a DydxTradeHelper instance
 * @param orderManager The order manager instance
 * @returns A new DydxTradeHelper instance
 */
export function createDydxTradeHelper(orderManager: OrderManager): DydxTradeHelper {
  return new DydxTradeHelper(orderManager);
}

/**
 * Utility function to wait for a specified time in milliseconds
 * @param ms Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
async function waitForTimeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
