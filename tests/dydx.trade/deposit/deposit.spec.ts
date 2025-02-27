import { metamaskEyesTest as test } from "@fixtures/metamaskEyesFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { TEST_TIMEOUTS } from "@constants/test.constants.js";
import { addNetwork } from "@wallets/metamask/actions/add-network";
import {
  checkInitialPortfolioValue,
  checkFinalPortfolioValue,
} from "@dydx/portfolio/actions/portfolio-actions";
import { closeOnboarding } from "@dydx/onboarding/actions/onboarding.actions";
import { instantDeposit } from "@interactions/dydx/deposits/actions/deposit-actions";
import { BrowserContext, Page } from "@playwright/test";
import { checkNotificationAppearance } from "@interactions/dydx/notifications/actions/notification-actions";
import { Eyes } from "@applitools/eyes-playwright";
import { NotificationSelectors } from "@interactions/dydx/notifications/selectors/notification-selectors";
import { DepositsSelectors } from "@interactions/dydx/deposits/selectors/deposits.selectors";

const depositAmount = 12;

test.describe("Instant deposit flow tests", () => {
  test.describe.configure({ retries: 0 });
  test("instant deposit core flow - Arbitrum One", async ({
    metamaskContext,
    eyes,
    page,
  }: {
    metamaskContext: BrowserContext;
    eyes: Eyes;
    page: Page;
  }) => {
    // Open dYdX and connect MetaMask
    await openDydxConnectMetaMask(page, metamaskContext);
    // Add Arbitrum One network
    await addNetwork(metamaskContext, "Arbitrum One", TEST_TIMEOUTS.DEFAULT);
    await page.bringToFront();
    await closeOnboarding(page);

    // Check initial portfolio value
    const initialPortfolioValue = await checkInitialPortfolioValue(page);

    // Perform the deposit workflow
    await instantDeposit(
      page,
      depositAmount,
      metamaskContext,
      'button:has(div:has-text("Arbitrum"))',
      {
        eyes,
        performEyesCheck: false,
      }
    );
    // Check for notification appearance
    /* await checkNotificationAppearance(
      page,
      NotificationSelectors.instantDepositToast,
      NotificationSelectors.instantDepositHeader,
      NotificationSelectors.depositCompletedMessage,
      "Deposit",
      "Deposit completed"
    ); */
    // Check final portfolio value and validate the increase
    await checkFinalPortfolioValue(page, initialPortfolioValue, depositAmount);
  });
});