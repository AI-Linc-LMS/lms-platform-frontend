/**
 * The certificate identity, established by components/dashboard/v2/CertificatePanel.tsx.
 *
 * These are deliberately LITERAL constants rather than `useTheme()` lookups or CSS
 * custom properties, for the same reason components/profile/theme/profileTokens.ts is:
 * the values do not vary per tenant, and the MUI theme resolves them to colours that
 * exist nowhere else in this product. `palette.warning` is never overridden by
 * ThemeProvider, so it is MUI's factory orange #ed6c02 - not the #f59e0b the module's
 * authors believed they were writing - and `palette.primary` IS tenant-overridable, so a
 * bare <Button variant="contained"> paints an unpredictable blue rather than the
 * product's violet.
 *
 * The violet identity is not a new choice. A student already sees it on their dashboard
 * every day in CertificatePanel; /certificates has to read as the same product.
 */
export const CERT = {
  violet: "#7c3aed",
  violetLight: "#a855f7",
  violetSoft: "#f5f3ff",
  violetBorder: "#ede9fe",
  pink: "#ec4899",
  ink: "#0f172a",
  inkMuted: "#475569",
  inkFaint: "#64748b",
  inkDim: "#94a3b8",
  hairline: "#e4e7f0",
  hairlineSoft: "#eef2f7",
  surface: "#ffffff",
} as const;

export const CERT_BADGE_GRADIENT = "linear-gradient(135deg, #7c3aed, #a855f7)";
export const CERT_BADGE_GLOW = "0 12px 26px -12px rgba(124,58,237,0.6)";
export const CERT_BAR_GRADIENT = "linear-gradient(90deg, #7c3aed, #ec4899)";
export const CERT_CTA_GRADIENT = "linear-gradient(135deg, #7c3aed, #ec4899)";
export const CERT_CTA_SHADOW = "0 14px 30px -12px rgba(192,38,211,0.7)";
export const CERT_PANEL_SHADOW =
  "0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28)";
export const CERT_FOCUS_RING = "0 0 0 2px #fff, 0 0 0 4px #7c3aed";
/** Hover border on an interactive certificate card. */
export const CERT_HOVER_BORDER = "#a78bfa";
/** ModulePageHeader accent key for every certificate page. */
export const CERT_ACCENT = "purple" as const;

/**
 * The two student-surface button recipes (§2.7).
 *
 * These live here rather than in any one component because four separate
 * surfaces render a certificate download CTA - the detail dialog, the learner
 * toolbar on the assessment success page, the legacy course-page buttons and
 * the public credential page. When each one carried its own copy, three of them
 * drifted to a bare `variant="contained"`, i.e. tenant-primary blue.
 *
 * `background` in `sx` outlives MUI's own disabled styling, so the disabled
 * state has to be restated or the button stays fully saturated mid-export.
 */
export const certPrimaryButtonSx = {
  borderRadius: 999,
  fontWeight: 800,
  textTransform: "none" as const,
  px: 2.5,
  py: 1,
  color: "#fff",
  background: CERT_CTA_GRADIENT,
  boxShadow: CERT_CTA_SHADOW,
  "&:hover": { filter: "brightness(1.06)", background: CERT_CTA_GRADIENT },
  "&.Mui-disabled": {
    background: CERT_CTA_GRADIENT,
    color: "#fff",
    opacity: 0.5,
    boxShadow: "none",
  },
};

export const certOutlinedButtonSx = {
  borderRadius: 999,
  fontWeight: 800,
  textTransform: "none" as const,
  px: 2.5,
  py: 1,
  borderColor: CERT.violetBorder,
  color: CERT.violet,
  "&:hover": { borderColor: "#c4b5fd", bgcolor: CERT.violetSoft },
};
