import type { NormalizedTheme } from "./normalizeThemeSettings";
import { stripInternalThemeKeys } from "./normalizeThemeSettings";

/** Space-separated RGB for `rgb(var(--shell-primary-rgb) / a)` in filters and shadows. */
function hexToRgbSpaceSeparated(hex: string): string | undefined {
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length === 3 && /^[0-9a-fA-F]{3}$/.test(raw)) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    return `${r} ${g} ${b}`;
  }
  if (raw.length === 6 && /^[0-9a-fA-F]{6}$/.test(raw)) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  return undefined;
}

/** Sidebar / bottom-nav chrome derived from tenant secondary + primary palette. */
function applyShellThemeVars(
  el: HTMLElement,
  t: Record<string, unknown>
): void {
  const shellBg =
    typeof t.secondary500 === "string" && t.secondary500.trim()
      ? t.secondary500.trim()
      : "#12293a";
  el.style.setProperty("--shell-sidebar-bg", shellBg);

  const primaryRgb =
    typeof t.primary500 === "string"
      ? hexToRgbSpaceSeparated(t.primary500)
      : undefined;
  if (primaryRgb) {
    el.style.setProperty("--shell-primary-rgb", primaryRgb);
  }
}

/** Maps camelCase token keys to CSS custom property names (without leading --). */
const CAMEL_TO_CSS: [keyof NormalizedTheme | string, string][] = [
  ["primary50", "primary-50"],
  ["primary100", "primary-100"],
  ["primary200", "primary-200"],
  ["primary300", "primary-300"],
  ["primary400", "primary-400"],
  ["primary500", "primary-500"],
  ["primary600", "primary-600"],
  ["primary700", "primary-700"],
  ["primary800", "primary-800"],
  ["primary900", "primary-900"],
  ["secondary50", "secondary-50"],
  ["secondary100", "secondary-100"],
  ["secondary200", "secondary-200"],
  ["secondary300", "secondary-300"],
  ["secondary400", "secondary-400"],
  ["secondary500", "secondary-500"],
  ["secondary600", "secondary-600"],
  ["secondary700", "secondary-700"],
  ["navBackground", "nav-background"],
  ["navSelected", "nav-selected"],
  ["fontDarkNav", "font-dark-nav"],
  ["fontLightNav", "font-light-nav"],
  ["accentYellow", "accent-yellow"],
  ["accentBlue", "accent-blue"],
  ["accentGreen", "accent-green"],
  ["accentRed", "accent-red"],
  ["accentOrange", "accent-orange"],
  ["accentTeal", "accent-teal"],
  ["accentPurple", "accent-purple"],
  ["accentPink", "accent-pink"],
  ["neutral50", "neutral-50"],
  ["neutral100", "neutral-100"],
  ["neutral200", "neutral-200"],
  ["neutral300", "neutral-300"],
  ["neutral400", "neutral-400"],
  ["neutral500", "neutral-500"],
  ["neutral600", "neutral-600"],
  ["neutral700", "neutral-700"],
  ["neutral800", "neutral-800"],
  ["success50", "success-50"],
  ["success100", "success-100"],
  ["success500", "success-500"],
  ["warning100", "warning-100"],
  ["warning500", "warning-500"],
  ["error100", "error-100"],
  ["error500", "error-500"],
  ["error600", "error-600"],
  ["fontLight", "font-light"],
  ["fontDark", "font-dark"],
  ["fontPrimary", "font-primary"],
  ["fontSecondary", "font-secondary"],
  ["fontTertiary", "font-tertiary"],
  ["courseCta", "course-cta"],
  ["defaultPrimary", "default-primary"],
  ["accentBlueLight", "accent-blue-light"],
  ["surfaceBlueLight", "surface-blue-light"],
  ["accentIndigo", "accent-indigo"],
  ["accentIndigoDark", "accent-indigo-dark"],
  ["surfaceIndigoLight", "surface-indigo-light"],
  ["chartArticles", "chart-articles"],
];

export function setCssVariablesOnElement(
  el: HTMLElement,
  theme: NormalizedTheme
): void {
  const t = stripInternalThemeKeys(theme);

  for (const [camel, cssName] of CAMEL_TO_CSS) {
    const val = t[camel as string];
    if (typeof val === "string" && val) {
      el.style.setProperty(`--${cssName}`, val);
    }
  }

  applyShellThemeVars(el, t as Record<string, unknown>);

  const ff = t.fontFamilySans;
  if (ff) {
    el.style.fontFamily = ff;
    el.style.setProperty("--font-family-primary", ff);
  }
}

/**
 * Apply normalized theme to `document.body` (CSS variables + font).
 */
export function applyDocumentTheme(theme: NormalizedTheme): void {
  if (typeof document === "undefined") return;
  const body = document.body;
  setCssVariablesOnElement(body, theme);

  body.style.setProperty("--main-background", "#ffffff");
  body.style.setProperty("--background", "#ffffff");
  body.style.setProperty("--foreground", "#171717");
}
