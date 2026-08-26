# Certificates UI — the design language to build to

**Status:** authoritative reference for the certificates rework.
**Branch:** `feat/certificates-ui-consistency`.
**Why this exists:** the certificates module was authored without studying the app's
existing visual language. The user's feedback, verbatim: *"ui should be as same as how it
is in dashboard and platform ui so make it like that whole whole thing you shipped."*

This document is the source. A rework agent should be able to work from it alone.

---

## 0. The one-paragraph summary

The platform's visual language is **literal hex values written directly into `sx`**, not
MUI theme lookups. Slate ink ramp (`#0f172a` / `#475569` / `#64748b` / `#94a3b8`), white
cards on a `#e4e7f0` hairline with a two-stop shadow, `borderRadius: 4`, violet→purple and
violet→pink gradients, and a dark violet hero. The certificates module instead went
through `useTheme()` / `alpha()` / `theme.palette.warning` / MUI `variant="contained"`,
which resolves to colours that **exist nowhere else in the product** (see §1.6). It also
chose **amber** as the certificate accent when the platform already had a certificate
identity — **violet** — shipped in `components/dashboard/v2/CertificatePanel.tsx`.

The fix is mechanical, not creative: replace theme lookups with the literal tokens below,
replace bespoke cards with `PanelCard` / `SectionHeader` / `StatBox`, and swap amber for
violet everywhere except the artwork.

---

## 1. THE TOKENS

Every value below is copied from shipped code. Cite the source when in doubt.

### 1.1 Ink ramp (text)

| Token | Value | Use | Source |
|---|---|---|---|
| ink | `#0f172a` | Titles, card headings, big numbers, primary rows | `parts.tsx:86`, `:104`, `profileTokens.ts:23` |
| inkMuted | `#475569` | Secondary values in a row (leaderboard score) | `LeaderboardPanel.tsx:45`, `profileTokens.ts:24` |
| inkFaint | `#64748b` | Subtitles, section subcopy, StatBox labels | `parts.tsx:87`, `:106`, `profileTokens.ts:25` |
| inkDim | `#94a3b8` | Tertiary meta ("42% done"), disabled band text | `parts.tsx:95`, `CertificatePanel.tsx:34` |

**Never** use `theme.palette.text.primary/secondary/disabled` on these surfaces.
`text.disabled` is MUI's untouched `rgba(0,0,0,0.38)` and is not part of this ramp.

### 1.2 Surfaces & borders

| Token | Value | Use | Source |
|---|---|---|---|
| surface | `#ffffff` | Every white card | `parts.tsx:65` |
| canvas | `#fbfbfd` | Page canvas (profile dialect) | `profileTokens.ts:27` |
| hairline | `#e4e7f0` | **PanelCard border** | `parts.tsx:64` |
| hairlineSoft | `#eef2f7` | Inner tiles, list rows, progress tracks | `parts.tsx:100`, `:141`, `CertificatePanel.tsx:32` |
| hairlineHover | `#cbd5e1` | Row border on hover | `UpNextPanel.tsx:42` |
| violetSoft | `#f5f3ff` | "you"-row tint, soft violet chip bg | `LeaderboardPanel.tsx:38` |
| violetBorder | `#ede9fe` | Border on a violet-tinted row | `LeaderboardPanel.tsx:38` |
| chipNeutral | `#f1f5f9` | Neutral pill background | `UpNextPanel.tsx:49` |

**Never** use `theme.palette.divider` (untouched MUI `rgba(0,0,0,0.12)`) or
`theme.palette.background.paper` (tenant-overridable) for app chrome.

### 1.3 Accent hexes

| Name | Value | Where it appears |
|---|---|---|
| violet | `#7c3aed` | The product's primary accent. Certificate identity. `StatBox` default accent. |
| violetLight | `#a855f7` | Gradient partner, hero glow |
| indigo | `#6366f1` | `SectionHeader` tile gradient start |
| pink | `#ec4899` | CTA gradient end |
| pinkDeep | `#db2777` | Solid-button gradient end (`DashboardV2.tsx:70`) |
| amber | `#f59e0b` | Momentum stat, `week_final` up-next kind, rank-1 medal. **Not the certificate colour.** |
| red | `#ef4444` | Streak stat accent, destructive hover |
| green | `#22c55e` | On-time stat accent, "strong" band |
| blue | `#3b82f6` | Cohort-rank stat accent |
| success text | `#15803d` | Positive delta text |
| danger text | `#b91c1c` | Negative delta / error text |

Band ladder (`parts.tsx:9-14`) — reuse verbatim if the module ever needs a status ramp:

```ts
"not-started": { color: "#94a3b8", bg: "#f1f5f9", bar: "#cbd5e1" }
"needs-work":  { color: "#b91c1c", bg: "#fef2f2", bar: "#ef4444" }
"building":    { color: "#b45309", bg: "#fffbeb", bar: "#f59e0b" }
"strong":      { color: "#15803d", bg: "#f0fdf4", bar: "#22c55e" }
```

### 1.4 Gradient recipes (copy exactly, do not re-derive)

| Name | Value | Use | Source |
|---|---|---|---|
| `TILE_GRADIENT` | `linear-gradient(135deg, #6366f1, #a855f7)` | 30px `SectionHeader` icon tile — the DEFAULT | `parts.tsx:76`, `profileTokens.ts:71` |
| **`CERT_BADGE_GRADIENT`** | `linear-gradient(135deg, #7c3aed, #a855f7)` | The certificate badge tile | `CertificatePanel.tsx:17` |
| **`CERT_BAR_GRADIENT`** | `linear-gradient(90deg, #7c3aed, #ec4899)` | Certificate progress bar fill | `CertificatePanel.tsx:32` |
| **`CERT_CTA_GRADIENT`** | `linear-gradient(135deg, #7c3aed, #ec4899)` | Certificate primary CTA | `CertificatePanel.tsx:41` |
| `CTA_GRADIENT` | `linear-gradient(135deg, #a855f7 0%, #ec4899 100%)` | Hero pill CTA (on dark) | `ModulePageHeader.tsx:209`, `profileTokens.ts:74` |
| solid button | `linear-gradient(135deg,#7c3aed,#db2777)` | Contained button on white | `DashboardV2.tsx:70` |
| `HERO_BG` | `radial-gradient(110% 130% at 12% 112%, rgba(192,38,211,0.45) 0%, rgba(124,58,237,0.30) 30%, rgba(15,10,40,0) 60%), linear-gradient(150deg, #271a5c 0%, #181040 55%, #100a2c 100%)` | Dashboard/profile dark hero | `AiBriefingHero.tsx:52`, `profileTokens.ts:49` |
| ModulePageHeader hero | `radial-gradient(120% 130% at 8% 115%, ${tone.glow} 0%, rgba(124,58,237,0.22) 32%, rgba(15,10,40,0) 62%), linear-gradient(150deg, #241653 0%, #181040 55%, #100a2c 100%)` | Every module page hero | `ModulePageHeader.tsx:84` |
| soft violet tip | `linear-gradient(135deg, #f5f3ff, #fdf2f8)` | AI-tip strip inside a white card | `LeaderboardPanel.tsx:52` |
| dark goal card | `linear-gradient(160deg, #1a1442 0%, #110b2e 100%)` on `backgroundColor: "#110b2e"` | Dark rail card | `TodayGoalPanel.tsx:29-30` |

### 1.5 Shadows & radii

| Token | Value | Source |
|---|---|---|
| `PANEL_SHADOW` | `0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28)` | `parts.tsx:66`, `profileTokens.ts:62` |
| tile shadow | `0 1px 2px rgba(16,24,40,0.04)` | `parts.tsx:100` |
| `HERO_SHADOW` | `0 24px 60px -30px rgba(76,29,149,0.7)` | `AiBriefingHero.tsx:52`, `ModulePageHeader.tsx:85` |
| `CTA_SHADOW` | `0 14px 34px -12px rgba(192,38,211,0.7)` | `AiBriefingHero.tsx:125`, `profileTokens.ts:76` |
| header-CTA shadow | `0 14px 30px -12px rgba(192,38,211,0.7)` | `ModulePageHeader.tsx:210` |
| cert badge glow | `0 12px 26px -12px rgba(124,58,237,0.6)` | `CertificatePanel.tsx:17` |
| dark card shadow | `0 18px 40px -24px rgba(76,29,149,0.6)` | `TodayGoalPanel.tsx:32` |

Radii — MUI spacing units, `borderRadius: N` = `N * 8px`:

