import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { OnboardingSelectors } from "@dydx/onboarding/selectors/onboarding.selectors";

export async function learnMoreStepOnboarding(page: Page): Promise<void> {
  try {
    await page.click(OnboardingSelectors.learnMoreButton);
    logger.debug('Successfully clicked learn more button');
  } catch (error) {
    logger.debug('Learn more button not found or not clickable - this may be expected');
  }
}
export async function nextStepOnboarding(page: Page): Promise<void> {
  try {
    await page.click(OnboardingSelectors.nextButton);
    logger.debug("Successfully clicked next button");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to click next button: ${errorMessage}`);
    throw new Error(
      `Failed to proceed to next onboarding step: ${errorMessage}`
    );
  }
}

export async function closeOnboarding(page: Page): Promise<void> {
  try {
    // Close onboarding
    await page.waitForSelector(OnboardingSelectors.tradeNowButton);
    await page.waitForSelector(OnboardingSelectors.closeButton);
    await page.click(OnboardingSelectors.closeButton);
    logger.debug("Successfully closed onboarding");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to click close button: ${errorMessage}`);
    throw new Error(
      `Failed to close onboarding: ${errorMessage}`
    );
  }
}