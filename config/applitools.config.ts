import {
  ClassicRunner,
  Configuration,
  BatchInfo,
} from "@applitools/eyes-playwright";
require("dotenv").config({ path: process.env.ENV_PATH || ".env" });

export const runner = new ClassicRunner();

// Throw an error if the environment variable is missing
if (!process.env.APPLITOOLS_BATCH_ID) {
  throw new Error("APPLITOOLS_BATCH_ID must be set for a stable batch ID.");
}

export const config = new Configuration();

// Set your API key and server URL
config.setApiKey(process.env.APPLITOOLS_API_KEY || "");
config.setServerUrl(process.env.APPLITOOLS_SERVER_URL || "https://eyesapi.applitools.com");

// Create BatchInfo using the environment variable only
const batchId = process.env.APPLITOOLS_BATCH_ID;
const batch = new BatchInfo(`DYDX-${batchId}`);

// Use the same ID so Applitools recognizes the same batch on re-runs
batch.setId(batchId);

// Apply BatchInfo to your config
config.setBatch(batch);

// Optional: set default viewport size and app name
config.setViewportSize({ width: 1920, height: 1080 });
config.setAppName("dYdX App");
