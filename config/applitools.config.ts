// config/applitools.config.ts
import {
  Configuration,
  BatchInfo,
  VisualGridRunner,
  Eyes,
} from "@applitools/eyes-playwright";
import { DummyEyes } from "../fixtures/dummyEyes";
require("dotenv").config({ path: process.env.ENV_PATH || ".env" });

// Create a singleton runner to be used by all tests
let sharedRunner: VisualGridRunner | null = null;

/**
 * Get a shared runner instance to reuse across tests
 */
export function getSharedRunner(): VisualGridRunner {
  if (!sharedRunner) {
    sharedRunner = new VisualGridRunner({ testConcurrency: 10 });
  }
  return sharedRunner;
}

/**
 * Get a shared configuration to be used by all tests
 */
export function getSharedConfiguration(): Configuration {
  const config = new Configuration();
  
  // Essential configuration
  config.setApiKey(process.env.APPLITOOLS_API_KEY || "");
  config.setServerUrl(process.env.APPLITOOLS_SERVER_URL || "https://eyesapi.applitools.com");
  
  // Handle batch information consistently
  const batchId = process.env.APPLITOOLS_BATCH_ID || '';
  const batch = new BatchInfo({ name: `DYDX-${batchId || new Date().toISOString()}` });
  if (batchId) {
    batch.setId(batchId);
  }
  config.setBatch(batch);
  
  // Viewport and browser configuration
  config.setViewportSize({ width: 1920, height: 1080 });
  config.addBrowser(1920, 1080, "chrome");
  config.addBrowser(1920, 1080, "firefox");
  
  // App and performance settings
  config.setAppName("dydx.trade");
  config.setIgnoreDisplacements(true);
  config.setEnablePatterns(true);
  config.setUseDom(true);
  config.setMatchLevel("Layout");
  config.setWaitBeforeScreenshots(5);
  
  return config;
}

/**
 * Get an Eyes instance (real or dummy based on environment)
 */
export function getEyesInstance(testName?: string): Eyes {
  const useApplitools = process.env.USE_APPLITOOLS === "true";
  
  if (!useApplitools) {
    return new DummyEyes() as unknown as Eyes;
  }
  
  const eyes = new Eyes(getSharedRunner());
  const config = getSharedConfiguration();
  
  if (testName) {
    config.setTestName(testName);
  }
  
  eyes.setConfiguration(config);
  return eyes;
}

// For backwards compatibility
export const runner = getSharedRunner();
export const config = getSharedConfiguration();