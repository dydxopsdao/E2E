// src/interactions/wallets/metamask/actions/download-metamask.ts

import axios from "axios";
import * as fs from "fs";
import * as unzipper from "unzipper";
import path from "path";
import "dotenv/config";
import { logger } from "@utils/logger/logging-utils";
import { WALLET_CONSTANTS } from "@constants/wallet.constants";
import { PATHS } from "@constants/paths.constants";

const EXTENSION_FOLDER = path.resolve(
  __dirname,
  ".././",
  PATHS.EXTENSION_FOLDER
);
const ZIP_PATH = path.join(EXTENSION_FOLDER, "metamask-extension.zip");

function getDownloadUrl(version: string): string {
  return `${WALLET_CONSTANTS.METAMASK.DOWNLOAD_URL_BASE}/v${version}/metamask-chrome-${version}.zip`;
}

/**
 * Downloads and extracts the MetaMask extension
 * @returns Path to the extracted extension folder
 */
export async function downloadMetaMask(): Promise<string> {
  const version =
    process.env.METAMASK_VERSION || WALLET_CONSTANTS.METAMASK.DEFAULT_VERSION;
  const downloadUrl = getDownloadUrl(version);

  try {
    // Check if extension is already downloaded
    if (
      fs.existsSync(EXTENSION_FOLDER) &&
      fs.readdirSync(EXTENSION_FOLDER).length > 0
    ) {
      logger.info("MetaMask already downloaded", {
        folder: EXTENSION_FOLDER,
        version,
      });
      return EXTENSION_FOLDER;
    }

    logger.step("Starting MetaMask extension download", {
      version,
      downloadUrl,
      targetFolder: EXTENSION_FOLDER,
    });

    // Create extension directory
    fs.mkdirSync(EXTENSION_FOLDER, { recursive: true });

    // Download extension
    const response = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream",
      validateStatus: (status) => status === 200,
    });

    // Write downloaded file
    const writer = fs.createWriteStream(ZIP_PATH);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", (error) => {
        logger.error("Failed writing MetaMask zip", error, {
          zipPath: ZIP_PATH,
        });
        reject(error);
      });
    });

    logger.step("Extracting MetaMask extension", {
      zipPath: ZIP_PATH,
      targetFolder: EXTENSION_FOLDER,
    });

    // Extract extension
    await fs
      .createReadStream(ZIP_PATH)
      .pipe(unzipper.Extract({ path: EXTENSION_FOLDER }))
      .promise();

    logger.success("MetaMask extension downloaded and extracted", {
      version,
      location: EXTENSION_FOLDER,
    });

    return EXTENSION_FOLDER;
  } catch (error) {
    logger.error(
      "Failed to download/extract MetaMask extension",
      error as Error,
      {
        version,
        downloadUrl,
        extensionFolder: EXTENSION_FOLDER,
      }
    );
    throw error; 
  }
}

export async function cleanupMetaMaskFiles(): Promise<void> {
  try {
    if (fs.existsSync(ZIP_PATH)) {
      logger.step("Cleaning up MetaMask zip file", { zipPath: ZIP_PATH });
      fs.unlinkSync(ZIP_PATH);
      logger.success("MetaMask zip file cleaned up");
    }
  } catch (error) {
    logger.warning("Failed to cleanup MetaMask zip file", {
      error: (error as Error).message,
      zipPath: ZIP_PATH,
    });
  }
}
