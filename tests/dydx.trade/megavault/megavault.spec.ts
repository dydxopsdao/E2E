import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { closeOnboarding } from "@dydx/onboarding/actions/onboarding.actions";
import { BrowserContext, Page } from "@playwright/test";
import { metamaskEyesTest as test } from "@fixtures/metamaskEyesFixture";
import { navigateToViaHeader } from "@interactions/dydx/general/actions/navigation.actions";
import { vaultTransaction } from "@interactions/dydx/megavault/actions/megavault.actions";
import { Eyes } from "@applitools/eyes-playwright";



test.describe("Megavault flows", () => {
  test.describe.configure({ retries: 0 });
   test.beforeEach(async ({ metamaskContext, page }) => {
     await openDydxConnectMetaMask(page, metamaskContext);
     await page.bringToFront();
     await closeOnboarding(page);
     await navigateToViaHeader(page, "VAULT");
   });

  test("megavault deposit", async ({
    metamaskContext,
    page,
    eyes
  }: {
    metamaskContext: BrowserContext;
    page: Page;
    eyes: Eyes;
  }) => {
    // Perform deposit workflow
    await vaultTransaction(page, 12, { eyes, performEyesCheck: false });

  });
  test("megavault withdraw", async ({
    metamaskContext,
    page,
    eyes,
  }:
  {
    metamaskContext: BrowserContext;
    page: Page;
    eyes: Eyes;
  }) => {
    await vaultTransaction(page, -12, { eyes, performEyesCheck: false });
  });
});
