export const WALLET_CONSTANTS = {
  METAMASK: {
    DEFAULT_VERSION: "12.9.3",
    DEFAULT_PASSWORD: "test-password",
    EXTENSION_BASE_URL: "chrome-extension://",
    DOWNLOAD_URL_BASE:
      "https://github.com/MetaMask/metamask-extension/releases/download",
  },
  SUPPORTED_WALLETS: ["MetaMask", "Cosmostation", "Phantom"] as const,
} as const;
