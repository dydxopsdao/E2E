/**
 * Selectors for the Orders table UI elements
 */
export const OrdersTableSelectors = {
  ordersTab: "[id$='trigger-Orders']",
  // Main orders table
  ordersTable: ".sc-1drcdyj-0.feSemO.sc-fi7txw-0.ejhAIk",

  // Table rows
  orderRow: ".sc-1drcdyj-3.ddEVDe",

  // Order actions
  cancelOrderButton: '[data-testid="cancel-order-button"]',
  cancelAllButton: '[data-testid="cancel-all-button"]',

  // Filters
  filterOpenOrders: '[data-testid="filter-open-orders"]',
  filterFilledOrders: '[data-testid="filter-filled-orders"]',
  filterCanceledOrders: '[data-testid="filter-canceled-orders"]',

  // Empty state
  emptyOrdersState: '[data-testid="empty-orders-state"]',

  // Order details elements
  orderType: '[data-testid="order-type"]',
  orderSide: '[data-testid="order-side"]',
  orderAmount: '[data-testid="order-amount"]',
  orderPrice: '[data-testid="order-price"]',
  orderStatus: '[data-testid="order-status"]',
  orderMarket: '[data-testid="order-market"]',

  // Pagination
  paginationNext: '[data-testid="pagination-next"]',
  paginationPrev: '[data-testid="pagination-prev"]',
}; 