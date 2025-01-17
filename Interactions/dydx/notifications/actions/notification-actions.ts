import { expect, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { NotificationSelectors } from "@dydx/notifications/selectors/notification-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";

/**
 * Verifies that a notification appears with the correct header and message.
 * Will wait up to timeout duration for the exact text match.
 * @param page Playwright Page object
 * @param toastSelector The selector for the notification toast
 * @param headerSelector The selector for the notification header
 * @param messageSelector The selector for the notification message
 * @param expectedHeader The expected header text (e.g., "Instant deposit", "Withdrawal")
 * @param expectedMessage The expected message text (e.g., "Deposit completed", "Withdrawal complete")
 * @param timeout Maximum time to wait in milliseconds (default: 180000 - 3 minutes)
 */
export async function checkNotificationAppearance(
  page: Page,
  toastSelector: string,
  headerSelector: string,
  messageSelector: string,
  expectedHeader: string,
  expectedMessage: string,
  timeout: number = 180000
): Promise<void> {
  logger.step(
    `Waiting for notification - Header: "${expectedHeader}", Message: "${expectedMessage}"`
  );

  const startTime = Date.now();
  const pollInterval = 5000;

  while (Date.now() - startTime < timeout) {
    try {
      // Check if toast is visible
      const isVisible = await page.locator(toastSelector).isVisible();
      if (!isVisible) {
        logger.debug("Notification toast not visible, waiting...");
        await page.waitForTimeout(pollInterval);
        continue;
      }

      // Get current texts
      const actualHeader = await page.locator(headerSelector).textContent();
      const actualMessage = await page.locator(messageSelector).textContent();
      const trimmedHeader = actualHeader?.trim();
      const trimmedMessage = actualMessage?.trim();

      logger.debug(
        `Current notification - Header: "${trimmedHeader}", Message: "${trimmedMessage}"`
      );

      // Check if texts match expected values
      if (
        trimmedHeader === expectedHeader &&
        trimmedMessage === expectedMessage
      ) {
        logger.success(
          `Notification verified - Header: "${expectedHeader}", Message: "${expectedMessage}"`
        );
        return;
      }

      // If texts don't match, wait before checking again
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

/**
 * Checks a series of notifications in sequence.
 * Useful for flows where notifications update over time.
 * @param page Playwright Page object
 * @param notifications Array of notification checks to perform in sequence
 */
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
 * @param amount The withdrawal amount for message verification
 * @param timeout Maximum time to wait for completion (default: 180000 - 3 minutes)
 */
export async function checkWithdrawalNotifications(
  page: Page,
  amount: string,
  timeout: number = 420000
): Promise<void> {
  logger.step("Checking withdrawal notifications");

  // Check initial state with split text handling
  await page.waitForSelector(NotificationSelectors.withdrawalToast, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });

  await expect(
    page.locator(NotificationSelectors.withdrawalHeader)
  ).toContainText("Withdrawal(s) in progress");

  // Get the message container and check its text parts
  const messageContainer = page.locator(
    NotificationSelectors.withdrawalMessage
  );

  await expect(messageContainer).toContainText(
    "Please keep this window open to ensure funds arrive."
  );

  logger.success("Found initial withdrawal notification");

  logger.step("Waiting for completion notification");

  const startTime = Date.now();
  const pollInterval = 5000;
  const expectedMessage = `Your withdrawal of ${amount} is now available.`;
  console.log(expectedMessage);
  while (Date.now() - startTime < timeout) {
    try {
      const messageText = await page
        .locator(NotificationSelectors.withdrawalCompletionMessage)
        .innerText();
      if (
        messageText.includes(`Your withdrawal of ${amount} is now available.`)
      ) {
        logger.success("Found completion notification");
        return;
      }
      console.log(messageText);
      await page.waitForTimeout(pollInterval);
    } catch (error) {
      await page.waitForTimeout(pollInterval);
    }
  }

  throw new Error("Timed out waiting for withdrawal completion notification");
}
