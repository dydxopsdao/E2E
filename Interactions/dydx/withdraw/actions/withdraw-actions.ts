// withdraw-helper.ts

import { Page } from "@playwright/test";
import { Eyes } from "@applitools/eyes-playwright";
import { logger } from "@utils/logger/logging-utils";
import { visualCheck } from "@utils/visual-check";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { WithdrawSelectors } from "@dydx/withdraw/selectors/withdraw-selectors";

/**
 * Performs a single step (labeled for logging) and optionally takes an Applitools visual snapshot.
 *
 * @param stepLabel   A descriptive label for logging (e.g. "Clicking the Withdraw button")
 * @param action      An async function that performs the step (e.g. `clickWithdrawButton(page)`)
 * @param options     Includes Eyes instance, whether to do a visual check, and the snapshot name
 */
async function performStep(
  stepLabel: string,
  action: () => Promise<void>,
  options: {
    eyes?: Eyes;
    performEyesCheck?: boolean;
    checkName: string;
  }
): Promise<void> {
  const { eyes, performEyesCheck = false, checkName } = options;

  logger.step(stepLabel);
  await action();

  if (performEyesCheck && eyes) {

    await visualCheck(eyes, { name: checkName });
  }
}

/**
 * Inputs the wallet address into the wallet address field.
 * @param page    Playwright Page object
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
 * @param page           Playwright Page object
 * @param optionSelector Selector for the option to select
 */
export async function selectDropdownOption(
  page: Page,
  optionSelector: string
): Promise<void> {
  logger.step("Opening dropdown and selecting an option");

  await page.click(WithdrawSelectors.chainDestinationDropdown);
  await page.waitForSelector(optionSelector, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });
  await page.click(optionSelector);

  logger.info(`Dropdown option selected: "${optionSelector}"`);
}

/**
 * Enters the withdrawal amount into the amount input field.
 * @param page   Playwright Page object
 * @param amount Amount to enter
 */
export async function enterAmount(page: Page, amount: string): Promise<void> {
  logger.step(`Entering withdrawal amount: ${amount}`);

  await page.waitForSelector(WithdrawSelectors.amountInput, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });
  await page.fill(WithdrawSelectors.amountInput, amount);

  logger.info(`Withdrawal amount "${amount}" entered successfully`);
}

/**
 * Clicks the Withdraw button
 * @param page Playwright Page object
 */
export async function clickWithdrawButton(page: Page): Promise<void> {
  logger.step("Clicking the Withdraw button");

  await page.waitForSelector(WithdrawSelectors.withdrawButton, {
    state: "visible",
    timeout: TEST_TIMEOUTS.ELEMENT,
  });
  await page.click(WithdrawSelectors.withdrawButton);

  logger.success("Withdraw button clicked successfully");
}

/**
 * Simulates a more natural withdraw button interaction
 * @param page Playwright Page object
 */
export async function clickWithdrawButtonComplete(page: Page): Promise<void> {
  logger.step("Preparing for natural withdrawal completion");

  const button = page.locator(WithdrawSelectors.withdrawButtonComplete);

  await page.waitForLoadState('domcontentloaded');
  await page.locator('h2:has-text("Withdraw")').click();
  // Wait for button
  await button.waitFor({ state: "visible" });

  // Move mouse to random position first (like a real user)
  await page.mouse.move(100, 100);
  await page.waitForTimeout(500);

  // Get button position
  const box = await button.boundingBox();
  if (!box) throw new Error('Could not find button position');

  // Move mouse to button gradually (like a real user)
  const targetX = box.x + box.width / 2;
  const targetY = box.y + box.height / 2;
  
  await page.mouse.move(targetX - 20, targetY - 20);
  await page.waitForTimeout(200);
  await page.mouse.move(targetX - 10, targetY - 10);
  await page.waitForTimeout(200);
  await page.mouse.move(targetX - 5, targetY - 5);
  await page.waitForTimeout(200);
  await page.mouse.move(targetX, targetY);
  
  // Hover for a moment (like a real user)
  await page.waitForTimeout(500);

  // Click with natural timing
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.up();

  // Let any immediate reactions settle
  await page.waitForTimeout(1000);
  logger.success("Natural withdraw button interaction completed");
}

/**
 * Options for `completeWithdrawal`
 */
interface WithdrawalOptions {
  eyes?: Eyes;
  performEyesCheck?: boolean; // defaults to false
}

/**
 * Combines all withdrawal steps: inputting address, selecting dropdown option,
 * entering amount, and clicking Withdraw.
 *
 * @param page           Playwright Page object
 * @param address        Wallet address to input
 * @param optionSelector Selector for the dropdown option to select
 * @param amount         Amount to enter (defaults to "10")
 * @param options        Optional visual check + Eyes
 */
export async function completeWithdrawal(
  page: Page,
  address: string,
  optionSelector: string,
  amount: string = "12",
  options: WithdrawalOptions = {}
): Promise<void> {
  const { eyes, performEyesCheck = false } = options;

  logger.step("Starting the complete withdrawal process");

  // Step 1: Click the initial Withdraw button
  await performStep(
    "Clicking the initial Withdraw button",
    async () => {
      await clickWithdrawButton(page);
    },
    {
      eyes,
      performEyesCheck,
      checkName: "After Clicking Withdraw Button",
    }
  );

  // Step 2: Input wallet address
  await performStep(
    "Inputting wallet address",
    async () => {
      await inputWalletAddress(page, address);
    },
    {
      eyes,
      performEyesCheck,
      checkName: "After Input Wallet Address",
    }
  );

  // Step 3: Select dropdown option
  await performStep(
    "Selecting dropdown option",
    async () => {
      await selectDropdownOption(page, optionSelector);
    },
    {
      eyes,
      performEyesCheck,
      checkName: "After Selecting Dropdown Option",
    }
  );

  // Step 4: Enter amount (defaults to "10")
  await performStep(
    `Entering amount (${amount})`,
    async () => {
      await enterAmount(page, amount);
    },
    {
      eyes,
      performEyesCheck,
      checkName: `After Entering Amount (${amount})`,
    }
  );

  // Step 5: Click the Withdraw button
  await performStep(
    "Clicking the Withdraw button",
    async () => {
      await page.waitForTimeout(2000);
      await clickWithdrawButtonComplete(page);
    },
    {
      eyes,
      performEyesCheck,
      checkName: "After Final Withdraw Click",
    }
  );

  logger.success("Complete withdrawal process finished successfully");
}
