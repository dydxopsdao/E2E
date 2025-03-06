import { combinedTest } from "./combinedFixture";
import { Eyes } from "@applitools/eyes-playwright";
import { runner, config } from "@config/applitools.config";
import { DummyEyes } from "./dummyEyes";

// Define the type for Eyes fixtures
type EyesFixtures = {
  eyes: Eyes;
};

// Extend combinedTest with Eyes fixtures
export const completeCombinedTest = combinedTest.extend<EyesFixtures>({
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

export default completeCombinedTest; 