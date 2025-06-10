# dYdX Visual Tests 🎭

E2E visual regression tests using Playwright + Applitools for dYdX trading interface.

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
APPLITOOLS_API_KEY=your_key
METAMASK_VERSION=12.18.3
METAMASK_PASSWORD=your_test_password
SEED_PHRASE=your_test_seed_phrase
USE_APPLITOOLS=true        
LOCAL_RUN=true
DEPLOYMENT_ID=manual            
```

## 🧪 Running Tests

### Run all tests:
```bash
ENV_PATH=.env.local npx playwright test
```

### Run a specific test:
```bash
ENV_PATH=.env.local npx playwright test --grep "Connect MetaMask Wallet"
```

### Skipping Tests

You can skip a test by appending `.skip` to the `test` function. This is useful when a test is failing due to a known issue that you don't want to fix immediately.

**Skip a single test:**
```typescript
test.skip('test name', async ({ page }) => {
  // test code
});
```

**Skip a test suite:**
```typescript
test.describe.skip('describe block name', () => {
  // all tests in here are skipped
});
```

## 📁 Project Structure

```
tests/
├── dydx.trade/                  # Test suites
    ├── connect-wallet/          # Wallet connection flow
    │   ├── metamask/           # MetaMask specific tests
    │   └── connect-wallet.spec # General connection tests
    ├── market-page/            # Trading interface tests
    └── not_connected/          # Logged out state tests

Interactions/                    # Reusable actions
├── dydx/                       # dYdX specific actions
└── wallets/                    # Wallet interactions
```

## 🛠️ Key Features

- **Automated MetaMask Setup**: Extension is downloaded and configured automatically
- **Visual Testing**: Powered by Applitools Eyes


## 📚 Resources

- [Playwright Docs](https://playwright.dev)
- [Applitools Docs](https://applitools.com/docs)