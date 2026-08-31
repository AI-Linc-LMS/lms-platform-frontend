/**
 * Jobs v2 — "The Career Ledger" identity.
 *
 * Everything that is a NUMBER, a MAP or a reusable `sx` object lives here as TypeScript;
 * everything that is a COLOUR lives in the `.jobs-scope` block appended to `app/globals.css`
 * and is referenced from here as a `var(--j-*)` string. That split is what makes dark mode a
 * one-attribute flip (`<div class="jobs-scope" data-jobs-theme="dark">`) with zero component
 * edits, and it is why there is no raw hex anywhere in `components/jobs-v2/**` (ESLint-enforced).
 *
 * Same pattern as `authTokens.ts` / `profileTokens.ts` / `roadmapTokens.ts`.
 */

/** The palette. Colours are var() strings so the scope's dark block re-points them. */
export const J = {
  canvas: "var(--j-canvas)",
  surface: "var(--j-surface)",
  surface2: "var(--j-surface-2)",
  surface3: "var(--j-surface-3)",
  ink: "var(--j-ink)",
  ink2: "var(--j-ink-2)",
  ink3: "var(--j-ink-3)",
  ink4: "var(--j-ink-4)",
  hairline: "var(--j-hairline)",
  hairlineSoft: "var(--j-hairline-soft)",
  hairlineStrong: "var(--j-hairline-strong)",
  azure: "var(--j-azure)",
  azureDeep: "var(--j-azure-deep)",
  azureSoft: "var(--j-azure-soft)",
  azureBorder: "var(--j-azure-border)",
  cyan: "var(--j-cyan)",
  violet: "var(--j-violet)",
  onDark: "var(--j-on-dark)",
  onDark2: "var(--j-on-dark-2)",
  onDark3: "var(--j-on-dark-3)",
  onDarkLine: "var(--j-on-dark-line)",
  night0: "var(--j-night-0)",
  night1: "var(--j-night-1)",
  night2: "var(--j-night-2)",
  gradAction: "var(--j-grad-action)",
  gradBrand: "var(--j-grad-brand)",
  gradHairline: "var(--j-grad-hairline)",
  gradBadge: "var(--j-grad-badge)",
  /** Danger/destructive reads through the "closed" status triplet. Never a filled red. */
  dangerFg: "var(--j-st-closed-fg)",
  dangerBg: "var(--j-st-closed-bg)",
  dangerBd: "var(--j-st-closed-bd)",
  successFg: "var(--j-st-active-fg)",
  successBg: "var(--j-st-active-bg)",
  successBd: "var(--j-st-active-bd)",
  warnFg: "var(--j-st-inactive-fg)",
  warnBg: "var(--j-st-inactive-bg)",
  warnBd: "var(--j-st-inactive-bd)",
} as const;

/** FOUR radius rungs, no fifth. `hero` is ModulePageHeader's and is never used elsewhere. */
export const R = {
  pill: "var(--j-r-pill)",
  hero: "var(--j-r-hero)",
  card: "var(--j-r-card)",
  inner: "var(--j-r-inner)",
  ctl: "var(--j-r-ctl)",
} as const;

export const SHADOW = {
  none: "none",
  panel: "var(--j-shadow-panel)",
  raise: "var(--j-shadow-raise)",
  overlay: "var(--j-shadow-overlay)",
  sticky: "var(--j-shadow-sticky)",
  glowAzure: "var(--j-glow-azure)",
  glowViolet: "var(--j-glow-violet)",
} as const;

/** One curve (= EASE_OUT_EXPO, already the LMS + marketing curve) and six durations. */
export const MOTION = {
  ease: "cubic-bezier(.16,1,.3,1)",
  easeQuart: "cubic-bezier(.22,1,.36,1)",
  micro: 120,
  ctl: 180,
  surface: 220,
  overlay: 300,
  reveal: 650,
  hairline: 1200,
} as const;

/** Control heights. `dense` is desktop-only and still needs a 44px hit area on touch. */
export const CTL_H = { base: 40, touch: 44, dense: 32 } as const;

