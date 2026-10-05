/**
 * Public-build seam.
 *
 * `LandingPages.tsx` reaches for document builders that belong to sibling scenes
 * outside this integration. The registered source is byte-exact and must not be
 * edited, so these modules exist only to close the module graph. The authored
 * callers treat them as optional — see the note above `buildTidecrestDocument?.()`
 * in LandingPages.tsx: "on the public site the builder is a stub, and the Pro
 * entry it belongs to is never mounted there".
 *
 * Nothing here participates in the Kage path: `KageLandingPage` renders the
 * packaged `/landing-pages/kage.html` and touches none of these symbols.
 */

export type SandboxPresentation = "page" | "background";

export type SandboxedPageDocumentOptions = {
  presentation?: SandboxPresentation;
  canvasSelector?: string;
};

/**
 * Stub seam. Returns the document untouched instead of wrapping it in a
 * sandboxed srcdoc envelope, so callers that depend on the rewrite render the
 * source as-is rather than crashing.
 */
export function buildSandboxedPageDocument(
  source: string,
  _options?: SandboxedPageDocumentOptions,
): string {
  return source;
}
