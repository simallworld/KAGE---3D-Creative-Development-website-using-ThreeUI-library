/**
 * Public-build seam — see ./landing-pages/sandboxedPageDocument.ts.
 * Unrelated to the Kage landing page, which ships its own packaged document.
 */

export type BetawiseGlobeVariant = "betawise" | "moon" | "mars" | "saturn" | "sun";

/** Stub seam: the authored sibling worlds live in the Pro build. */
export function buildBetawiseGlobeDocument(_variant: BetawiseGlobeVariant): string | undefined {
  return undefined;
}
