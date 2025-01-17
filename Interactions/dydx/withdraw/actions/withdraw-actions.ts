// withdraw-helper.ts
import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { VisualTestingHelper } from "@utils/visual-check";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { WithdrawSelectors } from "@dydx/withdraw/selectors/withdraw-selectors";

/**
 * Options for steps that can include visual testing
 */
interface StepOptions {
  visualTest?: VisualTestingHelper;
  performVisualCheck?: boolean;
  checkName: string;
}

/**
 * Performs a single step (labeled for logging) and optionally takes a visual snapshot.
 *
 * @param page        Playwright Page object
 * @param stepLabel   A descriptive label for logging (e.g. "Clicking the Withdraw button")
 * @param action      An async function that performs the step
 * @param options     Visual testing options
 */
async function performStep(
  page: Page,
  stepLabel: string,
  action: () => Promise<void>,
  options: StepOptions
): Promise<void> {
  const { visualTest, performVisualCheck = false, checkName } = options;

  logger.step(stepLabel);
  await action();

  if (performVisualCheck && visualTest) {
    await visualTest.check(page, { name: checkName });
  }
}

/**
 * Inputs the wallet address into the wallet address field.
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
 */
export async function clickWithdrawButtonComplete(page: Page): Promise<void> {
  logger.step("Preparing for natural withdrawal completion");

  const button = page.locator(WithdrawSelectors.withdrawButtonComplete);

  await page.waitForLoadState("domcontentloaded");
  await page.locator('h2:has-text("Withdraw")').click();
  await button.waitFor({ state: "visible" });

  // Move mouse to random position first (like a real user)
  await page.mouse.move(100, 100);
  await page.waitForTimeout(500);

  // Get button position
  const box = await button.boundingBox();
  if (!box) throw new Error("Could not find button position");

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

  await page.waitForTimeout(500);
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(1000);

  logger.success("Natural withdraw button interaction completed");
}

/**
 * Options for `completeWithdrawal`
 */
interface WithdrawalOptions {
  visualTest?: VisualTestingHelper;
  performVisualCheck?: boolean;
}

/**
 * Combines all withdrawal steps: inputting address, selecting dropdown option,
 * entering amount, and clicking Withdraw.
 */
export async function completeWithdrawal(
  page: Page,
  address: string,
  optionSelector: string,
  amount: string = "12",
  options: WithdrawalOptions = {}
): Promise<void> {
  const { visualTest, performVisualCheck = false } = options;

  logger.step("Starting the complete withdrawal process");

  // Step 1: Click the initial Withdraw button
  await performStep(
    page,
    "Clicking the initial Withdraw button",
    async () => {
      await clickWithdrawButton(page);
    },
    {
      visualTest,
      performVisualCheck,
      checkName: "After Clicking Withdraw Button",
    }
  );

  // Step 2: Input wallet address
  await performStep(
    page,
    "Inputting wallet address",
    async () => {
      await inputWalletAddress(page, address);
    },
    {
      visualTest,
      performVisualCheck,
      checkName: "After Input Wallet Address",
    }
  );

  // Step 3: Select dropdown option
  await performStep(
    page,
    "Selecting dropdown option",
    async () => {
      await selectDropdownOption(page, optionSelector);
    },
    {
      visualTest,
      performVisualCheck,
      checkName: "After Selecting Dropdown Option",
    }
  );

  // Step 4: Enter amount
  await performStep(
    page,
    `Entering amount (${amount})`,
    async () => {
      await enterAmount(page, amount);
    },
    {
      visualTest,
      performVisualCheck,
      checkName: `After Entering Amount (${amount})`,
    }
  );

  // Step 5: Click the Withdraw button
  await performStep(
    page,
    "Clicking the Withdraw button",
    async () => {
      await page.waitForTimeout(2000);
      await clickWithdrawButtonComplete(page);
    },
    {
      visualTest,
      performVisualCheck,
      checkName: "After Final Withdraw Click",
    }
  );

  logger.success("Complete withdrawal process finished successfully");
}
