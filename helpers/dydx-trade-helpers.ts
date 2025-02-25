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
    orderId: string,
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
      pollIntervalMs = 1000,
    } = options;

    // Validate target status
    const validStatuses = ["OPEN", "FILLED", "CANCELED", "BEST_EFFORT_CANCELED", "UNTRIGGERED", "BEST_EFFORT_OPENED"];
    if (!validStatuses.includes(targetStatus)) {
      logger.warning(`Invalid target status: ${targetStatus}. Valid statuses are: ${validStatuses.join(", ")}`);
    }

    logger.step(
      `Waiting for order with clientId ${orderId} to reach status: ${targetStatus}`
    );

    const startTime = Date.now();
    const orderIdStr = String(orderId); // Ensure orderId is a string for consistent comparison
    
    while (Date.now() - startTime < timeoutMs) {
      // Get all orders, use comma-separated format for statuses
      // When looking for CANCELED orders, also look at OPEN ones to see if they changed
      const statusParam = targetStatus === "CANCELED" ? "OPEN,CANCELED" : undefined;
      
      const orders = await this.orderManager.getOrders(
        subaccountNumber, 
        market, 
        statusParam, 
        { returnLatestOrders: true, limit: 100 }
      );
      
      // More detailed logging
      logger.info(`Looking for order clientId=${orderIdStr} among ${orders.length} orders`);
      
      if (orders.length > 0) {
        logger.info(`First few orders:`, { 
          orderSamples: orders.slice(0, 5).map((o: any) => ({
            clientId: o.clientId?.toString(),
            id: o.id?.toString(),
            status: o.status,
            ticker: o.ticker
          }))
        });
      }
      
      // FIRST try strict matching on clientId field
      const exactClientIdMatch = orders.find((o: any) => {
        return o.clientId?.toString() === orderIdStr;
      });
      
      if (exactClientIdMatch) {
        logger.info(`Found exact clientId match: ${orderIdStr}, status: ${exactClientIdMatch.status}`);
        
        if (exactClientIdMatch.status === targetStatus) {
          logger.success(`Order ${orderIdStr} reached status: ${targetStatus}`);
          return exactClientIdMatch;
        }
        
        // Check for terminal states
        if (
          ["FILLED", "CANCELED", "BEST_EFFORT_CANCELED"].includes(exactClientIdMatch.status) &&
          exactClientIdMatch.status !== targetStatus
        ) {
          logger.warning(
            `Order ${orderIdStr} reached terminal status ${exactClientIdMatch.status}, but we were waiting for ${targetStatus}`
          );
          return exactClientIdMatch;
        }
        
        // Order found but not in target status yet, continue polling
        logger.info(`Order ${orderIdStr} found but still in status: ${exactClientIdMatch.status}`);
      } else {
        // Fall back to checking id field
        const idMatch = orders.find((o: any) => o.id?.toString() === orderIdStr);
        if (idMatch) {
          logger.info(`Found match by UUID id: ${orderIdStr}, status: ${idMatch.status}`);
          
          if (idMatch.status === targetStatus) {
            logger.success(`Order ${orderIdStr} (matched by UUID) reached status: ${targetStatus}`);
            return idMatch;
          }
          
          // Check for terminal states
          if (
            ["FILLED", "CANCELED", "BEST_EFFORT_CANCELED"].includes(idMatch.status) &&
            idMatch.status !== targetStatus
          ) {
            logger.warning(
              `Order ${orderIdStr} (matched by UUID) reached terminal status ${idMatch.status}, but we were waiting for ${targetStatus}`
            );
            return idMatch;
          }
        } else {
          logger.warning(`Order ${orderIdStr} not found in current orders (checked both clientId and id fields)`);
          
          // If we're looking for a canceled order and couldn't find it by ID, check 
          // if there are any recently canceled orders that might match
          if (targetStatus === "CANCELED") {
            const recentlyCanceledOrders = orders.filter(o => o.status === "CANCELED");
            if (recentlyCanceledOrders.length > 0) {
              logger.info(`Found ${recentlyCanceledOrders.length} recently canceled orders, but none match clientId ${orderIdStr}`);
            }
          }
        }
      }

      // Sleep before polling again
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    logger.warning(
      `Timeout waiting for order ${orderIdStr} to reach status: ${targetStatus}`
    );
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