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
      `Waiting for order ${orderId} to reach status: ${targetStatus}`
    );

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      // Get all orders (don't filter by status to make sure we see all possible order states)
      // Use returnLatestOrders to prioritize recent orders
      const orders = await this.orderManager.getOrders(
        subaccountNumber, 
        market, 
        undefined, 
        { returnLatestOrders: true, limit: 50 }
      );
      
      // Find our order by clientId
      const order = orders.find((o: any) => o.clientId?.toString() === orderId);

      if (order) {
        logger.info(`Order ${orderId} current status: ${order.status}`);
        
        if (order.status === targetStatus) {
          logger.success(`Order ${orderId} reached status: ${targetStatus}`);
          return order;
        }
        
        // Check for terminal states
        if (
          ["FILLED", "CANCELED", "BEST_EFFORT_CANCELED"].includes(order.status) &&
          order.status !== targetStatus
        ) {
          logger.warning(
            `Order ${orderId} reached terminal status ${order.status}, but we were waiting for ${targetStatus}`
          );
          return order;
        }
      } else {
        logger.warning(`Order ${orderId} not found in current orders`);
      }

      // Sleep before polling again
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    logger.warning(
      `Timeout waiting for order ${orderId} to reach status: ${targetStatus}`
    );
    return null;
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