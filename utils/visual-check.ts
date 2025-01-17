import { Page } from "@playwright/test";
import { VisualCheckOptions } from "../types/visual-testing";
import { logger } from "@utils/logger/logging-utils";
import { IVisualProvider } from "../types/visual-testing";

export class VisualTestingHelper {
  constructor(private provider: IVisualProvider) {}

  async initialize(
    page: Page,
    appName: string,
    testName: string
  ): Promise<void> {
    try {
      await this.provider.initialize(page, appName, testName);
    } catch (error) {
      logger.error(`Failed to initialize visual provider`, error as Error);
      throw error;
    }
  }

  async check(page: Page, options: VisualCheckOptions): Promise<void> {
    const { name } = options;

    logger.step(`Performing visual check: ${name}`);

    try {
      await this.provider.check(page, options);
      logger.success(`Completed visual check: ${name}`);
    } catch (error) {
      logger.error(`Visual check failed for ${name}`, error as Error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.provider.cleanup();
    } catch (error) {
      logger.error(`Failed to cleanup visual provider`, error as Error);
      throw error;
    }
  }
}
