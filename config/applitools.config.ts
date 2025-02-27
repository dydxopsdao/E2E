import {
  ClassicRunner,
  Configuration,
  BatchInfo,
} from "@applitools/eyes-playwright";
require("dotenv").config({ path: process.env.ENV_PATH || ".env" });

export const runner = new ClassicRunner();

// Use the provided batch ID, falling back to a timestamp if not available
const batchId = process.env.APPLITOOLS_BATCH_ID || String(Date.now());

export const config = new Configuration();

config.setApiKey(process.env.APPLITOOLS_API_KEY || "");
// If using the public cloud, you might need to update the server URL:
config.setServerUrl(process.env.APPLITOOLS_SERVER_URL || "https://eyesapi.applitools.com");

// Create a BatchInfo with a stable ID based on the environment variable
const batch = new BatchInfo(`DYDX-${batchId}`);
batch.setId(`my-batch-id-${batchId}`);

config.setBatch(batch);

config.setViewportSize({ width: 1920, height: 1080 });
config.setAppName("dYdX App");