| Value | = px | Use |
|---|---|---|
| `borderRadius: 5` | 40 | Dashboard hero (`AiBriefingHero.tsx:52`) |
| `borderRadius: 4` | 32 | **PanelCard, ModulePageHeader hero, top-level cards** |
| `borderRadius: 3` | 24 | StatBox, inner tiles, action cards on dark |
| `borderRadius: 2.5` | 20 | List rows, small buttons, on-dark chips |
| `borderRadius: 2` | 16 | 30px icon tiles, small strips |
| `borderRadius: 999` | pill | Pills, badges, hero CTAs, progress tracks |

### 1.6 What the theme actually resolves to (the trap)

`lib/theme.ts` + `components/providers/ThemeProvider.tsx` build the MUI theme. Reading them
together:

- `palette.primary.main` is `#1976d2` by default (`lib/theme.ts:6`) and is **overridden
  per tenant** (`ThemeProvider.tsx:107-121`). So `<Button variant="contained">` renders an
  unpredictable per-tenant blue — **never** the product's violet.
- **`palette.warning` is never touched by `ThemeProvider`.** It is MUI's factory orange:
  `main #ed6c02`, `dark #e65100`, `light #ff9800`. The certificates module believes it is
  using amber `#f59e0b`. It is not. It is using a colour that appears nowhere in this
  product.
- `palette.divider` is untouched `rgba(0,0,0,0.12)`.
- `palette.mode` is **never set to `"dark"`** anywhere in the app. Every
  `theme.palette.mode === "dark" ? … : …` branch in the certificates module is dead code.
- `palette.background.paper` is tenant-overridable (`ThemeProvider.tsx:82-86`).

**Rule: app chrome does not read `useTheme()`.** The only legitimate `useTheme()` calls in
scope are `useMediaQuery(theme.breakpoints.down("sm"))`.

### 1.7 CSS custom properties (the admin dialect's tokens)

The admin surfaces use CSS vars from `app/globals.css`, not literal hex. Resolved values:

| Var | Value | Line |
|---|---|---|
| `--font-primary` | `#1f2430` | `globals.css:131` |
| `--font-secondary` | `#4b5563` | `:132` |
| `--font-light` | `#ffffff` | `:134` |
| `--border-default` | `#e5e7eb` | `:141` |
| `--surface` | `#f9fafb` | `:143` |
| `--card-bg` | `#ffffff` | `:152` |
| `--accent-indigo` | `#6366f1` | `:144` |
| `--ai-violet` | `#7c3aed` | `:164` |
| `--ai-pink` | `#ec4899` | `:165` |
| `--gradient-ai` | `linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)` | `:160` |
| `--radius-card` | `18px` | `:166` |
| `--font-mono` | `ui-monospace, "SFMono-Regular", Menlo, monospace` | `:170` |
| `--success-500` | `#5fa564` | `:115` |

### 1.8 Spacing rhythm

- **Page frame:** `MainLayout` already applies `p: { xs: 2, sm: 3, md: 4 }`
  (`MainLayout.tsx:72`). `PageShell` adds only `width:100%; maxWidth; mx:auto`
  (`PageShell.tsx:27`). **A page that uses `PageShell` must not add its own page padding.**
  The dashboard is the exception: it uses `MainLayout` directly and supplies
  `maxWidth: 1600, mx:"auto", px:{xs:2,md:3}, py:{xs:2,md:3}` (`app/dashboard/page.tsx:11`).
- **Hero → first content:** `mb: 3` is baked into `ModulePageHeader` (`:80`). Admin pages
  then open the next block with `mt: 3` (`cohorts/page.tsx:170`).
- **Between sibling cards:** `<Stack spacing={2}>` in the dashboard rail
  (`DashboardV2.tsx:151`); `PanelCard` also carries `mb: 2` of its own (`parts.tsx:60`).
- **Two-column dashboard grid:** `gap: 2.5` (`DashboardV2.tsx:129`).
- **Stat grids:** `gap: 1.5` (`StatCards.tsx:96`, `StatStrip.tsx:32`).
- **Card inner padding:** `p: 2` (PanelCard), `p: 1.75` (StatBox), `p: {xs:2, sm:2.75}`
  (ProfilePanel), `p: {xs:2.5, md:3.5}` (hero).
- **Section-header bottom margin:** `mb: 1.5` dashboard / `mb: 2` profile.

### 1.9 Type scale

| Role | Size / weight | Source |
|---|---|---|
| Hero title | `{ xs:"1.5rem", md:"2rem" }` / 900 / `letterSpacing:"-0.02em"` | `ModulePageHeader.tsx:139-144` |
| Hero eyebrow | `0.7rem` / 800 / `letterSpacing:"0.16em"` / uppercase / `rgba(255,255,255,0.6)` | `:129-134` |
| Hero description | `{ xs:"0.85rem", sm:"0.92rem" }` / `rgba(255,255,255,0.78)` / `maxWidth:680` | `:151-156` |
| Section title | `0.95rem` / 800 / `#0f172a` / `lineHeight:1.2` | `parts.tsx:86` |
| Section subtitle | `0.72rem` / `#64748b` | `parts.tsx:87` |
| Stat value | `1.5rem` / 900 / `#0f172a` / `lineHeight:1` | `parts.tsx:104` |
| Stat label | `0.6rem` / 800 / `letterSpacing:0.5` / uppercase / `#64748b` | `parts.tsx:106` |
| Stat sub | `0.72rem` / 700 | `parts.tsx:109` |
| Row title | `0.85–0.86rem` / 700 | `UpNextPanel.tsx:48` |
| Micro-eyebrow | `0.6rem` / 800 / `letterSpacing:0.6` / uppercase | `CertificatePanel.tsx:20` |
| Pill | `0.62–0.66rem` / 800 | `parts.tsx:123` |

RTL: every uppercase + letterspaced style must carry
`'[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" }`
(`surfaces.tsx:186`). The certificates module already does this correctly — keep it.

---

## 2. THE ATOMS

### 2.1 What is importable vs. what must be re-expressed

| Atom | Import from | Verdict |
|---|---|---|
| `PanelCard` | `@/components/dashboard/v2/parts` | **IMPORTABLE.** No dashboard-shaped props. Use on `/certificates` and in dashboard/rail contexts. |
| `SectionHeader` | same | **IMPORTABLE.** Props: `icon, title, subtitle?, gradient?, action?`. |
| `StatBox` | same | **IMPORTABLE.** Props: `label, value, sub?, subColor?, icon?, accent?, info?`. |
| `fmtDate`, `daysLeft` | same | **IMPORTABLE.** |
| `BandPill`, `SignalBar`, `BAND_STYLE` | same | Typed on `ReadinessBand`. **Do not import** unless you genuinely have a readiness band — re-express the pill inline. |
| `RANK_BG`, `RANK_FG`, `avatarColor` | same | Leaderboard-only. Not relevant. |
| `Reveal`, `CountUp`, `AnimatedRing` | `@/components/scorecard/shared` | **IMPORTABLE.** Entrance motion + counters. |
| `ModulePageHeader`, `HeaderActionButton` | `@/components/common/ModulePageHeader` | **IMPORTABLE.** Already used — only the `accent` is wrong. |
| `PageShell` | `@/components/common/PageShell` | **IMPORTABLE.** Already used. |
| `ProfilePanel`, `ProfileSectionHeader`, `SectionAction`, `StatTile`, `HeroCta` | `@/components/profile/theme/surfaces` | **IMPORTABLE but profile-scoped.** Only `components/profile/CertificatesSection.tsx` should use these. |
| `StatStrip`, `SegmentedTabs`, `AssessmentEmptyState`, `AssessmentFilterBar`, `AssessmentDataTable`, `AssessmentSharedPagination`, `StatusChip` | `@/components/admin/assessment/shared` | **IMPORTABLE.** These are the admin dialect's atoms. `app/admin/certificates/*` must use them. |
| `ViewToggle` | `@/components/common/list` | **IMPORTABLE** for card/table toggles. |
| Certificate identity constants | *(create)* `lib/certificates/ui-tokens.ts` | **NEW.** See §3.4. |

> Precedent for re-expressing rather than importing: `components/profile/theme/surfaces.tsx:20-27`
> explains that the profile mirrors `parts.tsx` instead of importing it because the atoms take
> dashboard-shaped props. That reasoning applies to `BandPill`/`SignalBar` only — `PanelCard`,
> `SectionHeader` and `StatBox` take plain props and should just be imported.

### 2.2 PanelCard — the white card

```tsx
// parts.tsx:56-69
<Box sx={{
  p: 2,
  mb: 2,
  borderRadius: 4,
  border: "1px solid #e4e7f0",
  bgcolor: "#fff",
  boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28)",
}} />
```

**Rule:** every top-level white card on a student surface. The border **and** the shadow
are both required — the comment at `parts.tsx:62-63` is explicit that this is what makes a
card read as a card rather than a plain rectangle. A card with only
`border: 1px solid ${theme.palette.divider}` and no shadow is the single most common
divergence in the shipped certificates module.

Forwards `data-*` attributes; accepts `sx` override.

