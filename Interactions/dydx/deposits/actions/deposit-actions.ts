import { BrowserContext, Page } from "@playwright/test";
import { Eyes } from "@applitools/eyes-playwright";
import { logger } from "@utils/logger/logging-utils";
import { DepositsSelectors } from "@dydx/deposits/selectors/deposits.selectors";
import { MetamaskSelectors } from "@wallets/metamask/selectors/metamask-selectors";
import { confirmMetaMaskAction } from "@wallets/metamask/actions/connect-metamask";
import {
  waitForAndClickDepositFunds,
  waitForDepositSuccess,
} from "@dydx/deposits/actions/wait-for-instant-deposit";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { maybeVisualCheck, visualCheck } from "@utils/visual-check";

interface InstantDepositOptions {
  eyes?: Eyes;
  performEyesCheck?: boolean;
}

/**
 * Performs the instant deposit flow on dYdX, including MetaMask confirmations.
 *
 * @param page             Playwright Page object
 * @param amount           The amount to deposit
 * @param metamaskContext  The MetaMask context object (browser/context/extension)
 * @param optionSelector   Selector for the option to select
 * @param options          Optional visual check + Eyes configuration
 */
export async function instantDeposit(
  page: Page,
  amount: number,
  metamaskContext: BrowserContext,
  optionSelector: string,
  options: InstantDepositOptions = {}
): Promise<void> {
  const password = process.env.METAMASK_PASSWORD || "";
  const { eyes, performEyesCheck = false } = options;

  logger.step(`Starting deposit workflow for amount: ${amount}`);

  try {
    // Click the Deposit button
    logger.debug("Clicking the Deposit button");
    await page.click(DepositsSelectors.depositButton);

    await maybeVisualCheck(eyes, performEyesCheck, "Deposit - Start", page);

    // Fill in the deposit amount
    logger.debug(`Filling deposit amount: ${amount}`);
    await page.fill(DepositsSelectors.amountInput, amount.toString());

    await maybeVisualCheck(
      eyes,
      performEyesCheck,
      "Instant Deposit - Entered amount",
      page
    );

    // Select the asset from the dropdown
    logger.step("Selecting Asset dropdown option");
    await selectAssetDropdownOptionDeposit(page, optionSelector);

    // Select Instant Deposit
    logger.step("Select Instant Deposit");
    await page.click(DepositsSelectors.instantDepositSelect);

    // Wait for and click Confirm Order
    logger.step("Waiting for Confirm Order and clicking it");
    await waitForAndClickDepositFunds(page);

    // Confirm in MetaMask (first confirmation)
    logger.step("Confirming in MetaMask (1st time)");
    await page.waitForTimeout(2500);
    await confirmMetaMaskAction(
      metamaskContext,
      password,
      TEST_TIMEOUTS.ELEMENT,
      MetamaskSelectors.confirmationSubmitButtonFooter
    );
    await page.waitForTimeout(2500);
    // Confirm in MetaMask (second confirmation)
    logger.step("Confirming in MetaMask (2nd time)");
    await confirmMetaMaskAction(
      metamaskContext,
      password,
      TEST_TIMEOUTS.ELEMENT,
      MetamaskSelectors.confirmButtonFooter
    );
    // Wait for deposit success
    logger.step("Waiting for deposit success");
    await checkDepositCompleted(page, amount);

    await maybeVisualCheck(
      eyes,
      performEyesCheck,
      "Deposit - Success",
      page
    );

    // Close the Instant Deposits modal
    logger.debug("Clicking the Close button on the Deposits modal");
    await page.click(DepositsSelectors.DepositsStartTradingButton);

    logger.success("Deposit workflow completed successfully");
  } catch (error) {
    logger.error("Deposit workflow failed", error as Error, {
      url: page.url(),
    });
    throw error;
  }
}

/**
 * Opens the asset dropdown and selects an option.
 *
 * @param page           Playwright Page object
 * @param optionSelector Selector for the option to select
 */
export async function selectAssetDropdownOptionDeposit(
  page: Page,
  optionSelector: string
): Promise<void> {
  logger.step("Opening dropdown and selecting an option");

  await page.click(DepositsSelectors.assetDropdown);
  await page.waitForSelector(optionSelector, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });
  await page.click(optionSelector);

  logger.info(`Dropdown option selected: "${optionSelector}"`);
}

/**
 * Checks that the deposit completion modal is displayed correctly.
 *
 * @param page           Playwright Page object
 * @param expectedAmount The expected deposit amount
 */
export async function checkDepositCompleted(
  page: Page,
  expectedAmount: number
): Promise<void> {
  logger.step("Checking deposit completion modal");

  // Wait for deposit modal to appear
  await page.waitForSelector(DepositsSelectors.depositModal, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });

  // Wait for up to 2 minutes for the deposit completed text to appear.
  await page.waitForSelector(DepositsSelectors.depositCompletedText, {
    timeout: 150000, // 2.5 minutes
    state: "visible",
  });

  // Extract displayed deposit amount
  const displayedAmountText = await page.textContent(DepositsSelectors.depositAmount);
  const displayedAmount = parseFloat(displayedAmountText?.replace(/[^0-9.]/g, "") || "0");

  if (isNaN(displayedAmount)) {
    throw new Error("Displayed deposit amount is not a valid number.");
  }

  // Validate the amount is within 10% of expected
  const lowerBound = expectedAmount * 0.9;
  const upperBound = expectedAmount * 1.1;
  if (displayedAmount < lowerBound || displayedAmount > upperBound) {
    throw new Error(
      `Displayed deposit amount ${displayedAmount} is out of the acceptable range (${lowerBound} - ${upperBound}).`
    );
  }

  logger.info(`Deposit confirmed: ${displayedAmount} (expected: ${expectedAmount})`);
}
