import { Page } from "@playwright/test";
import { ConnectWalletSelectors } from "@dydx/connect-wallet/selectors/connect-wallet-selectors";
import { logger } from "@utils/logger/logging-utils";
import { TEST_TIMEOUTS } from "../../../../constants/test.constants";
import { NotificationSelectors } from "@interactions/dydx/notifications/selectors/notification-selectors";

export async function triggerWalletConnectionModal(page: Page): Promise<void> {
  logger.step("Triggering wallet connection modal");
  try {
    await page.bringToFront();
    await page.waitForTimeout(1000);
    await page.locator(ConnectWalletSelectors.connectWallet).click({ force: true });
    await page.waitForTimeout(1000);
    await page.locator(ConnectWalletSelectors.signInWithWallet).click({ force: true });
    await page.waitForSelector(ConnectWalletSelectors.walletConnectModal, {
      state: "visible",
      timeout: TEST_TIMEOUTS.ELEMENT,
    });
    logger.success("Wallet connection modal displayed");
  } catch (error) {
    logger.error("Failed to trigger wallet connection modal", error as Error);
    throw error;
  }
}

export async function selectWallet(
  page: Page,
  walletType: string
): Promise<void> {
  logger.step(`Selecting wallet: ${walletType}`);
  try {
    const selector = getWalletSelector(walletType);
    await page.click(selector);
    logger.success(`${walletType} wallet selected`);
    await page.waitForTimeout(2000);
  } catch (error) {
    logger.error(`Failed to select wallet: ${walletType}`, error as Error);
    throw error;
  }
}

function getWalletSelector(walletType: string): string {
  switch (walletType) {
    case "MetaMask":
      return ConnectWalletSelectors.metaMaskWalletSelect;
    case "Cosmostation":
      return ConnectWalletSelectors.cosmostationWalletSelect;
    case "Phantom":
      return ConnectWalletSelectors.phantomWalletSelect;
    default:
      throw new Error(`Unsupported wallet type: ${walletType}`);
  }
}

export async function sendRequest(page: Page): Promise<void> {
  logger.step("Sending request");
  const selector = ConnectWalletSelectors.sendRequest;

  try {
    await page.click(selector);
    logger.success("Send request click");
  } catch (error) {

    // Attempt to handle the MetaMask password prompt
    //await handlePasswordPrompt(page);

    // Retry clicking the send request button
    try {
      await page.click(selector);
      logger.success("Send request click after handling password prompt");
    } catch (retryError) {
      logger.error(
        "Failed to click send request after handling password prompt",
        retryError as Error
      );
      throw retryError;
    }
  }
}