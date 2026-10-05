/**
 * Public-build seam — see ./landing-pages/sandboxedPageDocument.ts.
 * Unrelated to the Kage landing page, which ships its own packaged document.
 */

export type AsciiFieldVariant = "vortex" | "tide" | "ridge" | "canopy";

/** Stub seam: the authored sibling scenes live in the Pro build. */
export function buildAsciiFieldDocument(_variant: AsciiFieldVariant): string | undefined {
  return undefined;
}
