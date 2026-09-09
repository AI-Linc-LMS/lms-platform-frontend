import { describe, expect, it } from "vitest";
import { MODULE_CTA_BG, MODULE_HERO_BG } from "./gradients";
import { CUSTOM_PALETTE_OPT_IN, normalizeThemeSettings } from "./normalizeThemeSettings";
import { CAMEL_TO_CSS } from "./applyDocumentTheme";

/**
 * The module hero and its CTA were literals in every surface that drew one, so a tenant with
 * its own palette still got a violet banner and a purple/pink button on the dashboard, every
 * module header and the buttons underneath them -- reported after the Capabl repaint landed as
 * "update all the module header and buttons as well and cta buttons".
 *
 * The risk in fixing it is loosening the look for the other 15 tenants. These pin that the
 * defaults reproduce the previous literals exactly.
 */

const TOKENS = [
  "moduleHeroFrom", "moduleHeroMid", "moduleHeroTo", "moduleHeroGlow",
  "moduleCtaFrom", "moduleCtaTo",
];

describe("the gradients read tenant tokens", () => {
  it("the hero uses the hero vars", () => {
    for (const v of ["--module-hero-from", "--module-hero-mid", "--module-hero-to"]) {
      expect(MODULE_HERO_BG).toContain(v);
    }
  });

  it("the CTA uses the cta vars", () => {
    expect(MODULE_CTA_BG).toContain("--module-cta-from");
    expect(MODULE_CTA_BG).toContain("--module-cta-to");
  });

  it("every var carries the literal it replaced as its fallback", () => {
    // Belt and braces: if a token is ever dropped from the theme, the old look survives.
    expect(MODULE_HERO_BG).toContain("#241653");
    expect(MODULE_HERO_BG).toContain("#100a2c");
    expect(MODULE_CTA_BG).toContain("#a855f7");
    expect(MODULE_CTA_BG).toContain("#ec4899");
  });
});

describe("nothing changes for a tenant that has not opted in", () => {
  it("the forced palette supplies the previous literals", () => {
    const t = normalizeThemeSettings({ moduleCtaFrom: "#f59e0b", moduleHeroFrom: "#193c68" });
    expect(t.moduleCtaFrom).toBe("#a855f7");
    expect(t.moduleHeroFrom).toBe("#241653");
  });

  it("and so do the platform defaults on an empty theme", () => {
    const t = normalizeThemeSettings({});
    expect(t.moduleCtaTo).toBe("#ec4899");
    expect(t.moduleHeroTo).toBe("#100a2c");
  });
});

describe("an opted-in tenant gets its own", () => {
  it("keeps the hero and CTA colours it stored", () => {
    const t = normalizeThemeSettings({
      [CUSTOM_PALETTE_OPT_IN]: "true",
      moduleHeroFrom: "#193c68",
      moduleCtaFrom: "#f59e0b",
      moduleCtaTo: "#d97706",
    });
    expect(t.moduleHeroFrom).toBe("#193c68");
    expect(t.moduleCtaFrom).toBe("#f59e0b");
    expect(t.moduleCtaTo).toBe("#d97706");
  });
});

describe("the tokens actually reach the DOM", () => {
  it("each one is mapped to a CSS variable", () => {
    const mapped = new Set(CAMEL_TO_CSS.map(([camel]) => camel as string));
    for (const t of TOKENS) {
      expect(mapped.has(t), `${t} must be in CAMEL_TO_CSS or it is never emitted`).toBe(true);
    }
  });
});
