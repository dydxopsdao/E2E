import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { PortfolioSelectors } from "@dydx/portfolio/selectors/portfolio-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";

/**
 * Gets the portfolio value from the Portfolio page.
 * @param page Playwright Page object
 * @returns The portfolio value as a number
 */
export async function getPortfolioValue(page: Page): Promise<number> {
  logger.debug("Getting portfolio value");

  // Locate the portfolio value
  const portfolioValueLocator = page.locator(PortfolioSelectors.portfolioValue);

  // Extract the text content
  const portfolioValueText = await portfolioValueLocator.textContent();
  if (!portfolioValueText) {
    throw new Error("Failed to retrieve portfolio value. Element is empty.");
  }

  // Parse the value to a number
  const cleanedValue = portfolioValueText.replace(/[^0-9.]/g, ""); // Strip non-numeric characters
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
 * Checks and logs the final portfolio value and validates the increase.
 * @param page Playwright Page object
 * @param initialPortfolioValue The initial portfolio value to compare against
 * @param expectedIncrease The expected increase in portfolio value
 * @param variancePercent Allows for a percentage variance (default 10%)
 */
export async function checkFinalPortfolioValue(
  page: Page,
  initialPortfolioValue: number,
  expectedIncrease: number,
  variancePercent: number = 10
): Promise<void> {
  logger.step("Checking final portfolio value");
  await page.waitForTimeout(1000);

  const finalPortfolioValue = parseFloat(
    (await getPortfolioValue(page)).toFixed(2)
  );

  logger.info(`Final Portfolio Value: ${finalPortfolioValue}`);

  const actualIncrease = parseFloat(
    (finalPortfolioValue - initialPortfolioValue).toFixed(2)
  );

  // Calculate variance bounds
  const lowerBound = expectedIncrease * (1 - variancePercent / 100);
  const upperBound = expectedIncrease * (1 + variancePercent / 100);

  if (actualIncrease < lowerBound || actualIncrease > upperBound) {
    throw new Error(
      `Portfolio value increase (${actualIncrease}) is not within ` +
        `${variancePercent}% variance of the expected ${expectedIncrease}.
         Allowed range: [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]
         Initial: ${initialPortfolioValue},
         Final: ${finalPortfolioValue},
         Actual Increase: ${actualIncrease}`
    );
  }

  logger.success(
    `Portfolio value correctly increased by approx. ${expectedIncrease} (within ±${variancePercent}%)`
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