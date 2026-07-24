import { CAMEL_TO_CSS } from "./applyDocumentTheme";
import { normalizeThemeSettings } from "./normalizeThemeSettings";

/** Whitelist of CSS-safe characters so we never inject raw user input. */
const SAFE_VALUE = /^[#a-zA-Z0-9 .,()/%_\-+'"]*$/;

function sanitize(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!SAFE_VALUE.test(trimmed)) return null;
  return trimmed;
}

/**
 * Build a `<style>:root { --... }</style>` block from a tenant's stored
 * `theme_settings`. Inlined into the SSR HTML head so the very first browser
 * paint already uses the tenant palette - no flash from `globals.css` `:root`
 * defaults to the tenant theme on hydration.
 *
 * Server-safe: pure string transformation, no DOM access.
 */
export function themeToCssBlock(rawTheme: unknown): string {
  // Run the same normalization the client uses so defaults + legacy keys are
  // honoured and the SSR output matches what `applyDocumentTheme` would set.
  const flat = normalizeThemeSettings(rawTheme);
  const lines: string[] = [];

  for (const [camel, cssName] of CAMEL_TO_CSS) {
    const v = sanitize((flat as Record<string, unknown>)[camel as string]);
    if (v) lines.push(`  --${cssName}: ${v};`);
  }

  // Mirror the page-level fallbacks `applyDocumentTheme` writes onto body -
  // background, foreground, surface, modal, border - so the first paint
  // matches the JS pass after hydration.
  const background = sanitize(flat.navBackground) || sanitize(flat.surfaceBlueLight) || sanitize(flat.neutral50);
  const foreground = sanitize(flat.fontPrimary) || sanitize(flat.fontDark);
  const surface = sanitize(flat.surfaceBlueLight) || sanitize(flat.neutral50) || background;
  const cardBg = sanitize(flat.surfaceBlueLight) || sanitize(flat.neutral100);
  const borderDefault = sanitize(flat.neutral200);
  const shellBg = sanitize(flat.secondary500);

  if (background) {
    lines.push(`  --background: ${background};`);
    lines.push(`  --main-background: ${background};`);
  }
  if (foreground) {
    lines.push(`  --foreground: ${foreground};`);
    lines.push(`  --font-primary: ${foreground};`);
  }
  if (surface) lines.push(`  --surface: ${surface};`);
  if (cardBg) {
    lines.push(`  --card-bg: ${cardBg};`);
    lines.push(`  --modal-bg: ${cardBg};`);
  }
  if (borderDefault) lines.push(`  --border-default: ${borderDefault};`);
  if (shellBg) lines.push(`  --shell-sidebar-bg: ${shellBg};`);

  if (lines.length === 0) return "";
  return `:root {\n${lines.join("\n")}\n}`;
}
