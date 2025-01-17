export const WithdrawSelectors = {
  walletAddressInput: 'input[placeholder="Address"]',
  arbitrumOption: 'div[data-value="chains|42161"]',
  destinationLabel: 'label:has-text("Destination")',
  withdrawButton: 'button:has-text("Withdraw")',
  withdrawButtonComplete:
    'div[role="dialog"] button:has-text("Withdraw")',
  amountInput: 'input[placeholder="0.00"]',
  chainDestinationDropdown:
    'button[aria-haspopup="dialog"][data-state="closed"]:has(label:has-text("Destination"))',
  assetDropdown: 'button[aria-haspopup="listbox"]:has-text("Asset")',
};
