/**
 * Profile surface design tokens.
 *
 * Same reasoning as components/auth/layout/authTokens.ts: these are deliberately literal
 * constants, NOT CSS custom properties. A new `--var` has to be registered in CAMEL_TO_CSS
 * (lib/theme/applyDocumentTheme.ts), DEFAULT_THEME_FLAT, ALLOWED_THEME_KEYS
 * (lib/services/admin/branding.service.ts) and the Python serializer, or it is silently
 * dropped. None of these vary per tenant, so a constant is honest.
 *
 * Values are taken from the SHIPPED dashboard (components/dashboard/v2/*), not from the
 * token file and not from DESIGN.md sections 4 and 6. DESIGN.md section 2 says "match the
 * dashboard, do not invent a second one", but section 4 forbids 700+ weights and section 6
 * forbids gradient pill CTAs, both of which the shipped dashboard uses. The dashboard is
 * what a student actually sees, so it wins here.
 *
 * Colours that already exist as variables (ink, violet, hairline) are re-pointed for this
 * surface by the `.profile-surface` scope in app/globals.css. This file carries only the
 * STRUCTURAL values, which were never variables: the hero gradient, the panel radius and
 * shadow ladder, the icon-tile and CTA gradients.
 */

export const PROFILE = {
  ink: "#0f172a",
  inkMuted: "#475569",
  inkFaint: "#64748b",

  canvas: "#fbfbfd",
  surface: "#ffffff",
  hairline: "#e4e7f0",
  hairlineSoft: "#eef2f7",

  violet: "#7c3aed",
  violetLight: "#a855f7",
  violetSoft: "#f5f3ff",
  violetBorder: "#ede9fe",
  indigo: "#6366f1",
  pink: "#ec4899",

  /** Dark hero base stops. Mirrors AiBriefingHero. */
  night: "#100a2c",
  night2: "#181040",
  night3: "#271a5c",
} as const;

/**
 * The dark hero. Copied verbatim from AiBriefingHero.tsx so the profile hero and the
 * dashboard hero are the same object, not two things that look similar.
 */
export const HERO_BG =
  "radial-gradient(110% 130% at 12% 112%, rgba(192,38,211,0.45) 0%, rgba(124,58,237,0.30) 30%, rgba(15,10,40,0) 60%), " +
  "linear-gradient(150deg, #271a5c 0%, #181040 55%, #100a2c 100%)";

export const HERO_SHADOW = "0 24px 60px -30px rgba(76,29,149,0.7)";

/** MUI spacing unit, so `borderRadius: HERO_RADIUS` reads as 40px. */
export const HERO_RADIUS = 5;

/**
 * White card on canvas. From parts.tsx PanelCard: a defined border plus a soft shadow so
 * the cards read as cards next to the dark hero rather than as plain rectangles.
 */
export const PANEL_SHADOW =
  "0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28)";

export const PANEL_BORDER = `1px solid ${PROFILE.hairline}`;

/** MUI spacing unit → 32px. */
export const PANEL_RADIUS = 4;

/** The 30px section-header icon tile. */
export const TILE_GRADIENT = "linear-gradient(135deg, #6366f1, #a855f7)";

/** Primary action. The dashboard's gradient pill; see the DESIGN.md note above. */
export const CTA_GRADIENT = "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)";

export const CTA_SHADOW = "0 14px 34px -12px rgba(192,38,211,0.7)";

/** Translucent surfaces used on top of the dark hero. */
export const ON_DARK = {
  fill: "rgba(255,255,255,0.10)",
  fillStrong: "rgba(255,255,255,0.16)",
  border: "rgba(255,255,255,0.14)",
  borderStrong: "rgba(255,255,255,0.34)",
  cardFill: "rgba(0,0,0,0.20)",
  cardFillHover: "rgba(0,0,0,0.28)",
  text: "#ffffff",
  textSoft: "rgba(255,255,255,0.86)",
  textFaint: "rgba(255,255,255,0.60)",
  divider: "rgba(255,255,255,0.12)",
} as const;

/** Activity heatmap intensity ladder, violet rather than the old indigo. */
export const HEAT_SCALE = ["#f1f5f9", "#ede9fe", "#c4b5fd", "#a78bfa", "#7c3aed"] as const;

/**
 * Stat tile accents. Same four the dashboard StatCards row uses, in the same order, so a
 * student reading both surfaces learns one colour language.
 */
export const STAT_ACCENT = {
  violet: "#7c3aed",
  amber: "#f59e0b",
  blue: "#3b82f6",
  green: "#22c55e",
} as const;

/** Entrance motion. Matches the dashboard's Reveal. */
export const EASE = "cubic-bezier(.175,.885,.32,1.1)";
