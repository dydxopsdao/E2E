import { Eyes, Target } from "@applitools/eyes-playwright";
import { Locator, Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";

export interface VisualCheckOptions {
  name: string;
  fully?: boolean;
  matchLevel?: "Layout" | "Strict" | "Dynamic" | "Exact";
  useDom?: boolean; // Option to override DOM usage
  page?: Page; // Add page parameter to allow element interactions
  clickSelector?: string | false; // Optional selector to click before check, or false to skip
  regionLocator?: Locator; // Optional region to limit the visual check
  beforeRenderScreenshotHook?: string; // Optional Applitools hook to run before screenshot
}

export async function visualCheck(eyes: Eyes, opts: VisualCheckOptions) {
  const { 
    name, 
    fully = true, 
    matchLevel = "Layout", 
    useDom = true,
    regionLocator,
    beforeRenderScreenshotHook,
  } = opts;
  
  
  
  logger.step(`Performing visual check: ${name}`);

  // Create the target
  let target = regionLocator ? Target.region(regionLocator) : Target.window();

  if (fully && !regionLocator) {
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

  if (beforeRenderScreenshotHook) {
    target = target.beforeRenderScreenshotHook(beforeRenderScreenshotHook);
  }

  // Perform the check
  await eyes.check(name, target);

  logger.success(`Completed visual check: ${name}`);
}

export async function maybeVisualCheck(
  eyes: Eyes | undefined,
  performEyesCheck: boolean | undefined,
  name: string,
  options: Partial<VisualCheckOptions> = {}
) {
  if (performEyesCheck && eyes) {
    return visualCheck(eyes, { name, ...options });
  }
  return Promise.resolve();
}
