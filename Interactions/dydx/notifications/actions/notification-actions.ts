import { expect, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { NotificationSelectors } from "@dydx/notifications/selectors/notification-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";

/**
 * A generic function that checks for a specific toast/header/message match
 * within a given timeout.
 */
export async function checkNotificationAppearance(
  page: Page,
  toastSelector: string,
  headerSelector: string,
  messageSelector: string,
  expectedHeader: string,
  expectedMessage: string | RegExp,
  timeout: number = 580000
): Promise<void> {
  logger.step(
    `Waiting for notification - Header: "${expectedHeader}", Message: "${expectedMessage}"`
  );

  const startTime = Date.now();
  const pollInterval = 250;

  while (Date.now() - startTime < timeout) {
    try {
      const toastVisible = await page.locator(toastSelector).isVisible();
      if (!toastVisible) {
        logger.debug("Notification toast not visible, waiting...");
        await page.waitForTimeout(pollInterval);
        continue;
      }

      const actualHeader = await page.locator(headerSelector).textContent();
      const actualMessage = await page.locator(messageSelector).textContent();
      const trimmedHeader = actualHeader?.trim() ?? "";
      const trimmedMessage = actualMessage?.trim() ?? "";

      logger.debug(
        `Current notification - Header: "${trimmedHeader}", Message: "${trimmedMessage}"`
      );
      logger.debug(
        `Expected notification - Header: "${expectedHeader}", Message: "${expectedMessage}"`
      );

      // Check header equality
      const headerMatches = trimmedHeader === expectedHeader;

      // Check message: if expectedMessage is a RegExp, use .test(); otherwise, use direct comparison.
      let messageMatches = false;
      if (expectedMessage instanceof RegExp) {
        messageMatches = expectedMessage.test(trimmedMessage);
      } else {
        messageMatches = trimmedMessage === expectedMessage;
      }

      if (headerMatches && messageMatches) {
        logger.success(
          `Notification verified - Header: "${expectedHeader}", Message: "${expectedMessage}"`
        );
        return;
      }

      await page.waitForTimeout(pollInterval);
    } catch (error) {
      logger.debug(`Error checking notification: ${error}`);
      await page.waitForTimeout(pollInterval);
    }
  }

  throw new Error(
    `Timeout waiting for notification - Expected Header: "${expectedHeader}", Message: "${expectedMessage}"`
  );
}


export async function checkNotificationSequence(
  page: Page,
  notifications: Array<{
    toastSelector: string;
    headerSelector: string;
    messageSelector: string;
    expectedHeader: string;
    expectedMessage: string;
    timeout?: number;
  }>
): Promise<void> {
  for (const [index, notification] of notifications.entries()) {
    logger.step(
      `Checking notification ${index + 1} of ${notifications.length}`
    );

    await checkNotificationAppearance(
      page,
      notification.toastSelector,
      notification.headerSelector,
      notification.messageSelector,
      notification.expectedHeader,
      notification.expectedMessage,
      notification.timeout
    );
  }
}

/**
 * Specialized function to check withdrawal notifications with split text handling.
 * @param page Playwright Page object
 * @param amount The withdrawal amount for message verification (e.g. "$12.00")
 * @param timeout Maximum time to wait for completion (default: 620000 ms)
 */
export async function checkWithdrawalNotifications(
  page: Page,
  amount: string,
  timeout: number = 620000
): Promise<void> {
  logger.step("Checking withdrawal notifications");

  // Wait for the withdrawal toast to appear
  await page.waitForSelector(NotificationSelectors.withdrawalToast, {
    state: "visible",
    timeout: TEST_TIMEOUTS.ELEMENT,
  });

  // Verify that the header contains "Withdrawal(s) in progress".
  // If it does not, check if the error element is visible and contains "Something went wrong: Unknown error".
  try {
    await expect(
      page.locator(NotificationSelectors.withdrawalHeader)
    ).toContainText("Withdrawal(s) in progress");
  } catch (headerError) {
    const errorElement = page.locator("div.sc-1vvc9p2-0");
    if (await errorElement.isVisible()) {
      const errorText = (await errorElement.innerText()).trim();
      if (errorText.includes("Something went wrong: Unknown error")) {
        throw new Error(`Withdrawal header check failed. Found error message: "${errorText}"`);
      }
    }
    // Rethrow the original error if the error element is not found or does not contain the expected error text.
    throw headerError;
  }

  // Check the notification message container for its static text parts
  const messageContainer = page.locator(NotificationSelectors.withdrawalMessage);
  await expect(messageContainer).toContainText("Pending");

  logger.success("Found initial withdrawal notification");

  logger.step("Waiting for completion notification");

  const startTime = Date.now();
  const pollInterval = 5000;

  // Sanitize the passed in amount (e.g. "$12.00") by removing the '$' sign and any commas.
  const sanitizedAmount = amount.replace(/[$,]/g, "");
  const expectedAmount = parseFloat(sanitizedAmount);
  if (isNaN(expectedAmount)) {
    throw new Error(`Invalid expected amount: "${amount}" could not be parsed to a number.`);
  }
  console.log(`Expected numeric withdrawal amount: ${expectedAmount}`);

  // Calculate 10% tolerance range.
  const lowerBound = expectedAmount * 0.9;
  const upperBound = expectedAmount * 1.1;

  // Regular expression to capture the actual withdrawal amount from the completion message.
  // This regex expects the message to be in the format:
  // "Your withdrawal of $<actualAmount> is now available."
  const regex = /Your withdrawal of \$([\d,]+(?:\.\d{1,2})?) is now available\./;

  while (Date.now() - startTime < timeout) {
    try {
      const messageText = await page
        .locator(NotificationSelectors.withdrawalMessage)
        .innerText();

      const match = messageText.match(regex);
      if (match) {
        // Remove commas (if any) and convert the captured string to a number.
        const actualAmount = parseFloat(match[1].replace(/,/g, ""));
        if (isNaN(actualAmount)) {
          console.log(`Unable to parse amount from message: "${match[1]}"`);
        } else {
          console.log(`Found withdrawal amount in notification: ${actualAmount}`);
          // Check if the actual amount is within 10% of the expected amount.
          if (actualAmount >= lowerBound && actualAmount <= upperBound) {
            logger.success("Found completion notification with valid withdrawal amount");
            return;
          } else {
            console.log(
              `Withdrawal amount ${actualAmount} is not within 10% of expected ${expectedAmount} (acceptable range: ${lowerBound} - ${upperBound})`
            );
          }
        }
      } else {
        console.log(`Message did not match expected format: "${messageText}"`);
      }
      await page.waitForTimeout(pollInterval);
    } catch (error) {
      console.log("Error checking withdrawal completion message, retrying...", error);
      await page.waitForTimeout(pollInterval);
    }
  }

  throw new Error("Timed out waiting for withdrawal completion notification");
}


