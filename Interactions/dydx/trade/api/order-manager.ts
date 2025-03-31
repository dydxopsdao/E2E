import {
  CompositeClient,
  OrderSide,
  OrderTimeInForce,
  OrderType,
  OrderFlags,
  SubaccountClient,
  LocalWallet,
  OrderExecution,
  IndexerClient,
} from "@dydxprotocol/v4-client-js";
import { logger } from "../../../../utils/logger/logging-utils";

export interface OrderParams {
  market: string;
  side: OrderSide;
  type: OrderType;
  size: number;
  price?: string;
  timeInForce?: OrderTimeInForce;
  reduceOnly?: boolean;
  postOnly?: boolean;
  clientId?: number;
  execution?: OrderExecution;
  goodTilTimeInSeconds?: number;
  goodTilBlock?: number;
}

// Create interface based on actual API response
export interface OrderResponseObject {
  id: string;
  status: string;
  market: string; // Added market field to store for cancellation
  [key: string]: any; // Add other fields as needed
}

export class OrderManager {
  private client: CompositeClient;
  private wallet: LocalWallet;

  constructor(client: CompositeClient, wallet: LocalWallet) {
    this.client = client;
    this.wallet = wallet;
  }

  async placeOrder(
    subaccountNumber: number,
    params: OrderParams
  ): Promise<OrderResponseObject> {
    const {
      market,
      side,
      type,
      size,
      price = "0",
      timeInForce = OrderTimeInForce.IOC,
      reduceOnly = false,
      postOnly = false,
      clientId = Math.floor(Math.random() * 1000000), // Generate random client ID if not provided
      execution = OrderExecution.DEFAULT,
      // For GTT orders, default to 3600 seconds if not provided.
      goodTilTimeInSeconds = timeInForce === OrderTimeInForce.GTT ? 3600 : 0,
      goodTilBlock = 9999999999999
    } = params;

    logger.step(`Placing ${side} ${type} order for ${size} ${market}`);
    logger.info(`market: ${market}`);
    logger.info(`side: ${side}`);
    logger.info(`type: ${type}`);
    logger.info(`size: ${size}`);
    logger.info(`price: ${price}`);
    logger.info(`timeInForce: ${timeInForce}`);
    logger.info(`reduceOnly: ${reduceOnly}`);
    logger.info(`postOnly: ${postOnly}`);
    logger.info(`clientId: ${clientId}`);
    logger.info(`execution: ${execution}`);
    logger.info(`goodTilTimeInSeconds: ${goodTilTimeInSeconds}`);
    logger.info(`goodTilBlock: ${goodTilBlock}`);
    try {
      // Create subaccount client
      const subaccount = new SubaccountClient(this.wallet, subaccountNumber);

      // Place the order
      const response = await this.client.placeOrder(
        subaccount,
        market,
        type,
        side,
        Number(price), // Convert to number
        size,
        clientId,
        timeInForce,
        goodTilTimeInSeconds,
        execution,
        postOnly,
        reduceOnly,
        goodTilBlock
      );

      logger.success(`Order placed successfully`, {
        hash: response.hash,
        orderId: clientId,
      });
      logger.success(`response: ${JSON.stringify(response, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )}`);


      // Wait for order to be indexed
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Return order response with ID and market
      return {
        id: clientId.toString(),
        status: "PENDING",
        market,
        hash: response.hash,
      };
    } catch (error) {
      logger.error(`Failed to place order for ${market}`, error as Error);
      logger.info(`error: ${error}`);
      throw error;
    }
  }

