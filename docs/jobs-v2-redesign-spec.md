# Jobs v2 — Full Redesign Spec (student + admin)

**Status:** authoritative. This document is the single source of truth for the jobs-v2 redesign.
**Scope:** every student and admin screen, modal, dialog, interstitial and loading shell under
`app/jobs-v2/**`, `app/admin/jobs-v2/**`, `components/jobs-v2/**`, `components/admin/jobs-v2/**`.
**Branch:** `feat/jobs-v2-redesign` in `/Users/utkarshsingh/Developer/wt-jobs-redesign`.

**Read before writing a line:**
- `docs/specs/certificates-ui-language.md` — the platform's written language.
- `DESIGN.md` — the admin/system dialect, the banned patterns, the `useTheme()` trap.
- `components/roadmaps/surfaces.tsx` — the density discipline this module needs.
- `app/globals.css:604-1010` — the `.ailinc-wizard` scope, the precedent we are copying.

If this spec and a file you are reading disagree, this spec wins. If this spec is silent,
the exemplar order is: certificates → roadmaps → dashboard v2 → interview.

---

## 0. What we are fixing

The two audits found the same three diseases on both sides of the module:

1. **No shared vocabulary.** `SectionCard` is defined 4 times, `formatDate` 4 times, `InfoPill`
   twice, status maps 3 times, the bulk bar 3 times, the board renders twice, the apply form
   exists twice. Every fix has to be made 2-4 times, and every one of those copies has already
   drifted.
2. **No honest states.** There is no error state anywhere in the module. Every failed fetch
   renders an empty state — "No jobs found", "No applications yet", "Job not found" — which
   lies to the user about their own data and blames them for a server fault.
3. **No identity.** Three accents fight on one board. The dark hero disappears the moment you
   click a job. Four modal treatments, four loading treatments, eight font sizes, seven radii,
   and text tokens (`--font-light`) used as surfaces in nine places.

The redesign is therefore **one kit, one set of states, one identity** — built once in
`components/jobs-v2/ui/` and consumed by both student and admin screens.

---

## 1. DESIGN DIRECTION

### The concept: **The Career Ledger**

A job portal is a ledger of opportunities and outcomes. It is read by two people with
opposite postures: a learner scanning for the one role worth their afternoon, and a recruiter
triaging two hundred rows before lunch. Both are *reading data*, not browsing a gallery. So
the module's job is to make **scanning fast and state unmistakable** — and to look like AI Linc
while doing it.

The marketing site (`AI-Linc`) already has the exact device for this, and it is not a colour or
a shadow. It is the **hairline data strip**: a row of cells divided by 1px rules, each holding a
big tight-tracked number over a wide-tracked uppercase caption, with a brand-gradient hairline
that draws itself across the cell on entry. That is `Numbers.tsx`, `Impact.tsx`, and the hero
strip. It is editorial, it is dense, and it is exactly what a jobs surface needs.

We take **five devices** from ailinc-web and nothing else:

| # | Device | Where it lands in jobs-v2 |
|---|---|---|
| 1 | ~~**Numbered kicker** — `04 · CAREER`~~ **WITHDRAWN 2026-08-31.** | It shipped, and on the live board it was the one thing that made the jobs hero read as a different product bolted onto the platform: every sibling module's `ModulePageHeader` carries a plain one-word section name ("Achievements", "Learn", "Career", "Engagement"). The marketing site's numbering means nothing inside the app, where there is no `02` to be the second of. Jobs now uses plain eyebrows everywhere — student **Career / Role / Apply / Application**, admin **Engagement / Jobs / Job / Applicants / Reports / Scraped jobs**. `TYPE.eyebrow` stays: it is the strip-caption scale and is used by `JModal` and the hairline strips. |
| 2 | **Hairline data strip** — `border-y` + `border-l` cells, no card, no coloured top strip | The student Applied stats, the admin list header counts, the admin applications pipeline counts, the scraped queue tab counts. Replaces all three copies of the 5-tile stat grid. |
| 3 | **`grad-border-top`** — a 1px brand-gradient rule that `scaleX(0)` to `1` on entry | The top edge of every hairline strip cell and every hero-adjacent panel. One line of CSS, the cheapest "this is AI Linc" signal we own. |
| 4 | **Hover = lift-less accent edge** — the border moves, nothing else | Every interactive card and row, student and admin. No shadow bloom, no translate on table rows. |
| 5 | **Micro-rule bullets** — a 1px x 8px accent rule instead of a disc | Requirement lists, "what happens next" lists, empty-state hint lists. |

And we take the **hue**: the marketing cyan `#00e0ff` / blue `#2356d6` becomes the jobs module's
signal colour — but only where it is legible. On the dark hero and on-dark chips it is `#00e0ff`.
On the light canvas it is `#1d4dc7`. This is not a new decision; `/setup` already made it and
wrote the reason into `globals.css`. **Cyan-on-white is 2.6:1 and is banned outright.**

### Why cyan for jobs specifically

Every other module owns a violet family. Jobs is the module where the learner leaves the
platform for the outside world, and where the admin talks to employers. A distinct signal hue
makes "I am in the careers surface" legible in half a second from the sidebar, and it is the
one hue the marketing site would use for exactly this. Violet stays the **action** colour
(primary buttons, focus ring) so a jobs button and a certificates button still behave like the
same product. Azure is **signal, never action**.

### Accent budget: three per surface

`azure` (module signal: kicker, gradient hairline, active tab, link) · `violet` (primary
action + focus ring) · **one** semantic status hue for the surface's dominant state. If a
fourth appears, one of the first three was wrong. This is what kills the cyan-header /
indigo-cards / hardcoded-`#06b6d4`-rows problem outright.

### What we explicitly refuse

Fraunces and JetBrains Mono as system faces (the wizard already reversed that). GSAP,
ScrollTrigger, Lenis, `ParticleField`, the preloader, scroll-pinned reels. Grain on anything
that carries a table. The `#2356d6` to `#00e0ff` gradient as a button fill on white. Coloured
top-strips on cards. Glassmorphism. Blurred blobs. `data-theme` as a global mechanism.

---

## 2. TOKENS

Two files, and only two.

### 2.1 `app/globals.css` — append ONE scoped block (never edit `:root`)

Scoped custom properties declared inside a class block are **not** subject to the five-place
tenant registration chain (`CAMEL_TO_CSS` / `DEFAULT_THEME_FLAT` / `ALLOWED_THEME_KEYS` /
the Python serializer) — that chain governs only tenant-overridable tokens written onto
`<body>`. `--aw-*` proves it. `--j-*` works the same way and is deletable in one commit.

Append at the end of `app/globals.css`, after the `.ailinc-wizard` block:

```css
/* =========================================================================
 * Jobs v2 — "Career Ledger". Scoped to <div class="jobs-scope">.
 * Mirrors the .ailinc-wizard mechanism: local tokens, zero :root edits,
 * one-commit deletable. Every jobs surface MUST render inside this scope.
 * ======================================================================= */
.jobs-scope {
  /* --- surfaces (light) --- */
  --j-canvas:        #fbfbfd;   /* page ground under a jobs surface */
  --j-surface:       #ffffff;   /* card / row fill */
  --j-surface-2:     #f7f8fb;   /* hover rung, table zebra, inert tiles */
  --j-surface-3:     #eef1f7;   /* pressed rung, disabled fill */
  --j-ink:           #0f172a;   /* headings, values */
  --j-ink-2:         #475569;   /* body, secondary */
  --j-ink-3:         #64748b;   /* meta, captions */
  --j-ink-4:         #94a3b8;   /* placeholder, disabled label */
  --j-hairline:      #e4e7f0;   /* THE separator */
  --j-hairline-soft: #eef2f7;   /* inner dividers, zebra edges */
  --j-hairline-strong:#cbd5e1;  /* table head underline, focus-adjacent */

  /* --- on-dark surfaces (the hero band + any dark panel) --- */
  --j-night-0:       #080a1a;
  --j-night-1:       #0f0b2e;
  --j-night-2:       #1a1350;
  --j-on-dark:       rgba(255,255,255,0.94);
  --j-on-dark-2:     rgba(255,255,255,0.72);
  --j-on-dark-3:     rgba(255,255,255,0.52);
  --j-on-dark-line:  rgba(255,255,255,0.14);

  /* --- brand --- */
  --j-azure:         #1d4dc7;   /* signal on LIGHT. Never #00e0ff on white. */
  --j-azure-deep:    #12328a;
  --j-azure-soft:    #eef3ff;
  --j-azure-border:  #c7d7fb;
  --j-cyan:          #00e0ff;   /* signal on DARK only */
  --j-violet:        #7c3aed;   /* action + focus */
  --j-violet-2:      #a855f7;
  --j-pink:          #ec4899;
  --j-grad-action:   linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
  --j-grad-brand:    linear-gradient(90deg, #2356d6 0%, #00e0ff 100%);
  --j-grad-hairline: linear-gradient(90deg, #2356d6 0%, #00e0ff 100%);
  --j-grad-badge:    linear-gradient(135deg, #1d4dc7 0%, #00b8d4 100%);

  /* --- semantic: job status --- */
  --j-st-active-fg:    #047857;  --j-st-active-bg:    #ecfdf5;  --j-st-active-bd:    #a7f3d0;
  --j-st-inactive-fg:  #92400e;  --j-st-inactive-bg:  #fffbeb;  --j-st-inactive-bd:  #fde68a;
  --j-st-onhold-fg:    #3730a3;  --j-st-onhold-bg:    #eef2ff;  --j-st-onhold-bd:    #c7d2fe;
  --j-st-closed-fg:    #be123c;  --j-st-closed-bg:    #fff1f2;  --j-st-closed-bd:    #fecdd3;
  --j-st-completed-fg: #334155;  --j-st-completed-bg: #f1f5f9;  --j-st-completed-bd: #cbd5e1;

  /* --- semantic: visibility --- */
  --j-vis-pub-fg:  #12328a;  --j-vis-pub-bg:  #eef3ff;  --j-vis-pub-bd:  #c7d7fb;
  --j-vis-draft-fg:#64748b;  --j-vis-draft-bg:#f8fafc;  --j-vis-draft-bd:#cbd5e1;

  /* --- semantic: application pipeline (ordered) --- */
  --j-ap-applying-fg:  #92400e; --j-ap-applying-bg:  #fffbeb; --j-ap-applying-bd:  #fde68a;
  --j-ap-applied-fg:   #1d4dc7; --j-ap-applied-bg:   #eef3ff; --j-ap-applied-bd:   #c7d7fb;
  --j-ap-short-fg:     #6d28d9; --j-ap-short-bg:     #f5f3ff; --j-ap-short-bd:     #ddd6fe;
  --j-ap-interview-fg: #0e7490; --j-ap-interview-bg: #ecfeff; --j-ap-interview-bd: #a5f3fc;
  --j-ap-selected-fg:  #047857; --j-ap-selected-bg:  #ecfdf5; --j-ap-selected-bd:  #a7f3d0;
  --j-ap-rejected-fg:  #be123c; --j-ap-rejected-bg:  #fff1f2; --j-ap-rejected-bd:  #fecdd3;

  /* --- semantic: scraped queue --- */
  --j-sc-review-fg:     #1d4dc7; --j-sc-review-bg:     #eef3ff; --j-sc-review-bd:     #c7d7fb;
  --j-sc-imported-fg:   #047857; --j-sc-imported-bg:   #ecfdf5; --j-sc-imported-bd:   #a7f3d0;
  --j-sc-dismissed-fg:  #64748b; --j-sc-dismissed-bg:  #f8fafc; --j-sc-dismissed-bd:  #cbd5e1;
  --j-sc-irrelevant-fg: #92400e; --j-sc-irrelevant-bg: #fffbeb; --j-sc-irrelevant-bd: #fde68a;

  /* --- relevance ramp (scraped) --- */
  --j-rel-high: #047857;  --j-rel-mid: #b45309;  --j-rel-low: #64748b;

  /* --- radii: FOUR rungs, no fifth --- */
  --j-r-pill: 999px;
  --j-r-hero: 32px;   /* ModulePageHeader only; do not use elsewhere */
  --j-r-card: 18px;   /* = --radius-card. Cards, panels, dialogs, sheets */
  --j-r-inner: 12px;  /* tiles, drop zones, inline banners, avatars > 40px */
  --j-r-ctl: 8px;     /* buttons, inputs, selects, chips-as-blocks, avatars <= 40px */

  /* --- elevation --- */
  --j-shadow-none: none;
  --j-shadow-panel: 0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28);
  --j-shadow-raise: 0 1px 2px rgba(16,24,40,0.05), 0 10px 24px -14px rgba(16,24,40,0.18);
  --j-shadow-overlay: 0 24px 64px -24px rgba(15,23,42,0.38), 0 2px 8px rgba(15,23,42,0.08);
  --j-shadow-sticky: 0 -8px 24px -16px rgba(15,23,42,0.28);
  --j-glow-azure: 0 12px 26px -12px rgba(29,77,199,0.55);
  --j-glow-violet: 0 14px 30px -12px rgba(192,38,211,0.55);

  /* --- focus (platform-wide, do NOT recolour per module) --- */
  --j-focus: #7c3aed;
  --j-focus-ring: 0 0 0 2px var(--j-canvas), 0 0 0 4px #7c3aed;
  --j-focus-ring-on-dark: 0 0 0 2px #0f0b2e, 0 0 0 4px #00e0ff;

  /* --- motion --- */
  --j-ease: cubic-bezier(.16, 1, .3, 1);        /* = EASE_OUT_EXPO, already the LMS curve */
  --j-ease-quart: cubic-bezier(.22, 1, .36, 1);
  --j-dur-micro: 120ms;    /* border/colour on hover */
  --j-dur-ctl: 180ms;      /* buttons, chips, inputs */
  --j-dur-surface: 220ms;  /* card/row/panel state change */
  --j-dur-overlay: 300ms;  /* dialog/sheet in-out */
  --j-dur-reveal: 650ms;   /* Reveal entrance */
  --j-dur-hairline: 1200ms;/* grad-border-top scaleX */

  /* --- spacing rhythm (4px base; use MUI units, listed here as the contract) --- */
  --j-sp-1: 4px;  --j-sp-2: 8px;  --j-sp-3: 12px; --j-sp-4: 16px;
  --j-sp-5: 20px; --j-sp-6: 24px; --j-sp-8: 32px; --j-sp-10: 40px; --j-sp-14: 56px;

  /* --- controls --- */
  --j-ctl-h: 40px;         /* desktop control height */
  --j-ctl-h-touch: 44px;   /* xs..sm, and every touch target everywhere */
  --j-ctl-h-dense: 32px;   /* table-inline controls, desktop only, never on touch */
}

/* ---- DARK ----------------------------------------------------------------
 * The platform has no global dark mode today (ThemeModeProvider is dead and
 * writes variables that do not exist). We do NOT introduce one. What we do is
 * make every jobs token dark-ready in the scope, so that:
 *   (a) on-dark panels inside a jobs page are painted from the same names, and
 *   (b) when a global dark mode lands, jobs needs zero component edits.
 * The switch is opt-in and local: <div class="jobs-scope" data-jobs-theme="dark">.
 * NOTHING global is read or written here.
 * ------------------------------------------------------------------------ */
.jobs-scope[data-jobs-theme="dark"] {
  --j-canvas:        #0b0f1e;
  --j-surface:       #121729;
  --j-surface-2:     #182036;
  --j-surface-3:     #1f2842;
  --j-ink:           #e9ecf6;
  --j-ink-2:         #b6c0d6;
  --j-ink-3:         #9aa3c0;
  --j-ink-4:         #6b7490;
  --j-hairline:      rgba(255,255,255,0.10);
  --j-hairline-soft: rgba(255,255,255,0.06);
  --j-hairline-strong:rgba(255,255,255,0.18);

  --j-azure:         #4da3ff;   /* light-on-dark azure; #1d4dc7 is unreadable here */
  --j-azure-deep:    #7cc4ff;
  --j-azure-soft:    rgba(0,224,255,0.10);
  --j-azure-border:  rgba(0,224,255,0.30);
  --j-violet:        #a855f7;

  --j-st-active-fg:    #4ade80; --j-st-active-bg:    rgba(16,185,129,0.14); --j-st-active-bd:    rgba(16,185,129,0.34);
  --j-st-inactive-fg:  #fbbf24; --j-st-inactive-bg:  rgba(245,158,11,0.14); --j-st-inactive-bd:  rgba(245,158,11,0.34);
  --j-st-onhold-fg:    #a5b4fc; --j-st-onhold-bg:    rgba(99,102,241,0.16); --j-st-onhold-bd:    rgba(99,102,241,0.36);
  --j-st-closed-fg:    #fda4af; --j-st-closed-bg:    rgba(244,63,94,0.14);  --j-st-closed-bd:    rgba(244,63,94,0.34);
  --j-st-completed-fg: #cbd5e1; --j-st-completed-bg: rgba(148,163,184,0.14);--j-st-completed-bd: rgba(148,163,184,0.32);

  --j-vis-pub-fg:  #7cc4ff; --j-vis-pub-bg:  rgba(0,224,255,0.10); --j-vis-pub-bd:  rgba(0,224,255,0.30);
  --j-vis-draft-fg:#9aa3c0; --j-vis-draft-bg:rgba(255,255,255,0.04);--j-vis-draft-bd:rgba(255,255,255,0.18);

  --j-ap-applying-fg:  #fbbf24; --j-ap-applying-bg:  rgba(245,158,11,0.14); --j-ap-applying-bd:  rgba(245,158,11,0.34);
  --j-ap-applied-fg:   #7cc4ff; --j-ap-applied-bg:   rgba(0,224,255,0.10);  --j-ap-applied-bd:   rgba(0,224,255,0.30);
  --j-ap-short-fg:     #c4b5fd; --j-ap-short-bg:     rgba(139,92,246,0.16); --j-ap-short-bd:     rgba(139,92,246,0.36);
  --j-ap-interview-fg: #67e8f9; --j-ap-interview-bg: rgba(6,182,212,0.14);  --j-ap-interview-bd: rgba(6,182,212,0.34);
  --j-ap-selected-fg:  #4ade80; --j-ap-selected-bg:  rgba(16,185,129,0.14); --j-ap-selected-bd:  rgba(16,185,129,0.34);
  --j-ap-rejected-fg:  #fda4af; --j-ap-rejected-bg:  rgba(244,63,94,0.14);  --j-ap-rejected-bd:  rgba(244,63,94,0.34);

  --j-sc-review-fg:#7cc4ff; --j-sc-review-bg:rgba(0,224,255,0.10); --j-sc-review-bd:rgba(0,224,255,0.30);
  --j-sc-imported-fg:#4ade80; --j-sc-imported-bg:rgba(16,185,129,0.14); --j-sc-imported-bd:rgba(16,185,129,0.34);
  --j-sc-dismissed-fg:#9aa3c0; --j-sc-dismissed-bg:rgba(255,255,255,0.04); --j-sc-dismissed-bd:rgba(255,255,255,0.18);
  --j-sc-irrelevant-fg:#fbbf24; --j-sc-irrelevant-bg:rgba(245,158,11,0.14); --j-sc-irrelevant-bd:rgba(245,158,11,0.34);

  --j-rel-high:#4ade80; --j-rel-mid:#fbbf24; --j-rel-low:#9aa3c0;

  --j-shadow-panel: 0 1px 2px rgba(0,0,0,0.4), 0 12px 28px -20px rgba(0,0,0,0.6);
  --j-shadow-raise: 0 1px 2px rgba(0,0,0,0.4), 0 10px 24px -14px rgba(0,0,0,0.5);
  --j-shadow-overlay: 0 24px 64px -24px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4);
  --j-focus-ring: 0 0 0 2px var(--j-canvas), 0 0 0 4px #a855f7;
}

.jobs-scope[data-jobs-theme="dark"] {
  background: var(--j-canvas);
  color: var(--j-ink);
}

@media (prefers-color-scheme: dark) {
  .jobs-scope:not([data-jobs-theme="light"]) {
    /* Intentionally EMPTY until a global dark mode ships. Enabling jobs alone
       would leave the sidebar, app bar and every other module light. When the
       platform dark mode lands, copy the [data-jobs-theme="dark"] body here. */
  }
}

/* The one marketing device we import wholesale. */
.jobs-scope .j-grad-hairline { position: relative; }
.jobs-scope .j-grad-hairline::before {
  content: "";
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 1px;
  background: var(--j-grad-hairline);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--j-dur-hairline) var(--j-ease);
}
[dir="rtl"] .jobs-scope .j-grad-hairline::before { transform-origin: right center; }
.jobs-scope .j-grad-hairline[data-revealed="true"]::before { transform: scaleX(1); }

@media (prefers-reduced-motion: reduce) {
  .jobs-scope .j-grad-hairline::before { transition: none; transform: scaleX(1); }
  .jobs-scope *, .jobs-scope *::before, .jobs-scope *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 2.2 `components/jobs-v2/ui/jobsTokens.ts` — structural constants + sx recipes

Everything that is a **number, a map, or a reusable `sx` object** lives here as TypeScript, not
CSS — the `authTokens.ts` / `profileTokens.ts` / `roadmapTokens.ts` / `certificates/ui-tokens.ts`
pattern. Colours are referenced as `var(--j-*)` strings so dark works for free.

```ts
/** The jobs-v2 identity. Colours are var() strings so the scope's dark block re-points them. */
export const J = {
  canvas: "var(--j-canvas)", surface: "var(--j-surface)", surface2: "var(--j-surface-2)",
  surface3: "var(--j-surface-3)",
  ink: "var(--j-ink)", ink2: "var(--j-ink-2)", ink3: "var(--j-ink-3)", ink4: "var(--j-ink-4)",
  hairline: "var(--j-hairline)", hairlineSoft: "var(--j-hairline-soft)",
  hairlineStrong: "var(--j-hairline-strong)",
  azure: "var(--j-azure)", azureDeep: "var(--j-azure-deep)",
  azureSoft: "var(--j-azure-soft)", azureBorder: "var(--j-azure-border)",
  cyan: "var(--j-cyan)", violet: "var(--j-violet)",
  onDark: "var(--j-on-dark)", onDark2: "var(--j-on-dark-2)", onDark3: "var(--j-on-dark-3)",
  onDarkLine: "var(--j-on-dark-line)",
} as const;

