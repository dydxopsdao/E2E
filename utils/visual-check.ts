import { Eyes, Target } from "@applitools/eyes-playwright";
import { Page } from "@playwright/test";
import { logger } from "@utils/logger/logging-utils";

export interface VisualCheckOptions {
  name: string;
  fully?: boolean;
  matchLevel?: "Layout" | "Strict" | "Dynamic" | "Exact"; 
}

export async function visualCheck(eyes: Eyes, opts: VisualCheckOptions) {
  const { name, fully = true, matchLevel = "Layout" } = opts;

  logger.step(`Performing visual check: ${name}`);

  // Create the target
  let target = Target.window();

  if (fully) {
    target = target.fully();
  }

  target = target.matchLevel(matchLevel)
                .ignoreDisplacements(true)
                .enablePatterns(true);

  await eyes.check(name, target);

  logger.success(`Completed visual check: ${name}`);
}

export async function maybeVisualCheck(
  eyes: Eyes | undefined,
  performEyesCheck: boolean | undefined,
  name: string,
  page: Page
) {
  if (performEyesCheck && eyes) {
    await page.waitForTimeout(2500)
    return visualCheck(eyes, { name });
  }
  return Promise.resolve();
}