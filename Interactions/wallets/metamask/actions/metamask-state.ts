import { logger } from "@utils/logger/logging-utils";

interface MetaMaskState {
  extensionId: string | null;
}

class MetaMaskStateManager {
  private state: MetaMaskState = {
    extensionId: null,
  };

  setExtensionId(id: string) {
    logger.debug("Setting MetaMask extension ID", { extensionId: id });
    this.state.extensionId = id;
  }

  getExtensionId(): string {
    if (!this.state.extensionId) {
      const error = new Error("MetaMask extension ID not set");
      logger.error("Failed to get MetaMask extension ID", error);
      throw error;
    }
    return this.state.extensionId;
  }

  hasExtensionId(): boolean {
    return !!this.state.extensionId;
  }
}

// Export singleton instance
export const metamaskState = new MetaMaskStateManager();
