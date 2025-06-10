# dYdX E2E Testing Guide

This guide provides supplementary documentation for running and debugging the dYdX E2E test suite.

## Table of Contents

- [Viewing Test Traces](#-viewing-test-traces)
- [Checking Wallet State](#-checking-wallet-state)
- [Troubleshooting](#-troubleshooting)

## 🕵️ Viewing Test Traces

Playwright's trace viewer allows you to inspect test runs in detail, providing a timeline, DOM snapshots, network requests, and more.

### How to View a Trace

1.  **Run tests locally**: Traces are generated on failed tests when you run Playwright. By default, traces are kept for the first retry of a failed test. To generate traces for all tests, you can update the `playwright.config.ts` file.

    ```typescript
    // playwright.config.ts
    import { defineConfig } from '@playwright/test';

    export default defineConfig({
      use: {
        trace: 'on', // or 'retain-on-failure'
      },
    });
    ```

2.  **Open the trace**: After a test run, you can view the trace using the following command:

    ```bash
    npx playwright show-trace path/to/trace.zip
    ```

    The path to the trace file will be printed in the terminal when a test fails.

### Using the Trace Viewer

The trace viewer is a powerful tool. You can:
-   Scrub through the test execution timeline.
-   Inspect the DOM before and after each action.
-   View network requests and responses.
-   See console logs from the browser.

### Viewing Traces from CI

When tests run in a Continuous Integration (CI) environment like GitHub Actions, the trace files for failed tests are usually uploaded as artifacts.

1.  **Download the Trace Artifact**:
    - Navigate to the completed CI run that has failed tests.
    - Find the "Artifacts" section and download the trace files, which will be in a `.zip` format (e.g., `trace.zip`).

2.  **View the Trace Online**:
    - Go to the official Playwright Trace Viewer website: [trace.playwright.dev](https://trace.playwright.dev/).
    - Drag and drop the downloaded `trace.zip` file onto the page to upload and view it directly in your browser.

This allows you to debug CI-specific failures without needing to run anything locally.

## 💰 Checking Wallet State

When debugging tests involving wallet interactions, it can be useful to manually interact with the dYdX interface using the test wallet. This allows you to check balances, positions, and other on-chain or off-chain state.

### Dedicated Chrome Profile for Testing

The easiest way to do this is to create a dedicated Chrome profile for E2E testing.

1.  **Create a new Chrome Profile**:
    - Open Chrome, click on your profile icon in the top right, and click "Add".
    - Set up a new profile. This will give you a clean environment separate from your personal browsing.

2.  **Install MetaMask**:
    - In your new Chrome profile, install the MetaMask extension from the Chrome Web Store.

3.  **Import the Test Wallet**:
    - Open MetaMask and choose the "Import an existing wallet" option.
    - Use the `SEED_PHRASE` from your `.env.local` file to import the test wallet.
    - Make sure MetaMask is connected to the Sepolia testnet.

### Checking Balances

Once your testing profile is set up, you can easily check balances:

1.  **Navigate to dYdX**: Go to the dYdX website.
2.  **Connect Wallet**: Connect your imported MetaMask test wallet.
3.  **Check Portfolio**: You can now view your portfolio balance directly on the dYdX interface.
4.  **Check Wallet Balance**: You can also check the wallet's ETH and token balances directly within the MetaMask extension.

This setup allows you to quickly verify the state of the account before, during, or after a test run.

## 🐛 Troubleshooting

### Flaky Tests

If you encounter a flaky test, try the following:
1.  **Add logging**: Add `console.log` statements or use `page.pause()` to debug the test interactively.

---

_This guide is a living document. Please contribute to it as you learn more about the test suite._ 