/** THE focus ring. Identical on every jobs control. Never recoloured per screen. */
export const focusRing = {
  "&:focus-visible": { outline: "none", boxShadow: "var(--j-focus-ring)" },
} as const;

export const focusRingOnDark = {
  "&:focus-visible": { outline: "none", boxShadow: "var(--j-focus-ring-on-dark)" },
} as const;

/** RTL guard. Every uppercase + tracked style MUST spread this. */
export const rtlLabel = {
  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
} as const;

/**
 * Interactive card/row chrome. The border moves and the surface goes one rung up the ladder;
 * nothing lifts, blurs or bloom-shadows. (DESIGN.md, and the roadmaps density note.)
 */
export const cardInteraction = {
  borderRadius: R.card,
  border: `1px solid ${J.hairline}`,
  bgcolor: J.surface,
  transition: `border-color ${MOTION.micro}ms ${MOTION.ease}, background-color ${MOTION.micro}ms ${MOTION.ease}`,
  cursor: "pointer",
  "&:hover": { borderColor: J.azureBorder, bgcolor: J.surface2 },
  "&:active": { bgcolor: J.surface3 },
  ...focusRing,
} as const;

/** Visually hidden, still announced. The app has no global `.sr-only`, so it lives here. */
export const srOnly = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

/** A 1px x 8px accent rule instead of a disc. The marketing site's list bullet. */
export const microRuleBullet = {
  display: "block",
  width: 8,
  height: 1,
  flexShrink: 0,
  marginTop: "0.65em",
  background: J.azure,
} as const;

/**
 * Gradient-text emphasis. One per page, hero headline only. The solid `color` MUST come first:
 * a browser without `background-clip: text` otherwise renders an invisible heading.
 */
export const gradientText = {
  color: J.azure,
  background: "var(--j-grad-hairline)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
} as const;

export const gradientTextOnDark = {
  color: J.cyan,
  background: "var(--j-grad-brand)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
} as const;

/**
 * The type scale. One `sx` object per row so nobody hand-writes a size.
 * Weights are 400 / 500 / 700 / 800 — there is no 600 and no 900.
 */
export const TYPE = {
  display: {
    fontSize: "clamp(28px,4.2vw,44px)",
    lineHeight: 1.06,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: J.ink,
  },
  h2: {
    fontSize: "1.25rem",
    lineHeight: 1.25,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: J.ink,
  },
  h3: {
    fontSize: "1rem",
    lineHeight: 1.35,
    fontWeight: 700,
    letterSpacing: "-0.015em",
    color: J.ink,
  },
  h4: {
    fontSize: "0.9375rem",
    lineHeight: 1.4,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: J.ink,
  },
  body: { fontSize: "0.875rem", lineHeight: 1.6, fontWeight: 400, color: J.ink2 },
  bodyStrong: { fontSize: "0.875rem", lineHeight: 1.6, fontWeight: 500, color: J.ink },
  /** Student long-form prose only. */
  prose: { fontSize: "0.9375rem", lineHeight: 1.65, fontWeight: 400, color: J.ink2, maxWidth: "72ch" },
  small: { fontSize: "0.8125rem", lineHeight: 1.5, fontWeight: 400, color: J.ink3 },
  micro: { fontSize: "0.75rem", lineHeight: 1.4, fontWeight: 500, color: J.ink3 },
  label: {
    fontSize: "0.75rem",
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: J.ink3,
    ...rtlLabel,
  },
  eyebrow: {
    fontSize: "0.6875rem",
    lineHeight: 1,
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    ...rtlLabel,
  },
  numLg: {
    fontSize: "clamp(24px,2.6vw,34px)",
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: "-0.025em",
    fontFeatureSettings: '"tnum" 1',
    color: J.ink,
  },
  numSm: {
    fontSize: "1.125rem",
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    fontFeatureSettings: '"tnum" 1',
    color: J.ink,
  },
  mono: {
    fontFamily: "var(--font-mono)",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: J.ink2,
  },
} as const;

