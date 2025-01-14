import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { WithdrawSelectors } from "@dydx/withdraw/selectors/withdraw-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";

/**
 * Inputs the wallet address into the wallet address field.
 * @param page Playwright Page object
 * @param address Wallet address to input
 */
export async function inputWalletAddress(
  page: Page,
  address: string
): Promise<void> {
  logger.step("Inputting wallet address");

  await page.waitForSelector(WithdrawSelectors.walletAddressInput, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });

  await page.fill(WithdrawSelectors.walletAddressInput, address);
  logger.info(`Wallet address "${address}" inputted successfully`);
}

/**
 * Opens the dropdown and selects an option.
 * @param page Playwright Page object
 * @param optionSelector Selector for the option to select
 */
export async function selectDropdownOption(
  page: Page,
  optionSelector: string
): Promise<void> {
  logger.step("Opening dropdown and selecting an option");

  await page.click(WithdrawSelectors.destinationLabel); // Open the dropdown
  await page.waitForSelector(optionSelector, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });

  await page.click(optionSelector);
  logger.info(`Dropdown option selected: "${optionSelector}"`);
}

/**
 * Enters the withdrawal amount into the amount input field.
 * @param page Playwright Page object
 * @param amount Amount to enter
 */
export async function enterAmount(page: Page, amount: string): Promise<void> {
  logger.step("Entering withdrawal amount");

  await page.waitForSelector(WithdrawSelectors.amountInput, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });

  await page.fill(WithdrawSelectors.amountInput, amount);
  logger.info(`Withdrawal amount "${amount}" entered successfully`);
}

/**
 * Clicks the Withdraw button to confirm the withdrawal.
 * @param page Playwright Page object
 */
export async function clickWithdrawButton(page: Page): Promise<void> {
  logger.step("Clicking the Withdraw button");

  await page.waitForSelector(WithdrawSelectors.withdrawButton, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });

  await page.click(WithdrawSelectors.withdrawButton);
  logger.success("Withdraw button clicked successfully");
}

/**
 * Combines all withdrawal steps: inputting address, selecting dropdown option, entering amount, and clicking Withdraw.
 * @param page Playwright Page object
 * @param address Wallet address to input
 * @param optionSelector Selector for the dropdown option to select
 * @param amount Amount to enter
 */
export async function completeWithdrawal(
  page: Page,
  address: string,
  optionSelector: string,
  amount: string
): Promise<void> {
  logger.step("Starting the complete withdrawal process");

  await inputWalletAddress(page, address);
  await selectDropdownOption(page, optionSelector);
  await enterAmount(page, amount);
  await clickWithdrawButton(page);

  logger.success("Complete withdrawal process finished successfully");
}
