import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { BrowserContext, Page } from "@playwright/test";
import { WALLET_ADDRESSES } from "@constants/wallet-addresses.constants";
import { metamaskTest as test } from "@fixtures/metamaskFixture";
import { checkWithdrawCompleted, completeWithdrawal } from "@interactions/dydx/withdraw/actions/withdraw-actions";


const walletAddress = WALLET_ADDRESSES.PUBLIC_ARBITRUM;

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
    await completeWithdrawal(
      page,
      walletAddress,
      'button:has(div:has-text("Arbitrum"))',
      "23"
    );
    await checkWithdrawCompleted(page,);
  });
  test("withdraw flow - Avalanche", async ({
    metamaskContext,
    page,
  }: {
    metamaskContext: BrowserContext;
    page: Page;
  }) => {
    // Open dYdX and connect MetaMask
    await openDydxConnectMetaMask(page, metamaskContext);
    await page.bringToFront();
    await completeWithdrawal(
      page,
      walletAddress,
      'button:has(div:has-text("Avalanche"))',
      "12"
    );
    await checkWithdrawCompleted(page);

  });
});
