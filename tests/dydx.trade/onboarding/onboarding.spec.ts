import { metamaskVisualTest as test } from "@fixtures/metamaskVisualFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { learnMoreStepOnboarding, nextStepOnboarding } from "@dydx/onboarding/actions/onboarding.actions";
import { InstantDepositsSelectors } from "@dydx/instant-deposits/selectors/instant-deposits.selectors";
import { BrowserContext, Page } from "@playwright/test";
import { VisualTestingHelper } from "@utils/visual-check";


test.use({ seedPhraseEnvKey: "SEED_PHRASE_EMPTY" });
// TODO: Currently skipped due to: https://linear.app/dydx/issue/BUG2-225/unable-to-close-instant-deposits-if-onboarding-modal-is-open-behind
test.skip("Introducing dydx unlimited", async ({
  metamaskContext,
  visualTest,
  page,
}: {
  metamaskContext: BrowserContext;
  visualTest: VisualTestingHelper;
  page: Page;
}) => {
  try {
    // Arrange
    logger.step("Setting up onboarding diaglog test");
    await openDydxConnectMetaMask(page, metamaskContext);
    // Act
    console.log(page.url());
    await page.click(InstantDepositsSelectors.instantDepositsCloseButton);
    // Assert
    await visualTest.check(page, {
      name: "Step 1 - Introducing dYdX Unlimited"
    });

    await learnMoreStepOnboarding(page);
    await visualTest.check(page, {
      name: "Step 2 - Instant Market Listings"
    });

    await nextStepOnboarding(page);
    await visualTest.check(page, {
      name: "Step 3 - MegaVault"
    });
  

    await nextStepOnboarding(page);
    await visualTest.check(page, {
      name: "Step 4 - Affiliate Program"
    });

    await nextStepOnboarding(page);
    await visualTest.check(page, {
      name: "Step 5 - New Trading Rewards"
    });
  } catch (error) {
    logger.error("Market page test failed", error as Error);
    throw error;
  }
});
