import { expect, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { DealTicketSelectors } from "../selectors/deal-ticket.selectors";

export async function swapAsset(
  page: Page,
  desiredAsset: string
): Promise<void> {
  // Get the currently selected asset text from the first matching element
  const currentAsset = (
    await page.locator(DealTicketSelectors.assetSelected).first().innerText()
  ).trim();

  // If the asset is already what we want, no action is needed
  if (currentAsset.toUpperCase() === desiredAsset.toUpperCase()) {
    logger.info(`Asset is already set to ${desiredAsset}. No swap required.`);
    return;
  }

  // Click the swap asset button
  await page.click(DealTicketSelectors.swapAssetBtn);

  // Assert that the asset has been updated to the desired value on the first matching element
  await expect(
    page.locator(DealTicketSelectors.assetSelected).first()
  ).toHaveText(desiredAsset, {
    timeout: 5000, 
  });

  logger.success(`Asset successfully swapped to ${desiredAsset}.`);
}
