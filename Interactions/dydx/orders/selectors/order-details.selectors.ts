/**
 * Selectors for the Order Details UI elements and confirmation modals
 */
export const OrderDetailsSelectors = {
  // Order details modal
  orderDetailsModal: '[data-testid="order-details-modal"]',
  
  // Order fields in the details view
  orderDetailId: '[data-testid="order-detail-id"]',
  orderDetailMarket: '[data-testid="order-detail-market"]',
  orderDetailSide: '[data-testid="order-detail-side"]',
  orderDetailType: '[data-testid="order-detail-type"]',
  orderDetailSize: '[data-testid="order-detail-size"]',
  orderDetailPrice: '[data-testid="order-detail-price"]',
  orderDetailStatus: '[data-testid="order-detail-status"]',
  orderDetailTimeInForce: '[data-testid="order-detail-time-in-force"]',
  orderDetailGoodTilTime: '[data-testid="order-detail-good-til-time"]',
  
  // Confirmation actions
  confirmCancelButton: '[data-testid="confirm-cancel-button"]',
  confirmCancelAllButton: '[data-testid="confirm-cancel-all-button"]',
  cancelConfirmationButton: '[data-testid="cancel-confirmation-button"]',
  
  // Edit order
  editOrderButton: '[data-testid="edit-order-button"]',
}; 