  /**
   * Get orders for a subaccount with various filter options
   * @param subaccountNumber The subaccount number
   * @param options Optional filter parameters
   * @returns Array of orders
   */
  async getOrders(
    subaccountNumber: number, 
    market?: string,
    status?: string | string[],
    options: {
      limit?: number;
      side?: 'BUY' | 'SELL';
      type?: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET' | 'TRAILING_STOP' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
      goodTilBlockBeforeOrAt?: number;
      goodTilBlockTimeBeforeOrAt?: string;
      returnLatestOrders?: boolean;
    } = {}
  ) {
    try {
      logger.step(`Fetching orders for subaccount ${subaccountNumber}${market ? ` in market ${market}` : ''}`);

      // Get orders for the subaccount from the indexer
      const indexerClient = this.client.indexerClient as IndexerClient;
      const address = this.wallet.address;

      // Build base URL with required parameters
      let url = `${indexerClient.config.restEndpoint}/v4/orders/?address=${address}&subaccountNumber=${subaccountNumber}`;
      
      // Add market/ticker filter
      if (market) {
        url += `&ticker=${encodeURIComponent(market)}`;
      }
      
      // Add status filter - handle both string and array formats
      if (status) {
        const validStatuses = ["OPEN", "FILLED", "CANCELED", "BEST_EFFORT_CANCELED", "UNTRIGGERED", "BEST_EFFORT_OPENED", "PENDING"];
        
        if (Array.isArray(status)) {
          // Filter out any invalid statuses
          const validStatusValues = status.filter(s => validStatuses.includes(s));
          if (validStatusValues.length > 0) {
            // Join statuses with comma for API format
            url += `&status=${encodeURIComponent(validStatusValues.join(','))}`;
          }
        } else if (status.includes(',')) {
          // Status is already comma-separated string
          url += `&status=${encodeURIComponent(status)}`;
        } else if (validStatuses.includes(status)) {
          // Single status
          url += `&status=${encodeURIComponent(status)}`;
        } else {
          logger.warning(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
        }
      }
      
      // Add optional parameters
      if (options.limit) {
        url += `&limit=${options.limit}`;
      }
      
      if (options.side) {
        url += `&side=${options.side}`;
      }
      
      if (options.type) {
        url += `&type=${options.type}`;
      }
      
      if (options.goodTilBlockBeforeOrAt !== undefined) {
        url += `&goodTilBlockBeforeOrAt=${options.goodTilBlockBeforeOrAt}`;
      }
      
      if (options.goodTilBlockTimeBeforeOrAt) {
        url += `&goodTilBlockTimeBeforeOrAt=${encodeURIComponent(options.goodTilBlockTimeBeforeOrAt)}`;
      }
      
      if (options.returnLatestOrders !== undefined) {
        url += `&returnLatestOrders=${options.returnLatestOrders}`;
      }
      
      // Log the full URL to help with debugging
      logger.info(`Fetching orders from: ${url}`);
      
      // Make the API request
      const response = await fetch(url);
      
      // Check for unsuccessful responses
      if (!response.ok) {
        logger.warning(`API returned status ${response.status}: ${response.statusText}`);
        return [];
      }
      
      // Get the response data 
      const data = await response.json();

      // Based on the example, the API returns the array of orders directly
      const orders = Array.isArray(data) ? data : [];
      
      // If we got orders, let's log some details about the first one to verify structure
      if (orders.length > 0) {
        logger.debug("First order structure:", {
          id: orders[0].id,
          clientId: orders[0].clientId,
          status: orders[0].status,
          ticker: orders[0].ticker
        });
      }
      
      logger.success(`Retrieved ${orders.length} orders`);
      
      // If no orders were found but we expect them, log more details
      if (orders.length === 0) {
        logger.info("No orders found. If you expect orders, check if:");
        logger.info("- The correct wallet address is being used");
        logger.info("- The correct subaccount number is specified");
        logger.info("- Orders are in the status you're filtering for");
        logger.info("- The indexer has processed recent transactions");
      }
      
      return orders;
    } catch (error) {
      logger.error(`Failed to fetch orders`, error as Error);
      throw error;
    }
  }

  /**
   * Cancel an order.
   *
   * For orders placed with timeInForce = GTT, we now ensure that the cancellation's
   * goodTilTimeInSeconds is not less than the original order's expiration (default 3600s).
   * For non‑GTT orders, a safe goodTillBlock is computed based on the current block height.
   *
   * @param subaccountNumber The subaccount number.
   * @param orderId The order's client id as a string.
   * @param market The market of the order.
   * @param timeInForce (Optional) The timeInForce of the order. Defaults to GTT.
   * @param goodTilTimeInSeconds (Optional) Cancellation timeout for GTT orders.
   */
  async cancelOrder(
    subaccountNumber: number,
    orderId: string,
    market: string,
    timeInForce: OrderTimeInForce = OrderTimeInForce.GTT,
    goodTilTimeInSeconds: number = 120
  ) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        logger.step(
          `Canceling order ${orderId} for market ${market} (attempt ${
            attempts + 1
          }/${maxAttempts})`
        );

        // Create subaccount client
        const subaccount = new SubaccountClient(this.wallet, subaccountNumber);

        // Parse the orderId to a clientId (number)
        const clientId = parseInt(orderId, 10);

        // If the order was placed as a GTT order, use LONG_TERM cancellation parameters.
        // Ensure that the cancellation expiration is not less than the order's original expiration.
        if (timeInForce === OrderTimeInForce.GTT) {
          const orderFlags = OrderFlags.LONG_TERM;
          const goodTillBlock = 0;
          // For orders placed with GTT, we defaulted to 3600 seconds.
          // If the provided cancellation timeout is lower, override it.
          const effectiveGoodTilTime =
            goodTilTimeInSeconds < 3600 ? 3600 : goodTilTimeInSeconds;
          logger.info(
            `Cancelling GTT order using LONG_TERM parameters with effective goodTilTime: ${effectiveGoodTilTime}.`
          );
          const response = await this.client.cancelOrder(
            subaccount,
            clientId,
            orderFlags,
            market,
            goodTillBlock,
            effectiveGoodTilTime
          );
          logger.success(`GTT Order canceled successfully`, {
            orderId,
            market,
            hash: response.hash,
          });
          return response;
        }

        // Otherwise, for non-GTT orders, compute a safe goodTillBlock using the current block height
        logger.info("Fetching current block height from the indexer...");
        const indexerClient = this.client.indexerClient as IndexerClient;
        const heightResponse = await fetch(
          `${indexerClient.config.restEndpoint}/v4/height`
        );
        let heightData = await heightResponse.json();

        if (!heightData?.height || typeof heightData.height !== "number") {
          logger.warning(
            "Failed to get current block height, using fallback value"
          );
          heightData = { height: 38248110 }; // Fallback value if needed
        }

        const currentBlockHeight = heightData.height;
        const maxAllowedBuffer = 20; // ShortBlockWindow constraint
        const safeBuffer = Math.min(5 + attempts * 5, maxAllowedBuffer - 2);
        const goodTillBlock = currentBlockHeight + safeBuffer;
        const orderFlags = 0; // SHORT_TERM cancellation flag
        const cancellationGoodTilTimeInSeconds = 0; // Not used for short-term orders

        logger.info(`Current block height: ${currentBlockHeight}`);
        logger.info(
          `Using goodTillBlock: ${goodTillBlock} (current + buffer ${safeBuffer})`
        );
        logger.info(`ShortBlockWindow constraint: ${maxAllowedBuffer} blocks`);

        const response = await this.client.cancelOrder(
          subaccount,
          clientId,
          orderFlags,
          market,
          goodTillBlock,
          cancellationGoodTilTimeInSeconds
        );

        logger.success(`Order canceled successfully`, {
          orderId,
          market,
          hash: response.hash,
          goodTillBlock,
          currentBlockHeight,
          attempt: attempts + 1,
        });

        return response;
      } catch (error) {
        const errorMessage = String(error);

        // If error indicates that the goodTillBlockTime is less than expected, retry with a higher buffer
        if (errorMessage.includes("less than") && attempts < maxAttempts - 1) {
          const match = errorMessage.match(/current blockHeight (\d+)/);
          const actualBlockHeight = match ? parseInt(match[1], 10) : null;
          logger.warning(
            `Block height advanced too quickly. Retrying with higher buffer.`,
            { attempt: attempts + 1, actualBlockHeight }
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
          continue;
        }

        logger.error(
          `Failed to cancel order ${orderId} for market ${market}`,
          error as Error
        );
        throw error;
      }
    }
  }
}
