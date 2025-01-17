import { test as base } from "@playwright/test";
import { VisualProviderFactory } from "@providers/factory";
import { VisualTestingHelper } from "@utils/visual-check";
import { VisualProviderType } from "@providers/factory";

const VISUAL_PROVIDER = (process.env.VISUAL_PROVIDER ||
  "applitools") as VisualProviderType;

type VisualTestingFixtures = {
  visualTest: VisualTestingHelper;
};

export const visualTest = base.extend<VisualTestingFixtures>({
  visualTest: async ({ page }, use, testInfo) => {
    const provider = VisualProviderFactory.create(VISUAL_PROVIDER);
    const helper = new VisualTestingHelper(provider);

    await helper.initialize(page, "dYdX App", testInfo.title);
    await use(helper);
    await helper.cleanup();
  },
});