/** Clamp a block of text to N lines. Always pair with a `title` carrying the full string. */
export const lineClamp = (lines: number) =>
  ({
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: lines,
    overflow: "hidden",
    wordBreak: "break-word",
  }) as const;

/* ==========================================================================
 * Status: the SINGLE source of truth.
 *
 * This replaces JOB_STATUS_STYLES (x2), STATUS_COLORS, STATE_CHIP_STYLES,
 * JOB_STATUS_OPTIONS (x2) and the create/edit stepper's short status list.
 *
 * Because each map is a `Record<Union, Tone>` and every Select in the module maps the
 * matching *_ORDER array, a status can no longer go missing from one control and not
 * another — the `on_hold` bug dies here, and `applying` is first in APP_STATUS_ORDER so it
 * appears in every stat strip and filter row.
 * ======================================================================== */

export type JobStatus = "active" | "inactive" | "on_hold" | "closed" | "completed";
export type AppStatus =
  | "applying"
  | "applied"
  | "shortlisted"
  | "interview_stage"
  | "rejected"
  | "selected";
export type Visibility = "published" | "draft";
export type ScrapedState = "review" | "imported" | "dismissed" | "irrelevant";

export interface Tone {
  fg: string;
  bg: string;
  bd: string;
  /** i18n key. Never a hardcoded English string. */
  labelKey: string;
  icon: string;
  /** Dashed border, so the state survives colour-blindness and greyscale print. */
  dashed?: boolean;
}

export const JOB_STATUS: Record<JobStatus, Tone> = {
  active: {
    fg: "var(--j-st-active-fg)",
    bg: "var(--j-st-active-bg)",
    bd: "var(--j-st-active-bd)",
    labelKey: "jobsV2.jobStatus.active",
    icon: "mdi:check-circle-outline",
  },
  inactive: {
    fg: "var(--j-st-inactive-fg)",
    bg: "var(--j-st-inactive-bg)",
    bd: "var(--j-st-inactive-bd)",
    labelKey: "jobsV2.jobStatus.inactive",
    icon: "mdi:pause-circle-outline",
  },
  on_hold: {
    fg: "var(--j-st-onhold-fg)",
    bg: "var(--j-st-onhold-bg)",
    bd: "var(--j-st-onhold-bd)",
    labelKey: "jobsV2.jobStatus.on_hold",
    icon: "mdi:timer-sand",
  },
  closed: {
    fg: "var(--j-st-closed-fg)",
    bg: "var(--j-st-closed-bg)",
    bd: "var(--j-st-closed-bd)",
    labelKey: "jobsV2.jobStatus.closed",
    icon: "mdi:lock-outline",
  },
  completed: {
    fg: "var(--j-st-completed-fg)",
    bg: "var(--j-st-completed-bg)",
    bd: "var(--j-st-completed-bd)",
    labelKey: "jobsV2.jobStatus.completed",
    icon: "mdi:flag-checkered",
  },
};

export const APP_STATUS: Record<AppStatus, Tone> = {
  applying: {
    fg: "var(--j-ap-applying-fg)",
    bg: "var(--j-ap-applying-bg)",
    bd: "var(--j-ap-applying-bd)",
    labelKey: "jobsV2.appStatus.applying",
    icon: "mdi:progress-pencil",
    dashed: true,
  },
  applied: {
    fg: "var(--j-ap-applied-fg)",
    bg: "var(--j-ap-applied-bg)",
    bd: "var(--j-ap-applied-bd)",
    labelKey: "jobsV2.appStatus.applied",
    icon: "mdi:send-check-outline",
  },
  shortlisted: {
    fg: "var(--j-ap-short-fg)",
    bg: "var(--j-ap-short-bg)",
    bd: "var(--j-ap-short-bd)",
    labelKey: "jobsV2.appStatus.shortlisted",
    icon: "mdi:star-outline",
  },
  interview_stage: {
    fg: "var(--j-ap-interview-fg)",
    bg: "var(--j-ap-interview-bg)",
    bd: "var(--j-ap-interview-bd)",
    labelKey: "jobsV2.appStatus.interview_stage",
    icon: "mdi:account-voice",
  },
  selected: {
    fg: "var(--j-ap-selected-fg)",
    bg: "var(--j-ap-selected-bg)",
    bd: "var(--j-ap-selected-bd)",
    labelKey: "jobsV2.appStatus.selected",
    icon: "mdi:trophy-outline",
  },
  rejected: {
    fg: "var(--j-ap-rejected-fg)",
    bg: "var(--j-ap-rejected-bg)",
    bd: "var(--j-ap-rejected-bd)",
    labelKey: "jobsV2.appStatus.rejected",
    icon: "mdi:close-circle-outline",
  },
};

