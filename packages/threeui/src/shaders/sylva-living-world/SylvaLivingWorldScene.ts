/**
 * Public-build seam — see ./landing-pages/sandboxedPageDocument.ts.
 *
 * Supplies only the six symbols LandingPages.tsx imports. The variant palettes
 * and the source rewriters that consume them live in the Pro build, so these
 * pass the document through unchanged. Unrelated to the Kage landing page,
 * which ships its own packaged document.
 */

export const SAKURA_SUNSET_STYLE = "";
export const MAPLE_AUTUMN_STYLE = "";
export const SEQUOIA_MIST_STYLE = "";

export function applySakuraSunsetVariant(source: string): string {
  return source;
}

export function applyMapleAutumnVariant(source: string): string {
  return source;
}

export function applySequoiaMistVariant(source: string): string {
  return source;
}
