/**
 * Public-build seam — see ./landing-pages/sandboxedPageDocument.ts.
 * Unrelated to the Kage landing page, which ships its own packaged document.
 */

export type MeridianVariant = "earth" | "moon" | "mars" | "saturn";

/** Stub seam: the authored sibling bodies live in the Pro build. */
export function buildMeridianDocument(
  _variant: MeridianVariant,
  _presentation?: "page" | "background",
): string | undefined {
  return undefined;
}