export const R = { pill: "var(--j-r-pill)", hero: "var(--j-r-hero)", card: "var(--j-r-card)",
                   inner: "var(--j-r-inner)", ctl: "var(--j-r-ctl)" } as const;

export const SHADOW = { panel: "var(--j-shadow-panel)", raise: "var(--j-shadow-raise)",
                        overlay: "var(--j-shadow-overlay)", sticky: "var(--j-shadow-sticky)",
                        glowAzure: "var(--j-glow-azure)", glowViolet: "var(--j-glow-violet)" } as const;

export const MOTION = {
  ease: "cubic-bezier(.16,1,.3,1)",
  micro: 120, ctl: 180, surface: 220, overlay: 300, reveal: 650, hairline: 1200,
} as const;

export const CTL_H = { base: 40, touch: 44, dense: 32 } as const;

/** THE focus ring. Identical on every jobs control. Never recolour it per screen. */
export const focusRing = {
  "&:focus-visible": { outline: "none", boxShadow: "var(--j-focus-ring)" },
} as const;
export const focusRingOnDark = {
  "&:focus-visible": { outline: "none", boxShadow: "var(--j-focus-ring-on-dark)" },
} as const;

/** Interactive card/row chrome. Border moves; nothing lifts, blurs or bloom-shadows. */
export const cardInteraction = {
  borderRadius: R.card,
  border: `1px solid ${J.hairline}`,
  bgcolor: J.surface,
  transition: `border-color ${MOTION.micro}ms var(--j-ease), background-color ${MOTION.micro}ms var(--j-ease)`,
  cursor: "pointer",
  "&:hover": { borderColor: J.azureBorder, bgcolor: J.surface2 },
  "&:active": { bgcolor: J.surface3 },
  ...focusRing,
} as const;

/** RTL guard. Every uppercase + tracked style MUST spread this. */
export const rtlLabel = {
  '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
} as const;
```

Plus, in the same file, the **single** status source of truth (replacing `JOB_STATUS_STYLES`
x2, `STATUS_COLORS`, `STATE_CHIP_STYLES`, `JOB_STATUS_OPTIONS` x2 and the stepper's short list):

```ts
export type JobStatus = "active" | "inactive" | "on_hold" | "closed" | "completed";
export type AppStatus  = "applying" | "applied" | "shortlisted" | "interview_stage"
                       | "rejected" | "selected";
export type Visibility = "published" | "draft";
export type ScrapedState = "review" | "imported" | "dismissed" | "irrelevant";

export interface Tone { fg: string; bg: string; bd: string; labelKey: string; icon: string;
                        dashed?: boolean }

export const JOB_STATUS: Record<JobStatus, Tone> = { /* var(--j-st-*) triplets */ };
export const APP_STATUS: Record<AppStatus, Tone> = { /* var(--j-ap-*) triplets */ };
export const VISIBILITY: Record<Visibility, Tone> = { /* draft: dashed: true */ };
export const SCRAPED_STATE: Record<ScrapedState, Tone> = { /* var(--j-sc-*) triplets */ };

/** Ordered, and it MUST contain every member of the union. Enforced by the Record type. */
export const JOB_STATUS_ORDER: JobStatus[] = ["active","inactive","on_hold","closed","completed"];
export const APP_STATUS_ORDER: AppStatus[] =
  ["applying","applied","shortlisted","interview_stage","selected","rejected"];
```

> **The `on_hold` bug dies here.** Because `JOB_STATUS` is `Record<JobStatus, Tone>` and every
> status Select in the module maps `JOB_STATUS_ORDER`, the stepper physically cannot ship a
> shorter list again. Same for `applying`, which is now first in `APP_STATUS_ORDER` and
> therefore appears in every stat strip and every filter chip row.

### 2.3 Banned values

- `var(--font-light)` as a background. Anywhere. It is `#ffffff`, a *text* token. Use `J.surface`.
- Any raw hex in a jobs component `sx`. All colour goes through `J.*` / `var(--j-*)`.
- String-concatenated alpha such as `${style.color}30`. Use `color-mix(in srgb, X 30%, transparent)`.
- `useTheme()` for colour. Only `useTheme().breakpoints` inside `useMediaQuery`, and see 7.1.
- `color="text.secondary"`, `borderColor="divider"`, `color="primary"`, `color="error.main"`.
- `minHeight: calc(100vh - 64px)` — `MainLayout` already reserves the app bar.

---

## 3. TYPOGRAPHY

### 3.1 Family decision — **do not load a display face**

**No Fraunces. No JetBrains Mono. Satoshi only.** `/setup` already tried the second family and
reversed it: a second face "made the wizard read like a separate product from the LMS", and this
app has a live perf program (`perf-revamp-program`) that forbids new render-blocking fonts on a
91-route ISR app.

The marketing site's editorial character comes from **tracking, not serifs**. We reproduce it:

- **Display feel** = Satoshi 800 at `letterSpacing: -0.03em` and a `clamp()` size. Tight
  negative tracking at large size is what actually reads as editorial.
- **Mono/label feel** = Satoshi 700, `textTransform: uppercase`, `letterSpacing: 0.16-0.22em`,
  `fontFeatureSettings: '"tnum" 1'`.
- **Genuinely tabular figures** (table counts, IDs, percentages, currency, timestamps in a
  column) use `fontFamily: "var(--font-mono)"` — that token already exists in `globals.css`,
  costs nothing, and stops numbers dancing between rows.

The gradient-text emphasis span **is** allowed (one per page maximum, hero headline only), and
must always declare a solid `color` before the `background-clip: text`, or a browser without
`background-clip` support renders an invisible heading:

```ts
export const gradientText = {
  color: J.azure,                                   // fallback FIRST, always
  background: "var(--j-grad-hairline)",
  WebkitBackgroundClip: "text", backgroundClip: "text",
  WebkitTextFillColor: "transparent",
} as const;
```
On the dark hero, swap `background` to `var(--j-grad-brand)` and the fallback `color` to `J.cyan`.

### 3.2 Weight ladder — **400 / 500 / 700 / 800. There is no 600 and no 900.**

The two shipped dialects disagree (admin says 400/500/600; dashboard says 700/800/900). Jobs
picks one ladder and both sides use it. 800 is reserved for the hero title and the display
number tier; 700 for section/card titles and every uppercase label; 500 for meta and control
labels; 400 for body. Anything else is a bug.

### 3.3 The scale

| Role | Size / line-height | Weight | Tracking | Where |
|---|---|---|---|---|
| `display` | `clamp(28px, 4.2vw, 44px)` / 1.06 | 800 | -0.03em | Hero headline slot only (one per page) |
| `h1` | 24px xs / 32px md / 1.1 | 800 | -0.02em | `ModulePageHeader` title (unchanged — do not restyle) |
| `h2` | 20px / 1.25 | 700 | -0.02em | Section headings on canvas |
| `h3` | 16px / 1.35 | 700 | -0.015em | Card titles, dialog titles, job title on a card |
| `h4` | 15px / 1.4 | 700 | -0.01em | Row titles, table row primary, question label |
| `body` | 14px / 1.6 | 400 | 0 | All prose. Student long-form prose may go 15px / 1.65 |
| `body-strong` | 14px / 1.6 | 500 | 0 | Values in a definition row |
| `small` | 13px / 1.5 | 400 | 0 | Captions, helper text, meta |
| `micro` | 12px / 1.4 | 500 | 0 | Timestamps, counts inline |
| `label` | 12px / 1.3 | 700 | 0.10em, uppercase | Field labels, table headers, chip text |
| `eyebrow` | 11px / 1 | 700 | 0.22em, uppercase | Strip captions, `JModal` eyebrows. **Not** the page header eyebrow — `ModulePageHeader` owns its own. |
| `num-lg` | `clamp(24px, 2.6vw, 34px)` / 1.05 | 800 | -0.025em, `tnum` | Hairline strip values |
| `num-sm` | 18px / 1.1 | 800 | -0.02em, `tnum` | Inline counts, pipeline counts |
| `mono` | 13px / 1.4 | 500 | 0, `var(--font-mono)` | Table figures, IDs, emails, percentages |

Export as `TYPE` in `jobsTokens.ts`, one `sx` object per row, so nobody hand-writes a size:

```ts
export const TYPE = {
  display: { fontSize: "clamp(28px,4.2vw,44px)", lineHeight: 1.06, fontWeight: 800, letterSpacing: "-0.03em" },
  h2: { fontSize: "1.25rem", lineHeight: 1.25, fontWeight: 700, letterSpacing: "-0.02em", color: J.ink },
  h3: { fontSize: "1rem", lineHeight: 1.35, fontWeight: 700, letterSpacing: "-0.015em", color: J.ink },
  h4: { fontSize: "0.9375rem", lineHeight: 1.4, fontWeight: 700, letterSpacing: "-0.01em", color: J.ink },
  body: { fontSize: "0.875rem", lineHeight: 1.6, fontWeight: 400, color: J.ink2 },
  bodyStrong: { fontSize: "0.875rem", lineHeight: 1.6, fontWeight: 500, color: J.ink },
  small: { fontSize: "0.8125rem", lineHeight: 1.5, color: J.ink3 },
  micro: { fontSize: "0.75rem", lineHeight: 1.4, fontWeight: 500, color: J.ink3 },
  label: { fontSize: "0.75rem", lineHeight: 1.3, fontWeight: 700, letterSpacing: "0.10em",
           textTransform: "uppercase", color: J.ink3, ...rtlLabel },
  eyebrow: { fontSize: "0.6875rem", lineHeight: 1, fontWeight: 700, letterSpacing: "0.22em",
             textTransform: "uppercase", ...rtlLabel },
  numLg: { fontSize: "clamp(24px,2.6vw,34px)", lineHeight: 1.05, fontWeight: 800,
           letterSpacing: "-0.025em", fontFeatureSettings: '"tnum" 1', color: J.ink },
  numSm: { fontSize: "1.125rem", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em",
           fontFeatureSettings: '"tnum" 1', color: J.ink },
  mono: { fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 500, color: J.ink2 },
} as const;
```

### 3.4 Rules

- **Tracking tightens as size grows, loosens as it shrinks.** Nothing between `-0.01em` and
  `0.10em` — the gap is what carries the hierarchy.
- Line length caps at **72ch** for prose (`maxWidth: "72ch"`), 680px for hero descriptions.
- Line clamps: job title 2 lines, description preview 2 lines, company 1 line. Use
  `WebkitLineClamp` with `overflow: hidden` and always give the element a `title` attribute
  carrying the full string.
- **Arabic / RTL:** `label` and `eyebrow` MUST spread `rtlLabel`. Never letter-space or
  uppercase a translated string. Every dialog/sheet close button uses `insetInlineEnd`, never
  `right`.
- Dates and numbers go through `lib/jobs-v2/format.ts` (4.22), never `toLocaleDateString("en-IN")`.

---

## 4. COMPONENT KIT

All of it lives in **`components/jobs-v2/ui/`** and is barrel-exported from
`components/jobs-v2/ui/index.ts`. **Both student and admin screens import from here and
nowhere else.** No screen may define a local `SectionCard`, `InfoPill`, `formatDate` or status
map again; the ESLint rule in Group 1 enforces it.

Every component: `"use client"`, no `useTheme()` for colour, colours from `J.*`, radii from
`R.*`, motion from `MOTION.*`. Every interactive element spreads `focusRing`. Every one accepts
`sx?: SxProps` merged last, and `data-tour-id?: string`.

