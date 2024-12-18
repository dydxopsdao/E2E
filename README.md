# Applitools Visual Tests with Playwright (TypeScript)

This repository contains end-to-end visual regression tests using **Applitools Eyes** integrated with **Playwright** and written in **TypeScript**.

## Project Overview

### Key Features:
- **Playwright**: Automates browser actions to navigate and interact with your application.
- **Applitools Eyes**: Performs visual checks to detect UI regressions. https://applitools.com/
- **TypeScript**: Ensures strong typing and maintainable code.

## Project Structure
```
E2E_VISUAL/
├── node_modules/               # Dependencies
├── playwright-report/          # Test reports
│   └── index.html
├── tests/dydx.trade/           
│   ├── connect_wallet/         # Connect Wallet Flow Tests
│   │   └── connect_wallet.spec.ts
│   ├── not_connected/          # Tests of dydx.trade disconnected
│   │   └── not_connected_tests.spec.ts
├── .gitignore                  # Ignored files
├── package-lock.json           # NPM Lockfile
├── package.json                # Project dependencies and scripts
├── playwright.config.ts        # Playwright configuration
```

## Prerequisites
- **Node.js** (>=16)
- **NPM** or **Yarn**
- Applitools account with API key

## Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd <repo-directory>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration
1. **Applitools API Key**: Export your Applitools API key as an environment variable:
   ```bash
   export APPLITOOLS_API_KEY=<your_api_key>
   ```

2. Update `playwright.config.ts` with your desired browser and test settings.

## Writing Tests
Tests are written using Playwright and the Applitools Eyes fixture.

Example test (found in `connect_wallet.spec.ts`):

```typescript
import { test } from "@applitools/eyes-playwright/fixture";

const ELEMENT_TIMEOUT = 10000;

test.describe("Connect Wallet Flow", () => {
  test("Connect Wallet Modal Opens and Options Visible", async ({ page, eyes }) => {
    await page.goto("https://dydx.trade/portfolio/overview");
    await page.getByText('Connect wallet').click();

    await page.locator('div[role="dialog"]').waitFor({
      state: "visible",
      timeout: ELEMENT_TIMEOUT,
    });

    await eyes.check("Connect Wallet Modal with Options", {
      fully: true,
      matchLevel: "Layout",
    });
  });
});
```

## Running Tests
1. Run Playwright tests locally:
   ```bash
   npx playwright test
   ```
2. Generate a test report:
   ```bash
   npx playwright show-report
   ```