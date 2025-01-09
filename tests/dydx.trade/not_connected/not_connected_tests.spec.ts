import { test } from "@applitools/eyes-playwright/fixture";
import { Page } from "@playwright/test";
import { TEST_TIMEOUTS } from "../../../constants";


const urls = [
  {
    url: "https://dydx.trade/trade/ETH-USD",
    name: "ETH-USD market page",
    elementLocator: "div.chart-widget",
  },
  {
    url: "https://dydx.trade/markets",
    name: "Markets page",
    elementLocator:
      "table[aria-label='Markets'] div[role='row']:has([data-key='BTC-USD'])",
  },
  {
    url: "https://dydx.trade/portfolio",
    name: "Portfolio page",
    elementLocator:
      "text=Connect your wallet to deposit funds & start trading.",
  },
  {
    url: "https://dydx.trade/vault",
    name: "Megavault page",
    elementLocator: "table[aria-label='MegaVault']",
  },
  {
    url: "https://dydx.trade/referrals",
    name: "Referrals page",
    elementLocator: "table[aria-label='Leaderboard']",
  },
  {
    url: "https://dydx.trade/DYDX",
    name: "DYDX page",
    elementLocator: "div.sc-jfCxno.jMxfrO",
  },
];

async function waitForPageLoad(page: Page, elementLocator: string) {
  try {
    // Wait for the main element to be visible
    await page
      .locator(elementLocator)
      .waitFor({ state: "visible", timeout: TEST_TIMEOUTS.ELEMENT });
  } catch (error) {
    console.warn(
      `URL: ${page.url()} - Element with locator ${elementLocator} not found, tests may be unstable`
    );
  }
}

for (const { url, name, elementLocator } of urls) {
  test(`Visual check for ${name}`, async ({ page, eyes }) => {
    await page.goto(url, { timeout: TEST_TIMEOUTS.NAVIGATION });
    await waitForPageLoad(page, elementLocator);

    /* Full page visual check */
    await eyes.check(name, {
      fully: true,
      matchLevel: "Layout",
    });
  });
}
