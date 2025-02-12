import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { DepositsSelectors } from "@dydx/deposits/selectors/deposits.selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";

/**
 * Waits for the Confirm Order button to become clickable and clicks it
 * @param page - Playwright Page object
 * @param timeout - Optional timeout override
 */
export async function waitForAndClickDepositFunds(
  page: Page,
  timeout: number = TEST_TIMEOUTS.ELEMENT
): Promise<void> {
  logger.step("Waiting for Confirm Order button to be ready");

  try {
    // Wait for loading states to disappear
    logger.debug("Waiting for loading states to complete");
    for (const loadingText of DepositsSelectors.loadingStates) {
      await page.waitForFunction(
        (text: string) => !document.body.textContent?.includes(text),
        loadingText,
        { timeout }
      );
    }

    // Wait for and find the Deposit Funds button
    logger.debug("Waiting for Deposit Funds button");
    const depositFundsButton = await page.waitForSelector(
      DepositsSelectors.depositFundsButton,
      {
        state: "visible",
        timeout: TEST_TIMEOUTS.NAVIGATION,
      }
    );

    // Small delay to ensure button is interactive
    await page.waitForTimeout(1000);

    // Click the button
    await depositFundsButton.click();
    logger.success("Clicked Deposit Funds button");
  } catch (error) {
    logger.error(
      "Failed to wait for or click Deposit Funds button",
      error as Error,
      {
        timeout,
        url: page.url(),
      }
    );
    throw error;
  }
}

/**
 * Waits for the deposit to complete successfully
 * @param page - Playwright Page object
 * @param timeout - Optional timeout override (default: 2 minutes)
 */
export async function waitForDepositSuccess(
  page: Page,
  timeout: number = TEST_TIMEOUTS.DEPOSIT_SUCCESS
): Promise<void> {
  
}

