import { describe, expect, it } from "vitest";
import {
  AUTH_HERO_BG,
  AUTH_HERO_BG_COMPACT,
  AUTH_HERO_SCRIM,
  MODULE_CTA_BG,
  MODULE_HERO_BG,
  PROFILE_HERO_BG,
} from "./gradients";
import { CUSTOM_PALETTE_OPT_IN, normalizeThemeSettings } from "./normalizeThemeSettings";
import { CAMEL_TO_CSS } from "./applyDocumentTheme";
import { ALLOWED_THEME_KEYS } from "@/lib/services/admin/branding.service";

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

/**
 * The second wave: profile, icon tiles, the two brand-coloured shadows and the sign-in panel.
 *
 * The bug these guard against already happened once. `moduleHero*` was registered in the
 * defaults, the forced palette and CAMEL_TO_CSS, but NOT in ALLOWED_THEME_KEYS -- so the admin
 * Settings page filtered the six keys out of its own GET and could neither show nor edit a
 * tenant's hero. Four registries, and a key is only real when it is in all four.
 */

const WAVE_TWO = [
  "moduleHeroShadow", "moduleCtaShadow", "moduleTileFrom", "moduleTileTo",
  "profileHeroFrom", "profileHeroMid", "profileHeroTo", "profileHeroGlow", "profileHeroGlow2",
  "authAccent", "authAccentDeep", "authAccentSoft", "authAccentAlt",
  "authNight", "authNight2",
  "authGlow", "authGlowDeep", "authGlowSoft", "authScrim", "authScrim2",
  "authOnAccent", "authLink",
];

describe("every branding token is registered in all four places", () => {
  it("is mapped to a CSS variable", () => {
    const mapped = new Set(CAMEL_TO_CSS.map(([camel]) => camel as string));
    for (const t of [...TOKENS, ...WAVE_TWO]) {
      expect(mapped.has(t), `${t} is missing from CAMEL_TO_CSS, so it never reaches the DOM`)
        .toBe(true);
    }
  });

  it("has a platform default", () => {
    const t = normalizeThemeSettings({});
    for (const k of [...TOKENS, ...WAVE_TWO]) {
      expect(typeof t[k], `${k} has no default, so the fallback is all that renders`)
        .toBe("string");
    }
  });

  it("is editable from the admin Settings page", () => {
    // The exact gap that hid the hero colours from admins until now.
    for (const k of [...TOKENS, ...WAVE_TWO]) {
      expect(ALLOWED_THEME_KEYS.has(k), `${k} is not in ALLOWED_THEME_KEYS: the branding GET
        filters it out, so an admin can neither see nor set it`).toBe(true);
    }
  });
});

describe("wave two keeps every other tenant exactly where it was", () => {
  it("the profile hero still renders its own literals, not the module hero's", () => {
    // Pointing the profile hero at --module-hero-* would have shifted every tenant's profile
    // banner from #271a5c to #241653. It carries its own vars precisely so it does not.
    expect(PROFILE_HERO_BG).toContain("#271a5c");
    expect(PROFILE_HERO_BG).toContain("--profile-hero-from");
    expect(PROFILE_HERO_BG).not.toContain("--module-hero-from");
  });

  it("the forced palette reproduces the old shadows and tiles", () => {
    const t = normalizeThemeSettings({ moduleCtaShadow: "rgba(217,119,6,0.5)" });
    expect(t.moduleCtaShadow).toBe("rgba(192,38,211,0.7)");
    expect(t.moduleTileFrom).toBe("#6366f1");
    expect(t.authNight).toBe("#140b2b");
  });

  it("the sign-in panel keeps the alphas it used to build by hex suffix", () => {
    // `${AUTH.violet}59` -> 0x59/255 = 0.349. A var() cannot carry that suffix, so the stop is
    // pre-composed; if the conversion drifts, the panel's glow changes for all 16 tenants.
    expect(AUTH_HERO_BG).toContain("rgba(124,58,237,0.349)");
    expect(AUTH_HERO_BG).toContain("rgba(91,33,182,0.2)");
    expect(AUTH_HERO_BG_COMPACT).toContain("rgba(124,58,237,0.302)");
    expect(AUTH_HERO_SCRIM).toContain("rgba(30,16,64,0.851)");
    expect(AUTH_HERO_SCRIM).toContain("rgba(20,11,43,0.949)");
  });

  it("no auth gradient still concatenates a hex alpha onto a var", () => {
    for (const g of [AUTH_HERO_BG, AUTH_HERO_BG_COMPACT, AUTH_HERO_SCRIM]) {
      expect(g).not.toMatch(/var\([^)]*\)[0-9a-fA-F]{2}/);
    }
  });
});

describe("an opted-in tenant repaints sign-in too", () => {
  it("carries its own auth colours through", () => {
    const t = normalizeThemeSettings({
      [CUSTOM_PALETTE_OPT_IN]: "true",
      authAccent: "#f59e0b",
      authNight: "#0f2440",
    });
    expect(t.authAccent).toBe("#f59e0b");
    expect(t.authNight).toBe("#0f2440");
  });
});
