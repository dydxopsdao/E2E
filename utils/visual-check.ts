// helpers/visual-check.ts
import { Eyes, Target } from "@applitools/eyes-playwright";
import { logger } from "@utils/logger/logging-utils";

export interface VisualCheckOptions {
  name: string; // e.g. "Language Dropdown"
  fully?: boolean; // optional, default = true
  matchLevel?: "Layout" | "Strict" | "Dynamic" | "Exact"; 
}

export async function visualCheck(eyes: Eyes, opts: VisualCheckOptions) {
  const { name, fully = true, matchLevel = "Layout" } = opts;

  logger.step(`Performing visual check: ${name}`);

  // Build a chain-based Target
  let target = Target.window();

  // If user wants a full-page screenshot
  if (fully) {
    target = target.fully();
  }

  // If user wants a specific match level
  target = target.matchLevel(matchLevel);

  await eyes.check(name, target);

  logger.success(`Completed visual check: ${name}`);
}
