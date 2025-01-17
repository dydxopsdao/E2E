export type VisualProviderType = "applitools" | "percy";

import { ApplitoolsProvider } from "./aplitools-provider";
import { PercyProvider } from "./percy-provider";
import { IVisualProvider } from "../types/visual-testing";

export class VisualProviderFactory {
  static create(type: VisualProviderType): IVisualProvider {
    switch (type) {
      case "applitools":
        return new ApplitoolsProvider();
      case "percy":
        return new PercyProvider();
      default:
        throw new Error(`Unsupported visual provider type: ${type}`);
    }
  }
}