### 4.0 `JobsScope`
```tsx
<JobsScope theme?: "light" | "dark" | "auto" surface?: "student" | "admin">{children}</JobsScope>
```
Renders `<div className="jobs-scope" data-jobs-theme={theme ?? "light"}>` and provides
`JobsSurfaceContext`. **Every jobs route wraps its content in exactly one of these, immediately
inside `PageShell`/`MainLayout`.** It adds no padding and no background of its own on `light`
(so `MainLayout`'s canvas shows through); on `dark` it paints `bgcolor: J.canvas`.

### 4.1 `JButton`
```tsx
JButton({ variant, size, tone, startIcon, endIcon, loading, disabled, disabledReason,
          fullWidth, onClick, href, children, sx })
variant: "primary" | "secondary" | "ghost" | "quiet" | "danger" | "onDark"
size:    "sm" (h32, px 12, 13px) | "md" (h40, px 16, 14px) | "lg" (h48, px 20, 15px)
tone:    "violet" (default) | "azure"     // tone applies to primary/secondary only
```
- **primary** — `background: var(--j-grad-action)` (violet to pink), `color:#fff`, weight 700,
  `borderRadius: R.ctl`, `boxShadow: SHADOW.glowViolet`. `tone="azure"` swaps to
  `var(--j-grad-badge)` + `SHADOW.glowAzure`. Hover `filter: brightness(1.06)`; active
  `transform: scale(.98)`; disabled restates `background` with `opacity:.5, boxShadow:none`
  (an `sx` `background` outlives MUI's disabled styling — the certificates lesson).
- **secondary** — `1px solid J.hairline`, `bgcolor: J.surface`, `color: J.ink`, weight 700.
  Hover: `borderColor: J.azureBorder, bgcolor: J.surface2`.
- **ghost** — no border, `color: J.ink2`. Hover `bgcolor: J.surface2`.
- **quiet** — text-only, `color: J.azure`, underline on hover. This is the link recipe.
- **danger** — `1px solid var(--j-st-closed-bd)`, `color: var(--j-st-closed-fg)`,
  `bgcolor: var(--j-st-closed-bg)` on hover. Never a filled red.
- **onDark** — for the hero: `bgcolor: rgba(255,255,255,.12)`, `1px solid rgba(255,255,255,.22)`,
  `color:#fff`, `borderRadius: R.pill`. Prefer the real `HeaderActionButton` inside
  `ModulePageHeader`; this exists for dark panels elsewhere.
- **loading** — wraps `components/common/LoadingButton` semantics: spinner as `startIcon`,
  **never** `disabled` (blocks with `pointerEvents:none; opacity:.82`) so the verb stays legible.
- **`disabledReason`** — when set, the button is disabled AND wrapped in a `Tooltip` carrying
  the reason, and the reason renders as `small` helper text below it on touch viewports
  (tooltips do not exist on touch). **A disabled button in this module must always say why.**
- `minHeight: {xs: 44}` on every size; `WebkitTapHighlightColor: transparent`;
  `touchAction: manipulation`; `&&:active { transform: scale(.97) }`.

### 4.2 `StatusPill`
```tsx
StatusPill({ kind, value, size?, interactive?, onClick?, count? })
kind: "job" | "application" | "visibility" | "scraped"
```
Resolves `Tone` from the 2.2 maps. Renders `borderRadius: R.pill`, `px: 1`, `h: 24` (`size="sm"`
20), `1px solid tone.bd`, `bgcolor: tone.bg`, `color: tone.fg`, `TYPE.label` at 11px, plus a 14px
Iconify glyph. **`tone.dashed` renders `borderStyle: "dashed"`** — Draft and `applying` are
distinguished by *form* as well as colour, so they survive colour-blindness and greyscale print.
`interactive` adds `cardInteraction`'s hover + `focusRing`, `role="button"` and a key handler.
`count` appends a `·`-separated tabular number.
**Rule:** a `StatusPill` is never an editable control. Editing status uses `StatusSelect` (4.6),
which looks visibly different (chevron, control height, hairline border).

### 4.3 `MetaChip` / `SkillChip` / `CountPill`
- `MetaChip({ icon, children, title? })` — the meta row atom: 13px, `J.ink3`, 14px icon, no
  border, no background. `MetaRow` (4.19) lays them out.
- `SkillChip({ children, selected?, onToggle?, count? })` — `R.ctl`, `1px solid J.hairline`,
  12px/500. Selected: `bgcolor: J.azureSoft, borderColor: J.azureBorder, color: J.azureDeep`,
  `aria-pressed`. Optional trailing tabular `count` (the skills filter has none today).
- `CountPill({ value, tone? })` — `R.pill`, `TYPE.numSm` at 13px, tabular. Used for "42
  applicants", tab counts, "N selected".

### 4.4 `JCard` / `JPanel` / `HairlineStrip`
```tsx
JCard({ interactive?, elevated?, padded?, accent?, children, sx })   // the ONE card
JPanel({ children, sx })                                            // a card with no padding
HairlineStrip({ items: StripItem[], columns?, dense? })
StripItem = { key: string; label: string; value: ReactNode; hint?: string; tone?: string;
              onClick?: () => void; active?: boolean; icon?: string }
```
- `JCard`: `R.card`, `1px solid J.hairline`, `bgcolor: J.surface`, `p: {xs:2, md:2.5}`.
  `elevated` defaults from `JobsSurfaceContext`: **student surfaces get `SHADOW.panel`, admin
  and data surfaces get none** — the one place the two shipped dialects legitimately differ.
  `interactive` spreads `cardInteraction`. `accent="azure"` renders the `j-grad-hairline` top
  rule. **No coloured top strip, ever** (`DESIGN.md` bans it).
- `HairlineStrip` is **the** replacement for all three copies of the 5-tile stat grid. No cards,
  no gaps: a `display:grid` with `borderTop`/`borderBottom: 1px solid J.hairline` and
  `borderInlineStart` on every cell after the first, so the hairlines form one continuous rule
  (the roadmaps density note). Each cell: `TYPE.numLg` value over `TYPE.eyebrow` label in
  `J.ink3`, optional `hint` in `TYPE.micro`, and the `j-grad-hairline` on its top edge revealed
  on scroll-in. `onClick` makes the cell a `role="button"` filter toggle with `aria-pressed` —
  **this is how the "5 non-clickable tiles + 6 clickable chips" duplication collapses into one
  interactive row.** Columns: `{xs: 2, sm: 3, md: items.length}`.

### 4.5 `SectionHeader`
```tsx
SectionHeader({ icon?, title, count?, noun?, description?, action?, level? })
```
Sits **on the canvas**, not inside the card it labels (roadmaps pattern). 32px `R.ctl` icon tile
at `color-mix(in srgb, var(--j-azure) 12%, transparent)` with a `J.azure` glyph; title `TYPE.h2`
(`level="sub"` gives `TYPE.h3`); count folded into the subtitle line ("3 roadmaps" style) rather
than spent as a chip; `action` right-aligned. `mb: 1.75`.

### 4.6 Field wrappers
One file, `Field.tsx`. **Every export takes `label`, `required`, `error`, `helper`, `disabled`,
`id`.** The label is a real `<label htmlFor>` in `TYPE.label`, `mb: 0.75`; `required` renders a
`*` in `var(--j-st-closed-fg)` **plus** `aria-required` on the control **plus** a once-per-form
legend "Fields marked * are required".

```tsx
JField({ label, required, error, helper, htmlFor, children })   // wrapper for custom controls
JTextField({ ...JField, value, onChange, placeholder, type, startIcon, endIcon, multiline, rows, maxLength })
JSelect({ ...JField, value, onChange, options: {value,label,icon?,tone?}[], placeholder, renderValue? })
StatusSelect({ kind, value, onChange, disabled, busy?, dense? })
JTextArea({ ...JTextField, rows, autoResize? })
JRadioGroup({ ...JField, value, onChange, options, orientation })
JCheckGroup({ ...JField, values, onChange, options })
JDatePicker({ ...JField, value, onChange, min, max })
JFileDrop({ accept, maxBytes, value, onFile, onClear, label, hint, state })
JSwitch({ label, checked, onChange, description? })
```
- Control chrome: `h: CTL_H.base` (`{xs: CTL_H.touch}`), `R.ctl`, `1px solid J.hairline`,
  `bgcolor: J.surface`, 14px/400. Hover `borderColor: J.hairlineStrong`. Focus
  `borderColor: J.azure` + `focusRing`. Disabled `bgcolor: J.surface3, color: J.ink4`.
- **Error state is visual, not a toast.** `error` sets `borderColor: var(--j-st-closed-bd)`,
  renders the message below in `TYPE.small` + `var(--j-st-closed-fg)` with `role="alert"`, and
  sets `aria-invalid` + `aria-describedby`.
- `JSelect`'s `renderValue` defaults to the option's **`label`**, never the raw value. (Fixes
  the Experience control that shows `0-1` closed and `0-1 years` open.)
- `StatusSelect` is the only editable status control. `busy` shows an inline 16px spinner on
  that control alone. The dense variant is desktop-only and still gets a 44px hit area via a
  transparent `::before` inset.
- `JFileDrop` states: `idle` (2px dashed `J.hairline`), `dragover` (2px dashed `J.azure`,
  `bgcolor: J.azureSoft`), `uploading` (spinner + label, `cursor: wait`), `success` (2px solid
  `var(--j-st-active-bd)`, `bgcolor: var(--j-st-active-bg)`, filename + a **Remove** button),
  `error` (2px dashed `var(--j-st-closed-bd)` + message).
  **Drag state is React state, never `e.currentTarget.style.borderColor`.** The imperative
  mutation permanently outranks `sx` and is why the green success border never renders today.
  `onDragOver`/`onDragLeave`/`onDrop` call `setDrag(true|false)` and nothing else. A rejected
  file type or size produces the `error` state with a specific message, never silence.
- **An unknown control type never renders nothing.** Controls are chosen by
  `resolveQuestionControl(question)` in `lib/jobs-v2/questions.ts`, whose default branch returns
  a `JTextArea` and logs. A required question can never become unanswerable again.

### 4.7 `EmptyState`
```tsx
EmptyState({ illustration?, icon?, title, body, primaryAction?, secondaryAction?, hints?, variant })
variant: "page" | "panel" | "inline"
```
`JCard` with `borderStyle: "dashed"`, `borderColor: J.hairline`, centred, `py: {xs:5, md:6}`.
One illustration language (4.21). Title `TYPE.h3`, body `TYPE.body` at `maxWidth: 46ch`.
`hints` render as micro-rule bullets.
**Rule: an empty state caused by a filter MUST offer a reset action.** Two distinct empties per
list are mandatory — *nothing exists yet* vs *nothing matches* — and section 5 names both for
every screen.

### 4.8 `ErrorState`
```tsx
ErrorState({ title, body, error?, onRetry, secondaryAction?, variant })
```
The component that does not exist today and is the single biggest fix in the module.
A 72px `R.inner` tile at `var(--j-st-closed-bg)` with `mdi:alert-circle-outline` in
`var(--j-st-closed-fg)`; title `TYPE.h3`; body `TYPE.body`; the raw `error` message in
`TYPE.mono` inside a `J.surface2` block when present; a **Retry** `JButton variant="secondary"`
that re-runs the loader. `role="alert"`.
**Every data-loading surface in this module gets a `loadError` state and renders `ErrorState`
when it is set. A catch may never `setX([])`.** `app/admin/jobs-v2/scraped/page.tsx` already
does this correctly — copy its `loadError` shape verbatim.

### 4.9 Skeleton set — `Skeletons.tsx`
Skeletons must be **shaped like the content that replaces them**. Exports:
`JobCardSkeleton`, `JobRowSkeleton`, `JobListSkeleton({count, view})`, `JobDetailSkeleton`,
`ApplyStepSkeleton`, `AppliedListSkeleton`, `HairlineStripSkeleton({columns})`,
`DataTableSkeleton({columns, rows})`, `FormSkeleton({sections})`, `PipelineSkeleton`,
`ScrapedTableSkeleton`, `HeroSkeleton`.
All MUI `Skeleton variant="rounded"` at `R.ctl`/`R.card`, `animation="wave"`,
`bgcolor: J.surface2`. The wrapper carries `aria-busy="true"`, `aria-live="polite"` and an
`sr-only` "Loading ...".
**Rule: never a bare `CircularProgress` or `LinearProgress` as a page or panel loading state.**
Spinners survive only *inside* a control already on screen (a button, a drop zone, an inline
refresh). This deletes the four student and two admin loading dialects at once.

### 4.10 `JDataTable`
```tsx
JDataTable<T>({
  columns: Column<T>[], rows: T[], getRowId, getRowHref?, onRowClick?,
  selection?: { selectedIds: Set<ID>, onChange, selectableIds },  // omit = no checkbox column
  sort?: { key, dir, onSort },
  loading?, error?, onRetry?, empty?: ReactNode, emptyFiltered?: ReactNode, isFiltered?,
  dense?, stickyHeader?, caption, mobile: (row: T) => ReactNode
})
Column<T> = { key, header, width?, align?, sortable?, hideBelow?: "sm"|"md"|"lg",
              render: (row: T) => ReactNode, headerHelp?: string }
```
- **No nested scroller.** No `maxHeight`, no inner `overflow`. The page scrolls; the header is
  `position: sticky; top: 0` against the page. This deletes the double scrollbar on all three
  admin lists and the sticky header that stops working past 880px.
- Chrome: `JPanel` wrapper; header row `bgcolor: J.surface2`, `TYPE.label` headers,
  `borderBottom: 1px solid J.hairlineStrong`; body rows `borderBottom: 1px solid J.hairlineSoft`
  with none on the last; row height 56 (`dense` 48); hover `bgcolor: J.surface2` — no lift, no
  shadow.
- **`getRowHref` renders the row's primary cell as a real `<Link>`**, so rows are keyboard
  reachable, middle-clickable and announced as links. `onRowClick` is only for rows with no
  canonical URL, and then the row gets `role="button" tabIndex={0}` and a key handler.
- Sorting uses MUI `TableSortLabel` with `aria-sort` on the `<th>`. Never a bare `onClick`
  plus a chevron.
- Selection: header checkbox with `aria-label="Select all N rows on this page"` and
  `indeterminate`; row checkbox `aria-label="Select {row title}"`; **shift-click range
  selection**, implemented once, here. The header renders "N selected" inline even before the
  bulk bar appears, so selection is discoverable.
- `loading` gives `DataTableSkeleton` at the caller's column count. `error` gives `ErrorState`
  inside the panel with `onRetry`. `isFiltered && rows.length === 0` gives `emptyFiltered`,
  otherwise `empty`.
- `mobile` renders below `md` as a stacked card list built from `JCard interactive` — same data,
  same actions, never *less* data than the desktop table (7.2).
- `caption` renders a visually-hidden `<caption>` naming the table.

### 4.11 `JModal` / `JSheet` / `JConfirm`
**One dialog language for the whole module.** Replaces four.
```tsx
JModal({ open, onClose, title, eyebrow?, description?, icon?, size, tone?,
         footer?, dirty?, mobile?, children })
size: "sm" (480) | "md" (640) | "lg" (880) | "xl" (1080)
mobile: "sheet" (default) | "fullscreen"
```
- `PaperProps`: `R.card`, `boxShadow: SHADOW.overlay`, `overflow: hidden`, `maxHeight: "88vh"`.
- Header: a `J.surface2` band with `borderBottom: 1px solid J.hairline` — **not** a gradient.
  (The indigo-gradient dialog header is one of the four dialects being deleted; it is also the
  only one that cannot render legibly in dark.) Optional 40px `R.ctl` azure-tinted icon tile,
  `eyebrow` in `TYPE.eyebrow`, `title` in `TYPE.h3` inside a real `DialogTitle`, `description`
  in `TYPE.small`. Close `IconButton` at `insetInlineEnd: 8` (RTL-safe).
- Body: `DialogContent`, `p: {xs:2, md:3}`, its own scroll, `overscroll-behavior: contain`.
- Footer: a real `DialogActions`, `borderTop: 1px solid J.hairline`, `bgcolor: J.surface2`,
  destructive/secondary on the leading edge, primary on the trailing edge. On `xs` the footer
  stacks full-width buttons with the primary on top.
- **`dirty`**: when true, backdrop click and `Esc` do **not** close; they raise a `JConfirm`
  "Discard your changes?". This is the fix for the candidate pipeline modal and the apply flow
  silently binning typed data.
- Focus trap, `aria-labelledby`/`aria-describedby` wired to the real title and description
  nodes, focus returned to the invoker on close.
- `JSheet` is the same component rendered as a bottom sheet below `md` (`R.card` top corners,
  full width, `maxHeight: 92dvh`, drag-handle affordance, identical a11y). **Every `JModal` is
  automatically a `JSheet` below `md`** unless `mobile="fullscreen"`, which forms use.
- `JConfirm({ open, title, body, confirmLabel, cancelLabel, tone, consequences?, onConfirm, onCancel })`
  wraps `JModal size="sm"`. **`onClose` maps to `onCancel` only when `tone !== "danger"`**; a
  danger confirm requires an explicit button press. `consequences` renders a micro-rule bullet
  list of exactly what will change ("40 jobs become visible to every student", "200 applicants
  move to Rejected") and is **required for every bulk action** (4.20).

### 4.12 `JStepper`
```tsx
JStepper({ steps: Step[], active, onStepChange, completedThrough })
Step = { key, label, hint?, status: "todo"|"active"|"done"|"error", enabled: boolean }
```
- Horizontal on `md+`; a compact **progress bar plus "Step 2 of 4 · Description"** line below
  `md` — not a vertical stepper, which eats about 200px above every form on every step. Progress
  is stated **once**, never twice.
- **Steps are clickable** whenever `enabled` (every step already passed, plus any step whose
  gate is satisfied). Real buttons, `aria-current="step"`, arrow-key navigation. Editing a
  closing date must not cost three Next clicks.
- `status: "error"` tints the marker `var(--j-st-closed-fg)` and adds a `!` glyph, so a
  validation failure is visible from any step.
- **No SSR/hydration jump.** Orientation is chosen by CSS `display` at breakpoints, never by
  `useMediaQuery`. This kills the horizontal-to-vertical snap on every mobile load.

### 4.13 `JTabs`
```tsx
JTabs({ tabs: {value,label,icon?,count?}[], value, onChange, fullWidth?, size? })
```
A pill/segmented track (`R.pill`, `1px solid J.hairline`, `bgcolor: J.surface`, `p: 0.5`); the
active segment is `bgcolor: J.azureSoft`, `color: J.azureDeep`, weight 700; counts render as a
tabular `CountPill`. Real `role="tablist"`/`role="tab"` with `aria-selected`, `aria-controls`,
roving `tabIndex`, Home/End/Arrow keys. **The panel it controls must carry `role="tabpanel"`,
an `id` and `aria-labelledby`.** Scrolls horizontally with an edge fade below `sm`; never wraps.

### 4.14 `SearchInput`
```tsx
SearchInput({ value, onChange, onSubmit, placeholder, debounceMs = 300, loading?, ariaLabel })
```
- **One search semantic.** `onChange` updates the input; a 300ms debounce fires `onSubmit`. The
  magnifier button and `Enter` (`onKeyDown`) fire `onSubmit` immediately. There is no second,
  different, client-side filter running on every keystroke, so results no longer change before
  you search and again after.
- Chrome: `R.pill`, `h: 44`, `1px solid J.hairline`, leading 18px `mdi:magnify` in `J.ink3`,
  trailing clear `X` when non-empty (`aria-label="Clear search"`), an inline 16px spinner while
  `loading`. Focus: `borderColor: J.azure` + `focusRing`.
- `role="searchbox"`, `aria-label` required.

### 4.15 `FilterBar` + `ActiveFilters`
```tsx
FilterBar({ children, primary?, dense? })                  // layout only
FilterPopover({ label, icon, badge, children })            // one filter, in a popover
ActiveFilters({ chips: {key,label,onRemove}[], onClearAll })
```
- **Filters are one row of popover buttons, identical at every breakpoint.** No desktop sidebar,
  no separate mobile block. This deletes the desktop/mobile filter-parity gap, the location
  de-duplication written three times, the two independent location controls writing to two
  independent states, and 280px of horizontal space on the board.
- Each `FilterPopover` button: `R.pill`, `h: 40`, `1px solid J.hairline`, label plus chevron.
  When the filter is set: `borderColor: J.azureBorder, bgcolor: J.azureSoft, color: J.azureDeep`
  and a tabular `badge` count. The popover becomes a `JModal size="sm"` below `md`.
- `ActiveFilters` renders **below** the bar whenever anything is set: one removable chip per
  active value plus a "Clear all" `JButton variant="quiet"`. **Mandatory on every filtered list
  in the module** — it is the only way to see what is applied and the escape hatch from a
  zero-result dead end.

### 4.16 `JPagination`
```tsx
JPagination({ page, pageCount, total, pageSize, onPageChange, onPageSizeChange, sizes = [10,20,50] })
```
Leading: "Showing 21-40 of 137" in `TYPE.small` with tabular numerals. Trailing: page controls
at **44px touch targets** (`siblingCount={1}`, never `size="small"`) plus a page-size `JSelect`.
Renders `null` when `pageCount <= 1` **and** `total <= sizes[0]`. A `nav` element with
`aria-label="Pagination"`; the current page carries `aria-current="page"`.

### 4.17 `CompanyLogo`
```tsx
CompanyLogo({ src, name, size = 40, radius? })
```
A plain `<img>` (never `next/image` — arbitrary tenant and employer URLs), `objectFit: "contain"`,
`p: size >= 48 ? 1 : 0.5`, `bgcolor: J.surface`, `1px solid J.hairline`,
`borderRadius: size > 40 ? R.inner : R.ctl`. On `onError` **or** a missing `src` it falls back to
the initial letter on `var(--j-grad-badge)` in white 700 — never a broken-image glyph, never a
`display:none` box. `alt=""` (decorative; the name is always adjacent text).

### 4.18 `JAvatar`
The same shape for people: circular, initials fallback on `J.surface3` / `J.ink2`, sizes
28 / 32 / 40 / 56.

### 4.19 `MetaRow`
```tsx
MetaRow({ items: {icon,label,title?}[], max?, dense?, onDark? })
```
A wrapping `display:flex; gap: 1.5` of `MetaChip`s with a hairline `·` between them on `sm+`.
`max` truncates to N with a `+N` that opens a popover of the rest. **The order is fixed** —
location, job type, experience, salary, posted, deadline — and never varies between card, row
and detail, so the eye learns one path. `onDark` swaps to the on-dark ink tokens.

### 4.20 `Toolbar` + `BulkActionBar`
```tsx
Toolbar({ start?, end?, children })     // one flex row, gap 1.5, wraps to a grid below md
BulkActionBar({ count, noun, onClear, actions: BulkAction[], busy })
BulkAction = { key, label, icon, tone?, render?: ReactNode, onRun: () => Promise<BulkOutcome>,
               confirm: { title, body, consequences: string[] } }   // confirm is REQUIRED
BulkOutcome = { ok: number; failed: { id: ID; title: string; reason: string }[] }
```
- **One bulk bar, built once, used by all three admin lists.** Sticky to the top of the list
  region (`position: sticky; top: 0; zIndex: 2`), `R.card`, `1px solid J.azureBorder`,
  `bgcolor: J.azureSoft`, `boxShadow: SHADOW.raise`. Leading: a 36px azure tile, "N jobs
  selected" in `TYPE.h4`, and a `JButton variant="quiet"` "Clear". Trailing: the action controls.
- **`confirm` is not optional in the type.** Every bulk action raises a `JConfirm` listing its
  `consequences` before it runs. Publishing 40 jobs to every student can no longer be one click
  while deleting one job takes a dialog.
- Results are reported by an **outcome summary**, not a toast: the bar renders a dismissible
  result panel naming what failed and why, with a "Retry failed" button. This fixes "M skipped"
  with no list, and a partial write reported as a total failure.
- Each bulk action is **one request**. Two sequential requests behind one button (status then
  visibility) is split into two named actions.
- The bar enters with a `fadeIn` at `MOTION.ctl` and never reflows the list — it occupies a
  reserved sticky slot.

### 4.21 Illustrations
`components/jobs-v2/illustrations/*` is **normalised, not replaced**. One visual language: 2px
stroke, `currentColor` for structure, a single accent stop from `var(--j-grad-badge)`, and
**paper fills use `J.surface`, never `var(--font-light)`**. All six take
`{ width, height, tone?: "accent" | "muted" }` and default to `tone="muted"` (`J.ink4`
structure), so the same asset never reads as two different things on two screens — today
`JobSearchIllustration` is indigo on the board and grey on the detail page. All are `aria-hidden`.
`JobDetailIllustration` survives the deletion of `JobDetailModal` because the apply header uses it.

### 4.22 Shared logic — `lib/jobs-v2/`
Not UI, but it is kit, and Group 1 owns it. Both sides import from here; the four `formatDate`
copies and the two `getPostedLabel` copies die.
- `format.ts` — `formatDate(iso, {withTime?})` (locale-aware via i18n, **never** a hardcoded
  `en-IN`), `postedLabel(iso)` (returns `null` for a missing date; **never** fabricates
  "Recently"), `deadlineLabel(iso)` returning `{ text, urgency: "none"|"soon"|"urgent"|"past" }`,
  `relativeTime(iso)`, `formatSalary`, `formatExperience`.
- `status.ts` — re-exports the 2.2 maps plus `resolveJobStatus` and `resolveAppStatus`, both of
  which fall back to a neutral tone rather than crashing on an unknown string.
- `questions.ts` — `resolveQuestionControl`, `serializeAnswer` (**multi-choice answers submit as
  a real array, not `join(", ")`**, so an option containing a comma survives; if the API demands
  a string, join on a unit separator and document it), `validateAnswers` producing field-level
  errors.
- `useJobsUrlState.ts` — the URL contract (5.1.1): reads and writes `q, loc, exp, type, emp,
  skills, posted, salary, tab, view, page, size, sort, status` via `useSearchParams` plus a
  scroll-preserving debounced `router.replace`. Used by the student board, the admin list, the
  applications pipeline and the scraped queue.
- `useSelection.ts` — `{selected, toggle, toggleRange, clear, selectAll}`, and it **clears
  automatically whenever its `deps` key changes** (filter / search / page). The scraped queue's
  correct behaviour, made impossible to forget on the other two lists.
- `useSeq.ts` — the monotonic stale-response guard lifted from `scraped/page.tsx`. Every list
  loader and the student picker use it.

---

## 5. PER-SCREEN REDESIGN

Every screen below is wrapped:
```tsx
<PageShell>                 {/* MainLayout fullWidthContent; adds NO padding of its own */}
  <JobsScope surface="student|admin">
    <ModulePageHeader eyebrow="Career" title={...} description={...} accent="azure" icon={...} action={...} />
    {/* A PLAIN section name, like every sibling module. Never a numbered kicker — see 1. */}
    ...
  </JobsScope>
</PageShell>
```
**`ModulePageHeader` gains one new accent** — a one-line, fully typed addition to `ACCENTS` in
`components/common/ModulePageHeader.tsx`, the only edit to a shared file outside the kit:
```ts
azure: { a: "#00e0ff", b: "#2356d6", glow: "rgba(0,224,255,0.42)" },
```
Nothing else in that file changes. Every jobs page — student and admin, board, detail, apply,
list, stepper, pipeline, reports, queue — uses this header. **The dark hero never disappears
mid-flow again**; that single change fixes the board / detail / apply chrome discontinuity.

`minHeight: calc(100vh - 64px)` is deleted from all six places it appears.

---

### 5.1 STUDENT — Job Board, Browse tab
`app/jobs-v2/page.tsx` (plus new `components/jobs-v2/board/*`)

**The structural change: one render tree.** The `display:{xs:'none',lg:'flex'}` /
`display:{xs:'flex',lg:'none'}` fork and its roughly 300 duplicated lines are deleted. There is
one tree; layout differences are CSS (`gridTemplateColumns`, `flexDirection`) inside it. This
one change fixes the desktop-drops-`onFavoriteChange` bug, the two divergent empty-state copies,
the tour-ids-only-on-desktop bug, and the doubled DOM that broke accessibility.

**Layout, top to bottom**
1. `ModulePageHeader` — eyebrow `Career`, title "Jobs", accent `azure`, icon
   `mdi:briefcase-search`, description unchanged. `action`: `HeaderActionButton ghost`
   "Saved (N)" when the learner has favourites — **the favourites dead end closes**, because
   `is_favourited` currently round-trips through the API with no surface anywhere that lists it.
   The Saved view is the Browse list filtered by `is_favourited`, driven by `?fav=1` in the URL.
2. `ProfileLockBanner` — behaviour unchanged, restyled through `J.*` (its four raw hexes go).
   The shared component itself is not edited; jobs passes props.
3. **Search and filter rail** — one `JCard padded={false}` on the canvas, `p: 2`:
   - `SearchInput` at `maxWidth: 720`, left-aligned in a flex row whose remaining space holds
     the view switch. The current `maxWidth:960` bar inside a full-width row, hanging left with
     dead space to its right, is deleted.
   - `FilterBar` beneath: `FilterPopover`s for **Location, Job type, Employment type,
     Experience, Skills, Posted, Salary** — the same seven at every breakpoint. Location and
     Experience each exist exactly once now; the search bar's duplicate controls and the
     `experienceInput.trim() || filters.experience` resolution are both deleted.
     "Internship" appears in **one** vocabulary, not in both Job Type and Employment Type.
   - `ActiveFilters` below whenever anything is set.
   - `NaukriJobSearchBar`, `JobFiltersSidebar`, `MobileJobFilters`, `JobListHeader`,
     `SkillsFilter`, `JobPagination` are **no longer imported by jobs-v2**. They stay on disk,
     untouched, owned by the orphan `/jobs` route and its Playwright spec (Group 2 note).
4. `JTabs` — Browse / Applied / Saved, sitting **directly under the header and above the search
   rail**, because they switch the entire pane. On Applied and Saved the search rail and filter
   bar unmount. This fixes "a 280px Refine results column and a full search bar visible and
   interactive while controlling nothing".
5. Result meta row: "N jobs" (tabular) plus a sort `JSelect` plus the card/list switch rendered
   as `JTabs size="sm"` with two icon segments. `ViewToggle` is not imported here, so its dead
   `var(--hover-bg)` hover stops affecting jobs (the undefined variable remains `/jobs`'s
   problem; the shared file is not edited).
6. The list — `JobCardV2` (cards) or `JobRowV2` (rows), both rebuilt on `JCard interactive`.
7. `JPagination`.

**JobCardV2 / JobRowV2 — what changes**
- **One accent.** The hardcoded `#06b6d4` hover border and avatar fill on the list rows, and the
  cyan-header / indigo-card split, all die: card and row use `J.azure` for the hover border and
  `var(--j-grad-badge)` for the logo fallback. Switching card to list no longer changes the
  module's colour.
- `marginBottom: 2` is removed from the card; the list owns spacing (`Stack spacing={1.5}` for
  cards, `spacing={0}` with hairline dividers for rows). Cards no longer sit 48px apart while
  rows in the same view sit 12px apart.
- **A new signal row on every card and row:** `StatusPill kind="application"` when
  `has_applied`; a dashed "Not eligible" pill when `eligible_to_apply === false`; a
  `deadlineLabel` chip tinted by urgency. A learner can now tell a live opening from one they
  already applied to **without two navigations and a full-page interstitial**.
- The favourite heart has one `onFavoriteChange` path, because there is one tree. Optimistic
  toggle with rollback is preserved. Hidden in admin mode — behaviour unchanged.
- `postedLabel` comes from `format.ts` and returns `null` for an undated row; the meta chip is
  omitted rather than fabricating "Recently".
- The `memo` comparator widens to include `has_applied`, `eligible_to_apply` and
  `application_deadline`.

**Skills filtering** — substring matching (`jobTags.some(t => t.includes(s))`, which returns
every JavaScript job for "Java" and everything for "R") is replaced by exact, case-folded token
equality against `job.tags`. The `SkillChip` list is ranked by frequency, shows a `count` per
skill, and windows above 60 entries (a plain `overflow:auto` plus a sliced render — no new
dependency). A selected skill appears once, in the selected row, and is `aria-pressed` in the
list rather than rendered a second time.

**States**
- **Loading** — `JobListSkeleton count={6} view={view}`, shaped like the cards and rows. The
  illustration plus `LinearProgress` combo in a 320px void is deleted. On a *filter change* the
  list does not unmount: it dims to `opacity: .55` with `aria-busy="true"`, and the skeleton is
  used only on first load. The page no longer flashes empty on every refetch.
- **Empty (nothing matches)** — `EmptyState` with `EmptyJobsIllustration`,
  `t("jobsV2.noJobsFound")`, `t("jobsV2.tryAdjustFilters")`, a **primary "Clear all filters"**,
  and `hints` naming the two or three filters excluding the most. One copy, not two.
- **Empty (no jobs exist at all)** — different copy: "No openings posted yet" / "New roles land
  here as your institution posts them", and no clear-filters action.
- **Error** — `ErrorState` with Retry. `fetchJobs`'s catch sets `loadError`; it never calls
  `setAllJobs([])`.
- **Profile-locked** — `ProfileLockCard` is passed **`preview={<JobListSkeleton count={3} />}`**
  so the learner sees blurred job cards behind the lock instead of the empty box the missing
  `preview` prop produces today.
- **Success** — the favourite toast stays; nothing else on this screen toasts.

**5.1.1 URL state contract (new, and load-bearing)**
`useJobsUrlState` puts `q, loc, exp, type, emp, skills, posted, salary, fav, tab, view, page,
size, sort` in the query string. Consequences: the board is shareable and bookmarkable; "Back to
jobs" returns you to page 4 of your filtered search; the browser back button behaves. Defaults
are omitted from the URL so a clean board has a clean URL.

**Pagination honesty.** `getJobs` sends no `page`/`page_size` and the response's `count` is
discarded, so "N jobs found" is the size of whatever the server returned. The API is not
changing (section 10), so: the component now **reads `response.data.count`** and reports it,
labelling the visible slice honestly as "Showing 1-20 of 137" — and when client-side filtering
has reduced the set, "Showing 1-20 of 42 matching (137 total)". `page`/`page_size` pass-through
is written behind a `supportsPagination` flag so it flips on the day the endpoint lands.

**5.1.2 Card content quality (added 2026-08-31, after the first live review)**

Three defects the redesign carried over from the data rather than from the old UI:

- **The `job` chip.** The card rendered `job.job_type` raw, and on this tenant that string is
  the literal `"job"` on nearly every row — a chip spending a line of the card to tell a learner
  they are on the job board. The meta row now shows `formatEmploymentType(job.employment_type)`
  ("Full-time", "Internship"), canonicalised across the feed's spellings and **omitted entirely**
  when absent — no dash, no empty slot, which matters because most rows have neither salary nor
  experience either. `job_type` survives only through `jobTypeBadge`, which returns a chip **only
  when it adds information**: an internship, and only if the employment type has not already said
  so. The detail hero follows the same rule.
- **The description.** Already-published scraped rows open with the employer's own marketing
  ("GitLab is the intelligent orchestration platform for DevSecOps…", "About the Team…"), so a
  two-line clamp showed an advert for a company the learner did not search for.
  `descriptionPreview(text, company)` in `lib/jobs-v2/format.ts` is a **client-side safety net**
  over data we cannot re-ingest: it normalises nbsp/HTML/whitespace and drops a leading
  company-boilerplate block. It is deliberately conservative — at most three leading blocks,
  never all of them, and never a block that mentions the role — because losing the description is
  far worse than leaving one boilerplate line in place. Tested in `jobsLogic.test.ts`.

**5.1.3 Company variety on the default view (added 2026-08-31)**

The live board showed **six consecutive GitLab cards**. Nothing was broken — the sort was exactly
what it claimed — but a page of 20 openings that shows one employer fails at the only job it has.
`interleaveByCompany` (`lib/jobs-v2/variety.ts`) reorders **the page that has already been sliced**,
so it is a permutation: no job is added, dropped or duplicated, and page 3 holds exactly the jobs
page 3 held before. It runs **only on the default browse view** — no explicit sort, no search, no
filter — because quietly reordering the answer to an instruction reads as a bug.

**5.1.4 The match signal (added 2026-08-31)**

This is an edtech platform and the profile gate **already fetches the learner's whole profile** on
every page load for the completion percentage; it now keeps the `skills` array from that same
response, so the board pays no request and no new endpoint for this. Each card names the skills on
the job that are **already on the learner's profile** ("You have React, TypeScript"), those skills
are hoisted to the front of the clamped chip row, and a **"Most relevant"** sort ranks by how many
match, ties breaking on recency.

**There is no percentage, and there is no zero.** A score derived from two unweighted string lists
is a number the learner cannot check and cannot act on; a named skill is both. When we do not know
the learner's skills — signed out, an empty profile, a failed profile fetch, a jobs surface outside
the provider — the chip does not render, "Most relevant" is not offered, and a pasted
`?sort=relevant` falls back to the default order rather than pretending to rank.

**Guided tour** — the six `data-tour-id`s (`jobs-search`, `jobs-filters`, `jobs-results`,
`jobs-tabs`, plus header and card) now live on nodes present at **every** breakpoint, because
there is one tree. Four of them are currently inside the `lg`-only subtree, so two thirds of the
tour highlights nothing on a phone. `lib/guide/registry.ts`'s `jobs-filters` narration is
updated from "sidebar" wording to "the filter row" — Group 2's only line in that file.

---

### 5.2 STUDENT — Job Board, Applied tab
`components/jobs-v2/AppliedJobsSection.tsx` becomes
`components/jobs-v2/board/AppliedPanel.tsx`

**Layout**
1. **Placement banner** (conditional on a `selected` application) — `JCard accent="azure"` with a
   `j-grad-hairline` top rule, a 48px `mdi:trophy-outline` tile in `var(--j-st-active-*)`,
   "Offer received", and one row per selected application linking to the **application**, not
   the job. The green gradient wash, the 4px gradient top bar and the
   `color-mix(in srgb, var(--font-light) 60%, transparent)` row background are all deleted.
2. **`HairlineStrip`** — one interactive row replacing **both** the five stat tiles and the six
   filter chips. Cells come from `APP_STATUS_ORDER`, so `applying` is cell one and the counts
   now sum to the stated total. Each cell is a filter toggle with `aria-pressed`. The invalid
   `` `${style.color}30` `` border (which produces `var(--success-500)30` and silently drops on
   every populated tile) dies with the tiles.
3. Header row: "Your applications" in `TYPE.h2`, a `CountPill` total, a sort `JSelect` (the raw
   unstyled native `<select>` whose popup ignores the tenant palette is deleted), and a
   **Refresh** `JButton variant="ghost"` showing "Updated 2m ago" in `TYPE.micro`. Status
   changes no longer require a full page reload.
4. **Application rows** — `JCard interactive` linking to **`/jobs-v2/applications/{id}`** (the
   new route, 5.3), not to the job. Each row: company logo, job title `TYPE.h4`, company,
   `StatusPill kind="application"`, a **compact pipeline rail** (six 3px segments filled through
   the furthest stage reached, with an `aria-label` describing it), the applied date, a chevron.
5. `JPagination` above 20 applications.

**5.2.1 `applying` becomes first-class.** Rows at `applying` render a dashed amber pill and an
inline prompt: **"Did you complete this application?" / Yes / No, I did not.** "Yes" calls
`confirmApplied`. "No" calls the cancel path if the API has one; if it does not, the row is
locally hidden with "Hidden — it will reappear if the employer confirms" and exposes "Mark as
applied". Records stranded by answering "No" (or pressing Esc) on the detail page's dialog are
now correctable from the one screen that lists them.

**States**
- Loading gives `AppliedListSkeleton` plus `HairlineStripSkeleton`. The bare `CircularProgress`
  — the module's only spinner and its third loading dialect, one tab-switch from the second — is
  deleted.
- Empty (no applications) gives `EmptyState` using **`EmptyJobsIllustration`**, the same asset
  and language as the Browse tab, so the two tabs of one screen look related. The current 80px
  circled lucide `Briefcase` goes. Primary action "Browse jobs" flips the tab.
- Empty (filtered) keeps the existing good state: `No applications with status "X"` plus
  **"Show all (N)"** — the one recovery affordance the module already had.
- Error gives `ErrorState` plus Retry. A failed fetch may never render "No applications yet";
  that is the most alarming false negative on this screen.
- **i18n**: every string goes through `t()`; the six status labels come from
  `APP_STATUS[x].labelKey`. This file currently contains zero `t(` calls.

---

### 5.3 STUDENT — Application detail (NEW ROUTE)
`app/jobs-v2/applications/[id]/page.tsx`

The audit's sharpest finding: `round_1`-`round_4`, `offered`, `drive`, `internal_shortlisting`,
`shortlisted_by_hr`, `reason_not_shortlisted` and `resume_url` are all on `JobApplicationV2` and
**not one is ever shown**. A rejected learner is told "Rejected" and nothing else.

**Layout**
1. `ModulePageHeader` eyebrow `Application`, title = the job title, accent
   `azure`, `action` = `HeaderActionButton ghost` "View job".
2. **Pipeline timeline** — the primary content. A vertical rail on `xs`, horizontal on `md+`:
   one node per stage present on the record (Applied, Internal shortlisting, Shortlisted by HR,
   Drive, Round 1-4, Offered), each with its value, its date when present, and a state
   (done / current / upcoming / not reached). The current node carries the `j-grad-hairline`.
3. `JCard` "Your submission" — the resume that was sent (opens `ResumeViewerModal`) and every
   question and answer exactly as submitted.
4. `JCard` "Outcome" — `reason_not_shortlisted` in full when present, with an information tile.
   A rejection with a reason is the single most valuable thing this module can show a learner.
5. `MetaRow` — applied at, last updated, and the application reference `#{id}` in tabular mono.

**States** — `JobDetailSkeleton`-shaped loader; `ErrorState` plus Retry; not-found is a
**separate** branch ("This application no longer exists" plus "Back to applications"). No modal
on this route.

---

### 5.4 STUDENT — Job Detail
`app/jobs-v2/[id]/page.tsx`

**The chrome is fixed first.** `PageShell` + `JobsScope` + `ModulePageHeader` (eyebrow
`Role`, title = the job title, description = company and location, accent `azure`,
`action` = the favourite toggle plus the primary apply CTA as `HeaderActionButton`). The
hand-rolled `linear-gradient(135deg, #f8fafc, #f1f5f9, #e2e8f0)` hero — three hardcoded slate
hexes that stay light under every palette while `--font-primary` moves — is **deleted**.

**Layout**
1. `ModulePageHeader` as above, with `children` carrying the identity row: `CompanyLogo size={56}`,
   `MetaRow onDark`, and read-only `StatusPill`s (job type, employment type, eligibility).
2. A breadcrumb strip under the hero: "Jobs / {title}". The first element is a
   `JButton variant="quiet"` calling **`router.back()` with a `/jobs-v2` fallback**, so a learner
   on page 4 of a filtered search returns there instead of an unfiltered page 1. Prev/next job
   navigation appears when the board handed a result set through the URL.
3. Body grid `1fr / 340px`, splitting at **`md`, not `lg`** — this alone kills the 900-1200px
   apply dead zone. Single column below `md`.
   - Left: "About this role" `JCard`. The description renders through the app's existing
     sanitising markup renderer when the field carries HTML or Markdown, otherwise `pre-wrap`.
     The dead `& p / & ul, & ol / & li` rules in its `sx` go one way or the other; they may not
     stay dead. Then "Selection process", "Requirements" (micro-rule bullets, now including the
     three eligibility percentages the admin form collects), "Key skills" (`SkillChip`s), and
     "About the company".
   - Right (`position: sticky; top: 88` at `md+`): **one** apply card, the "Job details"
     definition list (the last row's `borderBottom` removed, so no stray divider sits above the
     card's own edge), and the attached-JD card whose file glyph uses `J.ink3` — **not
     `var(--error-500)`**; the app's error red used decoratively for a PDF reads as a failed
     attachment.
4. Deadline urgency: `deadlineLabel().urgency` promotes the closing date out of the tenth
   sidebar row into a chip beside the apply CTA when `soon` or `urgent`. A deadline three days
   out no longer looks identical to one three months out.
5. Social proof: `applications_count` and `favorites_count` render in `TYPE.micro` under the CTA
   ("42 applicants · 18 saved"). Both are on the payload and neither is surfaced today.
6. A sticky bottom apply bar below `md`, with `env(safe-area-inset-bottom)` padding.

**One apply CTA, one behaviour.** There are three CTAs and two behaviours today, and two of the
three record nothing. After this, **`ApplyCta` is a single component** rendered in the header
action, the sidebar card and the mobile bar, all bound to one `useApply(job)` hook.
- Internal: `router.push('/jobs-v2/{id}/apply')`. Its icon is `mdi:arrow-right`, **not**
  `ExternalLink` — it is a navigation that stays inside the app.
- External: **`window.open(job.apply_link, "_blank", "noopener")` FIRST, synchronously inside the
  click handler**, then `await applyForJob({external:true})`. The current order awaits the POST
  before opening, which leaves the user-gesture task and gets the popup blocked, stranding the
  learner in front of a "Did you apply?" dialog for a tab that never opened. If `window.open`
  returns `null` we render an inline "Your browser blocked the tab — open the application" link
  instead of raising the dialog.
- The sidebar "Apply for this position" card and the `/apply` route's "Open Application Link"
  both call the **same hook**. No `<a target="_blank">` that records nothing survives anywhere.
- Disabled states come from `getApplyDisabledLabel()` **plus a `disabledReason`** (4.1): "Not
  eligible" now names the criterion that failed (passout year, college, percentage) and links to
  the profile field that could fix it.

**"Did you apply?"** becomes a `JConfirm` with **three** answers, not two: **"Yes, I applied" /
"Not yet — remind me" / "No, I changed my mind."** The third calls the cancel path so the record
does not sit at `applying` forever; the second leaves it at `applying` *and* the Applied tab now
surfaces and can correct it (5.2.1). `onClose` maps to "Not yet", and the dialog says so.

**States**
- Loading gives `JobDetailSkeleton`. The `JobSearchIllustration`-in-grey-with-no-progress
  treatment — the same asset the board renders in indigo — is deleted.
- **Not found and error are separate branches.** A 404 gives `EmptyState` "This role is no
  longer listed" plus "Browse jobs". Any other failure gives `ErrorState` plus Retry. The
  `if (loading || !job)` conflation that turns every 500 into "Job not found — this job may have
  been removed" is deleted.
- Applied gives `StatusPill kind="application" value="applied"` plus a
  `JButton variant="secondary"` "View your application" pointing at `/jobs-v2/applications/{id}`.
- i18n: the file imports `useTranslation`. `jobsV2.applyOnExternalLink`, `notEligible`,
  `backToJobs` and `viewDetails` already exist in both `en` and `ar` and are now used.
- Card radii unify at `R.card` (they disagree 2.5 vs 2 inside one column today) and the two
  section-header washes at 6% and 8% of the same indigo become one token.

---

### 5.5 STUDENT — Apply route guards and interstitials
`app/jobs-v2/[id]/apply/page.tsx`

The five bare-text early returns become **one `ApplyGate` component with five typed variants**,
each a proper `EmptyState`/`ErrorState` inside the standard chrome (`PageShell` + `JobsScope` +
`ModulePageHeader` eyebrow `Apply`). The five inline copies of the
`MainLayout` + `Box minHeight` + `maxWidth:1100` + `py:8` wrapper collapse to one.

| Gate | Treatment |
|---|---|
| `has_applied` | `EmptyState`, icon `mdi:check-decagram`, "You already applied", body carrying the applied date and current status, **primary "View your application"** to `/jobs-v2/applications/{id}`, secondary "Back to job". No longer a dead end. |
| `apply_link` present | `EmptyState`, icon `mdi:open-in-new`, "This employer takes applications on their own site", body explaining that we will record it, **primary = the same `ApplyCta`** (records, then opens) — not a bare `<a>` that erases the learner's history. |
| `status !== "active"` | `EmptyState`, icon `mdi:lock-clock`, "Applications closed", body = the specific status sentence, secondary "Back to job" plus "Browse similar roles". |
| `eligible_to_apply === false` | `EmptyState`, icon `mdi:account-alert`, "You are not eligible for this role", body naming the failing criterion, **primary "Update your profile"** deep-linking the relevant field, secondary "Back to job". |
| not found | `EmptyState` "This role is no longer listed". A fetch *failure* is `ErrorState` plus Retry — a separate branch. |

The four buttons currently written as `<Button sx={{backgroundColor: var(--accent-indigo)}}` with
no `variant` and no `color` — MUI's default text-button label colour on a solid indigo fill, a
contrast problem repeated four times — are all `JButton` now.

**Double navigation** — `handleApply` pushes the route **or** the form calls `onCancel()`, never
both. `ApplyFlow` loses its `onCancel()`-after-success call; the route owns navigation.

**Success is a screen, not a toast.** After a successful submit the route renders `ApplySuccess`:
a `JCard accent="azure"` with a `mdi:check-decagram` tile, "Application sent", the reference
`#{id}` in tabular mono, a **"What happens next"** micro-rule bullet list, the resume that was
sent, and two actions — "Track your application" to `/jobs-v2/applications/{id}` and "Browse more
roles". The redundant refetch of a job the detail page fetched one click earlier is avoided by
passing the job through router state where available, with a fetch fallback.

---

### 5.6 STUDENT — Apply stepper
`components/jobs-v2/ApplyJobPage.tsx` becomes `components/jobs-v2/apply/ApplyFlow.tsx`

**Progress is stated once.** The header card's "Step 1 of 3 · Your Resume" line and the separate
`Stepper` card — together roughly 300px of chrome on a phone before the first form control —
collapse into one `JStepper` directly under the `ModulePageHeader`. On `md+` it is the horizontal
stepper; below `md` it is a progress bar plus one line of text. **Steps are clickable** for every
step already passed, so Review is not a one-way street reachable only by repeated Back presses.

**Step content** — one `JCard` per step; no `::before` gradient hairlines on form cards.
- **Step 0, Resume.** The two bare `<button>`s become a `JTabs size="sm"` segmented control with
  real `role="radiogroup"` / `aria-checked` and arrow-key support; its active fill is
  `J.azureSoft`, **never `var(--font-light)`**, which inverts or disappears under any tenant
  palette that is not white. "Saved resume" is a `JSelect` whose **empty state is visible without
  opening it**: when there is no saved resume the control is replaced by an inline `EmptyState`
  — "No saved resume" plus a **primary "Upload one now"** that switches to the upload tab, and a
  quiet "Manage resumes in your profile" link opening in a new tab so the flow is not abandoned.
  The current disabled `MenuItem` reading "No saved resumes. Upload one from Profile." is
  invisible until you open a dropdown that looks empty, and is not a link. "Upload new" is
  `JFileDrop` (4.6) — React-state drag styling, a Remove control, and a success border that can
  actually render.
- **Step 1, Questions.** `resolveQuestionControl` guarantees every question type renders a
  control, so a required question of an unknown type can no longer show a label, a red `*` and
  nothing to fill in while Next stays permanently disabled. Required questions carry
  `aria-required`, the `*`, **and** a form-level legend. Validation is field-level: the offending
  field turns `var(--j-st-closed-bd)`, its message renders below with `role="alert"`, and the
  first error is scrolled into view and focused. The toast-only "Please answer all required
  questions" is deleted.
- **Step 2, Review.** The indigo-to-purple gradient banner becomes a `SectionHeader` plus
  `JCard`. Unanswered **optional** questions render as "— not answered" instead of being
  silently omitted, so the recap does not misrepresent what is being sent. The resume card opens
  `ResumeViewerModal`.

**Footer** — one action bar, **`position: fixed` below `md`** and in-flow at `md+`.
`MainLayout` gives ancestors `overflow: auto`, which makes them the sticky containing block, so
the current `position: sticky` bar very likely does not pin at all; fixed plus
`env(safe-area-inset-bottom)` is deterministic. Order: **Back** and **Cancel** adjacent on the
leading edge, **Next / Apply** on the trailing edge — the two "go backwards" actions stop living
at opposite ends of the bar.
- `Next` when disabled always carries a `disabledReason` ("Select a resume to continue").
- `Cancel` raises a `JConfirm` when the form is dirty; today it discards every typed answer
  instantly with no warning.
- A `beforeunload` guard plus **draft autosave** to `sessionStorage` under
  `jobs-v2:apply:{id}` (answers and the resume choice, never the file bytes), restored with a
  "We restored your draft" notice and a "Start over" action.

**States** — `ApplyStepSkeleton` shaped like the stepper plus one card (the three grey 120/80/400
blocks go); the resume list sets a real loading flag and renders a skeleton `JSelect` instead of
an empty one that pops in; submitting uses `LoadingButton` semantics; success is owned by the
route (5.5).

**`components/jobs-v2/ApplyJobDialog.tsx` is DELETED** — 640 unreachable lines, zero importers,
already diverged from its twin in four ways (drop-zone padding, icon size, restored border
colour, preview mechanism), and its `<object data={blobUrl}>` PDF preview is a blank box on iOS
Safari. Applying is a route with a stepper; it is not also a single-scroll dialog.
**`components/jobs-v2/JobsV2PageHeader.tsx` is DELETED** — 44 lines, zero importers, a third
"Jobs" title with a fourth tagline.

---

### 5.7 STUDENT — route loading shells
`app/jobs-v2/loading.tsx`, plus **new** `app/jobs-v2/[id]/loading.tsx`,
`app/jobs-v2/[id]/apply/loading.tsx`, `app/jobs-v2/applications/[id]/loading.tsx`.

Each renders `MainLayout` plus a **module-shaped** skeleton from the kit: `HeroSkeleton` plus
the search rail plus `JobListSkeleton` for the board; hero plus two columns for the detail; hero
plus stepper plus one card for apply. `PageShimmerLayout variant="list"` is no longer used here —
its six generic avatar rows share no layout with the board and reflow the entire page on swap.
Because the in-component first-load skeleton is now the *same component*, the shimmer-to-content
transition is a crossfade rather than two unrelated loading designs in sequence.

---

### 5.8 ADMIN — Jobs list
`app/admin/jobs-v2/page.tsx`

**Layout**
1. `ModulePageHeader` eyebrow `Engagement`, title "Jobs", accent `azure`, icon
   `mdi:briefcase-search`. `action`: `ghost` "Scraped queue", `ghost` "Reports", `solid`
   "Create job". **All three destinations live in the header**, so the unbalanced
   `justifyContent: flex-end` toolbar holding a lone Reports button (separated from its two
   siblings up in the header) is deleted.
2. `HairlineStrip` — Total, Active, Draft, Closing this week, Applicants (30d). Cells are filter
   toggles, so the strip is also the status filter and supplies the result count the desktop
   view currently lacks entirely.
3. `Toolbar`: `SearchInput` (title / company / location) plus `FilterPopover` Status plus
   `FilterPopover` Visibility plus a sort `JSelect`. `ActiveFilters` below. The jobs list gains
   search and sort, so all three admin lists finally have the same three features.
4. `JDataTable` — columns: `[checkbox] · Job · Location · Status · Visibility · Courses ·
   Applicants · Created · Closes · kebab`.
   - **The Company column is deleted** — it duplicates the Job cell's own caption. The reclaimed
     120px goes to Location, which today has no column and is truncated inside that caption.
   - `Job` cell: `CompanyLogo 40`, title `TYPE.h4`, a `company` caption, and a "Scraped"
     `StatusPill size="sm"`. `getRowHref` points at `/admin/jobs-v2/{id}`, so rows are real
     links — keyboard reachable, middle-clickable, and visible to assistive tech.
   - `Status` is a `StatusSelect kind="job" dense` — visibly a control (chevron, hairline border,
     control height). `Visibility` is a `StatusPill kind="visibility"` — visibly not, with Draft
     dashed. **Status colours now separate** (2.1): active emerald, completed neutral ink,
     inactive amber, on_hold indigo, closed rose. No two greens 6% apart, and inactive is no
     longer the same hue as the brand accent, the Scraped chip and the applicants pill.
   - `Applicants` is a `CountPill` linking to the applications route.
   - `Closes` uses `deadlineLabel` with its urgency tint.
   - Sortable: Job, Status, Applicants, Created, Closes.
5. `BulkActionBar` with **two** actions — Change status, Change visibility — not one handler
   firing two sequential requests. Each carries a required `confirm` with `consequences` ("40
   jobs become visible to every student"). The partial-write-reported-as-total-failure bug dies
   because each action is one request reporting its own outcome (4.20).
6. `JPagination`.

**Single-row mutations no longer tear down the table.** `handleStatusChange` updates that row
optimistically (`updatingIds: Set<ID>`, so the row's control shows a spinner and **every other
row stays enabled**), then reconciles from the response; on failure it rolls back and shows an
inline row error. The `loadJobs()` with `setLoading(true)` after every single change — which
replaces the whole table with a centred spinner and loses scroll position — is deleted.

**Selection clears on filter, search and page change** via `useSelection`'s deps key. Bulk
actions can no longer mass-update ten people the admin can no longer see.

**States** — Loading gives `DataTableSkeleton`, and the route `loading.tsx` renders the *same*
skeleton, so there is one loading design instead of two back to back. Empty (no jobs) gives
`EmptyState` plus "Create job". **Empty (filtered) is a separate state**: "No jobs match these
filters" plus "Clear filters" — today the branch is purely `jobs.length === 0`, so filtering to
On Hold tells an admin they have never posted a job and invites them to create a duplicate.
Error gives `ErrorState` plus Retry; the catch sets `loadError` and never `setJobs([])`. The row
kebab and the delete `JConfirm` keep their current behaviour.

---

### 5.9 ADMIN — Job detail
`app/admin/jobs-v2/[id]/page.tsx`

1. `ModulePageHeader` eyebrow `Job`, title = the job title, accent `azure`,
   `children` = `CompanyLogo 56` plus `MetaRow onDark` plus read-only `StatusPill`s. `action` =
   `solid` "Applications (N)" plus `ghost` "Edit". The hand-rolled
   `linear-gradient(160deg, ...)` hero — the module's fourth header treatment — is deleted, and
   the hand-built breadcrumb of `<Button>`s separated by literal `/` `<Typography>`s becomes the
   standard breadcrumb strip.
2. **The live status Select moves out of the chip row** into a "Publishing" `JCard` in the right
   column, beside Visibility and the closing date — a `StatusSelect` with a real label, sitting
   among controls rather than disguised as a fourth read-only chip carrying a stray floating
   `InputLabel` that breaks the row's alignment.
3. `HairlineStrip` — Applicants, Shortlisted, Selected, Favourites, Days to close. This replaces
   the flex-wrap `InfoPill` row, and Location loses the forced `multiline` that currently gives
   the word "Remote" an entire full-width row above salary, openings and the deadline combined.
4. Body grid `1.2fr / 1fr` at `md+`:
   - Left: Description, Selection process, About company — three `JCard`s at one radius.
   - Right, **"Who can see this job"** (NEW) — the single most important missing card. It states
     the computed audience in one sentence and then lists **all four** targeting mechanisms:
     mapped courses, adaptive courses, individually assigned students (count and names), college
     mappings. `assigned_students` and adaptive targeting are invisible on this page today, so
     "who can see this job" is literally unanswerable from the screen that exists to answer it.
   - Then **"Eligibility"** — min 10th %, min 12th %, min graduation %, passout year, UG, PG,
     education. **All three percentages are collected by the create form and rendered nowhere**,
     so an admin cannot verify the gates they set without reopening the edit form.
   - Then Attached JD, External apply, Key skills.
   - The nested `1fr 1fr` grid of five one-line `SectionCard`s — each with a 36px icon badge and
     a bottom-bordered header, to hold the string "Engineering" — is replaced by **one**
     "Classification" `JCard` holding a definition list: Industry, Department, Role category,
     Education, Employment type.
5. **Skills render once.** The page concatenates `mandatory_skills` and `key_skills`, which the
   edit form makes identical (5.11), so every skill appears twice. The page de-duplicates
   case-folded **and** the form stops overwriting. Both halves of the bug are fixed.
6. Passout year appears **once**, in Eligibility — not once as a pill and again as a SectionCard.
7. Delete moves out of the primary action cluster into the kebab, and its `JConfirm` gains
   `consequences` naming the applicant count that will be affected.

**States** — Loading gives `JobDetailSkeleton`, and a `loading.tsx` is added for the route.
**Error gives `ErrorState` plus Retry in place**; the current toast-then-`router.push` back to
the list discards the admin's context and offers no retry. Not found is its own state.
**Incomplete job is a new state**: when description, process, company info and skills are all
empty, an inline `EmptyState` reads "This posting is missing its description" with a "Finish it"
action deep-linking the edit form at the right step — today a sparse job renders a hero, a pill
row and nothing else. Status change is optimistic on that control only; `loadJob()` with
`setLoading(true)`, which collapses the entire page back to skeletons after every flip, is
deleted.

**`components/admin/jobs-v2/JobDetailModal.tsx` is DELETED** — 502 unreferenced lines, a stale
second implementation of this page, and the source of the third and fourth `SectionCard`, the
second `InfoPill` and the fourth `formatDate`.

---

### 5.10 ADMIN — Create job / Edit job (routes)
`app/admin/jobs-v2/new/page.tsx`, `app/admin/jobs-v2/[id]/edit/page.tsx`

**Both routes render the header and nothing else of their own.** `ModulePageHeader` eyebrow
`Jobs`, title "Create job" / "Edit job", description = the job's identity on edit,
accent `azure`, `action` = "View applications" on edit. The stepper's own gradient hero is
deleted, which removes the stacked double header on `/edit` (quick-actions bar plus gradient
hero repeating the same logo, title, company and publish state).

**Create**
- **The course fetch no longer gates the form.** Courses are needed on step 4 only. The form
  mounts immediately; the Targeting pickers render a skeleton until
  `adminCoursesService.getCourses({limit:1000})` resolves, and an inline `ErrorState` with Retry
  if it fails. Today a naked "Loading..." spinner blocks typing a job title behind up to a
  thousand course records, and a course-fetch failure is swallowed (`catch { setCourses([]) }`)
  into a silently empty picker.
- **Hydration identity**: the reset effect keys on a **stable `initialKey` string**, not on
  object identity, so a late-arriving list can never reset `formData` and `activeStep` and wipe
  typed input.
- Scraped prefill: the banner stays, and **every prefilled field gets per-field provenance** — a
  12px `mdi:radar` marker beside the label with a tooltip "From {source}; review before
  publishing". `normalizeEmploymentType` and `matchCoursesByTitle` now **report what they
  dropped** in an inline notice ("2 suggested courses could not be matched: ...", "Employment
  type 'Full Time' was not recognised — pick one") instead of silently blanking a value.
- `<Suspense fallback>` renders `FormSkeleton`, not `null`; a hard load of
  `/admin/jobs-v2/new?scraped_job_id=...` currently paints a completely blank page.
- Post-create: **one** navigation. If `uploadJobJd` fails after `createJob` succeeded, the route
  navigates to the new job and shows a **warning** on the JD card — "The job was created; the JD
  upload failed" plus Retry upload. It never reports total failure for a partial success.

**Edit**
- The quick-actions bar is deleted; its content is the header.
- Saving returns to **the job detail page**, not the list, so a small correction does not eject
  the admin from the record they were working on.
- `useUnsavedChanges`: Back, Cancel, the breadcrumb and `beforeunload` all raise a `JConfirm`
  when dirty.
- A job at `on_hold` opens with `on_hold` selected, because `JOB_STATUS_ORDER` is exhaustive.
  Opening and saving an on-hold job can no longer silently reactivate it.
- Loading gives `FormSkeleton` shaped like the stepper (the current 120/80/400 blocks match
  neither the quick-actions bar nor the stepper). The existing good not-found state is kept and
  restyled. A course-fetch failure now surfaces instead of resolving into an empty picker.

---

### 5.11 ADMIN — Create/Edit stepper
`components/admin/jobs-v2/JobCreateEditPage.tsx` becomes
`components/admin/jobs-v2/form/JobForm.tsx` plus one file per step.

**The steps are renamed and re-partitioned**, because today "Basic Info" holds three eligibility
percentages, "Description & Skills" holds UG/PG requirements, and "Compensation & Location"
holds Job Type, Employment Type, Industry Type and Role Category — none of which are
compensation or location. Eligibility is scattered across three of the four steps while step 4
is called "Targeting".

| # | New step | Contents |
|---|---|---|
| 1 | **The role** | Job title, company name, company logo, apply link, location, job type, employment type, industry, role category, openings |
| 2 | **The description** | Description, JD upload, selection process, about company, skills |
| 3 | **Who can apply** | Experience, salary, education, department, UG, PG, passout year, min 10th / 12th / graduation % — **all eligibility in one place** |
| 4 | **Audience & publish** | Courses, adaptive courses, assigned students, colleges, application questions, publish status, job status, closing date |

**Validation becomes real.**
- Per-step validation with field-level errors (4.6), not one silent `disabled` gate on three
  fields with no error text, no red field state and no hint about which of the three is missing.
- Format validation: `company_logo` must parse as an `http(s)` URL **and** the preview must load;
  `apply_link` likewise; the three percentages are clamped 0-100 in `onChange`, not by advisory
  `inputProps` that let 500% save fine.
- The logo preview's `onError` no longer sets `style.display = "none"`, which leaves a dashed box
  captioned "Logo preview" and no way to tell a broken URL from a slow one. It renders an inline
  error: "That URL did not load an image", the URL, and Retry.
- Because a public logo URL is the hardest field on the form and currently blocks step 1
  entirely, it becomes **optional**: `CompanyLogo`'s initials fallback (4.17) is a good default,
  and the field carries the hint "Optional — we will use the company initial".

**`mandatory_skills` stops being overwritten.** `mandatory_skills: formData.key_skills ?? []` in
the submit payload is the root of the duplicated-skills bug on the detail page. The form exposes
**two** chip-bin editors — "Must-have skills" and "Nice-to-have skills" — mapped to
`mandatory_skills` and `key_skills`. If the product decides one list is enough, submit
`key_skills` and send `mandatory_skills: undefined`; **it may not send a copy.**

**Targeting states its audience.** A live `AudienceSummary` panel at the top of step 4 computes
and states one sentence — "Visible to every student in 3 courses, plus 12 named students, in 4
colleges", or "Visible to every student" — and lists the contributing mechanisms as micro-rule
bullets. The four per-picker captions that contradict each other ("Leave empty for all students"
under courses vs "Only these N student(s) will see this job" under assigned students, with
college mapping folded into neither) are deleted and replaced by that one sentence.
The email consequence — currently buried in a caption reading "Newly assigned students are
emailed once the job is published", two cards above a Publish Select with no confirmation step —
is promoted into the **publish `JConfirm`'s `consequences`** on save.

**Application questions.** The picker gains **search, a type filter and a "Selected only"
toggle**, and selected questions are **pinned to the top** — with 60 questions in a global bank
paginated 5 at a time, the only evidence of a selection today is an "N selected" chip.
Question cards become `JCard interactive` with `role="checkbox"`, `aria-checked`, `tabIndex` and
a key handler; they are clickable `<Box>`es today and unreachable by keyboard. The unselected
card's `bgcolor: var(--font-light)` is deleted. `order` is the question's index **within this
job's selection**, not `questionBank.length`.

**Footer** — `position: fixed` below `md`, in-flow at `md+` (same reasoning as 5.6:
`MainLayout`'s `overflow: auto` ancestors become the sticky containing block, so the Save/Next
bar very likely sits at the bottom of a roughly 2500px form rather than pinning). **Save is
available on every step** once the required fields pass, not only on step 4, so changing one
field does not cost four Next clicks. Cancel confirms when dirty.

**Autosave.** A local draft in `sessionStorage` under `jobs-v2:jobform:{id|new}`, written on a
1s debounce and restored with a visible "Draft restored" notice. Roughly 35 fields with no
autosave, no draft and no review step is the module's largest data-loss surface.

**States** — Loading is owned by the route (`FormSkeleton`). Submitting uses `LoadingButton`.
Validation is field-level plus a step-level `status:"error"` marker on `JStepper`. The
question-bank empty state is the existing good one, restyled. An adaptive-course fetch failure
gives an inline `ErrorState` with Retry instead of `.catch(() => {})` and a silently empty
picker. Dirty is guarded.

---

### 5.12 ADMIN — Applicant pipeline
`app/admin/jobs-v2/[id]/applications/page.tsx`

**The counts stop lying.** `statusCounts` is derived from `applications`, which is the
**server-filtered** response — so clicking "Shortlisted: 12" makes every other pill read 0
("Applied: 0", "Rejected: 0") and drops the headline to the filtered subset. Fix: hold an
unfiltered `countsRef` populated by a status-less fetch (or by the first unfiltered load) and
derive the strip from that. **The strip's numbers never depend on the active filter.**

**Layout**
1. `ModulePageHeader` eyebrow `Applicants`, title = the job title,
   description = company, location and openings, accent `azure`, `action` = `ghost` "View job"
   plus `ghost` "Export CSV". The hand-built breadcrumb of `<Button>`s separated by literal `/`
   `<Typography>`s — with the job title as a Button styled like a link but sized like a button —
   becomes the standard breadcrumb strip.
2. `HairlineStrip` from `APP_STATUS_ORDER` — six counts, each a filter toggle with
   `aria-pressed`. **The separate 140px "Status" `JSelect` is deleted**: two controls bound to
   one `statusFilter` that can appear to disagree is the toolbar's core problem. This takes the
   ten-control row that wraps to four or five lines on a laptop down to three controls.
3. `Toolbar`: `SearchInput`, a `FilterPopover` "Stage" (the pipeline fields, new), and a sort
   `JSelect`. `ActiveFilters` below.
4. `BulkActionBar` — **Change status, Advance stage, Reject with reason.** The last two are new
   and are the fix for "processing 200 applicants through four rounds means 200 open / edit /
   save modal cycles with a full table reload after each one". Each carries a required
   `JConfirm` with `consequences` naming the count; mass rejection can no longer be one click.
   `selectedIds` clears on filter and search change.
5. `JDataTable` — columns: `[checkbox] · Candidate · Stage · Status · College · Applied ·
   Resume · kebab`.
   - `Candidate`: `JAvatar 32`, name in `TYPE.h4`, email in `TYPE.mono` — monospace stays, but
     as a *token* used consistently rather than an ad-hoc choice appearing nowhere else.
   - **`Stage`** (new): a compact six-segment pipeline rail with the furthest stage reached
     labelled. The entire interview pipeline is invisible in the table today.
   - **`College`** (new): the desktop table currently shows six columns while the mobile card
     shows college, phone, batch, degree and location, so the surface a recruiter actually
     screens on carries less information than the phone. Every field on the card is now in the
     table or its row expansion.
   - `Resume`: a `JButton variant="ghost"` opening `ResumeUrlPreviewModal`.
   - Sorting via `TableSortLabel` with `aria-sort`.
   - **The `#` column is deleted.** It is `idx + 1` over the sorted and filtered array, so it
     renumbers on every sort and every search while looking like a stable applicant number.
6. `JPagination` reading the `count` the service returns and currently discards; the headline
   uses `count`, not `applications.length`.

**Candidate modal** becomes `JModal size="lg" dirty={isDirty} mobile="fullscreen"`.
- Header: `JAvatar 52`, name, `TYPE.mono` email, `StatusPill` — **not** a gradient band.
- Body: Status, Candidate info (definition grid), Skills/experience, **Pipeline** (Drive,
  Internal shortlisting, HR, Rounds 1-4, Offered laid out as a timeline of `JSelect`s rather
  than seven stacked Selects), Reason not shortlisted.
- **`dirty` guards backdrop and Esc.** Seven Selects and two text fields no longer vanish with
  no warning because `onClose={() => setDetailApp(null)}` fires on a stray click.
- **Opening the resume no longer closes the modal.** `ResumeUrlPreviewModal` opens *over* it as
  a nested overlay; focus moves and returns. Its hardcoded `#fafafa`, `#f1f5f9` and
  `rgba(0,0,0,0.08)` chrome becomes `J.surface2` / `J.surface3` / `J.hairline`.
- **Clearing `reason_not_shortlisted` works.** `?.trim() || undefined` drops an empty string
  from the PATCH body, so the old reason persists forever. When the field was touched and is now
  empty, send `""` explicitly.
- Prev/next candidate arrows inside the modal, so triage is not close, scroll, open, repeat.

**Export CSV honours the screen.** `downloadExportReport` receives the active status filter, the
search query and the sort; the confirm names what will be exported ("Exporting 12 shortlisted
applicants"). Today it passes only `job_id`, hands back every applicant, and toasts "CSV
exported successfully" — confirming the wrong thing.

**Single-row status change** is optimistic on that row only (5.8). The `loadApplications()` plus
`setLoading(true)` teardown after every triage action, which also re-runs the sort and loses
scroll position, is deleted.

**States** — Loading gives `DataTableSkeleton` matching the real column count rather than a
fixed five rows. Empty gives `EmptyState` with `ApplicationsIllustration`. Empty-filtered keeps
the existing good state ("No applications match your search" plus "Clear filters"). **Error
gives `ErrorState` plus Retry**; a failed load may never render "No applications yet". Export in
flight uses `LoadingButton`. Bulk reports an outcome summary (4.20). A `loading.tsx` is added.

---

### 5.13 ADMIN — Reports
`app/admin/jobs-v2/reports/page.tsx`

The screen is called "Job Reports" and contains **no reporting** — no counts, no funnel, no
conversion rates, no time-to-hire, no per-job totals. The jobs list's "Reports" button promises
analytics and delivers an export form. Two options; **take the second.**

1. Rename it "Export" and keep it an export form. Honest, cheap, and wrong: the admin still has
   nowhere to see numbers.
2. **Make it a report.** It already has every job and can already fetch applications per job.

**Layout**
1. `ModulePageHeader` eyebrow `Reports`, title "Job reports", accent `azure`,
   `action` = `solid` "Export CSV" opening the export `JModal`. The third hand-rolled hero — a
   light `linear-gradient(135deg, background, surface, border-default)` with a 160px
   illustration and an `h4` — is deleted.
2. `HairlineStrip` — Jobs posted, Live now, Total applicants, Shortlisted, Selected, Median days
   to first response. The numbers the page's name promises.
3. **Funnel** — a horizontal six-stage bar from `APP_STATUS_ORDER` with counts and
   stage-to-stage conversion, for the selected job or across all jobs. Built from
   `HairlineStrip` cells plus a proportional bar; **no chart library** (section 10).
4. **Per-job table** — `JDataTable`: Job, Status, Applicants, Shortlisted, Selected, Conversion,
   Closes, and a link to applications. Searchable, sortable, paginated. This replaces the 320px
   scroller of 12 full-width Buttons that ends in the dead caption "+N more jobs".
5. **Export `JModal`** — job (a searchable `Autocomplete`, not a flat unsearchable 200-item
   `Select` rendering `{title} - {company}`), status, **a date range** (new), a column checklist
   with a preview of the header row, and an estimated row count. Today the admin clicks a button
   and hopes.

**States** — Loading gives `HairlineStripSkeleton` plus `DataTableSkeleton`. Empty gives
`EmptyState` whose CTA is **"Create a job"**, not "Go to Jobs". **Error gives `ErrorState` plus
Retry**: the jobs fetch currently swallows failure entirely (`catch { setJobs([]) }`, no toast at
all), so an outage silently reads "0 jobs", an empty job Select and the empty panel.
`useSearchParams()` is wrapped in `<Suspense>` the way `new/page.tsx` deliberately does.
Exporting uses `LoadingButton` plus a result notice naming the file.

---

### 5.14 ADMIN — Scraped review queue
`app/admin/jobs-v2/scraped/page.tsx`

**This is the best-engineered screen in the module** — the `seqRef` stale-response guard, the
out-of-range page clamp that refetches without flashing an empty state, and selection explicitly
cleared on every query change. Its logic is preserved verbatim and its patterns are promoted
into the kit (`useSeq`, `useSelection`, `ErrorState`). What changes is presentation and four gaps.

1. `ModulePageHeader` eyebrow `Scraped jobs`, accent `azure`, icon `mdi:radar`,
   `action` = `ghost` "Back to jobs". Unchanged in kind.
2. `JTabs` with counts (Review / Imported / Dismissed / Irrelevant), and **each tab gains a
   one-line description under the header** stating what the state means — "Irrelevant" versus
   "Dismissed" is currently only explained by landing on the tab and reading its empty copy.
3. `Toolbar`: `SearchInput`, `FilterPopover` Source, and **a sort `JSelect` (new: Relevance,
   Seen, Company)**. There is no sorting today — not even by relevance, the column the entire
   triage decision hangs on.
4. `BulkActionBar` — Import as drafts, Dismiss. **Both** now carry a `JConfirm` with
   `consequences`; bulk import creates N real job records and currently has none while bulk
   dismiss does. The outcome summary (4.20) names each skipped job and its reason, replacing a
   toast that says "(M skipped)" with no list and no reason.
5. `JDataTable` — the same nine columns, restyled. `Relevance` renders the percentage in
   `TYPE.mono` over a 4px bar tinted from the `--j-rel-*` ramp, and **its tooltip always has
   text**: when `relevance_reason` is empty it reads "No reason recorded by the scorer" instead
   of MUI rendering no tooltip at all and leaving the score an unexplained number.
6. **A single-row "Import as draft"** joins the kebab beside "Review & import" and "Dismiss".
   Importing one job cleanly currently requires discovering that you can tick one checkbox and
   use the bulk bar.
7. **An in-app preview `JSheet`** (new) — a "Preview" kebab item showing the scraped
   description, skills, source and relevance reasoning, with "Import as draft", "Review &
   import" and "Open original" in its footer. Today the only way to read a posting before
   deciding is to leave the app entirely.
8. On the three non-Review tabs, the checkbox column's absence is explained by a one-line
   caption ("Bulk actions apply to the review queue"), not by silence.
9. **A mobile treatment.** This is the only admin list with no card branch: a nine-column table
   with roughly 940px of declared minimum widths, 0.7rem chips and a 4px relevance bar is pushed
   into horizontal scroll on a phone. `JDataTable`'s `mobile` render prop supplies the card list.

**States** — Loading gives `ScrapedTableSkeleton`; the clamped-page double fetch keeps `loading`
true across two requests and now says "Re-checking the last page..." so the longer wait is
explained. Error keeps its existing excellent state, moved to `ErrorState`. Empty keeps the
per-tab `TAB_EMPTY_STATES` copy, each now with an action. Acting keeps its per-row and per-bar
busy states.

---

### 5.15 ADMIN — Add question modal
`components/admin/jobs-v2/ApplicationQuestionsModal.tsx`

`JModal size="md" dirty={isDirty}`.
- A real `DialogTitle` and `DialogActions`. Both are hand-built `Box`es today, so the dialog has
  no accessible title association at all.
- Question text becomes a `JTextArea` with a live character count.
- Type becomes a `JRadioGroup` rendered as five cards with `role="radio"`, `aria-checked`,
  `tabIndex` and arrow-key navigation. They are clickable `<Box>`es today, so the type selector
  is entirely unreachable by keyboard. The unselected card's `bgcolor: var(--font-light)` — the
  literal white text token used as a surface — is deleted.
- **Switching type preserves typed options.** `handleTypeChange` currently resets `options` to
  four blanks for *both* `choice` and `multichoice`, so changing MCQ to Checkboxes after typing
  four options silently clears all four. Options are preserved whenever the new type also takes
  options.
- Options: `A.` / `B.` rows with per-row validation. Remove is enabled down to two **non-empty**
  options, so an admin who wants three real options can clear and rebuild instead of editing
  blanks.
- **A live preview** of the question exactly as the student's apply form will render it, using
  the same `resolveQuestionControl` (4.22). Same component, so preview and reality cannot drift.
- **"Save and add another"** beside "Save", so a five-question form is not five open/close cycles.
- Validation is field-level and live, not a generic submit-time strip reading "Add at least 2
  options" over four blank rows.
- A **warning notice** above the footer: "This question joins the shared question bank and will
  be visible on future jobs. It cannot be edited or deleted yet." That is true today, and an
  admin should know before a typo becomes permanent.
- `order` is the index within this job's selection, not `questionBank.length` (the size of the
  whole global bank).

### 5.16 ADMIN — Select students dialog
`components/admin/jobs-v2/SelectStudentsDialog.tsx`

`JModal size="md" mobile="fullscreen"`.
- **The subtitle is corrected.** It says "Only the students you pick will see this opening",
  which contradicts the Targeting step's "in addition to everyone enrolled in the selected
  courses" seconds later. The dialog now renders the **same `AudienceSummary`** sentence as step
  4 (5.11), computed by the same helper, so the two physically cannot disagree.
- `SearchInput` (debounced, shared). The duplicate load on open is fixed: the seeding effect is
  removed and the debounced effect fires once with a leading call, instead of two identical
  requests 350ms apart.
- Rows become `role="option"` inside a `role="listbox"`, focusable, Space/Enter to toggle, arrow
  keys to move. They are clickable `<Box>`es today with a Checkbox that is not independently
  focusable, so keyboard users cannot pick a student at all.
- **Select all on page**, a **total results count**, and a page-size `JSelect`. Curating 200
  students is currently ten pages of individual clicks with only `totalPages` to go on.
- Chips show the name with the email as a second line in `TYPE.micro`, not hidden in a `title`
  attribute — two students with the same display name are currently indistinguishable without
  hovering.
- **Already-assigned versus newly-added** are visually distinguished (a "New" pill), and the
  footer states "3 new students will be emailed when this job is published", matching the
  stepper's warning that has no counterpart here.
- `useSeq` guards paging; fast paging can currently render an older page.
- **Empty and error are separate.** `No students match ""` currently renders for an empty query,
  for a tenant with zero students, and after a failed load. Now: an empty query shows the first
  page; no matches shows `No students match "{q}"` plus Clear; a failure shows `ErrorState` plus
  Retry **inside** the dialog.
- Hover uses the module's azure tint like every other list (it is uniquely
  `color-mix(in srgb, var(--border-default) 30%, transparent)` today), and the four
  `var(--font-tertiary, #8b8b98)` hardcoded fallbacks that appear here and nowhere else are
  deleted.

### 5.17 Shared modals consumed by jobs
- **`ResumeViewerModal`** (`components/profile/ResumeViewerModal.tsx`) — **not edited**. Jobs
  passes it through unchanged; props and behaviour are untouched (section 10). Its framer-motion
  dialect is accepted for this sprint and listed as a follow-up.
- **`ResumeUrlPreviewModal`** (`components/admin/ResumeUrlPreviewModal.tsx`) — owned by Group 5,
  restyled to `J.*` tokens and wrapped in `JModal`. Props unchanged.
- **`ConfirmDialog`** (`components/common/ConfirmDialog.tsx`) — **not edited**. Jobs stops using
  it in favour of `JConfirm` (4.11), which fixes `onClose === onCancel` on destructive confirms
  (today a backdrop click or Esc silently means "No").
- **`ProfileLockBanner` / `ProfileLockCard`** — **not edited**. Jobs passes `preview` (5.1) and
  renders them inside `JobsScope` so they inherit the module's canvas. Their four raw hexes are
  a follow-up, out of scope.

### 5.18 Admin route loading shells and error boundaries
`app/admin/jobs-v2/loading.tsx` renders the **list's own** `HeroSkeleton` plus
`DataTableSkeleton`, not `PageShimmerLayout variant="list"` — whose ten avatar rows share no
layout with a dark hero and a nine-column table, and whose `rows={6}` prop actually renders ten
rows, an accidental prop/output mismatch.
**New `loading.tsx` for `[id]`, `[id]/edit`, `[id]/applications`, `new`, `reports`, `scraped`** —
six routes that currently leave the previous page frozen until the client bundle mounts.
**New `app/admin/jobs-v2/error.tsx` and `app/jobs-v2/error.tsx`** — there is no error boundary
anywhere under `app/admin/`; both render `ErrorState` with `reset()` wired to Retry.

---

## 6. INTERACTION + MOTION

**Easing.** One curve: `cubic-bezier(.16,1,.3,1)` — already `EASE_OUT_EXPO` in
`components/scorecard/shared/motion.ts` and already the marketing site's GSAP `expo.out`. Free
continuity; do not introduce a second curve.

**Durations.** micro 120ms (border/colour) · control 180ms · surface 220ms · overlay 300ms ·
entrance 650ms · gradient hairline 1200ms. Nothing else.

**Hover** — the border moves and the surface goes one rung up the ladder. No `translateY`, no
shadow bloom, no backdrop blur, on **any** table row or dense list. Student job *cards* may take
`translateY(-2px)` at 120ms; table rows and admin cards may not.

**Press** — `transform: scale(.98)` on buttons only, 120ms, with
`WebkitTapHighlightColor: transparent`.

**Focus-visible** — `var(--j-focus-ring)`: `0 0 0 2px <canvas>, 0 0 0 4px #7c3aed`. Identical on
every control in the module. The 2px canvas-coloured buffer means zero layout shift and
legibility on any surface. On dark panels, `--j-focus-ring-on-dark`. **Never** `outline: none`
without a replacement.

**Entrances.** `Reveal` and `fadeRise` from `components/scorecard/shared` — the existing
components, not new ones. Budget per page: **one** masked-line reveal (the hero headline only),
`gridStagger` (0.06) for one card grid, `fadeRise` for sections, `CountUp` for the hairline strip
numbers, and `j-grad-hairline` on strip cells and accented panels. **Nothing animates on a filter
change, a sort, or a pagination step** — those are data updates, not entrances.

**Skeleton strategy.**
1. A route `loading.tsx` renders the **same** skeleton component the client mounts with, so the
   shimmer-to-content transition is a crossfade and never a relayout.
2. First load gives a skeleton. **A refetch (filter, sort, page) keeps the existing content
   mounted at `opacity: .55`, `pointerEvents: none`, `aria-busy="true"`.** Lists must never
   blank out on a keystroke.
3. Skeletons are content-shaped. No spinner is ever a page or panel loading state; spinners live
   only inside a control already on screen.
4. Every skeleton wrapper carries `aria-busy="true"`, `aria-live="polite"` and an `sr-only` label.

**Toasts.** `useToast` stays, with a narrowed remit:
- **Allowed:** a transient confirmation of a completed action whose result is already visible
  (favourite added, CSV started, question created).
- **Forbidden:** as the *only* report of a failure (that is `ErrorState` or a field error); as
  the only report of a bulk outcome (that is the outcome summary, 4.20); and as validation
  feedback (that is a field error, 4.6).
- One toast per user action, maximum. Never a toast plus a redirect as the entire success state.

**Optimistic updates.** Single-row status, visibility and favourite mutations update locally,
mark **only that row** busy, and reconcile or roll back with an inline row error. No full-list
reload after a single-row change, anywhere in the module.

**Reduced motion.** The scope-level guard in 2.1, plus `useReducedMotion()` in `Reveal` (already
honoured), plus `j-grad-hairline` resolving to its end state. No entrance may be the only way a
user learns that something appeared.

---

## 7. RESPONSIVE

Breakpoints are MUI's: `xs 0 · sm 600 · md 900 · lg 1200 · xl 1536`.

### 7.1 The `useMediaQuery` rule
`useMediaQuery` returns `false` on the server, which is why the admin tables flash the desktop
layout on a phone and both steppers snap orientation on hydration. **Layout forks are CSS, not
JS.** `JDataTable` renders both the table and the mobile card list and hides one with
`display: {xs:"none", md:"block"}` / `{xs:"block", md:"none"}`. `JStepper` does the same.
`useMediaQuery` survives only for behaviour that cannot be expressed in CSS (which modal variant
to mount, for example), and then only below the fold.

### 7.2 Tables to cards
Below `md` every `JDataTable` renders its `mobile(row)` card list. The rule that matters: **the
card must never carry less information than the table.** Card layout: `JCard interactive` at
`p: 2`; avatar plus primary plus secondary on line 1; `MetaRow` on line 2; status and stage on
line 3; actions on line 4 at 44px. Selection is a 44px checkbox in the card's top-trailing
corner, with a "Select all (N)" bar above the list.

### 7.3 Student board
- `xs`-`sm`: header, tabs, full-width `SearchInput`, `FilterBar` as a horizontally scrolling row
  of popover pills (**not** an always-expanded block — the current sticky header stacks the
  search bar into four full-width rows of roughly 200px and the open filter block adds another
  140px, so the first job card is below the fold), `ActiveFilters`, single-column cards.
- `md`: two-column card grid, filter row inline.
- `lg+`: two-column grid at `maxWidth: 1280`, filter row inline. **There is no filter sidebar at
  any breakpoint.**

### 7.4 Student job detail
Single column below `md`; `1fr / 340px` at `md+` with a sticky right rail; a sticky bottom apply
bar below `md`. **The 900-1200px dead zone is gone**, because the grid split and the mobile bar
both switch at `md` rather than at `lg` and `md` respectively.

### 7.5 Apply stepper
- `xs`-`sm`: a progress bar plus "Step 2 of 3 · Questions"; one card; a **fixed** bottom action
  bar with safe-area padding; 44px controls; a 120px drop zone, not 200px.
- `md+`: a horizontal clickable stepper; the card at `maxWidth: 820`, centred.

### 7.6 Admin create/edit stepper
- `xs`-`sm`: a progress bar — **never** the vertical MUI stepper, which consumes roughly 200px
  above the form on every step, under an already tall hero; one section per screen; a fixed
  bottom bar; the Targeting pickers become full-screen `JSheet`s.
- `md`: horizontal stepper, single column, `maxWidth: 860`.
- `lg+`: horizontal stepper, and steps 1 and 3 use a two-column field grid at `gap: 2.5`.

### 7.7 Admin lists
- Jobs list: table at `md+`, cards below. Columns drop by priority via `hideBelow` — Courses
  (`lg`), Created (`lg`), Visibility (`md`).
- Applications: table at `md+`, cards below; the pipeline rail collapses to "Round 2 of 4".
- Scraped: table at `md+`, cards below (**new**); Skills and Seen hide below `lg`.

### 7.8 Modals
Every `JModal` becomes a bottom `JSheet` below `md` (`maxHeight: 92dvh`, rounded top corners, a
sticky footer inside the sheet). Form modals (`mobile="fullscreen"`) go full screen so a
keyboard does not crush them. Use `100dvh`, never `100vh`. `overscroll-behavior: contain` on the
scroll region.

### 7.9 Touch
Every interactive target is at least 44x44, including pagination (`siblingCount={1}`, never
`size="small"` — today it is roughly 28px and renders "1 ... 7 ... 20"), the inline status
selects (currently 28px on mobile), and the table checkboxes.

---

## 8. ACCESSIBILITY

**Contrast targets.** Body and label text at least 4.5:1; large text (19px+/700) and non-text UI
boundaries at least 3:1. Verified failures being fixed: `--warning-500` (#f59e0b) as chip text on
a 14% tint of itself; cyan on white anywhere; MUI's default text-button label on a solid indigo
fill (four occurrences on the apply interstitials); `var(--font-primary)` on the hardcoded slate
hero. Every `Tone` in 2.2 is chosen to clear 4.5:1 against its own `bg`.

**Focus.** `var(--j-focus-ring)` on every interactive element, including table rows, cards,
chips, strip cells and sheet handles. Focus order follows DOM order. Focus is never removed
without a replacement. On dark panels, the on-dark ring.

**Modals and sheets.** Focus trapped; initial focus on the first interactive element (or the
heading when the body is long); `Esc` closes unless `dirty`; focus returns to the invoker;
`aria-labelledby` and `aria-describedby` wired to real nodes; the background is `aria-hidden`
(MUI handles this — do not hand-roll it). Nested overlays (resume over candidate modal) stack
focus and restore in reverse.

**Steppers.** The step list is a `<nav aria-label="Application steps">` of buttons with
`aria-current="step"` on the active one; arrow keys move between enabled steps; the panel is
`aria-labelledby` the active step. Progress is announced through a polite live region on change
("Step 2 of 4, Questions"). Every step is reachable by keyboard alone, and Save is reachable
without traversing all four steps.

**Tables.** Real `<table>` semantics via MUI `Table`. A visually-hidden `<caption>`.
`<th scope="col">` headers. Sortable headers use `TableSortLabel` with `aria-sort` on the `<th>`
— today they are `TableCell onClick` with a lucide chevron, so there is no `aria-sort` and no
keyboard sort. Row navigation is a real `<Link>` in the primary cell (`getRowHref`), never an
`onClick` on `<TableRow>` with `cursor: pointer` and no link semantics.

**Bulk selection.** The header checkbox carries `aria-label="Select all N rows"` and
`indeterminate`; row checkboxes carry `aria-label="Select {row title}"`; a polite live region
announces "12 of 137 selected" on change; shift-click gives range selection; the bulk bar is
`role="region" aria-label="Bulk actions"` and receives focus when it appears.

**Tabs.** `role="tablist"` / `role="tab"` / `role="tabpanel"` fully wired with `aria-controls`,
`aria-labelledby`, roving `tabIndex` and Home/End/Arrow keys. The current tab panels have none of
this.

**Forms.** Every control has a real `<label htmlFor>`. Required fields carry `aria-required` and
a form-level legend, not just a bare red `*`. Errors use `aria-invalid` plus `aria-describedby`
plus `role="alert"`, and the first error is focused on submit. Radio and checkbox sets are
`<fieldset>` plus `<legend>` (visually hidden where the label serves).

**Loading and live regions.** Skeleton wrappers carry `aria-busy`, `aria-live="polite"` and an
`sr-only` label. `ErrorState` is `role="alert"`. Toasts are polite live regions and are never
the only announcement of a failure.

**Images and icons.** `CompanyLogo` is decorative (`alt=""`) with the name as adjacent text.
Illustrations are `aria-hidden`. Icon-only buttons always carry `aria-label`.

**Keyboard paths that must be verified before merge** (add to `TESTING.md`): board to filter to
card to detail to apply to stepper to submit to success; admin list to row to detail to edit to
step 4 to question modal to save; applications to row to candidate modal to resume and back to
save; scraped to tab to row to preview sheet to import.

**RTL.** Every uppercase or tracked style spreads `rtlLabel`. Logical properties throughout
(`insetInlineEnd`, `marginInlineStart`, `borderInlineStart`) — no `left` / `right`. The
`j-grad-hairline` origin flips (2.1). Dates and numbers are locale-formatted.

**i18n.** Every user-visible string goes through `t()`. `jobsV2.*` keys already exist in
`locales/en/common.json` and `locales/ar/common.json` for `noJobsFound`, `tryAdjustFilters`,
`apply`, `applyOnExternalLink`, `notEligible`, `viewDetails` and `backToJobs`, and are currently
used **zero** times. Group 1 adds the missing keys (status labels, empty and error copy, stepper
labels, bulk consequences) to both bundles; no group may ship a hardcoded English string.

---

## 9. IMPLEMENTATION GROUPS

Five groups with **non-overlapping file sets**. Group 1 lands first and everyone depends on it;
Groups 2-5 then run fully in parallel.

> **Coordination rule:** if you need a change in another group's file, you do not make it. You
> append a note to `docs/jobs-v2-redesign-notes.md` (append-only, one section per group) and the
> owning group makes it. The only files touched by more than one group are the two shared ones in
> Group 1 (`ModulePageHeader.tsx`'s `ACCENTS` map and the appended `globals.css` block), and
> Group 1 lands both before anyone else starts.

### Group 1 — Shared kit, tokens, shared logic *(blocking; land first)*
```
app/globals.css                                     (APPEND the .jobs-scope block only)
components/common/ModulePageHeader.tsx              (ADD the `azure` ACCENTS entry — 1 line)
components/jobs-v2/ui/index.ts
components/jobs-v2/ui/jobsTokens.ts
components/jobs-v2/ui/JobsScope.tsx
components/jobs-v2/ui/JButton.tsx
components/jobs-v2/ui/Chips.tsx                     (StatusPill, MetaChip, SkillChip, CountPill)
components/jobs-v2/ui/Surfaces.tsx                  (JCard, JPanel, HairlineStrip, cardInteraction)
components/jobs-v2/ui/SectionHeader.tsx
components/jobs-v2/ui/Field.tsx                     (JField, JTextField, JSelect, StatusSelect,
                                                     JTextArea, JRadioGroup, JCheckGroup,
                                                     JDatePicker, JFileDrop, JSwitch)
components/jobs-v2/ui/EmptyState.tsx
components/jobs-v2/ui/ErrorState.tsx
components/jobs-v2/ui/Skeletons.tsx
components/jobs-v2/ui/JDataTable.tsx
components/jobs-v2/ui/JModal.tsx                    (JModal, JSheet, JConfirm)
components/jobs-v2/ui/JStepper.tsx
components/jobs-v2/ui/JTabs.tsx
components/jobs-v2/ui/SearchInput.tsx
components/jobs-v2/ui/FilterBar.tsx                 (FilterBar, FilterPopover, ActiveFilters)
components/jobs-v2/ui/JPagination.tsx
components/jobs-v2/ui/CompanyLogo.tsx               (CompanyLogo, JAvatar)
components/jobs-v2/ui/MetaRow.tsx
components/jobs-v2/ui/Toolbar.tsx                   (Toolbar, BulkActionBar)
components/jobs-v2/illustrations/*.tsx              (normalise to one language; add `tone` prop)
lib/jobs-v2/format.ts
lib/jobs-v2/status.ts
lib/jobs-v2/questions.ts
lib/jobs-v2/useJobsUrlState.ts
lib/jobs-v2/useSelection.ts
lib/jobs-v2/useSeq.ts
locales/en/common.json                              (jobsV2.* additions)
locales/ar/common.json                              (jobsV2.* additions)
eslint.config.mjs                                   (no-restricted-syntax: ban raw hex and
                                                     var(--font-light)-as-background in
                                                     components/jobs-v2/** and
                                                     components/admin/jobs-v2/**)
docs/jobs-v2-redesign-notes.md                      (create, empty, append-only)
```
**Definition of done:** every component renders in isolation at light and
`data-jobs-theme="dark"`; every one is keyboard-complete; the `Record<...>` status maps are
exhaustive; the ESLint rule fails a build on a raw hex in either jobs tree.

### Group 2 — Student board (Browse, Applied, Saved)
```
app/jobs-v2/page.tsx                                (ONE render tree; delete the desktop/mobile fork)
app/jobs-v2/loading.tsx
components/jobs-v2/board/JobBoard.tsx
components/jobs-v2/board/BoardFilters.tsx
components/jobs-v2/board/JobCardV2.tsx              (moved from components/jobs-v2/JobCardV2.tsx)
components/jobs-v2/board/JobRowV2.tsx               (extracted from app/jobs-v2/page.tsx)
components/jobs-v2/board/AppliedPanel.tsx           (replaces components/jobs-v2/AppliedJobsSection.tsx)
components/jobs-v2/board/PlacementBanner.tsx
components/jobs-v2/board/useJobFilters.ts
components/jobs-v2/JobCardV2.tsx                    (DELETE after the move)
components/jobs-v2/AppliedJobsSection.tsx           (DELETE after the move)
components/jobs-v2/JobsV2PageHeader.tsx             (DELETE — dead code)
lib/guide/registry.ts                               (the /jobs-v2 entry's `jobs-filters` copy only)
```
**Does not touch** `components/jobs/*` — jobs-v2 stops importing them; they stay on disk for the
orphan `/jobs` route and its Playwright spec, which continue to work unchanged.

### Group 3 — Student job detail, apply flow, application detail
```
app/jobs-v2/[id]/page.tsx
app/jobs-v2/[id]/loading.tsx                        (new)
app/jobs-v2/[id]/apply/page.tsx
app/jobs-v2/[id]/apply/loading.tsx                  (new)
app/jobs-v2/applications/[id]/page.tsx              (new route)
app/jobs-v2/applications/[id]/loading.tsx           (new)
app/jobs-v2/error.tsx                               (new)
components/jobs-v2/detail/JobDetailView.tsx
components/jobs-v2/detail/ApplyCta.tsx              (the ONE apply behaviour)
components/jobs-v2/detail/useApply.ts
components/jobs-v2/detail/JobDetailsPanel.tsx
components/jobs-v2/apply/ApplyFlow.tsx              (replaces components/jobs-v2/ApplyJobPage.tsx)
components/jobs-v2/apply/StepResume.tsx
components/jobs-v2/apply/StepQuestions.tsx
components/jobs-v2/apply/StepReview.tsx
components/jobs-v2/apply/ApplyGate.tsx              (the five interstitials, one component)
components/jobs-v2/apply/ApplySuccess.tsx
components/jobs-v2/application/ApplicationTimeline.tsx
components/jobs-v2/ApplyJobPage.tsx                 (DELETE after the move)
components/jobs-v2/ApplyJobDialog.tsx               (DELETE — 640 lines, dead code)
```

### Group 4 — Admin list, scraped queue, reports
```
app/admin/jobs-v2/page.tsx
app/admin/jobs-v2/loading.tsx
app/admin/jobs-v2/error.tsx                         (new)
app/admin/jobs-v2/scraped/page.tsx
app/admin/jobs-v2/scraped/loading.tsx               (new)
app/admin/jobs-v2/reports/page.tsx
app/admin/jobs-v2/reports/loading.tsx               (new)
components/admin/jobs-v2/list/JobsTable.tsx
components/admin/jobs-v2/list/JobsToolbar.tsx
components/admin/jobs-v2/list/JobsBulkActions.tsx
components/admin/jobs-v2/scraped/ScrapedTable.tsx
components/admin/jobs-v2/scraped/ScrapedPreviewSheet.tsx   (new)
components/admin/jobs-v2/reports/ReportFunnel.tsx          (new)
components/admin/jobs-v2/reports/ReportJobsTable.tsx       (new)
components/admin/jobs-v2/reports/ExportModal.tsx           (new)
```
**Preserve verbatim:** the scraped queue's `seqRef` guard, its page clamping, and its
selection-clear-on-query-change (they become `useSeq` / `useSelection` calls with identical
semantics).

### Group 5 — Admin detail, create/edit form, applications pipeline, admin modals
```
app/admin/jobs-v2/[id]/page.tsx
app/admin/jobs-v2/[id]/loading.tsx                  (new)
app/admin/jobs-v2/[id]/edit/page.tsx
app/admin/jobs-v2/[id]/edit/loading.tsx             (new)
app/admin/jobs-v2/new/page.tsx
app/admin/jobs-v2/new/loading.tsx                   (new)
app/admin/jobs-v2/[id]/applications/page.tsx
app/admin/jobs-v2/[id]/applications/loading.tsx     (new)
components/admin/jobs-v2/detail/JobDetailView.tsx
components/admin/jobs-v2/detail/AudiencePanel.tsx          (new — "who can see this job")
components/admin/jobs-v2/detail/EligibilityPanel.tsx       (new)
components/admin/jobs-v2/form/JobForm.tsx                  (replaces JobCreateEditPage.tsx)
components/admin/jobs-v2/form/steps/StepRole.tsx
components/admin/jobs-v2/form/steps/StepDescription.tsx
components/admin/jobs-v2/form/steps/StepEligibility.tsx
components/admin/jobs-v2/form/steps/StepAudience.tsx
components/admin/jobs-v2/form/AudienceSummary.tsx          (shared by the step and the dialog)
components/admin/jobs-v2/form/useJobForm.ts
components/admin/jobs-v2/form/useUnsavedChanges.ts
components/admin/jobs-v2/applications/ApplicationsTable.tsx
components/admin/jobs-v2/applications/CandidateModal.tsx
components/admin/jobs-v2/applications/PipelineRail.tsx
components/admin/jobs-v2/ApplicationQuestionsModal.tsx
components/admin/jobs-v2/SelectStudentsDialog.tsx
components/admin/ResumeUrlPreviewModal.tsx
components/admin/jobs-v2/JobCreateEditPage.tsx             (DELETE after the move)
components/admin/jobs-v2/JobDetailModal.tsx                (DELETE — 502 lines, dead code)
```

### Files no group may touch
`components/common/PageShell.tsx` · `components/layout/MainLayout.tsx` ·
`components/common/ConfirmDialog.tsx` · `components/common/Toast.tsx` ·
`components/common/LoadingButton.tsx` · `components/common/IconWrapper.tsx` ·
`components/common/PageShimmer.tsx` · `components/common/ProfileLock.tsx` ·
`components/common/list/ViewToggle.tsx` · `components/profile/ResumeViewerModal.tsx` ·
`components/scorecard/shared/*` · `lib/theme/**` · `lib/theme.ts` ·
`components/providers/ThemeProvider.tsx` · `lib/services/**` · `components/jobs/**` ·
`app/jobs/**` · the `:root` block in `app/globals.css`.

---

## 10. NON-NEGOTIABLES

1. **MUI stays. No Tailwind in this app.** Every component is MUI plus Emotion `sx`. The
   marketing site's Tailwind classes are translated into `sx`, never imported. No `@apply`, no
   utility classes, no `tailwind.config` for this module.
2. **Colour goes through CSS custom properties**, scoped under `.jobs-scope`, plus the
   `jobsTokens.ts` constants that reference them. **No raw hex in any jobs component `sx`**
   (ESLint-enforced by Group 1). `:root` is never edited. `normalizeThemeSettings.ts`,
   `FIXED_MIDNIGHT_HYPER`, `applyDocumentTheme.ts` and `ALLOWED_THEME_KEYS` are never touched —
   that chain is the single chokepoint for SSR, client, MUI and the sidebar across every tenant.
3. **Dark works.** Every token has a dark value (2.1) and no component may hardcode a colour, so
   a dark canvas is a one-attribute flip (`data-jobs-theme="dark"`) with **zero component
   edits**. The on-dark tokens are exercised today by the hero and every dark panel, so this is
   not speculative. We do **not** switch jobs to dark alone while the sidebar, app bar and 36
   other modules are light — the `prefers-color-scheme` block is deliberately left empty until a
   platform dark mode lands, and enabling it is then a copy-paste of one block. `ThemeModeProvider`
   stays dead and untouched; we introduce no competing global mechanism, no `<html data-theme>`,
   and no pre-paint script that would race `ClientThemeSync`.
4. **No new heavy dependencies.** framer-motion, MUI, Iconify, lucide and react-i18next only.
   **No GSAP, no ScrollTrigger, no Lenis, no chart library, no virtualization library, no date
   library, no form library.** Virtualization (the skills list) is a windowed slice; the funnel
   is flex boxes; dates go through `Intl` in `lib/jobs-v2/format.ts`. Icons converge on
   **Iconify via `IconWrapper`** (SSR-safe); lucide imports inside jobs files are replaced, not
   added to. No new webfont: Satoshi only.
5. **API contracts and data flow unchanged.** No service signature changes, no new endpoints, no
   payload shape changes. `lib/services/jobs-v2.service.ts`, `admin-jobs-v2.service.ts` and
   `admin-scraped-jobs.service.ts` are read-only for this work. Where the UI needs something the
   API lacks — server pagination on the board and the applications list, a `search` param, a
   withdraw path — the component accepts it behind a flag and **labels honestly what it can
   currently show**; it does not fabricate a total or silently truncate.
6. **No behaviour regressions.** Explicitly preserved, and each re-verified before merge: profile
   lock (`useModuleLocked("jobs")` giving a 403 giving the banner plus locked card, now with a
   preview); admin mode (`useAdminMode()` hiding the favourite control); feature gating and
   permissions on every admin route; the favourite optimistic-toggle-with-rollback; the
   external-apply `applyForJob({external:true})` to confirm to `confirmApplied` sequence (order
   corrected, calls unchanged); every existing handler name and service call site; the scraped
   queue's stale-response and page-clamp logic; and the orphan `/jobs` route with
   `e2e/jobs/jobs.spec.ts`, which must still pass untouched.
7. **The shell contract holds.** Every jobs route is `PageShell` (or `MainLayout` where
   `PageShell` is wrong) then `JobsScope` then `ModulePageHeader` then content. `MainLayout`
   already supplies page padding and the app-bar spacer, so no jobs page adds page padding or a
   `100vh` minimum. Every route segment has a `loading.tsx`.
8. **Every data surface ships four states.** Loading (a content-shaped skeleton),
   empty-because-nothing-exists, empty-because-nothing-matches (with a reset action), and error
   (with Retry). **A `catch` that sets an empty array is a review blocker.** This is the single
   most important rule in this document.
9. **The kit is the only source of primitives.** No screen defines a card, pill, date formatter,
   status map, modal shell, empty state or skeleton locally. Four `SectionCard`s, four
   `formatDate`s and three status maps are what this redesign exists to end.
10. **Accent budget three per surface; weights 400/500/700/800; radii pill/32/18/12/8; one
    easing; six durations.** Anything outside those ladders is a bug, not a decision.

---

## Appendix A — Deletions

| File | Lines | Reason |
|---|---|---|
| `components/jobs-v2/ApplyJobDialog.tsx` | 640 | Zero importers. A diverged twin of `ApplyJobPage`. |
| `components/jobs-v2/JobsV2PageHeader.tsx` | 44 | Zero importers. A third "Jobs" title, a fourth tagline. |
| `components/admin/jobs-v2/JobDetailModal.tsx` | 502 | Zero importers. A stale second job detail page. |
| The desktop/mobile fork in `app/jobs-v2/page.tsx` | ~300 | Duplicated and already drifted. |
| Four `SectionCard` definitions, two `InfoPill`s, four `formatDate`s, three status maps, three bulk bars | ~400 | Replaced by the kit. |

Roughly **1,900 lines deleted** before a line of new UI is written.

## Appendix B — Follow-ups explicitly out of scope
Retiring the orphan `/jobs` route and its five legacy components, and moving
`e2e/jobs/jobs.spec.ts` onto `/jobs-v2` (which today has **zero** e2e coverage) ·
`ProfileLock`'s four raw hexes · `ViewToggle`'s undefined `--hover-bg` ·
`ResumeViewerModal`'s framer-motion dialect · server-side pagination and search on the board and
the applications list · a withdraw-application endpoint · question editing and deletion in the
global bank · a scroll-condensing app bar · a platform-wide dark mode.
