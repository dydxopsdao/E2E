// withdraw-helper.ts

import { Page } from "@playwright/test";
import { Eyes } from "@applitools/eyes-playwright";
import { logger } from "@utils/logger/logging-utils";
import { visualCheck } from "@utils/visual-check";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { WithdrawSelectors } from "@dydx/withdraw/selectors/withdraw-selectors";
import { closeDialog } from "@interactions/dydx/general/actions/general.actions";

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
    page?: Page;
  }
): Promise<void> {
  const { eyes, performEyesCheck = false, checkName, page } = options;

  logger.step(stepLabel);
  await action();

  if (performEyesCheck && eyes) {

    await visualCheck(eyes, { name: checkName, page });
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
 * Simulates a more natural withdraw button interaction.
 * @param page Playwright Page object
 */
export async function clickWithdrawButtonComplete(page: Page): Promise<void> {
  logger.step("Preparing for natural withdrawal completion");

  const button = page.locator(WithdrawSelectors.withdrawButtonComplete);

  // Ensure the page is loaded and the Withdraw section is visible.
  await page.waitForLoadState('domcontentloaded');
  await page.locator('h2:has-text("Withdraw")').scrollIntoViewIfNeeded();

  // Check for and acknowledge the route warning popup if it appears.
  await acknowledgeRouteWarningIfPresent(page);

  // Wait until the withdraw button is visible.
  await button.waitFor({ state: "visible" });

  // Start from a random position on the screen (simulate a user moving the mouse).
  await page.mouse.move(randomCoordinate(50, 150), randomCoordinate(50, 150));
  await randomDelay(300, 700);

  // Get the button's bounding box to determine the target position.
  const box = await button.boundingBox();
  if (!box) {
    throw new Error('Could not determine button position');
  }
  const targetX = box.x + box.width / 2;
  const targetY = box.y + box.height / 2;

  // Gradually move the mouse toward the button with random offsets.
  await page.mouse.move(targetX - 20 + randomOffset(10), targetY - 20 + randomOffset(10), { steps: 15 });
  await randomDelay(100, 300);
  await page.mouse.move(targetX - 10 + randomOffset(10), targetY - 10 + randomOffset(10), { steps: 10 });
  await randomDelay(100, 300);
  await page.mouse.move(targetX + randomOffset(5), targetY + randomOffset(5), { steps: 10 });
  await randomDelay(300, 600);

  // Hover briefly to mimic a human pausing before clicking.
  await randomDelay(300, 600);

  // Execute a natural click: mouse down, short pause, then mouse up.
  await page.mouse.down();
  await randomDelay(150, 300);
  await page.mouse.up();

  // Allow time for any UI reactions to settle.
  await randomDelay(1000, 1500);
  logger.success("Natural withdraw button interaction completed");
}

/**
 * Returns a random delay between min and max milliseconds.
 */
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Returns a random offset within the specified range.
 * For example, randomOffset(10) returns a random integer between -10 and 10.
 */
function randomOffset(range: number): number {
  return Math.floor(Math.random() * (range * 2 + 1)) - range;
}

/**
 * Returns a random coordinate between the given min and max.
 */
function randomCoordinate(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simulates a more natural Enter key press interaction.
 * @param page Playwright Page object
 */
export async function pressEnterKeyComplete(page: Page): Promise<void> {
  logger.step("Preparing for natural Enter key press");

  // Wait for the DOM to be fully loaded
  await page.waitForLoadState('domcontentloaded');


  // Pause to mimic natural reaction time
  await page.waitForTimeout(500);

  // Move the mouse to a neutral position (simulate a user moving the mouse)
  await page.mouse.move(50, 50);
  await page.waitForTimeout(300);

  // Simulate the Enter key press with a natural delay between keydown and keyup
  await page.keyboard.down('Enter');
  await page.waitForTimeout(200);
  await page.keyboard.up('Enter');

  // Allow any immediate UI reactions to settle
  await page.waitForTimeout(1000);
  logger.success("Natural Enter key press completed");
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
      page
    }
  );

  // Step 2: Select dropdown option
  await performStep(
    "Selecting dropdown option",
    async () => {
      await selectDropdownOption(page, optionSelector);
    },
    {
      eyes,
      performEyesCheck,
      checkName: "After Selecting Dropdown Option",
      page
    }
  );

  // Step 3: Enter amount (defaults to "10")
  await performStep(
    `Entering amount (${amount})`,
    async () => {
      await enterAmount(page, amount);
    },
    {
      eyes,
      performEyesCheck,
      checkName: `After Entering Amount (${amount})`,
      page
    }
  );

  // Step 4: Click the Withdraw button
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
      page
    }
  );

  logger.success("Complete withdrawal process finished");
}

/**
 * Checks that the withdrawal completion modal is displayed correctly.
 *
 * @param page           Playwright Page object
 * @param expectedAmount The expected withdrawal amount (pass as a positive or negative number)
 */
export async function checkWithdrawCompleted(
  page: Page,
  expectedAmount: number
): Promise<void> {
  logger.step("Checking withdrawal completion modal");

  // Define selectors for the withdrawal modal and the text that indicates completion.
  const withdrawModalSelector = 'div[role="dialog"]';
  const withdrawCompletedTextSelector = 'text=Your withdrawal of';

  // Wait for the withdrawal modal to appear
  await page.waitForSelector(withdrawModalSelector, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });

  // Wait for the withdraw completed text to appear (up to 3.5 minutes)
  await page.waitForSelector(withdrawCompletedTextSelector, {
    state: "visible",
    timeout: 600000, 
  });

  // Extract the full text content from the withdrawal modal
  const modalText = await page.textContent(withdrawModalSelector);
  if (!modalText) {
    throw new Error("Withdrawal modal text content not found.");
  }

  // Extract the withdrawal amount using a regular expression.
  // Expects a format like: "Your withdrawal of $11.97USDC is now available."
  const match = modalText.match(/\$([0-9]+(?:\.[0-9]+)?)/);
  if (!match) {
    throw new Error("Withdrawal amount not found in modal text.");
  }

  const displayedAmount = parseFloat(match[1]);
  if (isNaN(displayedAmount)) {
    throw new Error("Displayed withdrawal amount is not a valid number.");
  }

  // Validate the amount is within 10% of the expected amount using absolute values.
  const absoluteExpected = Math.abs(expectedAmount);
  const absoluteDisplayed = Math.abs(displayedAmount);
  const lowerBound = absoluteExpected * 0.9;
  const upperBound = absoluteExpected * 1.1;

  if (absoluteDisplayed < lowerBound || absoluteDisplayed > upperBound) {
    throw new Error(
      `Displayed withdrawal amount ${displayedAmount} is out of the acceptable range (${lowerBound} - ${upperBound}).`
    );
  }

  logger.info(
    `Withdrawal confirmed: ${displayedAmount} (expected: ${expectedAmount})`
  );
  await page.click(WithdrawSelectors.closeButton);
}

/**
 * Checks if the route warning popup exists and clicks it if visible.
 * @param page Playwright Page object
 */
async function acknowledgeRouteWarningIfPresent(page: Page): Promise<void> {
  const popup = page.locator("#acknowledge-route-warning");

  try {
    // Wait for up to 2 seconds for the popup to become visible.
    await popup.waitFor({ state: "visible", timeout: 2000 });
    logger.step("Popup warning detected. Acknowledging it.");
    await popup.click();
    await randomDelay(300, 600);
  } catch (error) {
    // If the popup doesn't appear within 2 seconds, proceed without error.
    logger.step("Popup warning did not appear within 2 seconds, proceeding.");
  }
}