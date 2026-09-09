import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTH_HERO_BG,
  AUTH_HERO_BG_COMPACT,
  AUTH_HERO_SCRIM,
  AUTH_BRAND_GLOW,
  AUTH_HERO_WASH,
  MODULE_CTA_BG,
  MODULE_HERO_BG,
  RESUME_HERO_BG,
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
  "aiViolet", "aiPink",
  "authWash", "authWash2", "authBrandFrom", "authBrandTo",
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


describe("the decorations follow the tenant too", () => {
  it("the panel wash is a variable, not two raw rgba literals", () => {
    // These are aria-hidden decoration, which is why they survived the first pass: nothing named
    // them and no token file mentioned them. On a navy panel they read as a purple bruise.
    expect(AUTH_HERO_WASH).toContain("--auth-wash");
    expect(AUTH_HERO_WASH).toContain("--auth-wash-2");
    expect(AUTH_HERO_WASH).toContain("rgba(168,85,247,0.24)");
    expect(AUTH_HERO_WASH).toContain("rgba(236,72,153,0.15)");
  });

  it("the brand glow is a variable", () => {
    expect(AUTH_BRAND_GLOW).toContain("--auth-brand-from");
    expect(AUTH_BRAND_GLOW).toContain("#ec4899");
  });
});

/**
 * The failure mode that produced this file's third round of fixes: a surface RE-TYPES the
 * literals instead of importing them, so it looks correct next to the token file and renders
 * violet on a repainted tenant. Reported as "resume builder still has old color".
 *
 * Reading the token file cannot catch that. Reading the SURFACES can, so these assertions run
 * against the actual source of the brand surfaces rather than against the exports.
 */
describe("no brand surface re-types the gradient literals", () => {
  const read = (p: string): string =>
    readFileSync(join(process.cwd(), p), "utf8");

  const SURFACES = [
    "components/profile/resume/ResumeHero.tsx",
    "components/common/ModulePageHeader.tsx",
    "components/dashboard/v2/AiBriefingHero.tsx",
  ];

  it.each(SURFACES)("%s builds no gradient from bare literals", (file) => {
    const src = read(file);
    const bare = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("*") && !l.trimStart().startsWith("//"))
      // Only a BACKGROUND built from the literals is the bug. ModulePageHeader's `tone` map is
      // a per-module accent palette -- indigo, pink, emerald, amber, one per module so the pages
      // are told apart -- and is deliberately NOT the tenant's brand colour.
      .filter((l) => /(background|linear-gradient|radial-gradient)/i.test(l))
      .filter((l) => /#(271a5c|241653|181040|100a2c|a855f7|ec4899)\b/.test(l))
      .filter((l) => !/var\(--/.test(l));
    expect(bare, `${file} re-types a gradient literal instead of importing it`).toEqual([]);
  });

  it.each(SURFACES)("%s carries no bare violet glow", (file) => {
    const src = read(file);
    const bare = src
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("*") && !l.trimStart().startsWith("//"))
      .filter((l) => /rgba\((76,29,149|192,38,211)/.test(l))
      .filter((l) => !/var\(--/.test(l));
    expect(bare, `${file} hardcodes a violet glow; it must use the shadow token`).toEqual([]);
  });

  it("the resume hero reuses the profile variables rather than a fourth set of keys", () => {
    expect(RESUME_HERO_BG).toContain("--profile-hero-from");
    expect(RESUME_HERO_BG).toContain("--profile-hero-glow");
    // and keeps its own geometry, so no other tenant's banner shifts
    expect(RESUME_HERO_BG).toContain("at 10% 115%");
    expect(RESUME_HERO_BG).toContain("#271a5c");
  });
});


/**
 * The AI pair reaches more of the product than any other token: --ai-violet alone is used 299
 * times, --gradient-ai 56, --ai-pink 10. All three were fixed literals in app/globals.css, which
 * is why a tenant that had repainted every hero and CTA still got violet composers, pills and
 * empty states -- and why those surfaces showed no hardcoded literal to grep for.
 */
describe("the AI gradient follows the tenant", () => {
  const css = (): string =>
    readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

  it("--ai-violet and --ai-pink read a theme token", () => {
    expect(css()).toMatch(/--ai-violet:\s*var\(--ai-violet-token, *#7c3aed\)/);
    expect(css()).toMatch(/--ai-pink:\s*var\(--ai-pink-token, *#ec4899\)/);
  });

  it("--gradient-ai is built from them, so it moves with them", () => {
    expect(css()).toMatch(/--gradient-ai:\s*linear-gradient\(135deg, var\(--ai-violet\)/);
    expect(css()).toContain("var(--ai-pink)");
  });

  it("keeps #7c3aed, NOT the CTA ramp's #a855f7", () => {
    // The codebase carries two violets on purpose. Pointing the AI pair at --module-cta-*
    // would lighten 370 sites for every stock tenant.
    const t = normalizeThemeSettings({});
    expect(t.aiViolet).toBe("#7c3aed");
    expect(t.aiPink).toBe("#ec4899");
    expect(t.aiViolet).not.toBe(t.moduleCtaFrom);
  });

  it("the forced palette pins it for a tenant that has not opted in", () => {
    const t = normalizeThemeSettings({ aiViolet: "#f59e0b" });
    expect(t.aiViolet).toBe("#7c3aed");
  });

  it("an opted-in tenant repaints it", () => {
    const t = normalizeThemeSettings({ [CUSTOM_PALETTE_OPT_IN]: "true", aiViolet: "#f59e0b" });
    expect(t.aiViolet).toBe("#f59e0b");
  });
});
