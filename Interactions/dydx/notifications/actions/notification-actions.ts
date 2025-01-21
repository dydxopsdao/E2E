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
  expectedMessage: string,
  timeout: number = 580000
): Promise<void> {
  logger.step(
    `Waiting for notification - Header: "${expectedHeader}", Message: "${expectedMessage}"`
  );

  const startTime = Date.now();
  const pollInterval = 500;

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

      if (
        trimmedHeader === expectedHeader &&
        trimmedMessage === expectedMessage
      ) {
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
 * @param amount The withdrawal amount for message verification
 * @param timeout Maximum time to wait for completion (default: 180000 - 3 minutes)
 */
export async function checkWithdrawalNotifications(
  page: Page,
  amount: string,
  timeout: number = 620000
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