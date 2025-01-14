import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { InstantDepositsSelectors } from "@dydx/instant-deposits/selectors/instant-deposits.selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";

/**
 * Waits for the Confirm Order button to become clickable and clicks it
 * @param page - Playwright Page object
 * @param timeout - Optional timeout override
 */
export async function waitForAndClickConfirmOrder(
  page: Page,
  timeout: number = TEST_TIMEOUTS.ELEMENT
): Promise<void> {
  logger.step("Waiting for Confirm Order button to be ready");

  try {
    // Wait for loading states to disappear
    logger.debug("Waiting for loading states to complete");
    for (const loadingText of InstantDepositsSelectors.loadingStates) {
      await page.waitForFunction(
        (text: string) => !document.body.textContent?.includes(text),
        loadingText,
        { timeout }
      );
    }

    // Wait for and find the Confirm Order button
    logger.debug("Waiting for Confirm Order button");
    const confirmButton = await page.waitForSelector(
      InstantDepositsSelectors.confirmOrderButton,
      {
        state: "visible",
        timeout: TEST_TIMEOUTS.ELEMENT,
      }
    );

    // Small delay to ensure button is interactive
    await page.waitForTimeout(1000);

    // Click the button
    await confirmButton.click();
    logger.success("Clicked Confirm Order button");
  } catch (error) {
    logger.error(
      "Failed to wait for or click Confirm Order button",
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
  logger.step("Waiting for deposit success confirmation");
  const pollingInterval = 1000; // Check every second
  const startTime = Date.now();
  let lastStatusText = "";

  try {
    while (Date.now() - startTime < timeout) {
      const locator = page.locator(InstantDepositsSelectors.fillStatusText);

      if (await locator.isVisible()) {
        const statusText = await locator.textContent();

        if (statusText) {
          lastStatusText = statusText.trim();
        }

        if (lastStatusText === "Successful") {
          logger.success("Fill status is 'Successful'");
          return; // Exit early on success
        }
      }

      logger.debug(
        `Fill status not "Successful", Last status: ${lastStatusText}. retrying...`
      );
      await page.waitForTimeout(pollingInterval); 
    }

    // If timeout is reached without success
    throw new Error(
      `Timed out waiting for fill status to be 'Successful'.'`
    );
  } catch (error) {
    logger.error(
      `Failed to confirm fill status as 'Successful'.'`,
      error as Error,
      {
        timeout,
        url: page.url(),
      }
    );

    // Capture element state for debugging
    const locatorHtml = await page.locator(InstantDepositsSelectors.fillStatusText).evaluate(
      (el) => el.outerHTML
    ).catch(() => "Element not found or not accessible");
    logger.debug(`Fill status element HTML: ${locatorHtml}`);

    throw error;
  }
}

