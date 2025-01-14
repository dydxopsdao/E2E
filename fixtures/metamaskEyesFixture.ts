
import { metamaskTest } from "./metamaskFixture";
import { Eyes } from "@applitools/eyes-playwright";
import { runner, config } from "@config/applitools.config";

type MetaMaskEyesFixtures = {
  eyes: Eyes;
};

export const metamaskEyesTest = metamaskTest.extend<MetaMaskEyesFixtures>({
  eyes: async ({ page }, use, testInfo) => {
    // Reuse our shared runner and config
    const eyes = new Eyes(runner);
    eyes.setConfiguration(config);

    // Open Eyes with any default app/test name
    await eyes.open(page, "dYdX App", testInfo.title);

    // Provide `eyes` to the test
    await use(eyes);

    // Close or abort after
    try {
      await eyes.close();
    } catch {
      await eyes.abortIfNotClosed();
    }
  },
});
