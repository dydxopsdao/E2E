import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { InstantDepositSelectors } from "@dydx/notifications/selectors/notification-selectors";

/**
 * Verifies that the notification appears with the correct header and message.
 * @param page Playwright Page object
 * @param expectedHeader The expected header text (e.g., "Instant deposit")
 * @param expectedMessage The expected message text (e.g., "Deposit completed")
 */
export async function checkNotificationAppearance(
  page: Page,
  expectedHeader: string,
  expectedMessage: string
): Promise<void> {
  logger.step("Checking for notification appearance");

  // Wait for the notification container to appear
  await page.waitForSelector(InstantDepositSelectors.instantDepositToast, {
    state: "visible",
    timeout: 5000, // Adjust timeout as needed
  });

  // Check the header text
  const actualHeader = await page
    .locator(InstantDepositSelectors.instantDepositHeader)
    .textContent();
  if (actualHeader?.trim() !== expectedHeader) {
    throw new Error(
      `Notification header mismatch. Expected: "${expectedHeader}", Actual: "${actualHeader}"`
    );
  }

  // Check the message text
  const actualMessage = await page
    .locator(InstantDepositSelectors.depositCompletedMessage)
    .textContent();
  if (actualMessage?.trim() !== expectedMessage) {
    throw new Error(
      `Notification message mismatch. Expected: "${expectedMessage}", Actual: "${actualMessage}"`
    );
  }

  logger.success(
    `Notification verified with header: "${expectedHeader}" and message: "${expectedMessage}"`
  );
}
