import { DEFAULT_THEME_FLAT } from "./defaultThemeTokens";

function kebabToCamelSegment(key: string): string {
  return key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** e.g. primary-50 -> primary50, nav-background -> navBackground */
export function cssVarKeyToCamel(cssKey: string): string {
  return kebabToCamelSegment(cssKey.replace(/^--/, ""));
}

/** secondary_500 -> secondary500 (legacy keys in stored JSON). Preserves _preset. */
function snakeToCamelKey(key: string): string {
  if (key.startsWith("_")) return key;
  if (!key.includes("_")) return key;
  return key.replace(/_([a-z0-9])/gi, (_, ch: string) => ch.toUpperCase());
}

/**
 * Flatten legacy shapes: nested `colors` with kebab keys, or flat camelCase from API.
 */
export function flattenThemeInput(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return out;
  }
  const obj = raw as Record<string, unknown>;

  const colors = obj.colors;
  if (colors && typeof colors === "object" && !Array.isArray(colors)) {
    for (const [k, v] of Object.entries(colors as Record<string, unknown>)) {
      if (typeof v !== "string") continue;
      const camel = cssVarKeyToCamel(k);
      out[camel] = v.trim();
    }
  }

  for (const [k, v] of Object.entries(obj)) {
    if (k === "colors") continue;
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    const canonical = snakeToCamelKey(k);
    out[canonical] = trimmed;
  }

  return out;
}

export type NormalizedTheme = Record<string, string>;

/**
 * Merge API / preset theme with defaults. Preserves `_preset` for admin display.
 */
/**
 * Platform-wide fixed colour palette ("Midnight hyper" - ink sidebar, vivid
 * purple accents, white canvas). Colour customization is disabled for every
 * client: these colour tokens are forced regardless of a tenant's stored
 * theme_settings. NON-colour keys (login slogan text, font family, logo
 * dimensions) are intentionally NOT listed here, so they still pass through and
 * remain editable on the admin Settings page. Sourced from the backend
 * `midnight_hyper_white_bg` preset (client_theming/presets.py) so it stays exact.
 */
const FIXED_MIDNIGHT_HYPER: Record<string, string> = {
  moduleHeroFrom: "#241653",
  moduleHeroMid: "#181040",
  moduleHeroTo: "#100a2c",
  moduleHeroGlow: "rgba(124,58,237,0.22)",
  moduleCtaFrom: "#a855f7",
  moduleCtaTo: "#ec4899",
  moduleHeroShadow: "rgba(76,29,149,0.7)",
  moduleCtaShadow: "rgba(192,38,211,0.7)",
  moduleTileFrom: "#6366f1",
  moduleTileTo: "#a855f7",
  profileHeroFrom: "#271a5c",
  profileHeroMid: "#181040",
  profileHeroTo: "#100a2c",
  profileHeroGlow: "rgba(192,38,211,0.45)",
  profileHeroGlow2: "rgba(124,58,237,0.30)",
  authAccent: "#7c3aed",
  authAccentDeep: "#5b21b6",
  authAccentSoft: "#f5f0ff",
  authAccentAlt: "#ec4899",
  authNight: "#140b2b",
  authNight2: "#1e1040",
  authGlow: "rgba(124,58,237,0.349)",
  authGlowDeep: "rgba(91,33,182,0.2)",
  authGlowSoft: "rgba(124,58,237,0.302)",
  authScrim: "rgba(30,16,64,0.851)",
  authScrim2: "rgba(20,11,43,0.949)",
  authOnAccent: "#ffffff",
  authLink: "#7c3aed",
  primary50: "#faf5ff",
  primary100: "#f3e8ff",
  primary200: "#e9d5ff",
  primary300: "#d8b4fe",
  primary400: "#c084fc",
  primary500: "#a855f7",
  primary600: "#9333ea",
  primary700: "#7e22ce",
  primary800: "#6b21a8",
  primary900: "#581c87",
  secondary50: "#e6f8f6",
  secondary100: "#cde5ce",
  secondary200: "#417845",
  secondary300: "#ae0606",
  secondary400: "#7e22ce",
  secondary500: "#0f0518",
  secondary600: "#1a1033",
  secondary700: "#0f0518",
  navBackground: "#ffffff",
  navSelected: "#1e1b4b",
  fontDarkNav: "#3b0764",
  fontLightNav: "#faf5ff",
  accentYellow: "#facc15",
  accentBlue: "#3875f9",
  accentGreen: "#38a169",
  accentRed: "#e53e3e",
  accentOrange: "#dd6b20",
  accentTeal: "#319795",
  accentPurple: "#c084fc",
  accentPink: "#d53f8c",
  neutral50: "#ffffff",
  neutral100: "#e9ecef",
  neutral200: "#dde2e6",
  neutral300: "#6c757d",
  neutral400: "#495057",
  neutral500: "#343a40",
  neutral600: "#2d3748",
  neutral700: "#1e1e1e",
  neutral800: "#1a1a1a",
  success50: "#e6f8f6",
  success100: "#cde5ce",
  success500: "#5fa564",
  warning100: "#fff8e6",
  warning500: "#ffb800",
  error100: "#ffe6e6",
  error500: "#ea4335",
  error600: "#ae0606",
  fontLight: "#ffffff",
  fontDark: "#000000",
  courseCta: "#9333ea",
  defaultPrimary: "#a855f7",
  muiPrimaryMain: "#a855f7",
  muiPrimaryLight: "#d8b4fe",
  muiPrimaryDark: "#7e22ce",
  muiPrimaryContrastText: "#ffffff",
  accentBlueLight: "#c084fc",
  surfaceBlueLight: "#ffffff",
  accentIndigo: "#a855f7",
  accentIndigoDark: "#7e22ce",
  surfaceIndigoLight: "#f8fafc",
  chartArticles: "#6b21a8",
};

