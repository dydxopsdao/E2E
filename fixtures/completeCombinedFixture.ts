import { combinedTest } from "./combinedFixture";
import { Eyes } from "@applitools/eyes-playwright";
import { getEyesInstance } from "@config/applitools.config";

// Define the type for Eyes fixtures
type EyesFixtures = {
  eyes: Eyes;
};

// Extend combinedTest with Eyes fixtures
export const completeCombinedTest = combinedTest.extend<EyesFixtures>({
  eyes: async ({ page }, use, testInfo) => {
    const useApplitools = process.env.USE_APPLITOOLS === "true";
    const eyes = getEyesInstance(testInfo.title);

    if (useApplitools) {
      await eyes.open(page);
    }

    // Use eyes instance in test
    await use(eyes);

    // Close eyes after test
    if (useApplitools) {
      try {
        await eyes.close(false); // Don't throw on failed tests
      } catch (error) {
        await eyes.abortIfNotClosed();
      }
    }
  },
});

export default completeCombinedTest; 