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

// Determine the type of run environment
enum RunEnvironment {
  LOCAL = 'local',        // Local development run
  CI_MANUAL = 'manual',   // Manual CI run (triggered via workflow_dispatch)
  CI_WEBHOOK = 'webhook'  // Automated CI run (triggered via webhook)
}

/**
 * Determine the current run environment
 */
function getRunEnvironment(): RunEnvironment {
  // Check if explicitly set to local in environment
  if (process.env.LOCAL_RUN === 'true') {
    return RunEnvironment.LOCAL;
  }
  
  // Check if this is manually triggered from workflow_dispatch (deployment_id will be 'manual')
  if (process.env.DEPLOYMENT_ID === 'manual') {
    return RunEnvironment.CI_MANUAL;
  }
  
  // Check if this is automated from webhook (deployment_id will be set to something other than 'manual')
  if (process.env.DEPLOYMENT_ID && process.env.DEPLOYMENT_ID !== 'manual') {
    return RunEnvironment.CI_WEBHOOK;
  }
  
  // Default to treating as local run if can't determine
  return RunEnvironment.LOCAL;
}

/**
 * Get the appropriate app name based on run environment
 */
function getAppName(): string {
  const environment = getRunEnvironment();
  
  switch (environment) {
    case RunEnvironment.LOCAL:
      return "dydx.trade-local";
    case RunEnvironment.CI_MANUAL:
      return "dydx.trade.ci.manual";
    case RunEnvironment.CI_WEBHOOK:
      return "dydx.trade";
    default:
      return "dydx.trade";
  }
}

/**
 * Get the appropriate batch prefix based on run environment
 */
function getBatchPrefix(): string {
  const environment = getRunEnvironment();
  
  switch (environment) {
    case RunEnvironment.LOCAL:
      return "Local-";
    case RunEnvironment.CI_MANUAL:
      return "Manual-";
    case RunEnvironment.CI_WEBHOOK:
      return ""; // No prefix for webhook runs
    default:
      return "";
  }
}

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
  const batchPrefix = getBatchPrefix();
  const batch = new BatchInfo({ name: `${batchPrefix}DYDX-${batchId || new Date().toISOString()}` });
  if (batchId) {
    batch.setId(batchId);
  }
  config.setBatch(batch);
  
  // Viewport and browser configuration
  config.setViewportSize({ width: 1920, height: 1080 });
  config.addBrowser(1920, 1080, "chrome");
  config.addBrowser(1920, 1080, "firefox");
  
  // App and performance settings - set different app name based on run type
  config.setAppName(getAppName());
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