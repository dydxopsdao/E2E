import { test } from "../../../../fixtures/metamaskFixture.ts";
import { confirmMetaMaskAction } from "../../../../Interactions/wallets/metamask/actions/connect-metamask.ts";
import { MetamaskSelectors } from "../../../../Interactions/wallets/metamask/selectors/metamask-selectors.ts";
import { expect } from "@playwright/test";
import { navigateToDydxPage } from "../../../../Interactions/dydx/general/actions/navigation.actions.ts";
import { selectWallet, sendRequest, triggerWalletConnectionModal } from "../../../../Interactions/dydx/connect-wallet/actions/connect-wallet.actions.ts";
import { getFirstPageFromContext } from "../../../../utils/get-first-page-from-context.ts";
import { ConnectWalletSelectors } from "../../../../Interactions/dydx/connect-wallet/selectors/connect-wallet-selectors.ts";
import { TEST_TIMEOUTS } from "../../../../constants";

test(
  "Connect MetaMask Wallet",
  async ({ metamaskContext, eyes }) => {
    const password = process.env.METAMASK_PASSWORD || "";

    const page = getFirstPageFromContext(metamaskContext);

    // Navigate to dYdX portfolio overview
    await navigateToDydxPage(page, "/portfolio/overview", {
      waitUntil: "domcontentloaded",
    });

    // Trigger wallet connection modal and select MetaMask
    await triggerWalletConnectionModal(page);
    await eyes.check("Connect Wallet Modal with Options", {
      fully: true,
      matchLevel: "Dynamic",
    });
    await selectWallet(page, "MetaMask");

    // Perform sequential MetaMask confirmations
    await confirmMetaMaskAction(
      metamaskContext,
      password,
      TEST_TIMEOUTS.DEFAULT,
      MetamaskSelectors.confirmButton
    );

    // Bring main page to front and send the request
    await page.bringToFront();
    await eyes.check("Sign Message Modal", {
      fully: true,
      matchLevel: "Dynamic",
    })
    await sendRequest(page);

    const confirmSelectors = [
      MetamaskSelectors.confirmButtonFooter,
      MetamaskSelectors.confirmButtonFooter,
    ];

    for (const selector of confirmSelectors) {
      await confirmMetaMaskAction(metamaskContext, password, TEST_TIMEOUTS.DEFAULT, selector);
    }

    const walletWithFunds = page.locator(
      ConnectWalletSelectors.metamaskWalletWithFunds
    );

    await expect(walletWithFunds).toBeVisible();

  });

/* test("metamask connect", async ({ context }) => {
  const page = await openDydxConnectMetaMask(context);
}); */