/**
 * Login / auth right-panel copy & layout overrides (stored in Client.theme_settings).
 */

export type LoginHeroBrandingUi = {
  sloganFontSize?: string;
  sloganColor?: string;
  sloganFontWeight?: number;
  sloganFontStyle?: "normal" | "italic";
  brandNameFontSize?: string;
  brandNameColor?: string;
  brandNameFontWeight?: number;
  logoMaxWidthPx?: number;
  logoHeightPx?: number;
};

function parseFontWeight(theme: Record<string, string>, key: string): number | undefined {
  const s = theme[key]?.trim();
  if (!s) return undefined;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 100 || n > 900) return undefined;
  return n;
}

function parsePx(theme: Record<string, string>, key: string): number | undefined {
  const s = theme[key]?.trim();
  if (!s) return undefined;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

/** Build UI config from merged theme_settings (e.g. output of `normalizeThemeSettings`). */
const SIDEBAR_LOGO_W_MIN = 40;
const SIDEBAR_LOGO_W_MAX = 220;
const SIDEBAR_LOGO_H_MIN = 24;
const SIDEBAR_LOGO_H_MAX = 80;
const SIDEBAR_LOGO_DEFAULT_W = 200;
const SIDEBAR_LOGO_DEFAULT_H = 44;

function clampInt(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

/** Side menu logo box (theme_settings). Falls back to login hero logo dimensions, then defaults. */
export function buildSidebarLogoBrandingUi(theme: Record<string, string>): {
  logoMaxWidthPx: number;
  logoHeightPx: number;
} {
  const sw = parsePx(theme, "sidebarLogoMaxWidthPx");
  const sh = parsePx(theme, "sidebarLogoHeightPx");
  const hw = parsePx(theme, "loginHeroLogoMaxWidthPx");
  const hh = parsePx(theme, "loginHeroLogoHeightPx");

  const w = sw ?? hw ?? SIDEBAR_LOGO_DEFAULT_W;
  const h = sh ?? hh ?? SIDEBAR_LOGO_DEFAULT_H;
  return {
    logoMaxWidthPx: clampInt(w, SIDEBAR_LOGO_W_MIN, SIDEBAR_LOGO_W_MAX),
    logoHeightPx: clampInt(h, SIDEBAR_LOGO_H_MIN, SIDEBAR_LOGO_H_MAX),
  };
}

export function buildLoginHeroBrandingUi(theme: Record<string, string>): LoginHeroBrandingUi {
  const st = theme.loginHeroSloganFontStyle?.trim();
  return {
    sloganFontSize: theme.loginHeroSloganFontSize?.trim() || undefined,
    sloganColor: theme.loginHeroSloganColor?.trim() || undefined,
    sloganFontWeight: parseFontWeight(theme, "loginHeroSloganFontWeight"),
    sloganFontStyle:
      st === "italic" ? "italic" : st === "normal" ? "normal" : undefined,
    brandNameFontSize: theme.loginHeroBrandNameFontSize?.trim() || undefined,
    brandNameColor: theme.loginHeroBrandNameColor?.trim() || undefined,
    brandNameFontWeight: parseFontWeight(theme, "loginHeroBrandNameFontWeight"),
    logoMaxWidthPx: parsePx(theme, "loginHeroLogoMaxWidthPx"),
    logoHeightPx: parsePx(theme, "loginHeroLogoHeightPx"),
  };
}

export function getLoginHeroSloganOverride(theme: Record<string, string>): string | null {
  const s = theme.loginHeroSlogan?.trim();
  return s ? s : null;
}

/** MUI `sx` for the hero / default slogan line. */
export function sloganTypographySx(hero: boolean, b: LoginHeroBrandingUi) {
  return {
    fontSize:
      b.sloganFontSize ??
      (hero
        ? { md: "2.25rem", lg: "2.75rem" }
        : { md: "3rem", lg: "4rem" }),
    fontWeight: b.sloganFontWeight ?? 700,
    fontStyle: b.sloganFontStyle ?? "normal",
    lineHeight: 1.2,
    color: b.sloganColor ?? (hero ? "#0f172a" : "#1e293b"),
    maxWidth: 720,
    position: "relative" as const,
    zIndex: hero ? undefined : 2,
  };
}

/** MUI `sx` for client name under logo (hero vs default layout). */
export function brandNameTypographySx(hero: boolean, b: LoginHeroBrandingUi) {
  if (hero) {
    return {
      fontSize:
        b.brandNameFontSize ??
        ({ md: "1.3125rem", lg: "1.5rem" } as const),
      fontWeight: b.brandNameFontWeight ?? 500,
      lineHeight: 1.5,
      color: b.brandNameColor ?? "#1e293b",
      maxWidth: 640,
      m: 0,
    };
  }
  return {
    fontSize:
      b.brandNameFontSize ??
      ({ md: "2.75rem", lg: "3.25rem" } as const),
    fontWeight: b.brandNameFontWeight ?? 800,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    wordSpacing: "normal",
    color: b.brandNameColor ?? "#1e293b",
    maxWidth: 720,
    width: "100%",
    m: 0,
    mx: "auto",
    textAlign: "center" as const,
    alignSelf: "center",
  };
}

export function logoContainerSx(hero: boolean, b: LoginHeroBrandingUi) {
  const maxW = b.logoMaxWidthPx ?? (hero ? 720 : 280);
  const h = b.logoHeightPx;
  if (h != null) {
    return {
      position: "relative" as const,
      width: "100%",
      maxWidth: maxW,
      height: h,
      mx: "auto" as const,
      alignSelf: "center" as const,
    };
  }
  if (hero) {
    return {
      position: "relative" as const,
      width: "100%",
      maxWidth: maxW,
      height: { md: 180, lg: 204 },
      mx: "auto" as const,
    };
  }
  return {
    position: "relative" as const,
    width: "100%",
    maxWidth: maxW,
    height: { xs: 56, md: 72 },
    mx: "auto" as const,
    alignSelf: "center" as const,
  };
}

export function logoImageSizes(hero: boolean, b: LoginHeroBrandingUi): string {
  const w = b.logoMaxWidthPx ?? (hero ? 720 : 280);
  return `${Math.min(w, 960)}px`;
}
