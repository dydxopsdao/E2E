export const MegaVaultSelectors = {
  // Add funds and remove funds buttons
  addFundsButton: 'button:has-text("Add funds")',
  removeFundsButton: 'button:has-text("Remove funds")',

  // Amount input and Max button
  amountInput: "input.sc-1pevboq-1.jOnwtS",
  maxButton: 'button:has-text("Max")',

  // Specific Vault Balance and All-time P&L outputs
  vaultBalanceNumber: "div.sc-1wo185u-10.dlfyHT",
  allTimePnlOutput: "div.sc-1wo185u-10.dlfyHT",

  // Cross Free Collateral and Cross Margin Usage
  crossFreeCollateral: 'div:has-text("Cross Free Collateral") + div',
  crossMarginUsage: 'div:has-text("Cross Margin Usage") + div',

  // Recover keys button and review button
  recoverKeysButton: 'button:has-text("Recover keys")',
  reviewButton: 'button:has-text("Review")',
  agreeToTerms: "#terms-ack",
  confirmButton: 'button:has-text("Confirm")',
  estimatedAmount:
    "dl.sc-1h33txe-0.iYVRBB.sc-q0pmw2-0.jbQEJU > div.sc-1h33txe-1.fiVecm > dd > output.sc-17stuub-0.sc-17stuub-1.eqFWVL.hsAYsL",

  // History view button
  historyViewButton: 'button:has-text("View")',
  historyTable: "div.sc-1drcdyj-0.feSemO.sc-1n2lg04-1.eNcqQE",
};
