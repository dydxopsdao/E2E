import { eyesTest as test } from "@fixtures/eyesFixture";
import { navigateToDydxPage } from "@interactions/dydx/general/actions/navigation.actions";
import { expect, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";
import { visualCheck } from "@utils/visual-check";

test.describe('help', () => {
  test.describe.configure({ retries: 0 });
  test('help', async ({ page, eyes }) => {
    
    await navigateToDydxPage(page, "/portfolio/overview");
    await page.click('//*[@id="root"]/div/header/div[6]/button[2]', { force: true });
    await expect(page.locator('.sc-18mw14j-2')).toBeVisible();
    await visualCheck(eyes, { name: 'help', useDom: true });
      logger.success(`Completed visual check for help`);

  });
});