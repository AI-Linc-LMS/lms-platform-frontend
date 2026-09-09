import { describe, expect, it } from "vitest";
import {
  CUSTOM_PALETTE_OPT_IN,
  normalizeThemeSettings,
  stripInternalThemeKeys,
} from "./normalizeThemeSettings";

/**
 * `FIXED_MIDNIGHT_HYPER` forces one palette on every client, and its comment says so:
 * "Colour customization is disabled for every client: these colour tokens are forced
 * regardless of a tenant's stored theme_settings."
 *
 * That is deliberate and stays the default. But it meant a tenant palette could be
 * configured, saved, returned by the API and still never render. Capabl Labs (client 58) had
 * its brand palette live in the database and a purple site: a token-by-token diff of the
 * built HTML matched the forced palette on 57 of 68 tokens and the tenant's own on 4.
 *
 * The opt-in is the escape hatch. Absent it, nothing changes for anyone.
 */

const CAPABL = {
  primary500: "#f59e0b",
  muiPrimaryMain: "#f59e0b",
  navSelected: "#193c68",
  accentOrange: "#ea580c",
  fontPrimary: "#333333",
};

describe("the forced palette is still the default", () => {
  it("overrides a tenant palette when there is no opt-in", () => {
    const t = normalizeThemeSettings(CAPABL);
    expect(t.primary500).toBe("#a855f7");
    expect(t.muiPrimaryMain).toBe("#a855f7");
  });

  it("overrides even when the tenant stored a full palette", () => {
    expect(normalizeThemeSettings({ ...CAPABL, secondary500: "#193c68" }).secondary500)
      .toBe("#0f0518");
  });

  it("applies to an empty theme too", () => {
    expect(normalizeThemeSettings({}).primary500).toBe("#a855f7");
  });

  it("is unaffected by a falsy or misspelled opt-in", () => {
    expect(normalizeThemeSettings({ ...CAPABL, [CUSTOM_PALETTE_OPT_IN]: "false" }).primary500)
      .toBe("#a855f7");
    expect(normalizeThemeSettings({ ...CAPABL, _useTenantPalettes: "true" }).primary500)
      .toBe("#a855f7");
  });
});

describe("an opted-in tenant keeps its own colours", () => {
  const opted = { ...CAPABL, [CUSTOM_PALETTE_OPT_IN]: "true" };

  it("renders the tenant primary, not the forced purple", () => {
    expect(normalizeThemeSettings(opted).primary500).toBe("#f59e0b");
  });

  it("carries the whole palette through, not just primary", () => {
    const t = normalizeThemeSettings(opted);
    expect(t.muiPrimaryMain).toBe("#f59e0b");
    expect(t.navSelected).toBe("#193c68");
    expect(t.accentOrange).toBe("#ea580c");
    expect(t.fontPrimary).toBe("#333333");
  });

  it("still fills unset tokens from the platform defaults", () => {
    // Opting in must not leave a tenant with holes; a missing token has to resolve.
    const t = normalizeThemeSettings({ primary500: "#f59e0b", [CUSTOM_PALETTE_OPT_IN]: "true" });
    expect(t.neutral200).toBeTruthy();
    expect(t.success500).toBeTruthy();
  });

  it("accepts the marker case-insensitively", () => {
    expect(normalizeThemeSettings({ ...CAPABL, [CUSTOM_PALETTE_OPT_IN]: "TRUE" }).primary500)
      .toBe("#f59e0b");
  });
});

describe("the marker is internal", () => {
  it("never reaches a caller that strips internals", () => {
    const t = normalizeThemeSettings({ ...CAPABL, [CUSTOM_PALETTE_OPT_IN]: "true" });
    expect(stripInternalThemeKeys(t)[CUSTOM_PALETTE_OPT_IN]).toBeUndefined();
  });

  it("is not a colour, so it can never be emitted as a CSS value", () => {
    expect(CUSTOM_PALETTE_OPT_IN.startsWith("_")).toBe(true);
  });
});
