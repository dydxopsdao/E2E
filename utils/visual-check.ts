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
}

export async function visualCheck(eyes: Eyes, opts: VisualCheckOptions) {
  const { name, fully = true, matchLevel = "Layout", useDom = true } = opts;
  
  logger.step(`Performing visual check: ${name}`);

  // Create the target
  let target = Target.window();

  if (fully) {
    target = target.fully();
  }

  // Apply settings - configuration is centralized, so we only need to set check-specific options
  target = target.matchLevel(matchLevel);
  
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
    return visualCheck(eyes, { name, ...options });
  }
  return Promise.resolve();
}