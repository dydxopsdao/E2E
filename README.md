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
METAMASK_PASSWORD=your_test_password
SEED_PHRASE=your_test_seed_phrase
USE_APPLITOOLS=true        
LOCAL_RUN=true            
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