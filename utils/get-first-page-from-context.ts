// src/utils/get-first-page-from-context.ts
import { BrowserContext, Page } from "@playwright/test";
import { logger } from "../utils/logger/logging-utils";

/**
 * Retrieves the first page from the given BrowserContext.
 * Throws an error if no pages are found.
 * @param context - The Playwright BrowserContext to retrieve the page from.
 * @returns The first available Page from the context.
 */
export function getFirstPageFromContext(context: BrowserContext): Page {
  logger.step("Getting first page from context");

  const pages = context.pages();
  logger.info("Current pages in context", { pageCount: pages.length });

  if (pages.length === 0) {
    logger.error(
      "No existing page found in context",
      new Error("Context has no pages"),
      { contextState: "empty" }
    );
    throw new Error("No existing page found in context");
  }

  const nonExtensionPages = pages.filter(
    (page) => !page.url().startsWith("chrome-extension://")
  );

  if (nonExtensionPages.length === 0) {
    logger.error(
      "No non-extension pages found in context",
      new Error("Only extension pages present"),
      { totalPages: pages.length }
    );
    throw new Error("No non-extension pages found in context");
  }

  logger.success("Found first non-extension page", {
    url: nonExtensionPages[0].url(),
    totalPages: pages.length,
    nonExtensionPages: nonExtensionPages.length,
  });

  return nonExtensionPages[0];
}
