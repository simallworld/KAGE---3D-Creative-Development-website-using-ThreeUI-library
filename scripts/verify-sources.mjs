/**
 * Verifies every registered ThreeUI file in this project against the manifest
 * captured from the source-code bundle. Run with `npm run verify:sources`.
 *
 * Registered sources live under packages/threeui/; the documents the frame
 * loads are served from public/, because LandingPageFrame requests them from
 * the application origin ("/landing-pages/kage.html").
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(resolve(root, "vendor/kage-landing-page.json"), "utf8"));

/** Where each registered path actually lives in this project. */
const locationOf = (registeredPath) =>
  registeredPath.startsWith("src/") ? `packages/threeui/${registeredPath}` : registeredPath;

let failures = 0;

const verify = (path, expectedSha, expectedBytes, label) => {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) {
    console.log(`MISSING  ${label}`);
    failures += 1;
    return;
  }
  const bytes = readFileSync(absolute);
  const sha = createHash("sha256").update(bytes).digest("hex");
  const ok = sha === expectedSha && (expectedBytes === undefined || bytes.length === expectedBytes);
  if (!ok) failures += 1;
  console.log(`${ok ? "OK  " : "FAIL"}  ${label}  ${bytes.length}B`);
};

for (const file of manifest.files) {
  verify(locationOf(file.path), file.sha256, file.bytes, file.path);
}
for (const asset of manifest.assets) {
  verify(asset.path, asset.sha256, asset.bytes, asset.path.replace("public/landing-pages/secret-pathways-assets/", ""));
}

console.log(
  failures === 0
    ? `\nAll ${manifest.files.length + manifest.assets.length} registered files match the manifest.`
    : `\n${failures} file(s) do not match the manifest.`,
);
process.exit(failures === 0 ? 0 : 1);
