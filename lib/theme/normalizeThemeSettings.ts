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
export function normalizeThemeSettings(themeSettings: unknown): NormalizedTheme {
  const flat = flattenThemeInput(themeSettings);
  const merged: NormalizedTheme = { ...DEFAULT_THEME_FLAT };
  for (const [k, v] of Object.entries(flat)) {
    if (!v) continue;
    merged[k] = v;
  }
  Object.assign(merged, FIXED_MIDNIGHT_HYPER);
  return merged;
}

export function stripInternalThemeKeys(theme: NormalizedTheme): NormalizedTheme {
  const copy = { ...theme };
  delete copy._preset;
  return copy;
}
