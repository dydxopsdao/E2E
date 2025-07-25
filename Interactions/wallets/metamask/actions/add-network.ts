import { BrowserContext, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { MetamaskSelectors } from "@wallets/metamask/selectors/metamask-selectors";
import { getMetaMaskPage, openMetaMask } from "@wallets/metamask/actions/open-metamask";
import { TEST_TIMEOUTS } from "@constants/test.constants";

/**
 * Adds a new network to MetaMask by selecting it from the predefined networks list
 */
export async function addNetwork(
  context: BrowserContext,
  networkName: string,
  timeout: number = TEST_TIMEOUTS.DEFAULT
): Promise<void> {
  logger.step("Adding network to MetaMask", {
    networkName,
    timeout,
  });

  // Map network names to their corresponding test-id selectors
  const networkSelectors: Record<string, string> = {
    "Arbitrum One": MetamaskSelectors.arbitrumNetwork,
    "Avalanche": MetamaskSelectors.avalancheNetwork,
  };

  const networkSelector = networkSelectors[networkName];
  if (!networkSelector) {
    const supportedNetworks = Object.keys(networkSelectors).join(", ");
    throw new Error(
      `Unsupported network: ${networkName}. Supported networks: ${supportedNetworks}`
    );
  }

  let metaMaskPage: Page | null = null;

  try {
    // Open MetaMask in a new tab
    await openMetaMask(context);

    metaMaskPage = await getMetaMaskPage(context, timeout);
    await metaMaskPage.bringToFront();

    // Click the network selector dropdown
    logger.debug("Opening network selector dropdown");
    await metaMaskPage.click(MetamaskSelectors.networkDisplay);

    // Find the network container and wait for it
    logger.debug(`Waiting for ${networkName} network container`);
    await metaMaskPage.waitForSelector(networkSelector, {
      state: "visible",
      timeout: TEST_TIMEOUTS.ELEMENT,
    });

    // Find the Add button within this container and click it
    logger.debug("Clicking Add button");
    await metaMaskPage
      .locator(
        `${networkSelector} ${MetamaskSelectors.networkAddButton}`
      )
      .click();

    // Wait for and click the "Approve" button in the confirmation dialog
    logger.debug("Clicking Approve in confirmation dialog");
    await metaMaskPage.click(MetamaskSelectors.confirmationSubmitButton, {
      timeout: timeout,
    });

    // Wait for network to be added and selected
    logger.debug("Waiting for network to be selected", { networkName });
    await metaMaskPage.waitForSelector(
      `${MetamaskSelectors.networkDisplay}:has-text("${networkName}")`,
      { state: "visible", timeout }
    );
    await metaMaskPage.waitForTimeout(5000);

    logger.success("Network added successfully", {
      networkName,
      currentUrl: metaMaskPage.url(),
    });
    await metaMaskPage.close();
  } catch (error) {
    logger.error("Failed to add network", error as Error, {
      networkName,
      timeout,
      currentUrl: metaMaskPage?.url(),
    });
    throw error;
  }
}
