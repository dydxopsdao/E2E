import { VisualTestingHelper } from "@utils/visual-check";
import { metamaskTest } from "./metamaskFixture";
import { VisualProviderFactory, VisualProviderType } from "@providers/factory";
import { TestInfo } from "@playwright/test";
import { Page } from "@playwright/test";

export const metamaskVisualTest = metamaskTest.extend<{
  visualTest: VisualTestingHelper;
}>({
  visualTest: async ({ page }: { page: Page }, use: (helper: VisualTestingHelper) => Promise<void>, testInfo: TestInfo) => {
    const provider = VisualProviderFactory.create(process.env.VISUAL_PROVIDER as VisualProviderType);
    const helper = new VisualTestingHelper(provider);

    await helper.initialize(page, "dYdX App", testInfo.title);
    await use(helper);
    await helper.cleanup();
  },
});
