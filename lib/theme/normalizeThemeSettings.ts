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
export function normalizeThemeSettings(themeSettings: unknown): NormalizedTheme {
  const flat = flattenThemeInput(themeSettings);
  const merged: NormalizedTheme = { ...DEFAULT_THEME_FLAT };
  for (const [k, v] of Object.entries(flat)) {
    if (!v) continue;
    merged[k] = v;
  }
  return merged;
}

export function stripInternalThemeKeys(theme: NormalizedTheme): NormalizedTheme {
  const copy = { ...theme };
  delete copy._preset;
  return copy;
}
