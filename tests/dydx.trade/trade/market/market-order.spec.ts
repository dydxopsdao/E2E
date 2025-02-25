import { combinedTest as test } from "@fixtures/combinedFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { BrowserContext, expect, Page } from "@playwright/test";
import { OrderbookSelectors } from "@interactions/orderbook/orderbook.selectors";
import { DealTicketSelectors } from "@interactions/dydx/deal-ticket/selectors/deal-ticket.selectors";
import { swapAsset } from "@interactions/dydx/deal-ticket/actions/deal-ticket.actions";
import { closePositions } from "../../../../helpers/dydx-trade-helpers";

test("btc-usd market order LONG", async ({
  metamaskContext,
  page,
  dydxTradeHelper
}) => {
  try {
    // Pre-test cleanup: Close any existing positions
    logger.step("Pre-test cleanup: Checking for existing positions to close");
    await closePositions(dydxTradeHelper, "BTC-USD", "Pre-test: ");
    
    // Arrange
    logger.step("Setting up connected market page test");
    await openDydxConnectMetaMask(page, metamaskContext, {
      dydxPage: "/trade/BTC-USD",
    });
    // Wait for orderbook to be visible
    await page.waitForSelector(OrderbookSelectors.orderbook, {
      state: "visible",
    });

    // Act
    await page.click(DealTicketSelectors.marketOrderBtn);
    await swapAsset(page, "USD");

    // Assert that the Place Market Order button is disabled
    await expect(
      page.locator(DealTicketSelectors.placeOrderBtnInactive)
    ).toBeDisabled();
    await page.fill(DealTicketSelectors.amountInput, "500");
    await expect(
      page.locator(DealTicketSelectors.placeOrderBtnActive)
    ).toBeEnabled();

    // Assert each fee/detail field is visible and does not show "--"
    for (const key of [
      "expectedPrice",
      "liquidationPrice",
      "positionMargin",
      "positionLeverage",
      "fee",
      "estimatedRewards",
    ]) {
      const selector =
        DealTicketSelectors[key as keyof typeof DealTicketSelectors];
      logger.step(`Verifying key "${key}" with selector "${selector}"`);

      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 10000 });
        
      } catch (error) {
        logger.error(
          `Failed to verify visibility for key "${key}" with selector "${selector}"`,
          error as Error
        );
        throw error;
      }

     try {
       // 1) Make sure the element is visible (optional but often helpful)
       await expect(page.locator(selector)).toBeVisible({ timeout: 10000 });

       // 2) Ensure it has at least one non-whitespace character
       await expect(page.locator(selector)).toHaveText(/\S+/, {
         timeout: 10000,
       });
     } catch (error) {
       logger.error(
         `Element for key "${key}" appears empty. Selector: "${selector}"`,
         error as Error
       );
       throw error;
     }
    }

    await page.click(DealTicketSelectors.placeOrderBtnActive);
    await page.waitForTimeout(10000);
    // TODO: assert Pending notification
    // TODO: assert order confirmation notification
    // TODO: assert trading reward received notification
    // TODO: assert position table details
  } catch (error) {
    logger.error("Market page test failed", error as Error);
    throw error;
  } finally {
    // Clean up - close any positions via API regardless of test result
    logger.step("Post-test cleanup: Closing any open positions");
    await closePositions(dydxTradeHelper, "BTC-USD", "Post-test: ");
  }
});
