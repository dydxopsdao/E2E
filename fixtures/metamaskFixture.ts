// fixtures/metamaskFixture.ts

import { test as base } from "@playwright/test";
import { BrowserContext, Page } from "@playwright/test";
import { setupMetaMaskContext } from "../Interactions/wallets/metamask/actions/setup-metamask";
import { importWallet } from "../Interactions/wallets/metamask/actions/import-wallet";
import "dotenv/config";

type MyFixtures = {
  metamaskContext: BrowserContext;
  page: Page;
  seedPhraseEnvKey?: string;
};

export const metamaskTest = base.extend<MyFixtures>({
  seedPhraseEnvKey: ["SEED_PHRASE", { option: true }],

  metamaskContext: async (
    { browser, seedPhraseEnvKey }: { browser: any; seedPhraseEnvKey?: string },
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
    const pages = context.pages();
    const emptyPage = pages[0];
    if (emptyPage) await emptyPage.close();

    // 4. Import wallet
    const seedPhrase =
      (seedPhraseEnvKey ? process.env[seedPhraseEnvKey] : undefined) ||
      process.env.SEED_PHRASE ||
      "test test test ...";
    const password = process.env.METAMASK_PASSWORD || "test-password";

    await importWallet(metamaskPage, { seedPhrase, password });

    // 5. Provide the MetaMask context to tests
    await use(context);

    // 6. Cleanup
    await context.close();
  },

  page: async ({ metamaskContext }, use) => {
    const page: Page = await metamaskContext.newPage();
    await use(page);
    await page.close();
  },
});
