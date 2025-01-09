// metamask/setup-metamask.ts
import { BrowserContext, chromium } from "@playwright/test";
import path from "path";
import os from "os";
import { mkdtempSync } from "fs";
import { downloadMetaMask } from "./actions/download-metamask";



export async function logAllPages(context: BrowserContext) {
  const pages = context.pages();
  console.log(`There are ${pages.length} open pages:`);

  for (const [index, page] of pages.entries()) {
    const url = page.url();
    const title = await page.title().catch(() => "(No title loaded)");
    console.log(`Page ${index + 1}:`);
    console.log(`  URL: ${url || "(No URL yet)"}`);
    console.log(`  Title: ${title}`);
  }
}

export async function setupMetaMaskContext(): Promise<BrowserContext> {
  const metaMaskPath = await downloadMetaMask();
  const tempProfileDir = mkdtempSync(
    path.join(os.tmpdir(), "metamask-profile-")
  );
  const browserContext = await chromium.launchPersistentContext(
    tempProfileDir,
    {
      headless: false,
        args: [
          `--disable-extensions-except=${metaMaskPath}`,
          `--load-extension=${metaMaskPath}`,
          "--disable-blink-features=AutomationControlled",
          "--disable-infobars",
          "--disable-dev-shm-usage",
          "--no-sandbox",
          "--disable-setuid-sandbox",
      ],
      ignoreDefaultArgs: ["--disable-extensions"],
    }
  );
  
  return browserContext;
}