/**
 * Merge API / preset theme with defaults, then force the platform-wide fixed
 * colour palette so every client renders identically. Preserves `_preset` and
 * non-colour keys (slogan text, fonts, logo sizing).
 *
 * This is the single chokepoint every colour read funnels through (sidebar
 * shell, MUI theme, all globals.css CSS vars, the login page, and the SSR
 * `themeToCssBlock` inline <style>), so forcing colours here covers first paint
 * + client runtime with no per-surface override and no loophole.
 */
/**
 * Opt-in marker a tenant sets in its stored `theme_settings` to keep its own colours.
 *
 * The fixed palette below exists so every client renders identically, and that stays the
 * default: a tenant without this key is unaffected, which is all of them bar the ones
 * deliberately opted in. Without an escape hatch, a tenant palette could be configured,
 * saved, served by the API and still never render -- which is exactly what happened to
 * Capabl Labs (client 58), whose brand palette was live in the database and invisible on
 * the site.
 *
 * A marker rather than a hardcoded client id: this file has no idea which tenant it is
 * rendering, and it should not learn.
 */
export const CUSTOM_PALETTE_OPT_IN = "_useTenantPalette";

export function normalizeThemeSettings(themeSettings: unknown): NormalizedTheme {
  const flat = flattenThemeInput(themeSettings);
  const merged: NormalizedTheme = { ...DEFAULT_THEME_FLAT };
  for (const [k, v] of Object.entries(flat)) {
    if (!v) continue;
    merged[k] = v;
  }
  // A tenant that has opted in keeps the colours it stored. Everyone else gets the fixed
  // palette, forced after the merge exactly as before.
  if (String(flat[CUSTOM_PALETTE_OPT_IN] ?? "").toLowerCase() !== "true") {
    Object.assign(merged, FIXED_MIDNIGHT_HYPER);
  }
  return merged;
}

export function stripInternalThemeKeys(theme: NormalizedTheme): NormalizedTheme {
  const copy = { ...theme };
  delete copy._preset;
  delete copy[CUSTOM_PALETTE_OPT_IN];
  return copy;
}
