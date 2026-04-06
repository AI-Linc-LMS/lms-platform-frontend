/**
 * Client 28 (INUN): teal / emerald CSS variables and MUI palette so the app
 * matches the auth landing gradient instead of default blue primaries.
 */

export const CLIENT_28_ID = 28;

/** Keys we always re-apply after API theme so blues cannot win. */
const CLIENT_28_STICKY_KEYS = [
  "primary50",
  "primary100",
  "primary200",
  "primary300",
  "primary400",
  "primary500",
  "primary600",
  "primary700",
  "primary800",
  "primary900",
  "navBackground",
  "fontDarkNav",
  "secondary400",
  "secondary500",
  "navSelected",
  "secondary600",
  "secondary700",
  "accentBlue",
  "accentTeal",
  "courseCta",
  "defaultPrimary",
] as const;

type StickyKey = (typeof CLIENT_28_STICKY_KEYS)[number];

/** Full baseline when API omits fields; aligns with globals.css non-blue tokens. */
export const CLIENT_28_THEME_COMPLETE: Record<string, string> = {
  primary50: "#ecfdf5",
  primary100: "#d1fae5",
  primary200: "#a7f3d0",
  primary300: "#6ee7b7",
  primary400: "#34d399",
  primary500: "#10b981",
  primary600: "#059669",
  primary700: "#047857",
  primary800: "#065f46",
  primary900: "#064e3b",

  secondary50: "#ecfdf5",
  secondary100: "#ccfbf1",
  secondary200: "#5eead4",
  secondary300: "#ae0606",
  secondary400: "#0d9488",
  secondary500: "#134e4a",
  navSelected: "#115e59",
  secondary600: "#0f766e",
  secondary700: "#134e4a",

  navBackground: "#d1fae5",
  fontDarkNav: "#064e3b",
  fontLightNav: "#ffffff",

  accentYellow: "#facc15",
  accentBlue: "#14b8a6",
  accentGreen: "#38a169",
  accentRed: "#e53e3e",
  accentOrange: "#dd6b20",
  accentTeal: "#0d9488",
  accentPurple: "#805ad5",
  accentPink: "#d53f8c",

  neutral50: "#f8f9fa",
  neutral100: "#e9ecef",
  neutral200: "#dde2e6",
  neutral300: "#6c757d",
  neutral400: "#495057",
  neutral500: "#343a40",
  neutral600: "#2d3748",
  neutral700: "#1e1e1e",
  neutral800: "#1a1a1a",

  success50: "#ecfdf5",
  success100: "#a7f3d0",
  success500: "#059669",

  warning100: "#fff8e6",
  warning500: "#ffb800",

  error100: "#ffe6e6",
  error500: "#ea4335",
  error600: "#ae0606",

  fontLight: "#ffffff",
  courseCta: "#10b981",
  defaultPrimary: "#0f766e",
  fontDark: "#000000",
};

function pickSticky(
  source: Record<string, string>
): Record<StickyKey, string> {
  const out = {} as Record<StickyKey, string>;
  for (const k of CLIENT_28_STICKY_KEYS) {
    out[k] = source[k];
  }
  return out;
}

/**
 * Merge API theme with client-28 teal palette; sticky keys override API blues.
 */
export function mergeClient28ThemeSettings(
  api: Record<string, string> | null | undefined
): Record<string, string> {
  const base = { ...CLIENT_28_THEME_COMPLETE, ...(api || {}) };
  return { ...base, ...pickSticky(CLIENT_28_THEME_COMPLETE) };
}

export function isClient28Theme(clientId: unknown): boolean {
  return Number(clientId) === CLIENT_28_ID;
}

/** Extra body CSS vars not driven by theme_settings today (blue-tinted defaults in globals). */
export const CLIENT_28_EXTRA_CSS_VARS: Record<string, string> = {
  "--accent-blue-light": "#14b8a6",
  "--surface-blue-light": "#ccfbf1",
  "--accent-indigo": "#0d9488",
  "--accent-indigo-dark": "#0f766e",
  "--surface-indigo-light": "#ecfdf5",
  "--chart-articles": "#134e4a",
};

export const client28MuiPrimary = {
  main: "#0d9488",
  light: "#2dd4bf",
  dark: "#0f766e",
  contrastText: "#ffffff",
} as const;
