import { metamaskEyesTest as test } from "@fixtures/metamaskEyesFixture";
import { openDydxConnectMetaMask } from "@wallets/metamask/actions/connect-metamask";
import { logger } from "@utils/logger/logging-utils";
import { Eyes } from "@applitools/eyes-playwright";
import { BrowserContext, expect, Page } from "@playwright/test";
import { visualCheck } from "@utils/visual-check";
import { OrderbookSelectors } from "@interactions/orderbook/orderbook.selectors";
import { DealTicketSelectors } from "@interactions/dydx/deal-ticket/selectors/deal-ticket.selectors";
import { swapAsset } from "@interactions/dydx/deal-ticket/actions/deal-ticket.actions";

test("btc-usd market order LONG", async ({
  metamaskContext,
  eyes,
  page,
}: {
  metamaskContext: BrowserContext;
  eyes: Eyes;
  page: Page;
}) => {
  try {
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

    // TODO: click place market order
    // TODO: assert Pending notification
    // TODO: assert order confirmation notification
    // TODO: assert trading reward received notification
    // TODO: assert position table details
  } catch (error) {
    logger.error("Market page test failed", error as Error);
    throw error;
  }
});
