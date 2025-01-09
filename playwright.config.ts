require("dotenv").config({ path: process.env.ENV_PATH || ".env" });
import { EyesFixture } from "@applitools/eyes-playwright/fixture";
import { defineConfig, ReporterDescription } from "@playwright/test";
import { PATHS, TEST_TIMEOUTS } from "./constants";

const isApplitoolsRun = process.env.USE_APPLITOOLS === "true";
const isLocalRun = process.env.LOCAL_RUN === "true";


export default defineConfig<EyesFixture>({
  testDir: "./tests/",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [
    ...(isApplitoolsRun
      ? [["@applitools/eyes-playwright/reporter"] as ReporterDescription]
      : []),
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
            waitBeforeScreenshots: 10,
          },
        }
      : {}),
    viewport: { width: 1920, height: 1080 },
    trace: "retain-on-failure",
    navigationTimeout: TEST_TIMEOUTS.NAVIGATION,
    actionTimeout: TEST_TIMEOUTS.ACTION,
    headless: !isLocalRun,
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