### 2.3 SectionHeader — the 30px gradient tile

```tsx
// parts.tsx:81-90
<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
  <Box sx={{ width: 30, height: 30, borderRadius: 2, flexShrink: 0,
             display: "grid", placeItems: "center", color: "white",
             background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
    <Icon icon={icon} width={17} />
  </Box>
  <Box sx={{ minWidth: 0, flex: 1 }}>
    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem", lineHeight: 1.2 }}>{title}</Typography>
    {subtitle && <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>{subtitle}</Typography>}
  </Box>
  {action}
</Stack>
```

**Rule:** the header of any section inside a card, or of a standalone section on a student
page. Tile is **30×30, radius 2, icon 17px**. Title is **0.95rem / 800**, not 1.05rem/900.
Pass `gradient={CERT_BADGE_GRADIENT}` for certificate sections.

### 2.4 StatBox — the accent-strip metric tile

```tsx
// parts.tsx:100-113
<Box sx={{ p: 1.75, borderRadius: 3, border: "1px solid #eef2f7", bgcolor: "#fff",
           boxShadow: "0 1px 2px rgba(16,24,40,0.04)", position: "relative", overflow: "hidden" }}>
  <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: accent }} />
  …value 1.5rem/900 #0f172a · label 0.6rem/800/uppercase/#64748b · sub 0.72rem/700
  …trailing Icon width={20} color={accent} opacity .85
</Box>
```

Grid: `display:"grid", gridTemplateColumns:{ xs:"repeat(2,1fr)", sm:"repeat(3,1fr)", lg:"repeat(N,1fr)" }, gap:1.5, mb:2.5`
(`StatCards.tsx:96`).

Canonical accent order (`profileTokens.ts:99-104`): violet `#7c3aed`, amber `#f59e0b`,
blue `#3b82f6`, green `#22c55e`.

**Rule:** student-side metric row. On admin, use `StatStrip` instead (§4.2).

### 2.5 Pills

Neutral pill (`UpNextPanel.tsx:49`):
```tsx
sx={{ display:"inline-block", mt:0.25, px:0.75, py:0.1, borderRadius:999,
      fontSize:"0.64rem", fontWeight:700, color:"#475569", bgcolor:"#f1f5f9" }}
```
Status pill (`parts.tsx:122-126`): `px:0.85, py:0.2, borderRadius:999, fontSize:"0.62rem", fontWeight:800` with a `{color, bg}` pair from the ladder in §1.3.

On-dark pill (`AiBriefingHero.tsx:55`): `px:1, py:0.4, borderRadius:999, fontSize:"0.66rem", fontWeight:800, letterSpacing:0.5, color:"white", bgcolor:"rgba(255,255,255,0.18)"`.

### 2.6 Progress bar

```tsx
// CertificatePanel.tsx:32 — the certificate bar
<LinearProgress variant="determinate" value={Math.min(100, pct)}
  sx={{ height: 8, borderRadius: 4, bgcolor: "#eef2f7",
        "& .MuiLinearProgress-bar": { borderRadius: 4,
          background: "linear-gradient(90deg, #7c3aed, #ec4899)" } }} />
```

Variants in the language: `height: 7, borderRadius: 4` for a signal bar
(`parts.tsx:160`), `height: 7, borderRadius: 999` for a thin profile bar
(`CertificatesSection.tsx:219`), `height: 6, borderRadius: 999` on dark
(`AiBriefingHero.tsx:69`). Track is `#eef2f7` on white, `rgba(255,255,255,0.12)` on dark.

**Rule:** a certificate progress bar is ALWAYS the violet→pink 90deg gradient.

### 2.7 Gradient CTA

Three legitimate forms:

1. **Card CTA (full-width, on white)** — `CertificatePanel.tsx:41`:
```tsx
<ButtonBase sx={{ mt:1.5, width:"100%", py:1.1, borderRadius:2.5, fontWeight:800,
  fontSize:"0.88rem", color:"white", gap:0.5,
  background: "linear-gradient(135deg, #7c3aed, #ec4899)" }} />
```
2. **Hero pill CTA (on dark)** — `HeaderActionButton variant="solid"`, `ModulePageHeader.tsx:207-212`:
`px:2.25, py:1.1, borderRadius:999, fontWeight:800, fontSize:"0.9rem"`,
`background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)"`,
`boxShadow: "0 14px 30px -12px rgba(192,38,211,0.7)"`, `"&:hover": { filter: "brightness(1.06)" }`.
3. **Contained MUI button on white** — `DashboardV2.tsx:70`:
```tsx
sx={{ textTransform:"none", fontWeight:800, borderRadius:2, px:3, py:1.1,
      background: "linear-gradient(135deg,#7c3aed,#db2777)" }}
```

**Rule:** a bare `<Button variant="contained">` with no `background` override is a bug —
it paints tenant-primary blue (§1.6). Every primary action needs an explicit gradient.
Secondary actions: `variant="outlined"` with `textTransform:"none", fontWeight:700,
borderRadius:2` (admin) or `SectionAction`-style violet-soft pill (student/profile).

### 2.8 Empty states

- **Student surface:** centered block, `p:{xs:3, md:4}`, `borderRadius:4`,
  `border:"1px solid #eef2f7"`, `bgcolor:"#faf9ff"`, 56px circular gradient badge
  (`linear-gradient(135deg,#7c3aed,#a855f7)`), title `1.15rem/800/#0f172a`, body `#64748b`,
  then one gradient CTA. Source: `StartJourneyCard`, `DashboardV2.tsx:52-76`.
- **Admin surface:** `AssessmentEmptyState` from `@/components/admin/assessment/shared` —
  `px:3, py:5, borderRadius:2, border:"1px solid var(--border-default)",
  backgroundColor:"var(--card-bg)"`, 56px indigo-tinted **square** tile (radius 2), title
  `1rem/600`, description `0.875rem`, optional action.

**A dashed border and an orange circle are not in this language anywhere.**

---

## 3. THE CERTIFICATE IDENTITY

### 3.1 It already exists

`components/dashboard/v2/CertificatePanel.tsx` is the platform's shipped certificate
surface. It is what a student already sees on their dashboard, and it defines the identity:

```tsx
// :17 — the badge
<Box sx={{ width: 56, height: 56, mx: "auto", mb: 1, borderRadius: 3,
  display: "grid", placeItems: "center", color: "white",
  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
  boxShadow: "0 12px 26px -12px rgba(124,58,237,0.6)" }}>
  <Icon icon="mdi:certificate" width={28} />
</Box>

// :20 — the micro-eyebrow
<Typography sx={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: 0.6,
  color: "#7c3aed", textTransform: "uppercase" }}>
  Certificate · {course.title}
</Typography>

// :32 — the progress bar
background: "linear-gradient(90deg, #7c3aed, #ec4899)"

// :41 — the CTA
background: "linear-gradient(135deg, #7c3aed, #ec4899)"
```

Plus the headline `1.05rem/800/#0f172a`, subcopy `0.8rem/#64748b`, and the paired
`0.68rem/700/#94a3b8` "N% done" / "N% to unlock" caption row (`:34-35`).

### 3.2 The identity, stated

| Element | Value |
|---|---|
| Icon | `mdi:certificate` (filled) for the identity badge; `mdi:certificate-outline` for muted/empty states |
| Badge gradient | `linear-gradient(135deg, #7c3aed, #a855f7)` |
| Badge glow | `0 12px 26px -12px rgba(124,58,237,0.6)` |
| Bar gradient | `linear-gradient(90deg, #7c3aed, #ec4899)` |
| CTA gradient | `linear-gradient(135deg, #7c3aed, #ec4899)` |
| Eyebrow colour | `#7c3aed`, `0.6rem / 800 / letterSpacing 0.6 / uppercase` |
| Focus ring | `0 0 0 2px #fff, 0 0 0 4px #7c3aed` |
| Hover border | `#7c3aed` at 0.6 alpha → use `#a78bfa` or `rgba(124,58,237,0.6)` |
| `ModulePageHeader` accent | `"purple"` → `{ a:"#a855f7", b:"#7c3aed", glow:"rgba(168,85,247,0.45)" }` |
| Ladder rung achieved | violet gradient, not amber |
| Locked/blurred overlay chip | violet-soft `#f5f3ff` bg, `#7c3aed` fg, `#ede9fe` border |

### 3.3 Why amber is wrong (three reasons, all independent)

1. **A certificate identity already existed** and it is violet. Two certificate surfaces in
   one product with two different accents is the exact inconsistency the user reported.
2. **Amber is already spoken for.** `#f59e0b` is the Momentum stat accent
   (`StatCards.tsx:79`), the `week_final` up-next kind (`UpNextPanel.tsx:12`), the rank-1
   medal (`parts.tsx:33-34`), and the Tickets module's page accent
   (`app/tickets/page.tsx:169`, `app/admin/tickets/page.tsx:234`). Certificates taking it
   collides with all four.
