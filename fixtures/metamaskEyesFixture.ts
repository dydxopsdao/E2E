// fixtures/metamaskEyesFixture.ts
import { metamaskTest } from "./metamaskFixture";
import { Eyes } from "@applitools/eyes-playwright";
import { runner, config } from "@config/applitools.config";
import { DummyEyes } from "./dummyEyes";

type MetaMaskEyesFixtures = {
  eyes: Eyes;
};

export const metamaskEyesTest = metamaskTest.extend<MetaMaskEyesFixtures>({
  eyes: async ({ page }, use, testInfo) => {
    const useApplitools = process.env.USE_APPLITOOLS === "true";

    // Instantiate either a real or dummy Eyes instance
    const eyesInstance = useApplitools ? new Eyes(runner) : new DummyEyes();

    if (useApplitools) {
      eyesInstance.setConfiguration(config);
      await eyesInstance.open(page, "dYdX App", testInfo.title);
    }

    // Provide `eyes` (always defined) to the test
    await use(eyesInstance as Eyes);

    if (useApplitools) {
      try {
        await eyesInstance.close();
      } catch {
        await eyesInstance.abortIfNotClosed();
      }
    }
  },
});
