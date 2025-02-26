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
