// fixtures/metamaskFixture.ts
import { test as base } from "@applitools/eyes-playwright/fixture";
import { BrowserContext, Page } from "@playwright/test";
import { setupMetaMaskContext } from "../Interactions/wallets/metamask/actions/setup-metamask";
import { importWallet } from "../Interactions/wallets/metamask/actions/import-wallet";
import "dotenv/config";

type MyFixtures = {
  metamaskContext: BrowserContext;
};

export const test = base.extend<MyFixtures>({
  metamaskContext: async ({ browser }, use) => {
    // 1. Launch browser context with MetaMask extension
    const context = await setupMetaMaskContext(browser);
    
    // 2. Patch browser properties to mimic a real user
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-GB", "en"],
      });
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
    });

    // 3. Wait for the MetaMask extension page to open
    const metamaskPage = await context.waitForEvent("page", (page) =>
      page.url().startsWith("chrome-extension://")
    );
    const pages = context.pages();
    const emptyPage = pages[0];
    if (emptyPage) await emptyPage.close();
    // 4. Import wallet using environment variables or defaults
    const seedPhrase = process.env.SEED_PHRASE || "test test test ...";
    const password = process.env.METAMASK_PASSWORD || "test-password";

    await importWallet(metamaskPage, { seedPhrase, password });

    // 5. Provide the MetaMask context to tests
    await use(context);

    // 6. Clean up after tests
    await context.close();
  },

  // Override the default page fixture to use your MetaMask context
  page: async ({ metamaskContext }, use) => {
    // Create a single page from the MetaMask context
    const page: Page = await metamaskContext.newPage();
    await use(page);
    // Cleanup: close the page after the test
    await page.close();
  },
});
