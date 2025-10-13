import { TEST_TIMEOUTS } from "@constants/test.constants";
import { eyesTest as test } from "@fixtures/eyesFixture";
import { navigateToDydxPage } from "@interactions/dydx/general/actions/navigation.actions";
import { MarketPageSelectors } from "@interactions/dydx/market-page/selectors/market-page.selectors";
import { expect, Page } from "@playwright/test";

test.describe('Market Page Header Stats', () => {
  const validateMarketStat = async (page: Page, selector: string, statName: string) => {
    const element = page.locator(selector);
    await expect(element).toBeVisible();
    const value = await element.textContent();
    expect(value, `${statName} should have a value`).toBeTruthy();
    expect(value, `${statName} should not be zero or null`).not.toMatch(/^(0|0\.00000%|0%|null)$/);
  };

  const marketStats = [
    { name: 'Oracle Price', selector: MarketPageSelectors.oraclePrice },
    { name: '24h Change', selector: MarketPageSelectors.change24h },
    { name: '24h Volume', selector: MarketPageSelectors.volume24h },
    { name: '24h Trades', selector: MarketPageSelectors.trades24h },
    { name: 'Open Interest', selector: MarketPageSelectors.openInterest },
    { name: '1h Funding', selector: MarketPageSelectors.fundingRate },
    { name: 'Next Funding', selector: MarketPageSelectors.nextFunding },
    { name: 'Maximum Leverage', selector: MarketPageSelectors.maxLeverage },
  ] as const;

  test('Market stats are visible and valid', async ({ page }) => {
    await navigateToDydxPage(page, "/trade/ETH-USD", { waitForSelector: ['.sc-1h5n0ah-2'] }); // Market Price

    // First verify all stats are present
    const stats = await page.locator(MarketPageSelectors.marketStats).count();
    expect(stats).toBe(marketStats.length);

    // Then validate each stat in sequence
    for (const { name, selector } of marketStats) {
      await test.step(`Validating ${name}`, async () => {
        await validateMarketStat(page, selector, name);
      });
    }
  });
});