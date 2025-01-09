import { test } from "@applitools/eyes-playwright/fixture";
import { navigateToDydxPage } from "../../../Interactions/dydx/general/actions/navigation.actions";
import { triggerWalletConnectionModal } from "../../../Interactions/dydx/connect-wallet/actions/connect-wallet.actions";
import { ConnectWalletSelectors } from "../../../Interactions/dydx/connect-wallet/selectors/connect-wallet-selectors";
import { TEST_TIMEOUTS } from "../../../constants";


   test("Language Dropdown Works", async ({ page, eyes }) => {
    await navigateToDydxPage(page, "/portfolio/overview");

    // Click the "Connect wallet" button to open the modal
    await triggerWalletConnectionModal(page);

    // Wait for modal to open
    await page
      .locator(ConnectWalletSelectors.walletConnectModal)
      .waitFor({ state: "visible", timeout: TEST_TIMEOUTS.DEFAULT });

    // Click the language dropdown
    await page.locator(ConnectWalletSelectors.languageDropdown).click();

    // Wait for options to be visible
    await page
      .locator(ConnectWalletSelectors.languageDropdownMenu)
      .waitFor({ state: "visible", timeout: TEST_TIMEOUTS.DEFAULT });

    await eyes.check("Language Dropdown Open", {
      fully: true,
      matchLevel: "Layout",
    });
  });

