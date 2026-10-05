/**
 * Public-build seam — see ./landing-pages/sandboxedPageDocument.ts.
 * Unrelated to the Kage landing page, which ships its own packaged document.
 */

export type TidecrestHeroVariant = "tidecrest" | "harbour-nights" | "dune-reach" | "river-hollow";

/** Stub seam: the authored variant rewrites live in the Pro build. */
export function buildTidecrestDocument(_variant: TidecrestHeroVariant): string | undefined {
  return undefined;
}
