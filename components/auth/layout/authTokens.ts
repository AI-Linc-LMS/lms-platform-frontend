/**
 * Auth surface design tokens.
 *
 * Deliberately literal constants, NOT CSS custom properties. A new `--var` has to be
 * registered in CAMEL_TO_CSS (lib/theme/applyDocumentTheme.ts), DEFAULT_THEME_FLAT,
 * ALLOWED_THEME_KEYS (lib/services/admin/branding.service.ts) and the Python serializer,
 * or it is silently dropped. These values never vary per tenant, so a constant is honest.
 *
 * Values are taken from the shipped student dashboard (components/dashboard/v2/*) and
 * ModulePageHeader rather than from the token file, because the two disagree:
 * --primary-500 is #a855f7 while the dashboard's violet is #7c3aed. Signing in should
 * look like the product you land in, so the dashboard wins.
 *
 * See DESIGN.md for the reasoning behind each value.
 */

export const AUTH = {
  ink: "#0f172a",
  inkMuted: "#475569",
  inkFaint: "#64748b",

  canvas: "#fbfbfd",
  surface: "#ffffff",
  hairline: "#e6e8ef",

  violet: "#7c3aed",
  violetDeep: "#5b21b6",
  violetSoft: "#f5f0ff",
  pink: "#ec4899",

  night: "#140b2b",
  night2: "#1e1040",

  error: "#dc2626",
  errorSoft: "#fef2f2",
} as const;

/** 4px base rhythm. */
export const SPACE = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const RADIUS = 8;

/** Everything except toggles. Pills are a 2021 tell. */
export const CONTROL_HEIGHT = 44;

export const EASE = "cubic-bezier(.175,.885,.32,1.1)";

/**
 * The focus ring. The inner canvas-colored buffer is the whole trick: it guarantees the
 * ring separates from whatever sits behind the control, on any surface.
 */
export const focusRing = (buffer: string = AUTH.canvas) =>
  `0 0 0 2px ${buffer}, 0 0 0 4px ${AUTH.violet}`;

/** Drawn as a shadow, not a border, so focus causes zero layout shift. */
export const hairlineRing = (color: string = AUTH.hairline) => `0 0 0 1px ${color}`;

export const FONT = `var(--font-family-primary, 'Satoshi'), system-ui, sans-serif`;

/**
 * Type scale. Tracking tightens as size grows; the eyebrow tier moves the other way.
 * Those opposing directions do the hierarchy work a second typeface would be hired for.
 */
export const TYPE = {
  display: { fontSize: 44, lineHeight: 1.06, fontWeight: 500, letterSpacing: "-1.4px" },
  title: { fontSize: 30, lineHeight: 1.15, fontWeight: 600, letterSpacing: "-0.6px" },
  section: { fontSize: 20, lineHeight: 1.3, fontWeight: 600, letterSpacing: "-0.3px" },
  body: { fontSize: 15, lineHeight: 1.5, fontWeight: 400, letterSpacing: 0 },
  label: { fontSize: 13, lineHeight: 1.4, fontWeight: 500, letterSpacing: 0 },
  eyebrow: { fontSize: 12, lineHeight: 1.4, fontWeight: 500, letterSpacing: "0.4px" },
} as const;

/**
 * Arabic script joins cursively, so letter-spacing breaks it and uppercase is a no-op.
 * Any tier carrying positive tracking must drop it under RTL.
 */
export const rtlSafeTracking = {
  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
} as const;

/** Primary action. Solid, never a gradient: the gradient CTA failed AA on its light half. */
export const authPrimaryButtonSx = {
  minHeight: CONTROL_HEIGHT,
  // py:1.25 made content taller than CONTROL_HEIGHT, so the button rendered at 46.3px
  // while the Google button sat at 44px. Let minHeight bind instead.
  py: 1,
  borderRadius: `${RADIUS}px`,
  background: AUTH.violet,
  color: "#ffffff",
  fontFamily: FONT,
  fontWeight: 500,
  fontSize: "0.9375rem",
  letterSpacing: 0,
  textTransform: "none" as const,
  boxShadow: "none",
  transition: `background 160ms ${EASE}`,
  "&:hover": { background: AUTH.violetDeep, boxShadow: "none" },
  "&:active": { background: AUTH.violetDeep },
  "&.Mui-focusVisible, &:focus-visible": {
    outline: "none",
    boxShadow: focusRing(),
  },
} as const;

export const authSecondaryButtonSx = {
  minHeight: CONTROL_HEIGHT,
  py: 1,
  borderRadius: `${RADIUS}px`,
  border: "none",
  boxShadow: hairlineRing(),
  background: AUTH.surface,
  color: AUTH.ink,
  fontFamily: FONT,
  fontWeight: 500,
  fontSize: "0.9375rem",
  textTransform: "none" as const,
  transition: `box-shadow 160ms ${EASE}`,
  "&:hover": {
    background: AUTH.surface,
    border: "none",
    boxShadow: hairlineRing("#d5d8e3"),
  },
  "&.Mui-focusVisible, &:focus-visible": {
    outline: "none",
    boxShadow: focusRing(),
  },
} as const;

export const authLinkSx = {
  color: AUTH.violet,
  fontFamily: FONT,
  fontWeight: 500,
  textDecoration: "none",
  borderRadius: "4px",
  "&:hover": { textDecoration: "underline" },
  "&:focus-visible": { outline: "none", boxShadow: focusRing() },
} as const;
