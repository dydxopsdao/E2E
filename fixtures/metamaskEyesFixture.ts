// fixtures/metamaskEyesFixture.ts
import { metamaskTest } from "./metamaskFixture";
import { Eyes } from "@applitools/eyes-playwright";
import { getEyesInstance } from "@config/applitools.config";
import { logger } from "@utils/logger/logging-utils"; // Ensure this path is correct

type MetaMaskEyesFixtures = {
  eyes: Eyes;
};

export const metamaskEyesTest = metamaskTest.extend<MetaMaskEyesFixtures>({
  eyes: async ({ page }, use, testInfo) => {
    const testTitle = testInfo.title; // Cache for cleaner log messages
    logger.info(`FIXTURE [${testTitle}]: Setup - START`);

    let useApplitools = process.env.USE_APPLITOOLS === "true";
    logger.info(`FIXTURE [${testTitle}]: Setup - USE_APPLITOOLS=${useApplitools}`);

    // --- Optional: Temporary override for debugging CI hang ---
    // if (process.env.CI === "true" && process.env.DISABLE_APPLITOOLS_FOR_DEBUG === "true") {
    //     logger.warn(`FIXTURE [${testTitle}]: CI DEBUG - Forcing Applitools OFF for this run.`);
    //     useApplitools = false;
    // }
    // --- End temporary override ---

    logger.info(`FIXTURE [${testTitle}]: Setup - Calling getEyesInstance().`);
    const eyes = getEyesInstance(testTitle); // `getEyesInstance` might return DummyEyes if useApplitools is false
    logger.info(`FIXTURE [${testTitle}]: Setup - getEyesInstance() returned. Eyes object type: ${eyes.constructor.name}`);


    if (useApplitools && eyes.constructor.name !== 'DummyEyes') { // Check if it's not DummyEyes
      logger.info(`FIXTURE [${testTitle}]: Setup - Applitools is ON. Attempting eyes.open().`);
      try {
        await eyes.open(page);
        logger.info(`FIXTURE [${testTitle}]: Setup - eyes.open() successful.`);
      } catch (e) {
        logger.error(`FIXTURE [${testTitle}]: Setup - ERROR during eyes.open():`, e as Error);
        // Decide if you want to throw or continue with DummyEyes logic if open fails
        // For now, it will proceed and likely fail later or use a closed eyes object.
      }
    } else {
      logger.info(`FIXTURE [${testTitle}]: Setup - Applitools is OFF or DummyEyes in use. Skipping eyes.open().`);
    }

    // Provide `eyes` to the test
    logger.info(`FIXTURE [${testTitle}]: Setup - Calling use(eyes). Test will run now.`);
    await use(eyes);
    logger.info(`FIXTURE [${testTitle}]: Teardown - Test steps COMPLETED. Starting fixture teardown.`);

    if (useApplitools && eyes.constructor.name !== 'DummyEyes' && eyes.getIsOpen()) { // Also check if eyes was actually opened
      logger.info(`FIXTURE [${testTitle}]: Teardown - Applitools is ON and Eyes is open.`);
      try {
        logger.info(`FIXTURE [${testTitle}]: Teardown - CALLING eyes.close(false).`);
        const results = await eyes.close(false); // Using false: do not throw on visual differences
        if (results) {
          logger.info(`FIXTURE [${testTitle}]: Teardown - eyes.close(false) RETURNED. URL: ${results.getUrl()}`);
        } else {
          // This can happen if eyes.close() is called on an already closed/aborted Eyes instance,
          // or if there were no checkpoints.
          logger.info(`FIXTURE [${testTitle}]: Teardown - eyes.close(false) RETURNED (no results object or already closed/aborted).`);
        }
      } catch (e) {
        logger.error(`FIXTURE [${testTitle}]: Teardown - ERROR during eyes.close(false):`, e as Error);
        logger.info(`FIXTURE [${testTitle}]: Teardown - Attempting eyes.abortIfNotClosed() due to error.`);
        try {
            await eyes.abortIfNotClosed();
            logger.info(`FIXTURE [${testTitle}]: Teardown - eyes.abortIfNotClosed() successful after error.`);
        } catch (abortError) {
            logger.error(`FIXTURE [${testTitle}]: Teardown - ERROR during eyes.abortIfNotClosed() after initial error:`, abortError as Error);
        }
      }
    } else if (useApplitools && eyes.constructor.name !== 'DummyEyes' && !eyes.getIsOpen()) {
        logger.info(`FIXTURE [${testTitle}]: Teardown - Applitools is ON but Eyes was not open. Skipping close/abort.`);
    }
    else {
      logger.info(`FIXTURE [${testTitle}]: Teardown - Applitools is OFF or DummyEyes in use. Skipping close/abort.`);
    }
    logger.info(`FIXTURE [${testTitle}]: Teardown - Fixture teardown FINISHED.`);
  },
});