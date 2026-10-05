/**
 * Public-build seam — see ./landing-pages/sandboxedPageDocument.ts.
 *
 * The registered source references exactly one Nocturne variant by name
 * (`"midnight"`, both as the default and as the safe fallback), so that is the
 * only member modelled here. Unrelated to the Kage landing page, which ships
 * its own packaged document.
 */

export const NOCTURNE_VARIANTS = ["midnight"] as const;
export type NocturneVariant = (typeof NOCTURNE_VARIANTS)[number];

export const NOCTURNE_TITLES: Record<NocturneVariant, string> = {
  midnight: "Nocturne — nocturne",
};

/** Stub seam: the authored scene body lives in the Pro build. */
export function buildNocturneDocument(_variant: NocturneVariant): string {
  return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"></head><body></body></html>";
}