3. **It isn't even amber.** `theme.palette.warning.main` is MUI's factory `#ed6c02` (§1.6).
   The shipped module is orange, not amber, and that orange is in no token file.

### 3.4 Where to put the identity

Create `lib/certificates/ui-tokens.ts`:

```ts
/** The certificate identity, established by components/dashboard/v2/CertificatePanel.tsx. */
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
export const CERT_PANEL_SHADOW =
  "0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -20px rgba(30,27,75,0.28)";
export const CERT_FOCUS_RING = "0 0 0 2px #fff, 0 0 0 4px #7c3aed";
/** ModulePageHeader accent key for every certificate page. */
export const CERT_ACCENT = "purple" as const;
```

Every file listed in §5 imports from here instead of calling `useTheme()`.

### 3.5 Every place the accent must change

`accent="amber"` → `accent="purple"`:
- `app/certificates/page.tsx:57`
- `app/admin/certificates/page.tsx:206`

`theme.palette.warning.*` → CERT tokens (full list, all confirmed by grep):
- `components/admin/certificates/shared.tsx:326`
- `components/admin/certificates/TemplatesTab.tsx:288`
- `components/admin/certificates/AssignmentsTab.tsx:376`, `:379`
- `components/admin/certificates/PointsLadderTab.tsx:448`, `:449`
- `components/admin/certificates/TemplateEditorDialog.tsx:551`, `:856`, `:1174`, `:1178`
- `components/certificate/CertificateDetailDialog.tsx:228`
- `components/certificate/CertificateGallery.tsx:256`, `:257`, `:268`, `:269`, `:494`, `:495`, `:575`, `:581`, `:586`, `:647`, `:682`, `:731`, `:732`
- `components/certificate/CertificatePreview.tsx:224`, `:225`, `:226`, `:253`
- `components/certificate/PointsLadderRail.tsx:73`, `:74`, `:205`
- `app/admin/certificates/page.tsx:245`, `:363`

Literal amber hexes → violet:
- `components/profile/CertificatesSection.tsx:111` (`linear-gradient(135deg, #f59e0b, #d97706)`)
- `components/profile/CertificatesSection.tsx:162` (`accent={STAT_ACCENT.amber}`)
- `components/profile/CertificatesSection.tsx:224` (`linear-gradient(90deg, #f59e0b, #d97706)`)
- `components/profile/CertificatesSection.tsx:260` (focus ring `STAT_ACCENT.amber`)
- `components/admin/adaptive-course/CertificateAdminSection.tsx:32` (`AMBER_GRADIENT`), used at `:327` and `:343`
- `components/admin/adaptive-course/CertificateAdminSection.tsx:227` (`CircularProgress sx={{ color: "#f59e0b" }}`)

`color="warning"` MUI buttons → gradient CTA:
- `app/certificates/page.tsx:96-103`
- `components/certificate/CertificateGallery.tsx:300-310`

**Deliberate exception:** the ARTWORK's own gold/metal palettes are unaffected. See §6.

---

## 4. THE TWO DIALECTS

They share the ink ramp, the radii, the spacing rhythm, `ModulePageHeader` and `PageShell`.
They differ in how colour is expressed and which atoms compose the body.

### 4.1 The student / dashboard dialect

- **Colour:** literal hex in `sx`. No `useTheme()`, no `alpha()`, no CSS vars.
- **Cards:** `PanelCard` — `p:2, mb:2, borderRadius:4, border:"1px solid #e4e7f0",
  bgcolor:"#fff"` + `PANEL_SHADOW`.
- **Section headers:** `SectionHeader` — 30px gradient tile, `0.95rem/800`.
- **Metrics:** `StatBox` — 3px accent strip, `1.5rem/900` value, `0.6rem/800` uppercase label.
- **Primary action:** gradient `ButtonBase`, never bare `variant="contained"`.
- **Motion:** `Reveal` wrappers, `CountUp`, `AnimatedRing`.
- **Dark surfaces exist** and are part of the language: the hero (`HERO_BG`) and the
  Today's-Goal card. A student page is white cards on canvas, punctuated by at most one or
  two dark violet surfaces.
- **Layout:** two columns `minmax(0,1fr) 390px`, `gap:2.5`, `alignItems:"start"`
  (`DashboardV2.tsx:129`); the rail is `<Stack spacing={2}>`.
- **Page frame:** `maxWidth:1600, mx:"auto", px:{xs:2,md:3}, py:{xs:2,md:3}`
  (`app/dashboard/page.tsx:11`) for the dashboard itself; `PageShell` + `ModulePageHeader`
  for module pages.

**The profile sub-dialect.** `components/profile/theme/*` is the same language with three
deliberate differences (`profileTokens.ts` header comment explains why):
canvas is `#fbfbfd` not white; panel padding is `p:{xs:2, sm:2.75}` not `p:2`; panels
carry `scrollMarginTop:"104px"` for hash deep links; the header tile margin is `mb:2` not
`mb:1.5`; and it adds explicit `:focus-visible` rings that the dashboard atoms omit.
It is otherwise value-for-value the dashboard. **Only files under `components/profile/`
speak it.**

### 4.2 The admin dialect

- **Colour:** CSS custom properties — `var(--card-bg)`, `var(--border-default)`,
  `var(--font-primary)`, `var(--font-secondary)`, `var(--ai-violet)`, `var(--gradient-ai)`,
  `var(--radius-card)`, with `color-mix(in srgb, …)` for tints. Still **not** `useTheme()`.
- **Hero:** `ModulePageHeader` + `HeaderActionButton` — identical to the student dialect.
  (`app/admin/cohorts/page.tsx:157-168` is the reference composition.)
- **Metrics:** `StatStrip` — a horizontal strip of `{icon tile 40px, mono value 1.35rem/700,
  caption label}` cards, `borderRadius: var(--radius-card)`, `gap:1.5`
  (`StatStrip.tsx:22-93`). **Not** `StatBox`. Numbers are in `var(--font-mono)`.
- **Tabs:** `SegmentedTabs` — one rounded `999` track, `p:0.5`, active segment filled
  `var(--ai-violet)` with `boxShadow: 0 6px 14px -8px color-mix(…)`, optional count badge
  (`SegmentedTabs.tsx:34-115`). **Never MUI `<Tabs>` with an underline indicator.**
- **Filters:** `AssessmentFilterBar`.
- **Empty states:** `AssessmentEmptyState` — square indigo tile, solid `1px` border, no
  dashes.
- **Tables:** `AssessmentDataTable` + `AssessmentSharedPagination`; cards via `ViewToggle`.
- **Card grids:** `gridTemplateColumns:{xs:"1fr", sm:"repeat(2,1fr)", lg:"repeat(3,1fr)"}, gap:2`
  (`cohorts/page.tsx:105-106`).
- **Buttons:** `variant="contained"` **with** `background: "var(--gradient-ai)"` and
  `borderRadius:"999px", textTransform:"none", fontWeight:700`
  (`cohorts/page.tsx:86`); secondary `variant="outlined"`, `borderRadius:2`.
- **Rhythm:** hero (`mb:3` internal) → `mt:3` stats → `mt:3, mb:2` tabs → filter bar →
  `mt:2.5` list. Exactly `app/admin/cohorts/page.tsx:155-260`.

### 4.3 Which certificate surface belongs to which

| Surface | Dialect | Notes |
|---|---|---|
| `app/certificates/page.tsx` | **Student** | `PageShell` + `ModulePageHeader accent="purple"`; body = `PanelCard` + `SectionHeader`. |
| `components/certificate/CertificateGallery.tsx` | **Student** | Sections use `SectionHeader`; cards are `PanelCard`-derived `ButtonBase`. |
| `components/certificate/PointsLadderRail.tsx` | **Student** | Wrap in `PanelCard`; violet rail; header row is a `StatBox`-style number + uppercase label. |
| `components/certificate/CertificateDetailDialog.tsx` | **Student** | Dialog paper `borderRadius:4`, `bgcolor:"#fff"`; primary = `CERT_CTA_GRADIENT`. |
| `components/certificate/CertificatePreview.tsx` (chrome only) | **Student** | Only the locked overlay + lock chip are in scope. |
| `components/profile/CertificatesSection.tsx` | **Profile** | Already correct structurally — only the amber tokens change. |
| `app/admin/certificates/page.tsx` | **Admin** | `StatStrip` + `SegmentedTabs`; drop the extra padding Box. |
| `components/admin/certificates/*` (all tabs, cards, dialogs) | **Admin** | CSS vars, `AssessmentEmptyState`, `SegmentedTabs`, `AssessmentDataTable`. |
| `components/admin/adaptive-course/CertificateAdminSection.tsx` | **Admin** | It already uses `panelSx` with CSS vars — that part is right. Only the amber gradients change. |
| `components/certificate/CertificateArtwork.tsx`, `ornaments.tsx` | **NEITHER** | Stationery. See §6. |

