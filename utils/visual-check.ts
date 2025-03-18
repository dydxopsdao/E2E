import { Eyes, Target } from "@applitools/eyes-playwright";
import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";

// Keep track of which checks have been performed to avoid duplicates
const performedChecks = new Set<string>();

export interface VisualCheckOptions {
  name: string;
  fully?: boolean;
  matchLevel?: "Layout" | "Strict" | "Dynamic" | "Exact";
  useDom?: boolean; // Option to override DOM usage
  page?: Page; // Add page parameter to allow element interactions
  clickSelector?: string | false; // Optional selector to click before check, or false to skip
}

export async function visualCheck(eyes: Eyes, opts: VisualCheckOptions) {
  const { 
    name, 
    fully = true, 
    matchLevel = "Layout", 
    useDom = true,
    page,
    clickSelector = '#DN70'
  } = opts;
  
  // Click the element if page is provided and clickSelector is not false
  if (page && clickSelector !== false) {
    try {
      // Find the iframe with the title "dYdX Chain Status"
      const iframe = page.frameLocator('iframe[title="dYdX Chain Status"]');
      
      // Log that we're switching to the iframe
      logger.info(`Switching to iframe with title "dYdX Chain Status" before clicking element`);
      
      // Use the iframe locator to click the element inside the iframe
      const selectorToClick = clickSelector || '#DN70';
      logger.info(`Clicking element ${selectorToClick} within iframe`);
      
      // Click the element inside the iframe
      await iframe.locator(selectorToClick).click({ force: true });
      
      // Add a small delay to allow any animations to complete
      await page.waitForTimeout(500);
    } catch (error) {
      logger.warn(`Failed to click element ${clickSelector || '#DN70'} in iframe: ${error}`);
    }
  }
  
  logger.step(`Performing visual check: ${name}`);

  // Create the target
  let target = Target.window();

  if (fully) {
    target = target.fully();
  }

  // Apply settings - configuration is centralized, so we only need to set check-specific options
  target = target.matchLevel(matchLevel);
  target = target.enablePatterns(true);
  target = target.ignoreDisplacements(true);
  
  // Override DOM usage if specified
  if (useDom === false) {
    target = target.useDom(false);
  }

  // Perform the check
  await eyes.check(name, target);

  logger.success(`Completed visual check: ${name}`);
}

export async function maybeVisualCheck(
  eyes: Eyes | undefined,
  performEyesCheck: boolean | undefined,
  name: string,
  page: Page,
  options: Partial<VisualCheckOptions> = {}
) {
  if (performEyesCheck && eyes) {
    await page.waitForTimeout(2500)
    return visualCheck(eyes, { name, page, ...options });
  }
  return Promise.resolve();
}