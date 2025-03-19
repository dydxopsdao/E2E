// fixtures/metamaskFixture.ts

import { test as base } from "@playwright/test";
import { BrowserContext, Page } from "@playwright/test";
import { setupMetaMaskContext } from "../Interactions/wallets/metamask/actions/setup-metamask";
import { importWallet } from "../Interactions/wallets/metamask/actions/import-wallet";
import "dotenv/config";
import { logger } from "@utils/logger/logging-utils";

type MyFixtures = {
  metamaskContext: BrowserContext;
  page: Page;
  seedPhraseEnvKey: string;
};

export const metamaskTest = base.extend<MyFixtures>({
  // Default to SEED_PHRASE, but allow tests to override
  seedPhraseEnvKey: ["SEED_PHRASE", { option: true }],

  metamaskContext: async (
    { browser, seedPhraseEnvKey }: { browser: any; seedPhraseEnvKey: string },
    use
  ) => {
    // 1. Launch browser context with MetaMask extension
    const context = await setupMetaMaskContext(browser);

    // 2. Patch browser properties
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-GB", "en"],
      });
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
    });

    // 3. Wait for MetaMask extension page
    const metamaskPage = await context.waitForEvent("page", (page) =>
      page.url().startsWith("chrome-extension://")
    );

    // 4. Import wallet using the specified environment variable
    logger.info(`Using seed phrase from environment variable: ${seedPhraseEnvKey}`);
    const seedPhrase = process.env[seedPhraseEnvKey] || 
                        process.env.SEED_PHRASE || 
                        "test test test ...";
    const password = process.env.METAMASK_PASSWORD || "test-password";

    await importWallet(metamaskPage, { seedPhrase, password });

    // 5. Provide the MetaMask context to tests
    await use(context);

    // 6. Cleanup
    try {
      await context.close();
    } catch (error) {
      logger.warning("Error closing context:");
    }
  },

  page: async ({ metamaskContext }, use) => {
    // Get the pages that are currently open
    const pages = metamaskContext.pages();

    // Look for a non-extension page (if available)
    let testPage = pages.find(
      (page) => !page.url().startsWith("chrome-extension://")
    );

    // If no such page exists, throw an error.
    // (Note: In persistent contexts with extensions, creating a new page is often disallowed.)
    if (!testPage) {
      throw new Error("No non-extension page available in context");
    }

    await use(testPage);
  },
});
