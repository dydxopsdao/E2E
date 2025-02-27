// config/applitools.config.ts
import {
  ClassicRunner,
  Configuration,
  BatchInfo,
} from "@applitools/eyes-playwright";
require("dotenv").config({ path: process.env.ENV_PATH || ".env" });

if (!process.env.APPLITOOLS_BATCH_ID) {
  // If you truly want to enforce the variable, keep throwing:
  throw new Error("APPLITOOLS_BATCH_ID must be set for a stable batch ID.");
}

export const runner = new ClassicRunner();
export const config = new Configuration();

config.setApiKey(process.env.APPLITOOLS_API_KEY || "");
config.setServerUrl(process.env.APPLITOOLS_SERVER_URL || "https://eyesapi.applitools.com");

const batchId = process.env.APPLITOOLS_BATCH_ID;
const batch = new BatchInfo(`My-Batch-${batchId}`);
batch.setId(batchId);
config.setBatch(batch);

config.setViewportSize({ width: 1920, height: 1080 });
config.setAppName("dYdX App");
