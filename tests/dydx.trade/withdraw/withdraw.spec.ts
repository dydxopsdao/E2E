import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import {
  checkInitialPortfolioValue,
  checkFinalPortfolioValue,
} from "@dydx/portfolio/actions/portfolio-actions";
import { BrowserContext, Page } from "@playwright/test";
import { WALLET_ADDRESSES } from "@constants/wallet-addresses.constants";
import { metamaskTest as test } from "@fixtures/metamaskFixture";
import { checkWithdrawCompleted, completeWithdrawal } from "@interactions/dydx/withdraw/actions/withdraw-actions";


const walletAddress = WALLET_ADDRESSES.PUBLIC_ARBITRUM;
const withdrawAmount = -12;

test.describe("Withdraw flow tests", () => {
  // Here we override the default retries
  test.describe.configure({ retries: 0 });

  test("withdraw flow - Arbitrum One", async ({
    metamaskContext,
    page,
  }: {
    metamaskContext: BrowserContext;
    page: Page;
  }) => {
    // Open dYdX and connect MetaMask
    await openDydxConnectMetaMask(page, metamaskContext);
    await page.bringToFront();
    const initialPortfolioValue = await checkInitialPortfolioValue(page);
    await completeWithdrawal(
      page,
      walletAddress,
      'button:has(div:has-text("Arbitrum"))'
    );
    await checkWithdrawCompleted(page, withdrawAmount);

    // Check for both withdrawal notifications in sequence
    //await checkWithdrawalNotifications(page, "$12.00");
    await checkFinalPortfolioValue(page, initialPortfolioValue, withdrawAmount);
  });
});
