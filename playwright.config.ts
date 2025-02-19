require("dotenv").config({ path: process.env.ENV_PATH || ".env" });
import { defineConfig, ReporterDescription } from "@playwright/test";
import { TEST_TIMEOUTS } from "./constants";

const isApplitoolsRun = process.env.USE_APPLITOOLS === "true";

export default defineConfig({
  globalSetup: require.resolve("./global-setup"),
  globalTeardown: require.resolve("./globalTeardown"),
  testDir: "./tests/",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ...(isApplitoolsRun
      ? [["@applitools/eyes-playwright/reporter"] as ReporterDescription]
      : []),
    // Add the JUnit reporter to generate XML output.
    ["junit", { outputFile: "results.xml" }] as ReporterDescription,
    // HTML reporter for the browser report.
    ["html", { outputFolder: "playwright-report" }] as ReporterDescription,
  ],
  use: {
    ...(isApplitoolsRun
      ? {
          eyesConfig: {
            apiKey: process.env.APPLITOOLS_API_KEY || "",
            serverUrl: "https://eyes.applitools.com/",
            appName: "dydx.trade",
            matchLevel: "Layout",
            waitBeforeScreenshots: 5,
          },
        }
      : {}),
    viewport: { width: 1920, height: 1080 },
    trace: "on",
    navigationTimeout: TEST_TIMEOUTS.NAVIGATION,
    actionTimeout: TEST_TIMEOUTS.ACTION,
    headless: false,
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
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
