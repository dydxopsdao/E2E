require("dotenv").config({ path: process.env.ENV_PATH || ".env" });
import { defineConfig, ReporterDescription } from "@playwright/test";
import { TEST_TIMEOUTS } from "./constants";

const isApplitoolsRun = process.env.USE_APPLITOOLS === "true";

export default defineConfig({
  globalSetup: require.resolve("./global-setup"),
  globalTeardown: require.resolve("./globalTeardown"),
  testDir: "./tests/",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: [
    ...(isApplitoolsRun
      ? [["@applitools/eyes-playwright/reporter"] as ReporterDescription]
      : []),
    ["html", { outputFolder: "playwright-report" }] as ReporterDescription,
  ],
  use: {
    ...(isApplitoolsRun
      ? {
          // This is just for the Applitools reporter - the actual configuration is in config/applitools.config.ts
          eyesConfig: {
            testConcurrency: 10,
            dontCloseBatches: true,
          },
        }
      : {}),
    viewport: { width: 1920, height: 1080 },
    trace: "retain-on-failure",
    navigationTimeout: TEST_TIMEOUTS.NAVIGATION,
    actionTimeout: TEST_TIMEOUTS.ACTION,
    headless: false,
    screenshot: "only-on-failure",
  },
  projects: [
    // Main tests that will run concurrently (using multiple workers via CLI override).
    {
      name: "main-tests",
      testDir: "./tests/",
      testIgnore: [
        '**/cancel-order/**/*.spec.ts', 
        '**/megavault/**/*.spec.ts'
      ],
      use: {
        browserName: "chromium",
        launchOptions: {
          args: [
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-setuid-sandbox",
          ],
        },
        ignoreHTTPSErrors: true,
      },
    },
    
    // Cancel-order tests that will run sequentially.
    {
      name: "cancel-order-tests",
      testDir: "./tests/",
      testMatch: ['**/cancel-order/**/*.spec.ts'],
      use: {
        browserName: "chromium",
        launchOptions: {
          args: [
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-setuid-sandbox",
          ],
        },
        ignoreHTTPSErrors: true,
      },
    },

    // Megavault tests that will run sequentially.
    {
      name: "megavault-tests",
      testDir: "./tests/",
      testMatch: ['**/megavault/**/*.spec.ts'],
      use: {
        browserName: "chromium",
        launchOptions: {
          args: [
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-setuid-sandbox",
          ],
        },
        ignoreHTTPSErrors: true,
      },
    },
  ],
  timeout: TEST_TIMEOUTS.TEST,
  expect: { timeout: TEST_TIMEOUTS.ELEMENT },
});