---

## 5. THE DIVERGENCE LIST — the work list

Exhaustive, grouped by file, with the correction. `L:` numbers are as of this branch.

### 5.0 The systemic one (fix this first — it removes most of the rest)

**Every certificate chrome file reads `useTheme()` / `alpha()` / `theme.palette.*`.**
The design language does not. Files carrying a `useTheme()` for colour (not breakpoints):
`components/admin/certificates/shared.tsx:304`, `:358`, `:394`;
`TemplatesTab.tsx:67`; `IssuedTab.tsx:104`; `AssignmentsTab.tsx:90`;
`PointsLadderTab.tsx:132`; `TemplateCard.tsx:85`; `TemplateEditorDialog.tsx:158`, `:212`;
`TemplatePickerField.tsx:158`, `:462`; `AdminCertificateUploadCard.tsx:49`;
`CertificateRuleEditor.tsx:191`; `CertificateGallery.tsx:83`, `:482`, `:562`, `:674`, `:711`;
`CertificateDetailDialog.tsx:75`; `CertificatePreview.tsx` (locked variant);
`PointsLadderRail.tsx:44`; `app/certificates/page.tsx:31`; `app/admin/certificates/page.tsx:83`.

Correction: delete the colour usages. Keep `useTheme()` **only** where it feeds
`useMediaQuery(theme.breakpoints.down("sm"))` (`CertificateDetailDialog.tsx:76`).

**Dead dark-mode branches.** `palette.mode` is never `"dark"` in this app (§1.6). Delete
the conditionals at `shared.tsx:314`, `:326`, `:364`, `:366-372`, `:407`;
`TemplateEditorDialog.tsx:551`; `AdminCertificateUploadCard.tsx:85`.

### 5.1 `app/admin/certificates/page.tsx`

| L | Divergence | Correction |
|---|---|---|
| 201 | `<Box sx={{ px:{xs:2,sm:3}, pt:{xs:2,md:3}, pb:6 }}>` wraps the whole page — but `MainLayout` already applies `p:{xs:2,sm:3,md:4}` (`MainLayout.tsx:72`). Double padding; no other admin page does this. | Delete the Box. Render `ModulePageHeader` as `PageShell`'s first child, exactly like `app/admin/cohorts/page.tsx:156-157`. |
| 204 | `eyebrow="CONTENT"` shouted; siblings pass title-case (`"People"`, `"Assessment Management"`) and `ModulePageHeader` uppercases it itself (`:133`). | `eyebrow="Content"`. |
| 206 | `accent="amber"` | `accent="purple"` (`CERT_ACCENT`). |
| 222-278 | Bespoke 4-up grid of local `StatTile`s from `certificates/shared.tsx`. | `<StatStrip items={…} />` from `@/components/admin/assessment/shared`, wrapped in `<Box sx={{ mt: 3 }}>`. Tones: `var(--ai-violet)`, `var(--accent-indigo)`, `var(--ai-pink)`, `var(--success-500)` — the exact set `cohorts/page.tsx:94-97` uses. |
| 232 | `<Skeleton height={74} sx={{ borderRadius: 3 }} />` | Match `StatStrip` card height and `borderRadius: "var(--radius-card)"`. |
| 245 | `tone={theme.palette.warning.main}` → resolves to `#ed6c02` | `var(--ai-violet)` |
| 251 | `tone={theme.palette.info.main}` | `var(--accent-indigo)` |
| 257 | `tone={theme.palette.secondary?.main ?? theme.palette.primary.main}` — `secondary.main` is `#dc004e` (`lib/theme.ts:12`), a crimson used nowhere. | `var(--ai-pink)` |
| 263 | `tone={theme.palette.success.main}` | `var(--success-500)` |
| 280-291 | `<Alert severity="info">` for the seeded notice — MUI default blue, unstyled. | An admin notice strip: `p:1.5, borderRadius:2, border:"1px solid var(--border-default)", bgcolor:"color-mix(in srgb, var(--ai-violet) 8%, var(--card-bg) 92%)"`, icon + `0.85rem/600 var(--font-primary)`. |
| 295-338 | Two `Typography variant="overline"` + `Chip` rows for recent-issued and the ladder. `variant="overline"` is not in the type scale; `<Chip variant="outlined">` inherits MUI defaults. | Use the eyebrow style from §1.9 (`0.6rem/800/letterSpacing .5/uppercase/var(--font-secondary)`) and the neutral pill from §2.5, or drop the rows into a `Surface` with a `SectionHeader`. |
| 340-377 | MUI `<Tabs>` with a 3px underline indicator tinted `theme.palette.warning.main`. Zero other admin pages in the app use MUI Tabs for a hub. | `<SegmentedTabs<TabKey> tabs={…} value={tab} onChange={goToTab} />`. Pass `count` per tab from `counts`. Wrap `<Box sx={{ mt: 3, mb: 2 }}>`. |
| 363 | indicator `bgcolor: theme.palette.warning.main` | n/a once `SegmentedTabs` lands (active fill is `var(--ai-violet)`). |
| 178-189 | Access-denied path wraps the local `EmptyState` in `maxWidth:620, px:2, pt:5`. | `AssessmentEmptyState icon="mdi:lock-outline"`. |
| 153-172 | Loading state is a bare `CircularProgress` at `minHeight:"50vh"`. | Skeletons in the page's own shape (`StatStrip` row + tab track + card grid), matching `cohorts/page.tsx:58-71`. |

### 5.2 `components/admin/certificates/shared.tsx`

| L | Divergence | Correction |
|---|---|---|
| 291-345 | `EmptyState`: `border: "1px dashed"`, `borderColor: alpha(divider, .9)`, `bgcolor: alpha(text.primary, .015)`, a **circular** `warning`-tinted tile at 56/72px, `variant="h6"`. Nothing in the language uses a dashed border or an orange circle. | Delete this component. Re-export `AssessmentEmptyState` from `@/components/admin/assessment/shared`. If the `dense` prop is needed, add it there. |
| 326 | `bgcolor: alpha(theme.palette.warning.main, …)` | n/a after the swap. |
| 348-380 | `Surface`: `borderRadius: 3` (24px, but the admin card radius is `var(--radius-card)` = 18px), `borderColor: alpha(divider, …)`, `bgcolor: theme.palette.background.paper` (tenant-overridable), a heavier shadow `0 20px 42px -28px rgba(15,23,42,0.18)` than any card in the language, and two dead dark-mode branches. | Re-express with CSS vars: `borderRadius: "var(--radius-card)", border: "1px solid var(--border-default)", bgcolor: "var(--card-bg)", boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)"` (the `SegmentedTabs.tsx:43` shadow, which is the admin card shadow), `p: padded ? {xs:2, sm:2.5} : 0`. Keep the name and the API so the tabs don't churn. |
| 383-423 | Local `StatTile` duplicating `StatStrip`'s card. | Delete; use `StatStrip`. |

### 5.3 `components/admin/certificates/TemplatesTab.tsx`

| L | Divergence | Correction |
|---|---|---|
| 236-244 | `Typography variant="subtitle2"` / `variant="caption" color="text.secondary"` for a section head. | `SectionHeader`-equivalent: `0.95rem/800 var(--font-primary)` + `0.72rem var(--font-secondary)`, with a 30px `CERT_BADGE_GRADIENT` tile. |
| 246-254 | `Button variant="outlined" sx={{ borderRadius: 2 }}` | Keep outlined but add `borderColor:"var(--border-default)", color:"var(--ai-violet)"`. |
| 281, 295, 306 | Preset chips at `borderRadius: 2 / 1.5 / "50%"` — three radii in one row. | One radius: pill `999` for chips, `2` for tiles. |
| 288 | `borderColor: theme.palette.warning.main` on the selected preset | `#7c3aed` |
| 339-344 | Bare `TextField` for search. | `AssessmentFilterBar`. |
| 355-360 | `ToggleButtonGroup` for the view switch. | `ViewToggle` from `@/components/common/list` (what `cohorts` and `adaptive-courses` use) or `SegmentedTabs`. |
| 368-371 | `<Chip variant="outlined" sx={{ borderRadius: 1.5 }}>` filter chip. | Neutral pill (§2.5) or `AssessmentFilterBar`'s own active-filter chips. |
| 393 | `Skeleton height={280} borderRadius: 3` | `borderRadius: "var(--radius-card)"`. |
| 397, 416 | Local `EmptyState`. | `AssessmentEmptyState`. |
| 405-409, 436-448 | `Button variant="contained"` with no background → tenant blue. | `background: "var(--gradient-ai)", borderRadius:"999px", textTransform:"none", fontWeight:700`. |

