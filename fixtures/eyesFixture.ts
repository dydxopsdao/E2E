// fixtures/eyesFixture.ts
import { test as base } from "@playwright/test";
import { Eyes } from "@applitools/eyes-playwright";
import { getEyesInstance } from "@config/applitools.config";

type EyesFixtures = {
  eyes: Eyes;
};

export const eyesTest = base.extend<EyesFixtures>({
  eyes: async ({ page }, use, testInfo) => {
    const useApplitools = process.env.USE_APPLITOOLS === "true";
    const eyes = getEyesInstance(testInfo.title);

    if (useApplitools) {
      await eyes.open(page);
    }

    // Provide eyesInstance to the test
    await use(eyes);

    if (useApplitools) {
      try {
        await eyes.close();
      } catch {
        await eyes.abortIfNotClosed();
      }
    }
  },
});
