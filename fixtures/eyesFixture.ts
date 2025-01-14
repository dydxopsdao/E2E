// fixtures/eyesFixture.ts
import { test as base } from "@playwright/test";
import {
  Eyes,
} from "@applitools/eyes-playwright";
import { runner, config } from "@config/applitools.config";

type EyesFixtures = {
  eyes: Eyes;
};

export const eyesTest = base.extend<EyesFixtures>({
  eyes: async ({ page }, use, testInfo) => {
    // Reuse shared runner and config
    const eyes = new Eyes(runner);
    eyes.setConfiguration(config);

    // Open Eyes
    await eyes.open(page, "dYdX App", testInfo.title);

    // Provide `eyes` to the test
    await use(eyes);

    // Close or abort after test
    try {
      await eyes.close();
    } catch {
      await eyes.abortIfNotClosed();
    }
  },
});
