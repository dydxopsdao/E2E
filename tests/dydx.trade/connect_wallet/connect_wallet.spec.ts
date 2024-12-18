import { test } from "@applitools/eyes-playwright/fixture";

const ELEMENT_TIMEOUT = 10000;

test.describe("Connect Wallet Flow", () => {
  test("Connect Wallet Modal Opens and Options Visible", async ({
    page,
    eyes,
  }) => {
    await page.goto("https://dydx.trade/portfolio/overview");

    await page
      .getByText('Connect wallet').click()

    // Wait for modal to open
    await page
      .locator('div[role="dialog"]')
      .waitFor({ state: "visible", timeout: ELEMENT_TIMEOUT });

    // Visual check for the modal with the wallet options
    await eyes.check("Connect Wallet Modal with Options", {
      fully: true,
      matchLevel: "Layout",
    });
  });

   test("Language Dropdown Works", async ({ page, eyes }) => {
    await page.goto("https://dydx.trade/portfolio/overview");

    // Click the "Connect wallet" button to open the modal
     await page.getByText("Connect wallet").click();

    // Wait for modal to open
    await page
      .locator('div[role="dialog"]')
      .waitFor({ state: "visible", timeout: ELEMENT_TIMEOUT });

    // Click the language dropdown
    await page.locator("text=English").click();

    // Wait for options to be visible
    await page
      .locator('div[role="menu"]')
      .waitFor({ state: "visible", timeout: ELEMENT_TIMEOUT });

    await eyes.check("Language Dropdown Open", {
      fully: true,
      matchLevel: "Layout",
    });
  });
});
