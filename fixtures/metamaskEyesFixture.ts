// fixtures/metamaskEyesFixture.ts
import { metamaskTest } from "./metamaskFixture";
import { Eyes } from "@applitools/eyes-playwright";
import { getEyesInstance } from "@config/applitools.config";

type MetaMaskEyesFixtures = {
  eyes: Eyes;
};

export const metamaskEyesTest = metamaskTest.extend<MetaMaskEyesFixtures>({
  eyes: async ({ page }, use, testInfo) => {
    const useApplitools = process.env.USE_APPLITOOLS === "true";
    const eyes = getEyesInstance(testInfo.title);

    if (useApplitools) {
      await eyes.open(page);
    }

    // Provide `eyes` (always defined) to the test
    await use(eyes);

    if (useApplitools) {
      try {
        await eyes.close(false);
      } catch {
        await eyes.abortIfNotClosed();
      }
    }
  },
});
