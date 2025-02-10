import { Page } from "@playwright/test";

export class DummyEyes {
  async open(page: Page, appName: string, testName: string) {
    /* no-op */
  }
  setConfiguration(_config: any) {
    /* no-op */
  }
  async close() {
    /* no-op */
  }
  async abortIfNotClosed() {
    /* no-op */
  }
  async check(_name: string, _target: any) {
    /* no-op */
  }
}
