import { metamaskEyesTest as test } from "@fixtures/metamaskEyesFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { TEST_TIMEOUTS } from "@constants/test.constants.js";
import { addNetwork } from "@wallets/metamask/actions/add-network";
import {
  checkInitialPortfolioValue,
  checkFinalPortfolioValue,
  clickWithdrawButton,
} from "@dydx/portfolio/actions/portfolio-actions";
import { closeOnboarding } from "@dydx/onboarding/actions/onboarding.actions";
import { instantDeposit } from "@dydx/instant-deposits/actions/instant-deposit";
import { BrowserContext } from "@playwright/test";
import { checkNotificationAppearance } from "@interactions/dydx/notifications/actions/notification-actions";
import { WALLET_ADDRESSES } from "@constants/wallet-addresses.constants";

const walletAddress = WALLET_ADDRESSES.PUBLIC;



/* test.describe("Withdraw flow tests", () => {
  // Here we override the default retries
  test.describe.configure({ retries: 1 });

  test("withdraw flow - Arbitrum One", async ({
    metamaskContext,
  }: {
    metamaskContext: BrowserContext;
  }) => {
    // Open dYdX and connect MetaMask
    const page = await openDydxConnectMetaMask(metamaskContext);
    await page.bringToFront();
    await closeOnboarding(page);
    await clickWithdrawButton(page);
  });
}); */
