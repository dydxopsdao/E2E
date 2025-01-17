import percySnapshot from "@percy/playwright";
import { Page } from "@playwright/test";
import { IVisualProvider, VisualCheckOptions } from "../types/visual-testing";

export class PercyProvider implements IVisualProvider {
  async initialize(): Promise<void> {
  }

  async check(page: Page, options: VisualCheckOptions): Promise<void> {
    const { name, customSnapshot, fully = true } = options;

    await percySnapshot(page, name, {
      widths: customSnapshot?.widths || [1440],
      minHeight: customSnapshot?.minHeight,
      percyCSS: customSnapshot?.percyCSS,
      scope: customSnapshot?.scope,
    });
  }

  async cleanup(): Promise<void> {
  }
}