export const VISIBILITY: Record<Visibility, Tone> = {
  published: {
    fg: "var(--j-vis-pub-fg)",
    bg: "var(--j-vis-pub-bg)",
    bd: "var(--j-vis-pub-bd)",
    labelKey: "jobsV2.visibility.published",
    icon: "mdi:eye-outline",
  },
  draft: {
    fg: "var(--j-vis-draft-fg)",
    bg: "var(--j-vis-draft-bg)",
    bd: "var(--j-vis-draft-bd)",
    labelKey: "jobsV2.visibility.draft",
    icon: "mdi:file-document-edit-outline",
    dashed: true,
  },
};

export const SCRAPED_STATE: Record<ScrapedState, Tone> = {
  review: {
    fg: "var(--j-sc-review-fg)",
    bg: "var(--j-sc-review-bg)",
    bd: "var(--j-sc-review-bd)",
    labelKey: "jobsV2.scrapedState.review",
    icon: "mdi:inbox-arrow-down-outline",
  },
  imported: {
    fg: "var(--j-sc-imported-fg)",
    bg: "var(--j-sc-imported-bg)",
    bd: "var(--j-sc-imported-bd)",
    labelKey: "jobsV2.scrapedState.imported",
    icon: "mdi:database-import-outline",
  },
  dismissed: {
    fg: "var(--j-sc-dismissed-fg)",
    bg: "var(--j-sc-dismissed-bg)",
    bd: "var(--j-sc-dismissed-bd)",
    labelKey: "jobsV2.scrapedState.dismissed",
    icon: "mdi:archive-outline",
  },
  irrelevant: {
    fg: "var(--j-sc-irrelevant-fg)",
    bg: "var(--j-sc-irrelevant-bg)",
    bd: "var(--j-sc-irrelevant-bd)",
    labelKey: "jobsV2.scrapedState.irrelevant",
    icon: "mdi:filter-remove-outline",
    dashed: true,
  },
};

/** The neutral tone an unknown status resolves to. Never crash, never guess a colour. */
export const NEUTRAL_TONE: Tone = {
  fg: "var(--j-st-completed-fg)",
  bg: "var(--j-st-completed-bg)",
  bd: "var(--j-st-completed-bd)",
  labelKey: "jobsV2.status.unknown",
  icon: "mdi:help-circle-outline",
};

/** Ordered, and each MUST contain every member of its union (the Record type enforces it). */
export const JOB_STATUS_ORDER: JobStatus[] = [
  "active",
  "inactive",
  "on_hold",
  "closed",
  "completed",
];

export const APP_STATUS_ORDER: AppStatus[] = [
  "applying",
  "applied",
  "shortlisted",
  "interview_stage",
  "selected",
  "rejected",
];

export const VISIBILITY_ORDER: Visibility[] = ["published", "draft"];

export const SCRAPED_STATE_ORDER: ScrapedState[] = [
  "review",
  "imported",
  "dismissed",
  "irrelevant",
];

/** Relevance ramp for the scraped queue (0..1). */
export const RELEVANCE = {
  high: "var(--j-rel-high)",
  mid: "var(--j-rel-mid)",
  low: "var(--j-rel-low)",
} as const;

export function relevanceColor(relevance: number): string {
  if (relevance >= 0.7) return RELEVANCE.high;
  if (relevance >= 0.4) return RELEVANCE.mid;
  return RELEVANCE.low;
}

/** `color-mix` tint helper — the ONLY sanctioned way to make an alpha of a token. */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
