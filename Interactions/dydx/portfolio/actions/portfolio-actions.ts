import { expect, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { PortfolioSelectors } from "@dydx/portfolio/selectors/portfolio-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { navigateToViaHeader } from "@interactions/dydx/general/actions/navigation.actions";

/**
 * Gets the portfolio value from the Portfolio page, waiting up to 15 seconds if the value is empty.
 * @param page Playwright Page object
 * @returns The portfolio value as a number
 */
export async function getPortfolioValue(page: Page): Promise<number> {
  logger.debug("Getting portfolio value");

  // Create a locator using the Playwright-specific syntax
  const portfolioValueLocator = page.locator('label:has-text("Portfolio Value") + output');

  // Wait for the element to have non-empty text
  await expect(portfolioValueLocator).toHaveText(/\S+/, { timeout: 30000 });

  // Extract the text content
  const portfolioValueText = await portfolioValueLocator.textContent();
  if (!portfolioValueText) {
    throw new Error("Failed to retrieve portfolio value. Element is empty after waiting.");
  }

  // Parse the value to a number
  const cleanedValue = portfolioValueText.replace(/[^0-9.]/g, "");
  const portfolioValue = parseFloat(cleanedValue);
  if (isNaN(portfolioValue)) {
    throw new Error(`Failed to parse portfolio value: ${portfolioValueText}`);
  }

  logger.debug(`Retrieved portfolio value: ${portfolioValue}`);
  return portfolioValue;
}

/**
 * Checks and logs the initial portfolio value.
 * @param page Playwright Page object
 * @returns The initial portfolio value as a number
 */
export async function checkInitialPortfolioValue(page: Page): Promise<number> {
  logger.step("Checking initial portfolio value");
  const initialPortfolioValue = parseFloat(
    (await getPortfolioValue(page)).toFixed(2)
  );
  logger.info(`Initial Portfolio Value: ${initialPortfolioValue}`);
  return initialPortfolioValue;
}
/**
 * Checks and logs the final portfolio value and validates the change (positive or negative).
 * @param page Playwright Page object
 * @param initialPortfolioValue The initial portfolio value to compare against
 * @param expectedIncrease The expected change in portfolio value (can be positive or negative)
 * @param variancePercent Allows for a percentage variance (default 10%)
 */
export async function checkFinalPortfolioValue(
  page: Page,
  initialPortfolioValue: number,
  expectedIncrease: number,
  variancePercent: number = 10
): Promise<void> {
  logger.step("Checking final portfolio value");

  const positionsLink = page.locator('[data-item="positions"]');
  await positionsLink.click();
  const overviewLink = page.locator('[data-item="overview"]');
  await overviewLink.click();
  await page.waitForTimeout(2500);

  const lowerBound = expectedIncrease * (1 - variancePercent / 100);
  const upperBound = expectedIncrease * (1 + variancePercent / 100);

  const minAllowed = Math.min(lowerBound, upperBound);
  const maxAllowed = Math.max(lowerBound, upperBound);

  let finalPortfolioValue = initialPortfolioValue;
  let actualChange = 0;
  let attempt = 0;
  let success = false;

  while (attempt < 3) {
    attempt++;
    const rawFinalValue = await getPortfolioValue(page);
    finalPortfolioValue = parseFloat(rawFinalValue.toFixed(2));
    logger.info(`Final Portfolio Value (Attempt ${attempt}): ${finalPortfolioValue}`);

    actualChange = parseFloat(
      (finalPortfolioValue - initialPortfolioValue).toFixed(2)
    );
    logger.info(`Actual Change: ${actualChange}`);

    if (actualChange >= minAllowed && actualChange <= maxAllowed) {
      success = true;
      break;
    }
    
    if (actualChange === 0 && attempt < 3) {
      logger.warn(
        `Portfolio value change is 0 on attempt ${attempt}. ` +
          "Navigating to DYDX and back to trigger refresh..."
      );
      
      // Navigate to DYDX home via logo to trigger refresh
      logger.info("Clicking DYDX logo to navigate to home");
      await navigateToViaHeader(page, "DYDX");
      await page.waitForTimeout(2000);
      
      // Navigate back to portfolio
      logger.info("Navigating back to portfolio overview");
      await navigateToViaHeader(page, "PORTFOLIO");
      await page.waitForTimeout(3000);
    } else {
      break;
    }
  }

  if (!success) {
    if (actualChange < minAllowed || actualChange > maxAllowed) {
      throw new Error(
        `Portfolio value change (${actualChange}) is not within ` +
          `${variancePercent}% variance of the expected ${expectedIncrease}.
           Allowed range: [${minAllowed.toFixed(2)}, ${maxAllowed.toFixed(2)}]
           Attempts: ${attempt},
           Initial: ${initialPortfolioValue},
           Final: ${finalPortfolioValue},
           Actual Change: ${actualChange}`
      );
    }
  }
  logger.success(
    `Portfolio value changed by approx. ${expectedIncrease} ` +
    `(within ±${variancePercent}% variance) after ${attempt} attempt(s).`
  );
}


/**
 * Clicks the Withdraw button on the Portfolio page.
 * @param page Playwright Page object
 */
export async function clickWithdrawButton(page: Page): Promise<void> {
  logger.step("Clicking the Withdraw button");

  await page.waitForSelector(PortfolioSelectors.withdrawButton, {
    state: "visible",
    timeout: TEST_TIMEOUTS.DEFAULT,
  });

  await page.click(PortfolioSelectors.withdrawButton);

  logger.success("Withdraw button clicked successfully");
}