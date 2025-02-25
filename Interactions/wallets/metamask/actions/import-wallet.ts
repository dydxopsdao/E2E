import type { Page } from "playwright";
import { MetamaskSelectors } from "@wallets/metamask/selectors/metamask-selectors";
import { logger } from "@utils/logger/logging-utils";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { metamaskState } from "@wallets/metamask/actions/metamask-state";

interface ImportWalletOptions {
  seedPhrase: string;
  password: string;
}

interface StepConfig {
  selector: string;
  name: string;
  optional?: boolean;
  timeout?: number;
}

async function executeStep(
  page: Page,
  {
    selector,
    name,
    optional = false,
    timeout = TEST_TIMEOUTS.ELEMENT,
  }: StepConfig
): Promise<boolean> {
  try {
    await page.click(selector, { timeout });
    logger.success(`Completed step: ${name}`);
    return true;
  } catch (error) {
    if (optional) {
      logger.info(`Optional step skipped: ${name}`, { selector });
      return false;
    }
    logger.error(`Failed step: ${name}`, error as Error, { selector });
    throw error;
  }
}

async function fillSeedPhrase(page: Page, seedPhrase: string): Promise<void> {
  logger.step("Filling seed phrase");
  try {
    const words = seedPhrase.split(" ");
    for (let i = 0; i < words.length; i++) {
      const wordSelector = `[data-testid="import-srp__srp-word-${i}"]`;
      await page.fill(wordSelector, words[i]);
    }
    logger.success("Seed phrase filled successfully");
  } catch (error) {
    logger.error("Failed to fill seed phrase", error as Error);
    throw error;
  }
}

async function setupPassword(
  page: Page,
  password: string,
  timeout = TEST_TIMEOUTS.DEFAULT
): Promise<void> {
  logger.step("Setting up password");
  try {
    // Wait for password input
    await page.waitForSelector(MetamaskSelectors.passwordCreateInput, {
      timeout,
      state: "visible",
    });

    // Fill password fields
    await page.fill(MetamaskSelectors.passwordCreateInput, password);
    await page.fill(MetamaskSelectors.createPasswordConfirm, password);

    // Accept terms if present
    await executeStep(page, {
      selector: MetamaskSelectors.createPasswordTerms,
      name: "Accept password terms",
      optional: false,
    });

    // Submit password
    await executeStep(page, {
      selector: MetamaskSelectors.createPasswordImportButton,
      name: "Submit password",
    });

    logger.success("Password setup completed");
  } catch (error) {
    if (error instanceof Error && error.message.includes("timeout")) {
      logger.info("Password setup screen not found, skipping", {
        timeout,
      });
      return;
    }
    logger.error("Failed to setup password", error as Error);
    throw error;
  }
}

/**
 * Saves the MetaMask extension ID for later use
 */
function saveExtensionId(page: Page): void {
  const url = page.url();
  const match = url.match(/chrome-extension:\/\/([^/]+)/);

  if (match && match[1]) {
    metamaskState.setExtensionId(match[1]);
  } else {
    logger.warning("Could not extract extension ID from URL", { url });
  }
}

/**
 * Imports a wallet into MetaMask using the provided seed phrase and password
 * @param page - Playwright Page object
 * @param options - Import options containing seed phrase and password
 */
export async function importWallet(
  page: Page,
  { seedPhrase, password }: ImportWalletOptions
): Promise<void> {
  logger.step("Starting wallet import process");

  try {
    // Save extension ID at the start
    saveExtensionId(page);

    // Initial setup steps
    const initialSteps: StepConfig[] = [
      {
        selector: MetamaskSelectors.agreeTermsofUseRadioButton,
        name: "Accept terms of use",
        optional: false,
      },
      {
        selector: MetamaskSelectors.importWalletButton,
        name: "Click import wallet",
        optional: false,
      },
      {
        selector: MetamaskSelectors.metricsNoThanks,
        name: "Decline metrics",
        optional: false,
      },
    ];

    // Execute initial steps
    for (const step of initialSteps) {
      await executeStep(page, step);
    }

    // Fill seed phrase
    await fillSeedPhrase(page, seedPhrase);

    // Confirm seed phrase
    await executeStep(page, {
      selector: MetamaskSelectors.confirmSrpButton,
      name: "Confirm recovery phrase",
      timeout: TEST_TIMEOUTS.ELEMENT,
    });

    // Setup password
    await setupPassword(page, password);

    // Complete onboarding steps
    const finalSteps: StepConfig[] = [
      {
        selector: MetamaskSelectors.onboardingComplete,
        name: "Complete onboarding",
      },
      {
        selector: MetamaskSelectors.pinExtension,
        name: "Pin extension",
      },
      {
        selector: MetamaskSelectors.pinExtensionDone,
        name: "Finish extension setup",
      },
    ];

    // Execute final steps
    for (const step of finalSteps) {
      await executeStep(page, step);
    }

    logger.success("Wallet import completed successfully", {
      extensionId: metamaskState.getExtensionId(),
    });
    //await page.close();
  } catch (error) {
    logger.error("Wallet import failed", error as Error, {
      seedPhraseLength: seedPhrase.split(" ").length,
      hasExtensionId: metamaskState.hasExtensionId(),
    });
    throw error;
    
  }
}