### 5.4 `components/admin/certificates/IssuedTab.tsx`

| L | Divergence | Correction |
|---|---|---|
| 263-334 | Four bare `TextField`s (search + three selects) laid out by hand. | `AssessmentFilterBar` with `FilterSelectDef[]` — the exact case it exists for. |
| 338 | `Skeleton height={420} borderRadius: 3` | `AssessmentTableSkeleton`. |
| 340, 359 | Local `EmptyState`. | `AssessmentEmptyState`. |
| 348-352, 379+ | `variant="contained"` unstyled. | `var(--gradient-ai)` pill. |
| 394-561 | Hand-rolled `Table` inside `Surface padded={false}`. | `AssessmentDataTable` + `AssessmentSharedPagination`. If the row actions make that impractical, at minimum align header cells to `0.6rem/800/uppercase/var(--font-secondary)` and rows to `0.85rem/600/var(--font-primary)`. |
| 432-500 | `Typography variant="subtitle2"/"caption"/"body2"` throughout — MUI's scale, not the app's. | Explicit sizes per §1.9. |
| 461-493 | `Chip variant="outlined" borderRadius: 1.5` for source and status. | `StatusChip` / `CountBadge` from the admin shared barrel. |
| 570, 638 | Dialog paper `borderRadius: 3`. | `borderRadius: 4` (32px) — the app's dialog radius (`CertificateDetailDialog.tsx:207` already gets this right). |
| 602-624, 661-668 | `variant="contained"` unstyled + `borderRadius: 2`. | Gradient pill. |

### 5.5 `components/admin/certificates/AssignmentsTab.tsx`

| L | Divergence | Correction |
|---|---|---|
| 254-285 | `ToggleButtonGroup` for course / assessment scope. | `SegmentedTabs` with `{value,label,icon,count}`. |
| 296 | Bare `TextField`. | `AssessmentFilterBar`. |
| 311, 445 | `Skeleton borderRadius: 2`. | `var(--radius-card)` for cards, `2` only for inline rows. |
| 315, 335, 406 | Local `EmptyState`. | `AssessmentEmptyState`. |
| 373-380 | Selected row: `borderRadius: 2`, `borderColor: alpha(warning.main, .5)`, `bgcolor: alpha(warning.main, …)`. | `borderRadius: 2.5`, `border: "1px solid #ede9fe"`, `bgcolor: "#f5f3ff"` (the `LeaderboardPanel.tsx:38` "selected row" recipe), or the admin equivalent `color-mix(in srgb, var(--ai-violet) 10%, var(--card-bg) 90%)`. |
| 424, 494 | `Typography variant="overline"`. | Eyebrow style per §1.9. |
| 451 | `<Alert severity="info">`. | Admin notice strip (see 5.1 L280). |

### 5.6 `components/admin/certificates/PointsLadderTab.tsx`

| L | Divergence | Correction |
|---|---|---|
| 360-361 | `Skeleton borderRadius: 3`. | `var(--radius-card)`. |
| 368, 746 | Local `EmptyState`. | `AssessmentEmptyState`. |
| 377-380, 756-759, 818-823 | `variant="contained"` unstyled. | `var(--gradient-ai)` pill. |
| 439 | Ladder bar `borderRadius: "10px 10px 4px 4px"` — a shape used nowhere else. | `borderRadius: 2` top corners, or a plain `borderRadius: 999` bar. |
| 448-449 | `linear-gradient(180deg, alpha(warning.light,.95), warning.dark)` + `boxShadow 0 10px 22px -12px alpha(warning.dark,.8)` | `linear-gradient(180deg, #a855f7, #7c3aed)` + `0 10px 22px -12px rgba(124,58,237,0.8)`. |
| 483 | `<Alert severity="warning">` with `borderRadius: 2.5`. | Admin notice strip, violet or red per meaning — not MUI orange. |
| 509 | `color: "text.secondary"` string shorthand. | `var(--font-secondary)`. |
| 547 | `Chip borderRadius: 1.5`. | Pill `999`. |
| 775 | `borderColor: alpha(divider, .7)`. | `var(--border-default)`. |
| 851-858 | Dialog `borderRadius: 3`. | `4`. |

### 5.7 `components/admin/certificates/TemplateEditorDialog.tsx`

| L | Divergence | Correction |
|---|---|---|
| 178-179 | `border: 1px solid alpha(divider,.9)`, `borderRadius: 6` (48px — larger than the hero). | `borderRadius: 3`, `border: "1px solid var(--border-default)"`. |
| 539 | Dialog paper `borderRadius: 3`. | `4`. |
| 547-562 | Header tile + `variant="caption"`. | 30px `CERT_BADGE_GRADIENT` tile + `SectionHeader` type. |
| 551 | `bgcolor: alpha(warning.main, …)` with a dead dark branch. | `CERT_BADGE_GRADIENT`. |
| 589, 687 | `borderColor: alpha(divider, .7 / .9)`. | `var(--border-default)`. |
| 609 | `variant="overline"`. | Eyebrow style. |
| 612-634, 673-696 | Two `ToggleButtonGroup`s (design/upload; field picker) with `borderRadius: "8px !important"`. | `SegmentedTabs`. The `!important` disappears with it. |
| 856, 1174, 1178 | `warning.main` / `warning.dark` selection states. | `#7c3aed` / `#a855f7`. |

### 5.8 `components/admin/certificates/TemplateCard.tsx`

| L | Divergence | Correction |
|---|---|---|
| 127 | `borderColor: alpha(divider, .7)` on hover. | `#a78bfa` (violet hover), matching the gallery card. |
| 153 | `color="text.secondary"`. | `var(--font-secondary)`. |
| 181-236 | Five chips at `borderRadius: 1.5`, one dot at `"50%"`, one at `1.5` with `textTransform:"capitalize"`. | One pill recipe (§2.5); `StatusChip` where a status is meant. |
| 250 | Menu paper `borderRadius: 2`. | `2.5`. |

### 5.9 `components/admin/certificates/AdminCertificateUploadCard.tsx`

| L | Divergence | Correction |
|---|---|---|
| 91-97 | `<Paper variant?>` with `borderRadius: 3`, `borderColor: alpha(divider,.85)`. | The re-expressed `Surface`. |
| 85 | `dropBorder` uses a dead `palette.mode === "dark"` branch. | Static `var(--border-default)`, active `#7c3aed`. |
| 123-164 | `ToggleButtonGroup` with `border: 1px solid ${theme.palette.divider} !important`. | `SegmentedTabs`. |
| 210, 224 | Drop zone `borderRadius: 2.5` + circular icon tile. | Keep `2.5`; make the tile a **rounded square** `borderRadius: 2` with `CERT_BADGE_GRADIENT`, per §2.3 — circular tiles are not in this language outside avatars and the empty-state badge. |
| 243-267 | `variant="contained"` unstyled. | `var(--gradient-ai)` pill. |

### 5.10 `components/admin/certificates/TemplatePickerField.tsx` / `CertificateRuleEditor.tsx`

| File:L | Divergence | Correction |
|---|---|---|
| `TemplatePickerField.tsx:231,313,323,427,505` | `color: "text.secondary"` shorthand. | `var(--font-secondary)`. |
| `TemplatePickerField.tsx:246-267,473` | `borderRadius: 3` + `alpha(divider,.9)`. | `var(--radius-card)` + `var(--border-default)`. |
| `TemplatePickerField.tsx:478` | Selected border `theme.palette.primary.main` → tenant blue. | `#7c3aed`. |
| `TemplatePickerField.tsx:330-334` | `variant="outlined"` with default colour. | Violet-tinted outline. |
| `CertificateRuleEditor.tsx:567,579` | `<Alert severity="info"/"error">`. | Admin notice strip; error uses `#b91c1c` on `#fef2f2` with a `1px solid` red-tinted border. |
| `CertificateRuleEditor.tsx:588-592` | `rowSurfaceSx`: `borderRadius: 3`, `alpha(divider,.9)`. | `borderRadius: 2.5`, `1px solid var(--border-default)`. |
| `CertificateRuleEditor.tsx:749-753` | `variant="contained"` unstyled. | `var(--gradient-ai)` pill. |

### 5.11 `app/certificates/page.tsx` (student)

