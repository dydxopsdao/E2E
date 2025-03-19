import { TEST_TIMEOUTS } from "@constants/test.constants";
import { OnboardingSelectors } from "@interactions/dydx/onboarding/selectors/onboarding.selectors";
import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";

export async function closeDialog(page: Page): Promise<void> {
  try {
    await page.waitForSelector(OnboardingSelectors.closeButton);
    await page.click(OnboardingSelectors.closeButton);
    logger.debug("Successfully closed dialog");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to click close button: ${errorMessage}`);
    throw new Error(`Failed to close dialog: ${errorMessage}`);
  }
}

export async function waitForPageLoad(page: Page, elementLocator: string) {
  try {
    logger.debug(`Waiting for element: ${elementLocator}`);
    await page
      .locator(elementLocator)
      .waitFor({ state: "visible", timeout: TEST_TIMEOUTS.ELEMENT });
    logger.success(`Element found: ${elementLocator}`);
  } catch (error) {
    logger.warning(`Element not found: ${elementLocator}`, { url: page.url() });
  }
}

// Wait for all animations to finish, but only up to the provided timeout.
// If animations are still running when the timeout is hit, a warning is logged and the test continues.
export async function waitForAnimations(page: Page, timeout: number) {
  try {
    logger.debug("Waiting for all animations to finish.");
    await Promise.race([
      page.evaluate(async () => {
        const animations = document.getAnimations();
        if (animations.length > 0) {
          await Promise.all(animations.map((animation) => animation.finished));
        }
      }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Animations timeout exceeded")),
          timeout
        )
      ),
    ]);
    logger.success("All animations have finished.");
  } catch (error) {
    logger.warning(
      "Animations did not finish within the timeout. Proceeding with the test."
    );
  }
}

export async function removeLongLivedWarning(page: Page, timeout: number = TEST_TIMEOUTS.ELEMENT) {
  // Click the element if page is provided and clickSelector is not false
    try {
      // Find the iframe with the title "dYdX Chain Status"
      const iframe = page.frameLocator('iframe[title="dYdX Chain Status"]');
      
      // Log that we're switching to the iframe
      logger.info(`Switching to iframe with title "dYdX Chain Status" before clicking element`);
      
      // Use the iframe locator to click the element inside the iframe
      const selectorToClick = '#DN70';
      logger.info(`Clicking element ${selectorToClick} within iframe`);
      
      // Click the element inside the iframe
      await iframe.locator(selectorToClick).click({ force: true });
      
      // Add a small delay to allow any animations to complete
      await page.waitForTimeout(500);
    } catch (error) {
    logger.warn(`Failed to click element '#DN70' in iframe: ${error}`);
  }
}

