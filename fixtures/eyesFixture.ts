// fixtures/eyesFixture.ts
import { test as base, Page } from "@playwright/test";
import { Eyes } from "@applitools/eyes-playwright";
import { runner, config } from "@config/applitools.config";
import { DummyEyes } from "./dummyEyes";

type EyesFixtures = {
  eyes: Eyes;
};

export const eyesTest = base.extend<EyesFixtures>({
  eyes: async ({ page }, use, testInfo) => {
    const useApplitools = process.env.USE_APPLITOOLS === "true";

    // Create either a real Eyes or a dummy instance
    const eyesInstance = useApplitools ? new Eyes(runner) : new DummyEyes();
    if (useApplitools) {
      eyesInstance.setConfiguration(config);
      await eyesInstance.open(page, "dYdX App", testInfo.title);
    }

    // Provide eyesInstance to the test
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