| L | Divergence | Correction |
|---|---|---|
| 31 | `useTheme()` for colour. | Delete. |
| 57 | `accent="amber"` | `accent="purple"` |
| 51 | `eyebrow="ACHIEVEMENTS"` shouted. | `"Achievements"` — the component uppercases. |
| 64-104 | Bespoke error card: `borderRadius: 4`, `border: 1px solid theme.palette.divider`, `bgcolor: alpha(error.main, .06)`, no shadow, and a `Button color="warning"` (MUI orange). | A `PanelCard` with a centered error block: 56px circle `bgcolor:"#fef2f2"`, icon `#b91c1c`, title `1.15rem/800/#0f172a`, body `#64748b`, then a `CERT_CTA_GRADIENT` retry `ButtonBase`. Mirrors `StartJourneyCard` (`DashboardV2.tsx:52-76`). |
| 108 | `<Stack spacing={4}>` — 32px between sections. The language's card rhythm is `2` / `2.5`. | `<Stack spacing={2.5}>`. |
| — | The page has **no dark hero content and no stat row**, so it reads flatter than every other student page. | Consider a `StatCards`-style `StatBox` row (Certificates held / Points / Milestones / Next rung) directly under the hero, reusing the accents already chosen in `CertificatesSection.tsx:158-190`. |

### 5.12 `components/certificate/CertificateGallery.tsx`

