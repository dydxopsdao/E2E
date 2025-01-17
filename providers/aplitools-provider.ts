import { Eyes, Target } from "@applitools/eyes-playwright";
import { runner, config } from "@config/applitools.config";
import { Page } from "@playwright/test";
import { IVisualProvider, VisualCheckOptions } from "../types/visual-testing";

export class ApplitoolsProvider implements IVisualProvider {
  private eyes: Eyes;

  constructor() {
    this.eyes = new Eyes(runner);
    this.eyes.setConfiguration(config);
  }

  async initialize(
    page: Page,
    appName: string,
    testName: string
  ): Promise<void> {
    await this.eyes.open(page, appName, testName);
  }

  async check(page: Page, options: VisualCheckOptions): Promise<void> {
    const { name, fully = true, matchLevel = "Layout" } = options;

    let target = Target.window();
    if (fully) {
      target = target.fully();
    }
    target = target.matchLevel(matchLevel);

    await this.eyes.check(name, target);
  }

  async cleanup(): Promise<void> {
    try {
      await this.eyes.close();
    } catch {
      await this.eyes.abortIfNotClosed();
    }
  }
}
