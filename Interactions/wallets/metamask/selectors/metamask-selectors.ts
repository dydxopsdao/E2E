export const MetamaskSelectors = {
  agreeTermsofUseRadioButton: '[data-testid="onboarding-terms-checkbox"]',
  importWalletButton: '[data-testid="onboarding-import-wallet"]',
  metricsNoThanks: '[data-testid="metametrics-no-thanks"]',
  srpSingleField: '[data-testid="import-srp__srp-word-0"]',
  confirmSrpButton: '[data-testid="import-srp-confirm"]',
  passwordCreateInput: '[data-testid="create-password-new"]',
  passwordUnlock: '[data-testid="unlock-password"]',
  createPasswordConfirm: '[data-testid="create-password-confirm"]',
  createPasswordTerms: '[data-testid="create-password-terms"]',
  confirmPasswordInput: 'input[id="confirm-password"]',
  createPasswordImportButton: '[data-testid="create-password-import"]',
  submitButton: 'button[type="submit"]',
  onboardingComplete: '[data-testid="onboarding-complete-done"]',
  walletImportedIndicator: '[data-testid="onboarding-complete-done"]',
  metaMaskUnlockPassword: '[data-testid="unlock-password"]',
  metaMaskUnlockSubmit: '[data-testid="unlock-submit"]',
  pinExtension: '[data-testid="pin-extension-next"]',
  pinExtensionDone: '[data-testid="pin-extension-done"]',
  confirmButton: '[data-testid="confirm-btn"]',
  confirmButtonFooter: '[data-testid="confirm-footer-button"]',
  confirmationSubmitButton: '[data-testid="confirmation-submit-button"]',
  confirmationSubmitButtonFooter: '[data-testid="page-container-footer-next"]',
  doneButton: '[data-testid="page-container-footer-next"]',
  // Network-related selectors
  networkDisplay: '[data-testid="network-display"]',
  networkListContainer: ".mm-box.new-network-list__list-of-networks",
  arbitrumNetwork: '[data-testid="popular-network-0xa4b1"]',
  avalancheNetwork: '[data-testid="popular-network-0xa86a"]',
  networkAddButton: '[data-testid="test-add-button"]',

} as const;
