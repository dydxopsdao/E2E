import { Page } from "@playwright/test";

export interface VisualCheckOptions {
  name: string;
  fully?: boolean;
  matchLevel?: "Layout" | "Strict" | "Dynamic" | "Exact";
  customSnapshot?: {
    widths?: number[];
    minHeight?: number;
    percyCSS?: string;
    scope?: string;
  };
}

export interface IVisualProvider {
  initialize(page: Page, appName: string, testName: string): Promise<void>;
  check(page: Page, options: VisualCheckOptions): Promise<void>;
  cleanup(): Promise<void>;
}
