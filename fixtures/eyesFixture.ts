// fixtures/eyesFixture.ts
import { test as base } from "@playwright/test";
import { Eyes } from "@applitools/eyes-playwright";
import { getEyesInstance } from "@config/applitools.config";
import { logger } from "@utils/logger/logging-utils";

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
        logger.info(`FIXTURE [${testInfo.title} EYES_FIXTURE]: Teardown - CALLING eyes.close(false).`);
        await eyes.close(false);
        logger.info(`FIXTURE [${testInfo.title} EYES_FIXTURE]: Teardown - eyes.close(false) RETURNED.`);
      } catch (e) {
        logger.error(`FIXTURE [${testInfo.title} EYES_FIXTURE]: Teardown - ERROR during eyes.close(false):`, e as Error);
        await eyes.abortIfNotClosed();
        logger.info(`FIXTURE [${testInfo.title} EYES_FIXTURE]: Teardown - eyes.abortIfNotClosed() after error.`);
      }
    }
  },
});
