import { EyesFixture } from "@applitools/eyes-playwright/fixture";
import { defineConfig, ReporterDescription } from "@playwright/test";

export default defineConfig<EyesFixture>({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [
    ["@applitools/eyes-playwright/reporter"] as ReporterDescription,
    ["html", { outputFolder: "playwright-report" }] as ReporterDescription,
  ],
  use: {
    eyesConfig: {
      apiKey: process.env.APPLITOOLS_API_KEY || "YOUR_APPLITOOLS_API_KEY",
      serverUrl: "https://eyes.applitools.com/",
      appName: "dydx.trade",
      matchLevel: "Layout",
      waitBeforeScreenshots: 10,
    },
    viewport: { width: 1920, height: 1080 },
    trace: "on-first-retry",
    navigationTimeout: 30000,
    actionTimeout: 15000,
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  timeout: 60000,
  expect: { timeout: 10000 },
});
