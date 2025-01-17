import { BrowserContext, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { InstantDepositsSelectors } from "@dydx/instant-deposits/selectors/instant-deposits.selectors";
import { MetamaskSelectors } from "@wallets/metamask/selectors/metamask-selectors";
import { confirmMetaMaskAction } from "@wallets/metamask/actions/connect-metamask";
import {
  waitForAndClickConfirmOrder,
  waitForDepositSuccess,
} from "@dydx/instant-deposits/actions/wait-for-instant-deposit";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { VisualTestingHelper } from "@utils/visual-check";

// Type for optional parameters
interface InstantDepositOptions {
  visualTest?: VisualTestingHelper;
  performVisualCheck?: boolean;
}

/**
 * Performs the instant deposit flow on dYdX, including MetaMask confirmations.
 *
 * @param page             Playwright Page object
 * @param amount           The amount to deposit
 * @param metamaskContext  The MetaMask context object (browser/context/extension)
 * @param options          Optional visual check + VisualTestingHelper
 */
export async function instantDeposit(
  page: Page,
  amount: number,
  metamaskContext: BrowserContext,
  options: InstantDepositOptions = {}
): Promise<void> {
  const password = process.env.METAMASK_PASSWORD || "";
  const { visualTest, performVisualCheck = false } = options;

  logger.step(`Starting deposit workflow for amount: ${amount}`);

  try {

    logger.debug("Clicking the Deposit button");
    await page.click(InstantDepositsSelectors.depositButton);
    
    if (performVisualCheck && visualTest) {
      await page.waitForTimeout(2000);
      await visualTest.check(page, {
        name: "Instant Deposit - Start",
      });
    }
    logger.debug("Clicking the first Continue button");
    await page.click(InstantDepositsSelectors.continueButton);

    if (performVisualCheck && visualTest) {
      await page.waitForTimeout(2000);
      await visualTest.check(page, {
        name: "Instant Deposit - Enter Amount",
      });
    }
    logger.debug(`Filling deposit amount: ${amount}`);
    await page.fill(InstantDepositsSelectors.amountInput, amount.toString());

    if (performVisualCheck && visualTest) {
      await page.waitForTimeout(2000);
      await visualTest.check(page, {
        name: "Instant Deposit - Entered Amount",
      });
    }
    logger.debug("Clicking the second Continue button");
    await page.click(InstantDepositsSelectors.continueButton);

    
      if (performVisualCheck && visualTest) {
      for (const loadingText of InstantDepositsSelectors.loadingStates) {
        await page.waitForFunction(
          (text: string) => !document.body.textContent?.includes(text),
          loadingText,
          { timeout: TEST_TIMEOUTS.DEFAULT }
        );
      }
      await visualTest.check(page, {
        name: "Instant Deposit - Confirm Order",
      });
    } 
    logger.step("Waiting for Confirm Order and clicking it");
    await waitForAndClickConfirmOrder(page);

    logger.step("Confirming in MetaMask (1st time)");
    await confirmMetaMaskAction(
      metamaskContext,
      password,
      TEST_TIMEOUTS.DEFAULT,
      MetamaskSelectors.confirmationSubmitButtonFooter
    );


    logger.step("Confirming in MetaMask (2nd time)");
    await confirmMetaMaskAction(
      metamaskContext,
      password,
      TEST_TIMEOUTS.DEFAULT,
      MetamaskSelectors.confirmButtonFooter
    );

    logger.step("Waiting for deposit success");
    await waitForDepositSuccess(page);

    if (performVisualCheck && visualTest) {
      await page.waitForTimeout(2000);
        await visualTest.check(page, {
        name: "Deposit Success",
      });
    }

    logger.debug("Clicking the Close button on the Instant Deposits modal");
    await page.click(InstantDepositsSelectors.instantDepositsCloseButton);
    await page.waitForTimeout(1000);

    logger.success("Deposit workflow completed successfully");
  } catch (error) {
    logger.error("Deposit workflow failed", error as Error, {
      url: page.url(),
    });
    throw error;
  }
}
