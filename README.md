# KAGE - 3D Creative Development website using ThreeUI library

**Where stillness reveals the unseen** — a five-chapter night walk through a Kyoto mountain temple, rendered live in WebGL.

This repository integrates the authored `KageLandingPage` component from [ThreeUI](https://threeui.com) into a **Next.js 15 (App Router)** application. The scene itself is the original authored document, preserved byte-for-byte: its own navigation, scroll-driven camera rig, chapter scenes, post-processing stack, and a locally bundled Three.js runtime.

---

## Table of contents

- [What this is](#what-this-is)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [npm scripts](#npm-scripts)
- [Architecture](#architecture)
  - [1. The frame boundary](#1-the-frame-boundary)
  - [2. The typography pipeline](#2-the-typography-pipeline)
  - [3. The document and its assets](#3-the-document-and-its-assets)
  - [4. The render loop](#4-the-render-loop)
  - [5. Build seams](#5-build-seams)
- [Project layout](#project-layout)
- [Source integrity](#source-integrity)
- [Configuration](#configuration)
- [Deployment notes](#deployment-notes)
- [Browser support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [Licensing](#licensing)

---

## What this is

The Kage experience is **not** re-implemented in React. It is a single self-contained HTML document (`kage.html`, ~244 KB) containing its own CSS, markup, and scene logic. React's job is narrow:

1. Mount an `<iframe>` pointed at that document.
2. Apply typography/colour overrides to it from the outside.
3. Contain it visually.

All scene behaviour — the camera rig, shaders, post-processing, reveal animations, parallax, preloader — lives inside the authored document and is untouched.

The consequence is that the scene is **isolated by construction**: its global styles, its `window` globals, and its bundled Three.js runtime cannot collide with the host application.

---

## Requirements

|                 |                                             |
| --------------- | ------------------------------------------- |
| Node.js         | **≥ 18.18** (developed on 24.x)      |
| Package manager | npm 10+ (ships with Node 18.18+)            |
| Browser         | Any evergreen browser with**WebGL 2** |

There is no database, no environment variable, no API key, and no network access required at runtime. Every asset — including all seven font faces — is served from this repository.

---

## Quick start

```bash
git clone <your-repo-url>
cd <your-repo-dir>

npm install
npm run dev
```

Open **http://localhost:3000**.

> **First load is slow in development.** Next.js compiles the ThreeUI package on demand; expect roughly 30–45 s for the initial request and ~1 s afterwards. `npm run build && npm start` avoids this.

### Production

```bash
npm run build
npm start          # http://localhost:3000
```

---

## npm scripts

| Script                     | Purpose                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`            | Start the development server with hot reload.                                                                                 |
| `npm run build`          | Create an optimized production build.                                                                                         |
| `npm start`              | Serve the production build.                                                                                                   |
| `npm run typecheck`      | Run`tsc --noEmit` across the app and the vendored package.                                                                  |
| `npm run verify:sources` | **Assert every registered ThreeUI file still matches its published SHA-256.** See [Source integrity](#source-integrity). |

`npm run verify:sources` is the one command worth wiring into CI. See [CI](#ci) below.

---

## Architecture

### 1. The frame boundary

`KageLandingPage` (`LandingPages.tsx`) is a thin composition of three registered modules:

```
Scene.tsx
  └─ KageLandingPage                    LandingPages.tsx
       ├─ splitTypographyProps()        pageTypography.ts   ← splits control props from frame props
       ├─ usePageTypography()           pageTypography.ts   ← resolves overrides against the recipe
       └─ LandingPageFrame              LandingPageFrame.tsx
            └─ <iframe src="/landing-pages/kage.html" sandbox="…allow-same-origin allow-scripts">
```

`LandingPageFrame` renders:

```tsx
<div className="threeui-background landing-page-frame" data-state={ready ? "ready" : "loading"}>
  <iframe
    title="Kage — Where stillness reveals the unseen"
    src="/landing-pages/kage.html"
    sandbox="allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
    loading="eager"
  />
</div>
```

Two deliberate details:

- **`sourceUrl` instead of `srcDoc`.** The document is loaded by URL, so it stays a real, cacheable, byte-exact file rather than an inlined string. `LandingPageFrame` supports `srcDoc` for *derived* variants only.
- **`allow-same-origin` + `allow-scripts`.** The frame needs same-origin access to receive the typography overrides and to read its own scene API. Both are required; removing either breaks customization.

### 2. The typography pipeline

Controls are **appended to the loaded document's `<head>` at runtime**. The packaged `kage.html` is never rewritten, so it stays byte-exact and cacheable.

```JavaScript
<KageLandingPage headingFont="onest" bodyFont="onest" headingWeight="400" … />
        │
        ├─ splitTypographyProps()  →  { type: <control props>, frame: <rest> }
        │
        ├─ usePageTypography(KAGE_TYPOGRAPHY, type)          pageRecipes.ts
        │     KAGE_TYPOGRAPHY declares the authored faces, the colour helpers
        │     (retone / retoneRgba) and which selectors each control drives.
        │
        └─ customization  ──►  applyPageCustomization(frame, customization)
                                  │
                                  └─ injects a <style> into the frame's contentDocument
```

For a URL-backed frame like Kage, `applyPageCustomization` is the operative path — React can reach `contentDocument` directly. Its sibling `postPageCustomization` exists for the derived `srcDoc` case, where an opaque sandbox blocks that access and a small bridge script is appended *to the generated string* instead. Kage never needs it.

Two rules the recipe system follows, worth knowing before you retune values:

- **`clamp()` ceilings, not fixed sizes.** Where the page sizes type with `clamp()`, the control drives the **ceiling**. At a 1280 px viewport `headingSize={46}` resolves to `39.04px` and `bodySize={17}` to `14px` — both correct, both below the prop. At wider viewports they climb toward the ceiling.
- **Ratios travel, absolutes do not.** Sizes that ride along (a second heading scale, line-height, narrow-screen step-downs) are carried at their authored ratio rather than pinned, so the page keeps its internal proportions when retuned.

See [Configuration](#configuration) for the accepted values and defaults.

### 3. The document and its assets

Everything the frame loads is served from `public/`, because `LandingPageFrame` requests `/landing-pages/kage.html` **from the application origin**. All references inside `kage.html` are relative, so the layout is fixed:

```
public/landing-pages/
├── kage.html                                       ← the complete authored document
└── secret-pathways-assets/
    ├── fonts.css                                   ← 7 @font-face, fonts inlined as base64
    ├── three.min.js                                ← bundled Three.js runtime
    ├── generated/                                  ← 4 chapter backdrops (WebP)
    │   ├── kage-sanmon-preview.webp
    │   ├── kage-approach.webp
    │   ├── kage-lantern-court.webp
    │   └── kage-moonwater.webp
    └── foreground/png/                             ← 10 transparent foreground layers (WebP)
        ├── temple-wall.webp     ├── stone-lantern.webp   ├── hill.webp
        ├── pine-tree.webp       ├── garden-bush.webp     └── shrine-ruins.webp
        ├── tall-grass.webp      ├── basalt-stones.webp
        ├── sakura-branch.webp   └── maple-leaves.webp
```

Total weight ≈ **3.4 MB**, dominated by the foreground layers and the document itself.

`fonts.css` **inlines every font as base64** rather than linking separate `.woff2` files. That is what makes the file 99 KB and self-contained: no font request can 404, and there is no third-party font CDN in the runtime path.

> If you move the document, move the whole `landing-pages/` tree. A relocated `kage.html` will resolve every asset relative to itself.

### 4. The render loop

Owned entirely by `kage.html`. The shape of it:

- **Camera rig** — a `CatmullRomCurve3` through six authored waypoints, sampled by normalized scroll progress. `RIG.prog` is the raw target; `RIG.smooth` is a critically damped follower (`damp(…, 5.2, dt)`), which is why the camera glides rather than snapping. Each waypoint carries its own position, look-at target, and field of view.
- **Chapters** — five `<section>` elements (`hero`, `gate`, `pathways`, `lessons`, `eternity`) plus the `<footer>`, each marked `data-cam="0..5"`. Their measured offsets become the six scroll anchors the rig samples between.
- **Post-processing** — enabled by default. MSAA is disabled on the main pass when post is active (`antialias: !WANT_POST`), since the composite pass resolves it.
- **Pointer parallax** — a damped 2D offset layered on top of the scroll rig.
- **Reduced motion** — `prefers-reduced-motion: reduce` collapses the smoothing and the intro timeline.
- **Scene API** — on boot the document publishes `window.__kage` (`RIG`, `WORLD`, `WORD`, `CAM`, `POST`, `renderer`, `scene`, `camera`, `anchors()`). Useful for debugging and for driving captures from automation.

### 5. Build seams

`LandingPages.tsx` is a barrel that also exports ~20 sibling landing pages (Tidecrest, Meridian, Axonis, Nocturne, Sylva, Betawise, ASCII Field). Those pages import document builders that are **not part of the Kage bundle**. Because the registered file must stay byte-exact, it could not be edited — so the missing modules exist as minimal seams under `packages/threeui/src/shaders/`:

| Seam                                                           | Provides                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| `tidecrest-hero/tidecrestDocument.ts`                        | `buildTidecrestDocument` → `undefined`                           |
| `meridian-landing-page/meridianDocument.ts`                  | `buildMeridianDocument` → `undefined`                            |
| `ascii-field/asciiFieldDocuments.ts`                         | `buildAsciiFieldDocument` → `undefined`                          |
| `betawise-globe/betawiseGlobeDocument.ts`                    | `buildBetawiseGlobeDocument` → `undefined`                       |
| `nocturne-hero/NocturneScene.ts`                             | `NOCTURNE_VARIANTS`, `NOCTURNE_TITLES`, `buildNocturneDocument` |
| `sylva-living-world/SylvaLivingWorldScene.ts`                | 3 palette constants, 3 identity rewriters                             |
| `landing-pages/sandboxedPageDocument.ts`                     | `buildSandboxedPageDocument`                                        |
| `axonis-field/*.html`, `sylva-living-world/sources/*.html` | `?raw` placeholders                                                 |

This mirrors the upstream design rather than working around it. The registered source documents it directly:

> *the optional call is not defensiveness: on the public site the builder is a stub, and the Pro entry it belongs to is never mounted there*

**None of these are reachable from `KageLandingPage`.** The Kage path touches only the four registered modules plus the packaged document. The seams exist purely to close the module graph. If you later need one of those pages, replace the seam with the real builder from the full ThreeUI source.

---

## Project layout

```
.
├── public/landing-pages/            # served at /landing-pages/* — the scene and its assets
├── packages/threeui/                # local package: @designcodeio/threeui (file: dependency)
│   └── src/
│       ├── index.ts                 # "use client" barrel
│       ├── raw-modules.d.ts         # `*?raw` module declaration
│       └── shaders/
│           ├── threeui.css          # shared stylesheet, exported as <pkg>/style.css
│           ├── fonts/               # fragment-mono.woff2 (referenced by threeui.css)
│           ├── landing-pages/       # ← the four registered source files
│           │   ├── LandingPages.tsx
│           │   ├── LandingPageFrame.tsx
│           │   ├── pageTypography.ts
│           │   └── pageRecipes.ts
│           └── <sibling seams>/     # see Build seams
├── src/
│   ├── app/
│   │   ├── layout.tsx               # metadata + globals.css
│   │   ├── page.tsx                 # renders <Scene />
│   │   ├── globals.css              # .shader-frame viewport shell
│   │   └── icon.svg                 # authored Kage mark
│   └── components/Scene.tsx         # ← the component usage
├── scripts/verify-sources.mjs       # SHA-256 integrity check
├── vendor/kage-landing-page.json    # source manifest (paths + hashes)
├── THIRD_PARTY/                     # license + font + asset notices
├── next.config.mjs
└── tsconfig.json
```

### Why the package is local

`@designcodeio/threeui` on npm ships a **prebuilt** `lib-dist` — and it is a *different revision* than this bundle (its `style.css` hashes to `813ee0c2…`, not the required `efe44471…`). Using it would silently render a different stylesheet.

So the package here is vendored as TypeScript source and compiled by Next via `transpilePackages`. That keeps the authored files byte-exact instead of pre-built, and makes the hash check meaningful. The dependency is wired as `"@designcodeio/threeui": "file:./packages/threeui"`, so the import in `Scene.tsx` is unchanged from the documented usage.

---

## Source integrity

Every registered file is pinned to a published SHA-256 in `vendor/kage-landing-page.json` — 8 text files and 14 binary assets, 22 in total.

```bash
npm run verify:sources
```

```
OK    src/shaders/landing-pages/LandingPages.tsx  40525B
OK    public/landing-pages/kage.html  243963B
OK    public/landing-pages/secret-pathways-assets/three.min.js  608081B
…
All 22 registered files match the manifest.
```

The script exits non-zero on any mismatch, so it is safe in CI. Run it after any change under `packages/threeui/src/shaders/landing-pages/` or `public/landing-pages/`.

> **Note on retrieval.** `kage.html` and `fonts.css` are published on threeui.com only in a CDN-rewritten form (asset paths rewritten to remote origins, plus an injected CORS shim). The canonical bytes were reconstructed and confirmed against the manifest hashes above — `c8e06b90…` and `985f85a9…` respectively. If you ever need to re-fetch, treat the hash check as the source of truth, not the live URL.

### CI

```yaml
- run: npm ci
- run: npm run verify:sources
- run: npm run typecheck
- run: npm run build
```

---

## Configuration

All scene configuration is expressed through props in `src/components/Scene.tsx`:

```tsx
import { KageLandingPage } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export function Scene() {
  return (
    <div className="shader-frame">
      <KageLandingPage
        headingFont="onest"
        bodyFont="onest"
        headingWeight="400"
        bodyWeight="300"
        primaryColor="#e0231c"
        headingSize={46}
        bodySize={17}
        headingLetterSpacing={-0.012}
      />
    </div>
  );
}
```

Every control resolves against the `KAGE_TYPOGRAPHY` recipe, and an out-of-range or unrecognised value falls back to the authored default rather than breaking the page.

| Prop                     | Accepted                                                   | Authored default |
| ------------------------ | ---------------------------------------------------------- | ---------------- |
| `headingFont`          | `onest`, `instrument-serif`, `newsreader`, `geist` | `onest`        |
| `bodyFont`             | `onest`, `geist`, `newsreader`, `instrument-serif` | `onest`        |
| `headingWeight`        | `400`, `500`, `600`, `700`                         | `400`          |
| `bodyWeight`           | `300`, `400`, `500`, `600`                         | `300`          |
| `primaryColor`         | any hex                                                    | `#e0231c`      |
| `headingSize`          | `30` – `72` (px)                                      | `46`           |
| `bodySize`             | `13` – `24` (px)                                      | `17`           |
| `headingLetterSpacing` | `-0.06` – `0.12` (em)                                 | `-0.012`       |

**Fonts are fetched only when needed.** The recipe emits a Google Fonts `<link>` for whichever faces it selects that declare a `google` spec — but only for faces the document does not already carry. `fonts.css` embeds Onest, Noto JP and Wordmark, so **the default configuration makes no external font request at all**. Selecting `newsreader`, `geist`, or `instrument-serif` will inject a `fonts.googleapis.com` stylesheet; if you need a fully self-contained page, stay on `onest`.

**Colour moves with intent.** `primaryColor` is not just a variable swap. The recipe derives a shift from the authored primary and applies it to the related authored colours too — `--ember` is retoned from `#ff5a3c`, and `retone()` / `retoneRgba()` preserve a palette's internal relationships (a lighter tint stays lighter) instead of flattening every accent onto one hex.

**`headingLetterSpacing` is expressed in `em`** relative to the **resolved** heading size. With `headingSize={46}` at a 1280 px viewport (39.04 px resolved), `-0.012` yields `-0.468px`.

The emitted override is a small stylesheet targeting the page's own selectors:

```css
:root { --vermilion: …; --ember: …; }
body { font-family: …; }
body, .body, .body-lg, .num { font-weight: …; }
h1:not(.jp), h2:not(.jp), h3:not(.jp), .display:not(.jp) { font-family: …; font-weight: …; }
.display { letter-spacing: …em; }
.h-hero { font-size: clamp(26px, 3.05vw, …); }
.h-sec  { font-size: clamp(30px, 4vw, …); }
.body-lg { font-size: clamp(14px, 1.02vw, …); }
.body    { font-size: …; }
```

This is also where the two `clamp()` rules above become visible: `headingSize` lands on the **ceiling** of `.h-hero`, while `.h-sec` is recomputed at the authored ratio (ceiling × 60/46) and `.body` at `bodySize − 3`.

`.shader-frame` is defined in `src/app/globals.css` and pins the scene to the viewport; the frame owns its own scroll story inside.

---

## Deployment notes

The app is fully static — the only dynamic part is client-side, and the scene is served as a static file. It deploys to any Node or static host.

- **Must not be rewritten or cached as HTML.** A CDN rule that rewrites `*.html` will corrupt `kage.html`. Exclude `/landing-pages/*` from HTML optimisation.
- **Serve `kage.html` as `text/html`** and the `.webp` assets as `image/webp`. Both are correct out of the box on Vercel, Netlify, and Cloudflare Pages.
- **Long cache lifetimes are safe** for `public/landing-pages/**` — those files are content-pinned and never change without a hash change.
- **`public/` is copied verbatim.** Nothing under it is bundled, hashed, or minified, which is exactly what keeps the document byte-exact.

---

## Browser support

Requires **WebGL 2** and `100dvh`-era CSS. Verified on Chromium. The document honours `prefers-reduced-motion`, and pointer parallax degrades to a coarse-pointer path.

On a machine with **no GPU acceleration** (CI containers, some VMs) the canvas can come up blank. Launch the browser with:

```
--enable-unsafe-swiftshader
```

---

## Troubleshooting

**Blank canvas, no errors.**
Software rendering. See [Browser support](#browser-support).

**Everything renders but text is in the wrong face.**
`fonts.css` did not load. Check that `public/landing-pages/secret-pathways-assets/fonts.css` returns `200` — the fonts are inlined there and nowhere else.

**The iframe is blank / shows `about:blank`.**
The document is not being served. Confirm `GET /landing-pages/kage.html` returns `200` with 243963 bytes.

**First dev request takes 40 s.**
Expected — Next compiles the vendored package on demand. Use `npm run build && npm start` for a fast loop.

**`Module not found: Can't resolve '../…/…Document.js'`.**
A build seam was deleted or renamed. Restore it, or check the [Build seams](#5-build-seams) table.

**Fonts render, headings look too small.**
Expected at narrow widths. `headingSize` is a `clamp()` ceiling — see [The typography pipeline](#2-the-typography-pipeline).

**`data-state` on `.landing-page-frame` stays `"loading"`.**
Cosmetic and expected. The document can finish loading before React attaches its `onLoad` handler, so the flag never flips. It has **no** styling attached, and the frame's opacity is gated only when `backgroundCanvasSelector` is set — which `KageLandingPage` does not use. Nothing to fix.

---

## Licensing

The ThreeUI component sources, scene documents, and scene assets are MIT licensed — **Copyright (c) 2026 Meng To**. See [`THIRD_PARTY/LICENSE`](THIRD_PARTY/LICENSE).

Third-party components retain their own terms:

| Component                                                                | License                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Fragment Mono, Onest, Instrument Serif, Newsreader, Lexend font software | SIL Open Font License 1.1 —[`THIRD_PARTY/FONT-LICENSES.md`](THIRD_PARTY/FONT-LICENSES.md) |
| Bundled Three.js runtime                                                 | MIT, upstream header retained                                                               |
| Scene images and textures                                                | MIT (ThreeUI-authored) —[`THIRD_PARTY/ASSET-LICENSES.md`](THIRD_PARTY/ASSET-LICENSES.md)  |

Notices are reproduced verbatim in [`THIRD_PARTY/THIRD_PARTY_NOTICES.md`](THIRD_PARTY/THIRD_PARTY_NOTICES.md).

This repository contains **no Pro or Beta component source**, and no component-specific private asset.
