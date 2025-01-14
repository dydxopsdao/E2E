// applitools.config.ts
import {
  ClassicRunner,
  Configuration,
  BatchInfo,
} from "@applitools/eyes-playwright";
require("dotenv").config({ path: process.env.ENV_PATH || ".env" });

export const runner = new ClassicRunner();

const batchTimestamp = process.env.APPLITOOLS_BATCH_TIME || String(Date.now());

export const config = new Configuration();

config.setApiKey(process.env.APPLITOOLS_API_KEY || "");
config.setServerUrl("https://eyes.applitools.com");

// 1) Create BatchInfo with a consistent ID
const batch = new BatchInfo(`DYDX-${batchTimestamp}`);

// The crucial part: define a stable ID so Applitools recognizes them as truly the same batch.
batch.setId(`my-batch-id-${batchTimestamp}`);

// Then apply that BatchInfo to your config
config.setBatch(batch);

// Set default viewport etc.
config.setViewportSize({ width: 1920, height: 1080 });
config.setAppName("dYdX App");