| L | Divergence | Correction |
|---|---|---|
| 68-75 | `GRID_SX gap: 2.5`. | Fine; keep. |
| 224, 765 | `<Stack spacing={4}>` (gallery root, and the skeleton). | `2.5` in both, so the skeleton reserves the real rhythm. |
| 253-257 | Claim card: `p:2, borderRadius:3, border: 1px solid alpha(warning.main,.35), bgcolor: alpha(warning.main,.08)`. | `p:1.75, borderRadius:2.5, border:"1px solid #ede9fe", bgcolor:"#f5f3ff"`. |
| 261-272 | 40px tile, `borderRadius: 2`, `warning` gradient. | Keep 40/`2`; gradient → `CERT_BADGE_GRADIENT`. |
| 275-292 | `0.9rem/800` title + `0.75rem text.secondary` sub. | `0.86rem/700/#0f172a` + `0.72rem/#64748b` (`UpNextPanel.tsx:48-49`). |
| 300-310 | `<Button variant="contained" color="warning" size="small">` — MUI orange. | `ButtonBase` with `CERT_CTA_GRADIENT`, `borderRadius:999, px:2, py:0.75, fontWeight:800, fontSize:"0.8rem"`. |
| 481-533 | `Section`: tile is **32px** with `warning` gradient; title is **`1.05rem/900` + `letterSpacing:"-0.3px"`**; subtitle `0.8rem`; `mb: 2`. | Replace the whole function with `SectionHeader` from `parts.tsx`: 30px tile, `gradient={CERT_BADGE_GRADIENT}`, title `0.95rem/800`, subtitle `0.72rem`, `mb: 1.5`. |
| 562-587 | `CertificateCard`: `p:1.25, borderRadius:4, border: 1px solid theme.palette.divider, bgcolor: background.paper`, **no shadow**, hover `translateY(-3px)` + `alpha(warning.main,.6)` + `0 18px 38px -22px alpha(black,.6)`, focus ring `warning.main`. | `border: "1px solid #e4e7f0"`, `bgcolor: "#fff"`, add `PANEL_SHADOW`. Hover: `translateY(-2px)`, `borderColor: "#a78bfa"`, `boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 18px 34px -22px rgba(124,58,237,0.45)"`. Focus: `CERT_FOCUS_RING`. |
| 575, 682 | `focused ? warning.main : divider`. | `focused ? "#7c3aed" : "#e4e7f0"`. |
| 594-609 | Revoked badge uses `theme.palette.error.main/contrastText`. | `bgcolor: "#b91c1c"`, `color: "#fff"` — keep `borderRadius:999, 0.62rem/900/uppercase`. |
| 615-628 | Caption `0.88rem/800/text.primary`. | `0.86rem/700/#0f172a`. |
| 638-641 | Meta `0.72rem/600/text.secondary`. | `0.72rem/700/#94a3b8` (`CertificatePanel.tsx:34`). |
| 647 | "View certificate" in `warning.dark`. | `#7c3aed`. |
| 674-704 | `TierTeaser`: `1px dashed divider`, `bgcolor: alpha(text.primary, .02)`, caption in `text.secondary`, meta in `text.disabled` (`rgba(0,0,0,0.38)`). | `border: "1px solid #eef2f7"`, `bgcolor: "#faf9ff"` (the language's soft-violet empty surface, `DashboardV2.tsx:55`), caption `#64748b`, meta `#94a3b8`. Keep it inert. |
| 711-755 | `EmptyEarned`: dashed border, `alpha(text.primary,.02)`, **circular** 52px tile tinted `warning`. | `StartJourneyCard` recipe: `p:{xs:3,md:4}, borderRadius:4, border:"1px solid #eef2f7", bgcolor:"#faf9ff"`, 56px circle with `CERT_BADGE_GRADIENT`, title `1.15rem/800/#0f172a`, body `#64748b`, then a `CERT_CTA_GRADIENT` CTA to the ladder. |
| 766-777 | Skeletons `borderRadius: 4`, no `Reveal`. | Keep radii; wrap the loaded gallery in `<Reveal>` to match `StatCards.tsx:95`. |

### 5.13 `components/certificate/PointsLadderRail.tsx`

| L | Divergence | Correction |
|---|---|---|
| 44 | `useTheme()` for colour. | Delete. |
| 73-75 | `accent = warning.main`, `accentDeep = warning.dark`, `trackColor = alpha(text.primary,.1)`. | `accent = "#a855f7"`, `accentDeep = "#7c3aed"`, `trackColor = "#eef2f7"`. |
| 92-98 | The rail's own card: `p:{xs:2,sm:2.5}, borderRadius:4, border: 1px solid divider, bgcolor: background.paper` — **no shadow**, so it does not read as a card next to the hero. | Wrap in `PanelCard` (`sx={{ p: { xs: 2, sm: 2.5 }, mb: 0 }}`) or inline `border:"1px solid #e4e7f0", bgcolor:"#fff"` + `PANEL_SHADOW`. |
| 109-138 | The points header is a bespoke `1.6rem/900` + uppercase label + right-aligned summary. | Structurally correct and worth keeping, but retune to the language: value `1.5rem/900/#0f172a/lineHeight:1/letterSpacing:"-1px"`, label `0.6rem/800/letterSpacing .5/uppercase/#64748b`, summary `0.78rem/700/#64748b`. Add a `SectionHeader icon="mdi:stairs-up"` above it so the card has the same anatomy as every other panel. |
| 175 | Fill `linear-gradient(90deg, ${accent}, ${accentDeep})`. | `CERT_BAR_GRADIENT` (`linear-gradient(90deg, #7c3aed, #ec4899)`). |
| 203-208 | Achieved disc: `warning.contrastText` on a warning gradient, glow `alpha(accent,.8)`. | `color:"#fff"`, `backgroundImage: CERT_BADGE_GRADIENT`, `boxShadow: "0 6px 18px -6px rgba(124,58,237,0.8)"`. |
| 210-218 | Locked disc: `text.disabled`/`text.primary`, `2px dashed alpha(text.primary,.22)`. | Next: `2px solid #7c3aed`, `color:"#0f172a"`. Not-next: `2px dashed #cbd5e1`, `color:"#94a3b8"`. |
| 219-221 | Active ring `0 0 0 4px alpha(accent,.28)`. | `0 0 0 4px rgba(124,58,237,0.28)`. |
| 237-253 | Node label `text.primary`/`text.secondary`, threshold `text.disabled`. | `#0f172a` / `#64748b`, threshold `#94a3b8`. |
| 277 | Focus ring `background.paper` + `accent`. | `CERT_FOCUS_RING`. |

### 5.14 `components/certificate/CertificateDetailDialog.tsx`

| L | Divergence | Correction |
|---|---|---|
| 75 | `useTheme()` — keep only for `useMediaQuery` at `:76`. | Strip the colour usages. |
| 205-211 | Paper `borderRadius:{xs:0, sm:4}` (good), `bgcolor: theme.palette.background.paper`. | `bgcolor: "#fff"`. |
| 222-234 | Eyebrow `0.68rem/800/letterSpacing .8/uppercase` in `warning.dark`. | `0.6rem/800/letterSpacing .6/uppercase` in `#7c3aed` — the exact `CertificatePanel.tsx:20` micro-eyebrow. |
| 235-246 | Title `{xs:"1.15rem", sm:"1.4rem"}/900/letterSpacing "-0.5px"` in `text.primary`. | `#0f172a`; keep the sizes (this is a dialog title, and `-0.5px` matches `surfaces.tsx:174`). |
| 253-279 | Revoked banner uses `alpha(error.main, .1/.3)`. | `bgcolor:"#fef2f7"`… use the band ladder: `bgcolor:"#fef2f2"`, `border:"1px solid #fecaca"`, `color:"#b91c1c"`, `borderRadius: 2.5`. |
| 297-353 | Meta tiles: `borderRadius:2, border: 1px solid divider, bgcolor: alpha(text.primary,.02)`, labels in `text.disabled`. | `borderRadius:2.5, border:"1px solid #eef2f7", bgcolor:"#fff"`, label `0.6rem/800/uppercase/#64748b`, value `0.82rem/700/#0f172a` — i.e. a `StatBox` without the accent strip. |
| 362-376 | **Primary** action is `<Button variant="contained">` with no background → tenant-primary blue. This is the module's most visible single divergence: the main CTA of the certificate dialog is not violet. | `background: CERT_CTA_GRADIENT`, `color:"#fff"`, `borderRadius:999, fontWeight:800, textTransform:"none", px:2.5, py:1`, `"&:hover":{ filter:"brightness(1.06)" }`, `boxShadow: "0 14px 30px -12px rgba(192,38,211,0.7)"`. |
| 377-409 | Three `variant="outlined"` buttons at default colour. | `borderColor:"#ede9fe", color:"#7c3aed", "&:hover":{ borderColor:"#c4b5fd", bgcolor:"#f5f3ff" }`, same radius/weight. |

### 5.15 `components/certificate/CertificatePreview.tsx` (chrome only)

| L | Divergence | Correction |
|---|---|---|
| 224-226 | Lock chip: circular 44px, `bgcolor: alpha(warning.main,.16)`, `color: warning.dark`, `border: 1px solid alpha(warning.main,.35)`. | `bgcolor:"#f5f3ff"`, `color:"#7c3aed"`, `border:"1px solid #ede9fe"`. Keep the circle here — it reads as a lock badge over artwork, not as a section tile. |
| 253 | Locked progress bar `linear-gradient(90deg, warning.main, warning.dark)`. | `CERT_BAR_GRADIENT`. |
| 233 | Track `alpha(theme.palette.text.primary, .12)`. | `rgba(255,255,255,0.55)` over the blurred artwork, or `#eef2f7` — pick one and use it in both locked previews. |
| 207-212 | Scrim `alpha(background.paper, .45 → .78)`. | `linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.82) 100%)`. The dark-mode reasoning in the comment is moot (§1.6). |
| 96, 179-191 | The scaling wrapper, `radius`, `elevated`, and the blur-on-wrapper mechanic. | **DO NOT TOUCH.** These are export-correctness mechanics, documented at `:20-36`. |

### 5.16 `components/profile/CertificatesSection.tsx`

Structurally the **best** file in the module: it already uses `ProfilePanel`,
`ProfileSectionHeader`, `SectionAction` and `StatTile`. Only colour changes.

| L | Divergence | Correction |
|---|---|---|
| 111 | `gradient="linear-gradient(135deg, #f59e0b, #d97706)"` | `gradient={CERT_BADGE_GRADIENT}` |
| 162 | `accent={STAT_ACCENT.amber}` on the Certificates tile | `accent={STAT_ACCENT.violet}` (`#7c3aed`) — and move the Points tile to `STAT_ACCENT.amber` (`:171`) so the row keeps the canonical violet/amber/green order from `profileTokens.ts:99-104`. |
| 224 | `backgroundImage: "linear-gradient(90deg, #f59e0b, #d97706)"` | `CERT_BAR_GRADIENT` |
| 260 | Focus ring `0 0 0 2px #fff, 0 0 0 4px ${STAT_ACCENT.amber}` | `CERT_FOCUS_RING` |
| 271 | `wrapperStyle={{ border: "1px solid " + PROFILE.hairline }}` | Correct — keep. |

### 5.17 `components/admin/adaptive-course/CertificateAdminSection.tsx`

| L | Divergence | Correction |
|---|---|---|
| 32 | `const AMBER_GRADIENT = "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"` — `#f97316` appears nowhere else in the app. | Delete; import `CERT_BADGE_GRADIENT`. |
| 33 | `INDIGO_GRADIENT = "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"` | Correct — it is `TILE_GRADIENT`. Import it from a shared place rather than redeclaring. |
| 35-40 | `panelSx` uses `color-mix(… var(--card-bg) 92%)` and `var(--border-default) 75%` — a faded card where the admin language uses solid `var(--card-bg)` on solid `var(--border-default)`. | `bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-card)"` + the admin card shadow. |
| 58-63 | `PanelHeader` tile is **38px, radius 2.25**, title `1.02rem/800`. | 30px, radius 2, icon 17, title `0.95rem/800` — `SectionHeader` proportions. |
| 63 | `color: "text.secondary"`. | `var(--font-secondary)`. |
| 227 | `<CircularProgress sx={{ color: "#f59e0b" }} />` | `"#7c3aed"`. |
| 327, 343 | `gradient={AMBER_GRADIENT}` | `gradient={CERT_BADGE_GRADIENT}` |

### 5.18 Adjacent surfaces to check while you are in here

Not part of the shipped module but they render certificate chrome and must not be left
amber-or-blue once the rest is violet:
`components/adaptive-journey/CertificateCard.tsx`,
`components/course/CertificateButtons.tsx`,
`components/certificate/CertificateLearnerToolbar.tsx`,
`app/certificates/loading.tsx`, `app/admin/certificates/loading.tsx`.
Apply §1 and §3 to each. Do not restyle `components/certificate/DynamicCertificate.tsx`'s
canvas — it is artwork (§6).

---

## 6. WHAT MUST NOT CHANGE — the artwork is stationery

**`components/certificate/CertificateArtwork.tsx` and `components/certificate/ornaments.tsx`
are OUT OF SCOPE. Do not "fix" them. Do not make them theme-aware. Do not apply any token
in §1 to them.**

They are a printed document, not app chrome. Specifically:

1. **They are deliberately MUI-free.** Plain `div`s with inline `style` objects, no `sx`,
   no `useTheme`. The reasoning is documented in the file header
   (`CertificateArtwork.tsx:26-54`) and it is an *export-correctness* requirement, not a
   preference: `sx` compiles to Emotion classes in a stylesheet, and `html-to-image` has to
   reach those rules through `CSSStyleSheet.cssRules` — the exact call that needed the
   cross-origin patch in `lib/utils/pdf-generation.utils.ts` before exports worked at all.
   Inline styles ride on the cloned node and cannot fail that way. **Converting the artwork
   to `sx` would break PNG and PDF export.**
2. **Their colours are frozen data, not design.** Every colour comes from the resolved
   `design.palette`, which is snapshotted into `design_snapshot` at issuance. A certificate
   issued last year must still render exactly as issued. Restyling the artwork rewrites
   history.
3. **They have no light/dark variant on purpose.** The document's colours *are* the design.
   The only literal colours in the file are pure black and pure white, used solely as
   contrast endpoints (`CONTRAST_LIGHT` / `CONTRAST_DARK`).
4. **They have no hooks and no fetching in the render path** (`:44-50`) — anything that
   resolves one tick late lands in the learner's PNG as a blank patch. Do not add a hook.
5. **A certificate should look like a certificate.** Gold seals, guilloche, diamond rules
   and metal labels are correct *there* and wrong everywhere else. The violet identity in
   §3 governs the **chrome around** the artwork; it does not govern the artwork.

Also do not touch, for the same export reasons:
- `CertificatePreview.tsx`'s scale wrapper, `radius`, `elevated`, ref-forwarding and
  blur-on-wrapper mechanics (`:56-110`, `:180-191`) — only the overlay's *colours* are in
  scope (§5.15).
- `lib/certificates/presets.ts`, `lib/certificates/export.ts`,
  `lib/certificates/format.ts`, `lib/certificates/types.ts`.
- `components/certificate/DynamicCertificate.tsx`'s canvas.

**In scope: cards, headers, dialogs, tabs, buttons, chips, empty states, skeletons, grids,
rails and page frames. Out of scope: the document.**

---

## 7. Definition of done

1. No `useTheme()` in any certificate chrome file except for `useMediaQuery(breakpoints)`.
2. No `theme.palette.warning`, `theme.palette.divider`, `theme.palette.background.paper`,
   `theme.palette.text.*` or `alpha()` in chrome.
3. No `palette.mode === "dark"` branches.
4. Zero `#f59e0b` / `#d97706` / `#f97316` outside `CertificateArtwork.tsx`, `ornaments.tsx`
   and `lib/certificates/presets.ts`.
5. `accent="purple"` on both certificate `ModulePageHeader`s.
6. Every primary button carries an explicit gradient background.
7. `app/admin/certificates/page.tsx` uses `StatStrip` + `SegmentedTabs` and no page-level
   padding Box.
8. `app/certificates/page.tsx` body is `PanelCard` + `SectionHeader` at `spacing 2.5`.
9. `CertificateArtwork.tsx` and `ornaments.tsx` are untouched in the diff.
10. Open `/dashboard` and `/certificates` side by side: the certificate badge, the progress
    bar and the CTA are the same violet on both.
