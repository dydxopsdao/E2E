export const InstantDepositsSelectors = {
  instantDepositsCloseButton: '[aria-label="Close"]',
  depositButton: 'button:has-text("Deposit")',
  continueButton: 'button:has-text("Continue")',
  confirmOrderButton: 'button:has-text("Confirm Order")',
  amountInput: 'input[placeholder="$0.00"][type="text"]',
  loadingStates: [
    "Estimating gas...",
    "Preparing your quote..."
  ],
    // Success state selectors
  fillStatusText: "text=Successful",
  newDepositButton: 'button:has-text("New Deposit")',
  fillStatus: "div:text('Fill status')",
};
