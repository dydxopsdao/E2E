export const DepositsSelectors = {
  DepositsStartTradingButton: 'button:has-text("Start Trading")',
  depositButton: 'button:has-text("Deposit")',
  continueButton: 'button:has-text("Continue")',
  depositFundsButton: 'button:has-text("Deposit Funds")',
  amountInput: 'input[placeholder="0.00"]',
  loadingStates: ["Estimating gas...", "Preparing your quote..."],
  assetDropdown: ".sc-1jt7k6f-2",
  instantDepositSelect: '//button[descendant::*[text()="Instant"]]',
  instantDepositSelect2: ".sc-jJBjNq.hwnNNF",
  // Success state selectors
  fillStatusText: "text=Successful",
  newDepositButton: 'button:has-text("New Deposit")',
  fillStatus: "div:text('Fill status')",
  depositModal: ".sc-18mw14j-2",
  depositCompletedText: "text=Deposit completed",
  depositAmount: "//div[normalize-space()='Your deposit']/following-sibling::div[1]/output",
};