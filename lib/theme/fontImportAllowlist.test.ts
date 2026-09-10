import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isRedundantFontImport } from "./fontImportAllowlist";

/**
 * Satoshi moved in-repo, but all 24 tenants that set `fontImportUrl` kept the Fontshare URL.
 * Measured on learn.agileologyedu.com/login: the self-hosted weights download from the site's
 * own origin AND four more requests go to api.fontshare.com + cdn.fontshare.com at ~200 ms
 * each, for a font the browser already has. Two extra DNS+TLS handshakes, ~800 ms, zero pixels.
 */
describe("a tenant font import that duplicates a self-hosted family", () => {
  const FONTSHARE_SATOSHI =
    "https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap";

  it("is recognised as redundant", () => {
    expect(isRedundantFontImport(FONTSHARE_SATOSHI)).toBe(true);
  });

  it("still allows a family we do NOT self-host", () => {
    expect(isRedundantFontImport("https://api.fontshare.com/v2/css?f[]=clash-display@400")).toBe(false);
    expect(isRedundantFontImport("https://fonts.googleapis.com/css2?family=Inter:wght@400")).toBe(false);
  });

  it("does not drop a mixed import that also asks for something new", () => {
    // Dropping this would lose Clash Display, so it must survive.
    expect(isRedundantFontImport(
      "https://api.fontshare.com/v2/css?f[]=satoshi@400&f[]=clash-display@400")).toBe(false);
  });

  it("ignores anything that is not a webfont host", () => {
    expect(isRedundantFontImport("")).toBe(false);
    expect(isRedundantFontImport("https://example.com/satoshi.css")).toBe(false);
  });
});

describe("self-hosted fonts are cached like the immutable assets they are", () => {
  it("netlify.toml gives /assets/fonts a long immutable max-age", () => {
    // Without this Netlify serves public/ as `max-age=0, must-revalidate` and answers with the
    // full body: 75 KB of Satoshi re-downloaded on EVERY document load, every route, every
    // tenant, measured at 519-637 ms per weight.
    const toml = readFileSync(join(process.cwd(), "netlify.toml"), "utf8");
    const block = toml.slice(toml.indexOf('for = "/assets/fonts/*"'));
    expect(block).toContain("immutable");
    expect(block).toMatch(/max-age=31536000/);
  });
});
