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
