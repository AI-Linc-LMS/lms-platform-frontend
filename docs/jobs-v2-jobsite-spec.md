# Jobs v2 — "Job Site" Spec (board, card, detail, filters)

**Status:** implementation spec. Supersedes §5.1 and §5.4 of
`docs/jobs-v2-redesign-spec.md` (the Career Ledger spec) and extends it. Everything else in
that document — §2 TOKENS, §3 TYPOGRAPHY, §4 COMPONENT KIT, §6 MOTION, §8 ACCESSIBILITY,
§10 NON-NEGOTIABLES — **still holds verbatim and is the substrate for this one.**

**The complaint this answers.** After using the shipped redesign the product owner said: *"make
it more like a traditional job searching website like Naukri or LinkedIn — the UI is pretty
plain and simple, and the about-the-job description is very plain. Redesign them completely."*

**The two root causes, named.**

1. **The board is a page of cards, not a search product.** There is no pane, no counted facets,
   no sense of a result set being worked through. Every card ejects you to a full page and back
   costs a navigation. That reads as a list, not as a job site.
2. **The description is one string.** `job_scraper/services/enrichment.py` already asks the model
   for a summary, a Responsibilities block and a Requirements block — and then glues them into
   one `job_description` text field, which `JobDetailView.tsx` renders through `<Prose>` as
   `pre-wrap` in a single card. **We generate structure and destroy it at the boundary.** Fixing
   this is mostly *stop flattening*, which is why it adds no invention risk.

**The thesis.** We hold ~500 curated roles, not 11,817. We are not competing on inventory, so we
do not copy a market-scale board's noise — no injected signup interstitials, no paid "urgently
hiring", no applicant counts we do not have. We win on the one question those five boards answer
badly: **"can I actually apply to this, and what happens when I click?"**

---

## 0. Decisions, up front

| # | Decision | Why |
|---|---|---|
| D1 | **Split pane at `lg+` (≥1200), full-width list below.** The pane is a **real route**: `/jobs-v2/[id]`. | ~500 roles means comparison beats exploration; every apply is an outbound hand-off so ejecting to a page and back is pure cost. But we **email** students their assigned jobs, so the detail URL must be shareable, bookmarkable and land correctly. LinkedIn's `currentJobId` query param is the wrong half of this; Naukri's separate-page-per-job is the other wrong half. |
| D2 | **No auto-selected first job.** `/jobs-v2` at `lg+` shows a purposeful `BoardPane`, not `jobs[0]`. | Auto-select fabricates a choice the student did not make, quietly promotes whichever employer sorts first (we already had six consecutive GitLab cards once), and either churns history or desyncs the URL from the pane. Costs one click; buys a board URL that stays a board URL. |
| D3 | **Filters stay a pill row. No left rail, at any breakpoint.** But every option now carries a live count, eligibility is promoted to a first-class toggle, and mobile gets a deferred sheet. | Three columns at 1280px leaves a 300px facet rail, a 380px result rail and a 500px pane — worse than either two-column layout. Naukri can afford a rail because it has no pane. We take Naukri's *counts* (the load-bearing feature) and Instahyre's *deferred apply* (mobile only) without taking the rail. |
| D4 | **The structured description is the product.** `role_summary` + `responsibilities` + `requirements_must` + `requirements_good` + `tech_stack` + `perks` become real columns and real sections. `job_description` survives as a **derived** flat projection and a **permanent** fallback. | Manual admin-authored jobs will always exist. The fallback is not a shim. |
| D5 | **Eligibility, computed and explained, sits above the JD.** None of the five boards has this. It is the first question every Indian student asks. | We own the rule and its inputs, so we can print both. |
| D6 | **Ship nothing from the applicant-count / view-count / recruiter-activity / employer-responsiveness / company-rating / easy-apply families.** | We have no such data. A fabricated signal is discovered the moment a student compares us with Naukri, and it is discovered *about us*. |
| D7 | **A legacy flat description is parsed at render time into the same section shapes**, when and only when it already carries the markers. | 486 published jobs look structured on day one, before a single BE phase lands. A parse is not a generation. |

---

## 1. BOARD — the results experience

### 1.1 Routes and shell

```
/jobs-v2              board.  At lg+: rail + BoardPane.       Below lg: full-width list.
/jobs-v2/[id]         posting. At lg+: rail + JobDetailView.  Below lg: full-width detail page.
/jobs-v2/[id]/apply   unchanged.
/jobs-v2/applications/[id]  unchanged.
```

Both routes render the **same shell component**, `JobsSplitLayout`, differing only in what they
hand it. Every existing route contract holds: `PageShell` → `JobsScope` → `ModulePageHeader` →
content, one `loading.tsx` per segment.

```tsx
// app/jobs-v2/page.tsx
<JobsSplitLayout
  rail={<JobResultsRail filters={filters} selectedId={null} />}
  pane={<BoardPane filters={filters} />}
  showBelowLg="rail"
/>

// app/jobs-v2/[id]/page.tsx
<JobsSplitLayout
  rail={<JobResultsRail filters={filters} selectedId={job.id} />}
  pane={<JobDetailView job={job} … />}
  showBelowLg="pane"
/>
```

`showBelowLg` is a **CSS** switch (`display: {xs:"none", lg:"block"}` on the other child), never
`useMediaQuery`. Both children are always in the tree, so there is one render tree, no hydration
jump, and the six `data-tour-id`s stay present at every breakpoint (§5.1 of the Career Ledger
spec, preserved).

`useMediaQuery(theme.breakpoints.up("lg"))` survives for exactly one thing: gating whether
`JobResultsRail` **fetches** on the detail route. It starts `false`, so SSR and first paint issue
no request; the rail's layout never depends on it.

### 1.2 The split geometry (`lg+`)

```
┌───────────────────────────────────────────── page (does not scroll) ──┐
│ ModulePageHeader (Jobs) — normal page flow, scrolls away              │
│ Search + FilterBar + ActiveFilters — sticky, top: var(--j-split-top)  │
│ Result meta row: "Showing 1–20 of 84" · sort · saved                  │
├──────────────── 400px ───────────┬──────────── 1fr (min 520px) ───────┤
│ RAIL                             │ PANE                               │
│ overflow-y: auto                 │ overflow-y: auto                   │
│ overscroll-behavior: contain     │ overscroll-behavior: contain       │
│ scroll position PRESERVED        │ scrollTop = 0 on every selection   │
│ across selections                │                                    │
│ …20 JobRailCards…                │ sticky JobHeroBar (h 76) inside    │
│ JPagination (in-rail footer)     │ …sections…                         │
└──────────────────────────────────┴────────────────────────────────────┘
```

- Grid: `display: grid; gridTemplateColumns: "400px minmax(520px, 1fr)"; gap: 0;`
  with a `borderInlineStart: 1px solid J.hairline` on the pane. **No gutter, no card gap between
  the columns** — one continuous hairline is what makes two panes read as one instrument
  (the roadmaps density note).
- Height: `height: calc(100dvh - var(--j-split-top) - 16px)` where
  `--j-split-top` is set once in the `.jobs-scope` block to the app bar + header + filter-rail
  height. `dvh`, never `vh` (§7.8).
- **This is the one sanctioned nested scroller in the module.** §4.10's "no nested scroller" rule
  was written for `JDataTable` and still binds it. The exception is narrow and stated here:
  exactly two panes, only at `lg+`, the page body itself must not scroll while the split is
  mounted (`overflow: hidden` on the split's own wrapper, never on `body`), both panes carry
  `overscroll-behavior: contain`, and both are focusable scroll regions
  (`tabIndex={0}` + `role="region"` + `aria-label`) so a keyboard user can scroll them.
- **Sticky is unreliable here** and we know why: `MainLayout` gives ancestors `overflow: auto`,
  which makes them the sticky containing block (this is documented in `JobDetailView.tsx` where
  the mobile apply bar had to become `fixed`). Inside the pane's own `overflow-y: auto` box,
  `position: sticky; top: 0` **is** reliable, because that box is the containing block. The
  `JobHeroBar` therefore sticks *inside the pane*, not to the viewport.
- Below `lg`, the split wrapper drops to `display: block; height: auto; overflow: visible` and
  both panes lose their scrollers. **Nothing about the mobile page is a nested scroller.**

### 1.3 Selection behaviour

- A rail card's title is a real `<Link href={/jobs-v2/${id}?${boardQuery}}>` (the stretched-link
  recipe already in `JobCardV2.tsx`). Middle-click, cmd-click and "open in new tab" all work.
- Left-click at `lg+` is intercepted by `JobsSplitLayout` and does `router.push(href, { scroll: false })`.
  One history entry per real choice; browser back walks the roles you actually opened.
- `boardQuery` is `serializeState(state, defaults)` from `lib/jobs-v2/useJobsUrlState.ts`,
  unchanged — the board's whole filter state rides on the detail URL, which is what makes the
  rail come back correct and what makes "Back to jobs" land on page 4 of the filtered search.
- The `?ids=` sibling contract in `JobDetailView` (prev/next) is **preserved** and now also
  drives ⌘↑/⌘↓ in the rail.
- Keyboard: `j`/`k` or ↑/↓ move selection within the rail when focus is inside it, `Enter` opens,
  `Esc` returns focus to the search input. All behind a single `useRailKeys(...)` hook, and all
  suppressed while focus is in a text field.
- On selection the pane sets `scrollTop = 0` and moves focus to the pane's `<h1>` (`tabIndex={-1}`),
  announcing the new posting to a screen reader. The rail's scroll position is untouched.

### 1.4 Densities

| Surface | Item height | Per page | Spacing |
|---|---|---|---|
| Rail (`lg+`) | `JobRailCard`, 116–132px | 20 | `Stack spacing={0}` with `borderBottom: 1px solid J.hairlineSoft`; the selected card gets `bgcolor: J.azureSoft` + a 3px `J.azure` inline-start rule, and `aria-current="true"` |
| Full list (`md`–`lg`) | `JobCardV2`, ~200px | 20 | two-column grid, `gap: 1.5` |
| Full list (`xs`–`sm`) | `JobCardV2`, ~220px | 20 | single column, `Stack spacing={1.5}` |

The card/list `JTabs` view switch (`view=card|list`) is **preserved below `lg`** and hidden at
`lg+`, where the rail is the only density.

### 1.5 Pagination

Numbered `JPagination`, unchanged, with the page in the URL. **No infinite scroll** — every one
of the five boards paginates and none of them makes you lose your place. At `lg+` the pagination
renders as the rail's last row (inside the rail's scroller), not below the split.
`SUPPORTS_SERVER_PAGINATION = false` stays; the honest "Showing 1–20 of 84 matching (137 total)"
label from §5.1.1 is unchanged.

### 1.6 `BoardPane` — what fills the pane before a selection

Not a job. A `JCard` at `maxWidth: 560`, centred, containing, in order:

1. `JobSearchIllustration tone="muted"`, 120px.
2. `TYPE.h2` — "Pick a role to read the full posting".
3. `TYPE.body` — "Everything the employer stated, plus a check of it against your profile."
4. A `HairlineStrip` of **three honest numbers only**: *N roles open to you* (the student's own
   visible count — never a marketing total), *N you're eligible for*, *N saved*. Each cell is a
   filter toggle (`onClick` → `elig=1`, `fav=1`), which is how §4.4's "5 tiles + 6 chips"
   collapse rule is honoured.
5. `TYPE.micro` keyboard hint: "↑ ↓ to move, Enter to open".

If the result set is empty, `BoardPane` renders the same `EmptyState` the list renders, once, in
the pane; the rail shows the reset action.

### 1.7 States (all four, on both panes)

Unchanged from §5.1 and §10.8, restated because the split doubles the surfaces:

- **Loading (first)** — rail: `JobListSkeleton count={6} view="rail"`. Pane: `JobDetailSkeleton`.
- **Refetching** — the rail dims to `opacity: .55` with `aria-busy="true"`; it does **not**
  unmount, and the pane is untouched. A filter change must never blank the posting you are reading.
- **Empty (nothing matches)** — `EmptyState` + "Clear all filters" + `excludingHints`.
- **Empty (nothing exists)** — different copy, no clear action.
- **Error** — `ErrorState` + Retry. A `catch` that sets `[]` remains a review blocker.
- **Profile-locked** — `ProfileLockCard preview={<JobListSkeleton count={3} />}`, unchanged.

### 1.8 What we deliberately do not copy

- Naukri's injected "Register for free" interstitial between cards 2 and 3, its salary widget and
  its Top Companies widget. **No non-job block ever enters the result stream.** That is
  monetisation wearing information design.
- Indeed's "Urgently hiring" (a paid Sponsored-Jobs feature, not an organic fact).
- LinkedIn's replacement of filters with natural-language query. They can fund that with intent
  data at their scale; we cannot, and our facets are cheap because our set is small.
- Wellfound's company-grouped list. Grouping is good for "who is this company" and actively bad
  for "compare these five backend roles", which is the job our students are doing.

---

## 2. RESULT CARD — full anatomy

Two components, one vocabulary. `JobCardV2` (existing, below `lg`) is extended; `JobRailCard`
(new, `lg+`) is its compressed sibling. **Both import the same atoms** from
`components/jobs-v2/board/JobCardV2.tsx` (`SignalChip`, `DeadlineChip`, `SkillMatchChip`,
`JobSignals`, `jobMetaItems`, `FavoriteButton`, `stretchedLink`) — the discipline that already
keeps card and row honest.

### 2.1 `JobRailCard` — element by element

```
┌────────────────────────────────────────────── 400px, p: 1.75 ──┐
│ [40px logo]  Senior Backend Engineer            ♡              │  ← line 1
│              Razorpay                                          │  ← line 2
│  ⌖ Bengaluru · Hybrid · 2–4 yrs                                │  ← line 3, MetaRow dense
│  [You have Python, Django +2]  [Eligible]  [Closes in 4 days]  │  ← line 4, signals
│  3 days ago                                                    │  ← line 5, micro
└────────────────────────────────────────────────────────────────┘
```

| # | Element | Source | Missing → |
|---|---|---|---|
| 1 | `CompanyLogo size={40}` | `company_logo` | initial letter on `var(--j-grad-badge)` — never a broken glyph, never a blank box |
| 2 | Title, `TYPE.h4`, `lineClamp(2)`, the stretched link and the only tab stop | `job_title` | `t("jobsV2.board.untitledRole")` |
| 3 | Company, `TYPE.small`, single line ellipsis | `company_name` | the whole line is omitted (never "Unknown company") |
| 4 | `FavoriteButton` — 44px, real sibling `<button>`, optimistic toggle with rollback, hidden in admin mode | `is_favourited` | renders unfilled |
| 5 | `MetaRow dense max={3}` in the fixed order **location · work mode · experience** | `location`, `work_mode`, `years_of_experience` | each chip **omitted**, no dash, no empty slot. If all three are missing the row does not render |
| 6 | Signal strip — see 2.3 | | strip omitted when it would be empty |
| 7 | Posted age, `TYPE.micro` | `created_at` via `postedLabel()` | **omitted**. `postedLabel` returns `null` for an undated row and we never fabricate "Recently" |

The rail card carries **no description snippet, no skill chip row and no Apply button.** It is a
navigation target for the pane, which is exactly LinkedIn's reason for a thin card. Salary is not
on the rail card either — see 2.4.

### 2.2 `JobCardV2` (below `lg`) — changes from shipped

Order preserved, three additions:

1. `role_summary` replaces the `descriptionPreview(job_description)` excerpt when present.
   `descriptionPreview` **stays** as the fallback for legacy rows — it is a safety net over data
   we cannot re-ingest and deleting it would regress every unenriched row.
2. Salary renders as a **`MetaChip`**, verbatim as the admin typed it, when
   `formatSalary(job.salary)` returns non-null. When null the chip is omitted on the card
   (see 2.4).
3. Skill chips: matched-first ordering is already implemented (`jobSkillLabels(job, 5, learnerTokens)`).
   Add the **visual promotion** the shipped card lacks: a matched chip renders
   `SkillChip selected`, an unmatched one renders plain. Clamped at 5 with a `+N` `MetaChip`.

`memo` comparator widens to `role_summary`, `work_mode` and `tech_stack.length`.

### 2.3 The signal strip — the complete, closed list

`JobSignals` renders **only** these, in this order. Nothing else may be added to it without a
data source named in §6.

| Signal | Component | Condition | Backing |
|---|---|---|---|
| Applied | `StatusPill kind="application" value="applied"` | `has_applied` | the student's own `JobApplication` row |
| Internship | `SignalChip` azure | `jobTypeBadge(job)` returns a value **and** `employment_type` has not already said so | `job_type` |
| Skills you have | `SkillMatchChip` | `matchedSkills(job, learnerTokens).length > 0` | the profile the gate already fetched. **Never a percentage. Never a zero.** When we do not know the learner's skills the chip does not render at all |
| Eligible / Not eligible | `SignalChip` — solid success, or dashed warn with the failing criterion named | `eligible_to_apply` is a boolean | course + college rule; see §3.5 for the enforcement caveat |
| Closes in N days | `DeadlineChip`, tinted by `deadlineLabel().urgency` | `application_deadline` set | employer-stated. **This is our honest urgency.** We never fake the other kind |
| Closed | `SignalChip` dashed, `J.dangerFg` | `is_open === false` | status, or a passed deadline |
| Why you see this | `SignalChip` quiet, e.g. "Assigned by your mentor" | `visibility_reason !== "open"` | `jobs_v2/visibility.py`. Every string is backed by the actual rule (§6.4) |

Wellfound's discipline, adopted: **a badge carries its own justification.** Every one of the
above has a `title` (and, on touch, a tap-to-reveal `Popover`) stating the rule in one sentence —
"You are enrolled in Python Full-Stack, which this role is open to."

### 2.4 Missing fields — the rule, and the salary case

**Most of our rows have no salary.** `salary` is a free-text `CharField`; enrichment fills it
only when the posting states it.

The rule, everywhere in this module:

> **On a card, a missing field is omitted — no dash, no "—", no "Not specified", no empty slot.
> In the detail page's `Role snapshot` label/value block, and only there, a missing field renders
> its label with `Not disclosed` in `J.ink4`.**

Why the asymmetry: on a card, a row of placeholders is noise that costs a line each and teaches
the eye nothing (Naukri does exactly this — salary simply vanishes from the meta line, and the
detail page says "Not Disclosed"). In a label/value block the labels are the structure, so a
silently absent row makes the reader wonder whether we failed to load it.

Consequences, spelled out so nobody re-litigates them per field:

- No salary → no salary chip, on rail card and board card. `Role snapshot` says "Not disclosed".
- No experience → no experience chip. `Role snapshot` omits the row entirely (an unstated
  experience range is not "not disclosed", it is *absent*, and printing a row would imply we
  asked).
- No `work_mode` → no chip. An unstated location is **not** evidence of on-site. Empty is the
  correct answer and we never infer it.
- No `created_at` → no posted chip.
- No logo → initial-letter fallback.
- No company name → the line is dropped, not filled.
- No `role_summary` **and** no legacy description → the card renders without a snippet and the
  detail page renders its sparse state.

### 2.5 What never goes on a card

Applicant counts. View counts. "Trending". "Be an early applicant". "Actively hiring".
"Responds within N days". A company star rating. A match percentage. An Apply button.

The last one is a design decision, not a data one: apply is an outbound jump to a third party and
it deserves the detail page's context — the destination domain, the eligibility check, the safety
notice. A one-click apply on a card that lands you on a stranger's ATS is how a student ends up
blaming us.

`applications_count` and `favorites_count` **are** on the payload today and §5.4 of the Career
Ledger spec surfaces them as "42 applicants · 18 saved" under the CTA. **This spec removes that.**
They count applications *recorded on our platform*, not applications the employer received — for
an external role the number is a count of students who clicked our button, which a reader will
inevitably read as competition. `favorites_count` stays available to admin surfaces; neither is
rendered to a student.

---

## 3. JOB DETAIL — the complete page

This is the "very plain" complaint, and it gets the most words.

### 3.1 Structure at a glance

```
lg+ : inside the pane's scroller          below lg : one column, page scroll
┌──────────────────────────────────────┐
│ JobHeroBar        sticky, top: 0     │  ← identity + apply, always reachable
├──────────────────────────────────────┤
│ EligibilityCard   ← ABOVE the JD     │
│ About this role   role_summary       │
│   + HighlightStrip                   │
│ What you'll do    responsibilities   │
│ What they're looking for  must/good  │
│ Skills and stack  key_skills+tech    │
│ Eligibility detail  gates table      │
│ Selection process role_process       │
│ Perks and benefits  perks            │
│ Role snapshot     label/value        │
│ About {company}   company_info       │
│ SafetyNotice                         │
│ SimilarJobs       4 rows             │
└──────────────────────────────────────┘
                                          + fixed bottom apply bar (existing, unchanged)
```

At `lg+` the right rail of the old two-column detail **disappears**: the pane is already 520–900px
and a 340px rail inside it would leave 200px of prose. The apply card, `JobDetailsPanel` and
`AttachedJdCard` fold into the flow (`Role snapshot`, and the JD attachment as a row inside it).
Below `lg` the existing `1fr / 340px` grid at `md+` **is preserved unchanged**, with the new
sections filling the left column.

### 3.2 `JobHeroBar` — the apply affordance

Sticky inside the pane at `lg+`; below `lg` the existing `ModulePageHeader` hero stays and this
bar is not rendered (the fixed bottom bar already covers reachability there).

```
┌── h 76, bgcolor J.surface, borderBottom 1px J.hairline, boxShadow on scroll ──┐
│ [40 logo]  Senior Backend Engineer                    ♡ Save   [ Apply ↗ ]    │
│            Razorpay · Bengaluru · Hybrid · ₹18–24 LPA                          │
│                                            greenhouse.io ↗                     │
└────────────────────────────────────────────────────────────────────────────────┘
```

- The apply affordance appears **at least twice** (hero bar + the `Role snapshot` apply block +
  the mobile fixed bar) — the pattern common to all five boards.
- **The button says where it goes.** External: `Apply on the company site ↗` with the destination
  host (`new URL(job.apply_link).hostname`, `www.` stripped) rendered in `TYPE.micro` directly
  beneath it. Internal: `Apply` with `mdi:arrow-right`, no external glyph, because it is a
  navigation that stays inside the app.
- `ApplyCta` remains **one component bound to one `useApply(job)` hook**, in all three placements.
  The external sequence is unchanged and its order stays corrected:
  `window.open(job.apply_link, "_blank", "noopener")` **first, synchronously inside the click
  handler**, then `await applyForJob({ external: true })`; a `null` return renders the inline
  "your browser blocked the tab" link instead of the dialog.
- `boxShadow: SHADOW.sticky` is applied only once `pane.scrollTop > 8`, via a scroll listener on
  the pane (rAF-throttled). A permanently shadowed bar reads as a modal header.
- Deadline urgency promotes into the bar as a chip when `soon` or `urgent`.
- **Closed roles**: when `is_open === false` the button is `disabled` with a
  `disabledReason` naming the fact — "This role closed on 12 Aug" or "The employer closed this
  role". §4.1 requires every disabled button in this module to say why.

### 3.3 The structured description — solving "very plain"

This is D4 and D7 together. Section order, each self-omitting when its field is empty:

**1. About this role** — `role_summary`, one lead paragraph.
`TYPE.prose` at `fontSize: "1rem"`, `lineHeight: 1.7`, `maxWidth: "68ch"`, `color: J.ink`
(not `ink2` — this is the lead, it carries full ink). No bullets in this card. A confident
two-sentence opening instead of a wall does most of the work the product owner is asking for.

**2. Highlights** — a `HighlightStrip` of computed fact chips, inside the same card, directly
under the paragraph, separated by a `HairlineStrip`-style rule.
**Computed in Python, never asked of the model** (§6.1): a model asked for "highlights" writes
marketing copy; a function cannot. Chips render only for facts that exist:
`work_mode` · `years_of_experience` · salary verbatim · `number_of_openings` ·
"N technologies" from `len(tech_stack)` · employment type.

**3. What you'll do** — `responsibilities` through `BulletList variant="rule"` (the 1×8px accent
rule from `microRuleBullet`, not a disc). First 8 shown; a `JButton variant="quiet"` "Show all N"
discloses the rest. Each item is one duty, verb-first, ≤180 chars — enforced by the applier, not
requested of the model.

**4. What they're looking for** — one `JCard`, two blocks:
- **Must have** — `BulletList variant="check"` (`mdi:check`, `J.successFg`), full ink.
- **Good to have** — `BulletList variant="plus"` (`mdi:plus`, `J.ink3`), muted. **The whole
  block disappears when `requirements_good` is empty**, which is ~60% of rows.
The two lists are disjoint by construction (the applier subtracts `must` from `good`), for the
same reason `dedupe_skills` exists: a UI that renders both must not show the same item twice.

**5. Skills and stack** — `SkillChip` row. `key_skills` ∪ `mandatory_skills` ∪ `tech_stack`,
folded with `foldToken`. **If `tech_stack` overlaps the skills by more than 80%, render one
merged "Skills and stack" section**; otherwise two sub-blocks under one header. This page has
already been burned once by rendering two lists that turned out identical.
Matched skills render `SkillChip selected` and sort first.

**6. Eligibility** — `EligibilityChecklist`, the existing `RequirementsList` promoted (§3.5).
Positioned **below** the requirement bullets: it is the shortlisting gate table, not part of the
pitch. But its *summary* (`EligibilityCard`) sits at the very top of the pane, above everything.

**7. Selection process** — `role_process`, which now receives `interview_process` as `- ` lines
and is therefore often populated for the first time. `BulletList variant="numbered"`.
None of the five boards offers this; it is a real differentiator.

**8. Perks and benefits** — `perks` through `BulletList variant="rule"`. Usually absent (~85%).

**9. Role snapshot** — the Naukri chipped-metadata block, whose shape Indian students recognise.
`DefinitionList` (existing, `ui/Surfaces.tsx`) in two columns at `md+`:
role category · department · industry · employment type · education (UG / PG) · applicable
passout year · openings · closing date · salary (**"Not disclosed"** when empty — the one place
that string appears) · attached JD (a `JButton variant="secondary"` row when `jd_file_url`).

**10. About {company}** — `company_info` through `<Prose>`. Ends with, when we have it, the
apply destination domain as a plain line: "Applications go to greenhouse.io."

**11. Safety notice** — a `Notice tone="quiet"` (existing kit component), in Naukri's spirit and
doubling as an honest explanation of the hand-off:
> "AI Linc never asks for money for a job or an interview. You apply on the employer's own site
> — we do not collect a fee and we do not receive your application."

**12. Similar jobs** — §3.6.

**Typographic rules that make this not-plain**, and are the actual answer to the complaint:

- Exactly **one** paragraph of prose per card. Everything else is a list or a label/value pair.
- Section headers sit **on the canvas**, not inside the card they label (`SectionHeader`, §4.5) —
  so the page reads as a stack of labelled objects rather than one document.
- Measure is capped at `68ch` for the lead and `72ch` for `<Prose>`. A 900px pane at 15px runs
  ~110 characters, which is the actual reason LinkedIn's JD reads as a wall even when it *is*
  paragraphed.
- Bullets are 1×8px accent rules or glyphs, never discs.
- Vertical rhythm: `mb: 3` between sections, `mb: 1.75` between a `SectionHeader` and its card.

**The legacy fallback (permanent).** When `role_summary` and `responsibilities` are **both**
empty:
1. Try `parseFlatDescription(job.job_description)` (§5.7) — a render-time parse, no network, no
   model, that splits our own stored text on `Responsibilities:` / `Requirements:` /
   `Qualifications:` / `What you'll do` markers into the same section shapes. It returns `null`
   unless the markers are present and the resulting blocks are non-trivial.
2. Otherwise render `<Prose text={job.job_description} />` exactly as today.
3. Otherwise the existing sparse state.

Rows never blank, manual jobs always render, and 486 published rows look structured before a
single backend phase lands.

### 3.4 `EligibilityCard` — the section none of them have

Above everything, directly under the hero bar. This is D5.

```
┌── JCard accent="azure" ────────────────────────────────────────┐
│ ✓  You can apply to this role                                  │
│    Open to your Python Full-Stack cohort                       │
│    ✓ Passout year 2026        needs 2025–2026 · yours 2026     │
│    ✓ Graduation 68%           needs 60% · yours 68%            │
│    ✓ Enrolled course          Python Full-Stack                │
│    ⚠ Class 12 percentage      needs 70% · not on your profile  │
│      [ Add it to your profile → ]                              │
└────────────────────────────────────────────────────────────────┘
```

- Header line resolves to one of three, and only three:
  - `eligible === true` → "You can apply to this role", `J.successFg`.
  - `eligible === false` → "You cannot apply to this role yet" plus the **named blocking
    criterion**, `J.warnFg`, dashed border.
  - unknown (signed out, no profile) → the card does not render at all. We never print a
    judgement of a student whose data we do not have.
- Each row is `{ label, requirement, yours, status }` with `status: "pass" | "fail" | "unknown"`.
  A `"fail"` or `"unknown"` row that maps to a profile field renders a `JButton variant="quiet"`
  deep-linking to that field (`/profile#education`), because a gate you cannot act on is just a
  rejection.
- **The enforcement caveat, and it is load-bearing.** `get_eligible_to_apply` in
  `jobs_v2/serializers.py` checks **courses and college mappings only**. The passout year and the
  three percentage gates are collected by the admin form, shown to the student, and **not
  enforced at apply time**. So each check carries `enforced: true | false`, and:
  - the card's headline verdict and the Apply button's disabled state come from **`enforced`
    checks only** — behaviour is preserved exactly;
  - non-enforced rows render under a sub-label "**Stated by the employer**" with the honest
    framing "the employer says they check this; we do not block your application on it".

  Telling a student "you are not eligible" when the button in fact works, or the reverse, is
  worse than showing no card. This distinction is not optional.

### 3.5 Company panel

We hold `company_name`, `company_logo`, `company_info`, `department`, `industry_type` and the
apply destination domain. That is what the panel shows, and nothing else.

**Explicitly not shown:** a star rating, a review count, employee count, funding stage, investor
badges, "actively hiring", response-time claims. We have no AmbitionBox/Glassdoor licence, no
review corpus and no recruiter-side telemetry. Naukri gives ratings prime real estate on every
card and an Indian student's eye goes there second; we cannot follow, and a fabricated 3.7 is the
single most damaging thing on this page.

### 3.6 Similar jobs

Header: "Other roles you can apply to" — **not** "Jobs you might be interested in", because our
set is already visibility-filtered to this student and the stronger claim is true.

Up to 4 `JobRailCard`s at `density="compact"`, each carrying its **"Why you're seeing this"** line
(`visibility_reason`). Sourced from `related_jobs` on the detail payload (§6.4): the same visible
set, ranked by shared skill tokens → same `role_category` → recency, excluding this job and any
the student has applied to. Renders nothing when the list is empty — never a padded row.

### 3.7 Closed and expired roles

The honesty duty in the other direction. Today:

- `JobListAPIView` **drops** an `active` job whose `application_deadline` has passed
  (`Q(status='active') & (deadline isnull | deadline >= now)`), so it silently vanishes from the
  board mid-search.
- `JobDetailAPIView` does **not** apply that clause, so the same job still returns 200 with a live
  Apply button — and we email these links.

Both are fixed, additively (§6.5): the list keeps the row and marks it, the detail exposes
`is_open`, and the FE renders `Closed` in place with the apply button disabled and a reason. A
student who follows our link into a dead ATS page blames us, not the employer.

---

## 4. FILTERS

### 4.1 The system

One `FilterBar` row of `FilterPopover` pills, identical at every breakpoint, sticky above the
split. **No sidebar at any breakpoint** (D3). Preserved from the shipped board:
`useJobFilters()`, `useJobsUrlState()`, the URL keys, the leave-one-out facet computation, the
`useSeq` stale-response guard, and `SUPPORTS_SERVER_PAGINATION`.

Order, left to right — priority order for this audience, not alphabetical:

| # | Pill | URL key | Values | Side |
|---|---|---|---|---|
| 0 | **Only jobs I'm eligible for** — a `SegmentedToggle`, not a popover, always visible, first | `elig` | `1` | client (`eligible_to_apply`) |
| 1 | Role / function | `role` | `role_category` values present in the set | client |
| 2 | Job type | `type` | `job` \| `internship` | server (existing) |
| 3 | Location | `loc` | distinct `location` | server (existing) |
| 4 | Work mode | `wm` | `On-site` \| `Hybrid` \| `Remote` | client (new column) |
| 5 | Experience | `exp` | `0-1` `1-3` `3-5` `5-10` `10+` | client (existing bands) |
| 6 | Skills | `skills` | multi-select, ranked by frequency, windowed at 60 | client (existing) |
| 7 | Employment type | `emp` | Full-time \| Part-time \| Contract | server (existing) |
| 8 | Posted | `posted` | `1d` `7d` `30d` | client (existing) |
| 9 | Closing | `close` | `3d` `7d` `30d` | client (new) |
| 10 | Salary | `salary` | `disclosed` \| `undisclosed` | client (existing) |
| 11 | Saved | `fav` | `1` | client (existing) |

**No salary range facet.** `salary` is an unparsed free-text `CharField`; a "6–10 LPA" facet over
unparsed strings is a filter that lies. Ship it the day a numeric `salary_min` / `salary_max`
lands, and not before. The disclosed/undisclosed toggle is honest and stays.

**No company-type or industry facet.** Meaningless across ~500 curated roles.

### 4.2 Counts — the load-bearing feature

Every option in every popover carries a live count, computed over **the student's own visible
set**, leave-one-out: the count for option *o* of facet *f* is the size of
`applyClientFilters(jobs, filters, /* omit */ f)` filtered to *o*. `useJobFilters` already does
exactly this to build `locationOptions` / `jobTypeOptions` / `employmentOptions` / `skillFacets`;
the change is to extend it to every facet and to render the number.

- Rendered as a tabular `CountPill` on the option row, `J.ink3`.
- **A zero-count option renders disabled, not hidden.** Hiding it makes the facet list shift
  under the cursor between openings; disabling it tells the student the truth ("Remote: 0").
- Four options then a `JButton variant="quiet"` "View more" inside the popover — Naukri's
  gesture, which Indian students already know.
- The pill's own badge is the number of **selected** values, not the count.

The one thing counts must never be: a total that is not the student's own. Visibility is
per-student, so "500 jobs" on a marketing page and the number above this list are different
facts. The list shows the student's own count, always.

### 4.3 Active filters

`ActiveFilters` (existing) renders below the bar whenever anything is set: one removable chip per
active **value** (not per facet — three skills are three chips), plus "Clear all". Mandatory,
unchanged; it is the only way to see what is applied and the only escape from a zero-result dead
end. Extended: each chip's label is the *human* label, never the raw value
(`"Work mode: Remote"`, not `"wm=Remote"`).

### 4.4 Apply timing

- **Desktop: instant.** Toggling an option refetches/refilters immediately and the pill stays
  open. Naukri's model; it is right when the result count is already visible.
- **Mobile: deferred.** The `FilterBar` collapses to one "Filters (N)" button opening
  `FilterSheet` — a `JSheet mobile="fullscreen"` with every facet as a collapsible group and a
  **footer button that states the outcome**: `Show 84 jobs`, live-counted as you toggle,
  disabled at 0 with "No jobs match — try removing a filter". Instahyre's discipline, and it is
  the only one of the five that gets mobile right.
- Above the mobile list, a horizontally scrolling chip strip of the four most-used facets
  (Eligible · Job type · Location · Posted) so the common case never opens the sheet — Naukri's
  mobile-web move.
- Sort (`sort`) is **not** a filter and does not live in the bar; it stays in the result meta row
  as a `JSelect`, with `relevant` offered only when `canSortByRelevance` (§5.1.4, preserved).

---

## 5. NEW / CHANGED KIT COMPONENTS

All in `components/jobs-v2/ui/`, barrel-exported from `ui/index.ts`. Every one: `"use client"`,
colours from `J.*` only, radii from `R.*`, motion from `MOTION.*`, `focusRing` on every
interactive element, `sx?: SxProps<Theme>` merged last, `data-tour-id?: string`. No raw hex
(ESLint-enforced). All strings via `useTranslation("common")` with a `defaultValue`.

### 5.1 New — `Split.tsx`

```tsx
export interface JobsSplitLayoutProps {
  rail: ReactNode;
  pane: ReactNode;
  /** Which child survives below lg. The other is display:none — CSS, never useMediaQuery. */
  showBelowLg: "rail" | "pane";
  /** Rail width at lg+. Default 400. */
  railWidth?: number;
  railLabel: string;   // aria-label for the rail scroll region
  paneLabel: string;   // aria-label for the pane scroll region
  sx?: SxProps<Theme>;
}
export function JobsSplitLayout(props: JobsSplitLayoutProps): JSX.Element;

/** rAF-throttled scrollTop of the nearest split pane. Drives JobHeroBar's shadow. */
export function usePaneScrolled(threshold?: number): boolean;

/** j/k, arrows, Enter, Esc over the rail. No-ops while focus is in a text field. */
export function useRailKeys(opts: {
  ids: number[]; selectedId: number | null; onSelect: (id: number) => void;
}): void;
```

### 5.2 New — `BulletList.tsx`

```tsx
export type BulletVariant = "rule" | "check" | "plus" | "cross" | "numbered";
export interface BulletListProps {
  items: ReactNode[];
  variant?: BulletVariant;      // default "rule" (microRuleBullet)
  tone?: "default" | "muted";   // muted = J.ink3, for "Good to have"
  /** Show only the first N with a "Show all N" disclosure. */
  max?: number;
  dense?: boolean;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}
export function BulletList(props: BulletListProps): JSX.Element | null;
```

`MicroRuleList` (existing, `ui/Surfaces.tsx`) becomes a thin
`BulletList variant="rule"` wrapper and keeps its name and signature — `JobDetailsPanel.tsx`
and every admin caller are untouched.

### 5.3 New — `HighlightStrip.tsx`

```tsx
export interface Highlight { key: string; icon: string; label: string; title?: string; }
export interface HighlightStripProps { items: Highlight[]; sx?: SxProps<Theme>; }
export function HighlightStrip(props: HighlightStripProps): JSX.Element | null;

/** Pure. Computes the strip from a job — never model output. */
export function jobHighlights(job: JobV2, t: TFunction): Highlight[];
```

Renders `null` on an empty list. Chips are `MetaChip`-shaped but on `J.surface2` with a hairline,
wrapping, `gap: 0.75`.

### 5.4 New — `Eligibility.tsx`

```tsx
export type CheckStatus = "pass" | "fail" | "unknown";
export interface EligibilityCheck {
  key: string;            // "passout_year" | "graduation_percentage" | "course" | "college" | …
  label: string;
  requirement: string;    // "60%"  |  "2025–2026"  |  "Python Full-Stack"
  yours: string | null;   // null = not on the student's profile
  status: CheckStatus;
  /** Whether failing this actually blocks apply. Courses + college: true. The rest: false. */
  enforced: boolean;
  /** Deep link to the profile field that fixes it, when there is one. */
  fixHref?: string;
}
export interface EligibilitySummary {
  eligible: boolean | null;      // null = unknown (signed out / no profile) → render nothing
  reason?: string;               // the named blocking criterion
  visibilityReason?: string;     // "Open to your Python Full-Stack cohort"
  checks: EligibilityCheck[];
}

export function EligibilityCard(p: { summary: EligibilitySummary; sx?: SxProps<Theme> }): JSX.Element | null;
export function EligibilityChecklist(p: { checks: EligibilityCheck[]; sx?: SxProps<Theme> }): JSX.Element | null;
```

`EligibilityCard` renders `null` when `eligible === null` **or** `checks.length === 0`.

### 5.5 New — `StructuredDescription.tsx` (lives in `components/jobs-v2/detail/`)

```tsx
export interface JobContent {
  roleSummary: string;
  responsibilities: string[];
  requirementsMust: string[];
  requirementsGood: string[];
  techStack: string[];
  perks: string[];
  /** "structured" = new columns; "parsed" = parsed from the flat blob; "flat" = raw fallback. */
  origin: "structured" | "parsed" | "flat" | "empty";
  flat?: string;
}
export function resolveJobContent(job: JobV2): JobContent;         // pure, in lib/jobs-v2/content.ts
export function StructuredDescription(p: { job: JobV2 }): JSX.Element;
```

`resolveJobContent` is the single decision point for D7 and is unit-tested in
`lib/jobs-v2/jobsLogic.test.ts` against three fixtures: a structured row, a legacy flat row with
markers, and an empty row.

### 5.6 New — `JobRailCard.tsx` (in `components/jobs-v2/board/`)

```tsx
export interface JobRailCardProps {
  job: JobV2;
  selected?: boolean;
  density?: "rail" | "compact";     // "compact" drops the signal strip; used by SimilarJobs
  href: string;                     // carries the board query
  onSelect?: (id: number) => void;  // intercepts left-click into router.push
  learnerTokens?: ReadonlySet<string>;
  onFavoriteChange?: (jobId: number, favorited: boolean) => void;
  "data-tour-id"?: string;
}
export const JobRailCard: MemoExoticComponent<(p: JobRailCardProps) => JSX.Element>;
```

Comparator: `id, is_favourited, has_applied, eligible_to_apply, application_deadline, is_open,
selected, learnerTokens`.

### 5.7 New — `BoardPane.tsx` (in `components/jobs-v2/board/`)

```tsx
export function BoardPane(p: {
  visibleCount: number; eligibleCount: number; savedCount: number;
  onToggleEligible: () => void; onToggleSaved: () => void;
  emptyState?: ReactNode;
}): JSX.Element;
```

### 5.8 Changed — `FilterBar.tsx`

```tsx
// NEW exports alongside the existing FilterBar / FilterPopover / ActiveFilters:
export interface FacetOption { value: string; label: string; count: number; }
export function FacetList(p: {
  options: FacetOption[];
  selected: string[];
  onToggle: (value: string) => void;
  multiple?: boolean;
  initialVisible?: number;   // default 4, then "View more"
  emptyLabel?: string;
}): JSX.Element;

export function SegmentedToggle(p: {
  label: string; icon?: string; checked: boolean; onChange: (v: boolean) => void; count?: number;
}): JSX.Element;

export function FilterSheet(p: {
  open: boolean; onClose: () => void;
  groups: { key: string; label: string; node: ReactNode }[];
  resultCount: number;                 // the footer button's live number
  onApply: () => void; onClearAll: () => void;
}): JSX.Element;
```

`FilterPopover`'s existing signature is unchanged; `FacetList` is what goes inside it.

### 5.9 Changed — existing kit, minimal edits

| Component | Change |
|---|---|
| `MetaRow` | `META_ORDER` gains `workMode` between `location` and `jobType`. The order stays fixed and identical on card, rail and detail. |
| `Skeletons` | `JobListSkeleton` gains `view="rail"`; new `JobRailCardSkeleton`, `SplitSkeleton` (rail + pane together). |
| `Chips` | `SignalChip` and `DeadlineChip` move **up** from `board/JobCardV2.tsx` into `ui/Chips.tsx` (they are now used by the detail pane, similar jobs and the rail). Re-exported from `JobCardV2.tsx` so no existing import breaks. |
| `Surfaces` | `DefinitionList` gains `columns?: 1 \| 2` and `emptyValue?: ReactNode` (the "Not disclosed" case). `Notice` gains `tone="quiet"` for the safety notice. |
| `JCard` | no change. |

### 5.10 Changed — `lib/jobs-v2/`

| File | Change |
|---|---|
| `content.ts` **(new)** | `resolveJobContent`, `parseFlatDescription(text): ParsedContent \| null`, `jobHighlights`. Pure, fully unit-tested. |
| `eligibility.ts` **(new)** | `buildEligibility(job, profile): EligibilitySummary`. Consumes the BE `eligibility` payload when present and falls back to a client-side build from the fields we already have, so the FE ships before §6. |
| `format.ts` | add `applyDomain(url): string \| null`, `formatWorkMode(value)`. `descriptionPreview` unchanged and still used for legacy rows. |
| `useJobFilters.ts` | add `elig`, `wm`, `role`, `close` to `ClientFilterInput`; extend `applyClientFilters`; return `facets: Record<FacetKey, FacetOption[]>` with leave-one-out counts for **every** facet; add `eligibleCount`. |
| `useJobsUrlState.ts` | add `elig` (bool), `wm`, `role`, `close` to `JobsUrlState`, `JOBS_URL_DEFAULTS`, `FILTER_KEYS`, `parseState`, `serializeState`. Defaults still omitted from the URL. |
| `relevance.ts` | `jobSkillEntries` gains `tech_stack` as a third source, folded. |

---

## 6. BACKEND CONTRACT

Repo: `/Users/utkarshsingh/Developer/wt-job-radar-be`. **Additive only.** No field is removed, no
field changes type, no existing key changes meaning. Every FE surface in §1–§5 degrades correctly
against today's payload (that is what §5.10's `eligibility.ts` fallback and §5.5's `parseFlat`
path are for), so the BE and FE groups can land in either order.

### 6.1 Enrichment output — `job_scraper/services/enrichment.py`

Replace the single `job_description` key in `_ENRICH_SYSTEM`. **Everything else in the prompt
stays byte-identical** (relevance, relevance_reason, job_title, company_name, location,
employment_type, years_of_experience, salary, job_type, department, industry_type, role_category,
education, company_domain, company_info, mandatory_skills, key_skills, suggested_course_titles).

```
"role_summary":       string   // 2-3 sentences, prose, NO bullets, <=400 chars. A restatement
                               // of the posting's own opening, not a pitch.
"responsibilities":   [string] // <=8 items, <=180 chars, no leading "-"/"•", verb-first,
                               // one duty per item.
"requirements_must":  [string] // <=8 items, <=180 chars. ONLY what the posting states as
                               // required/minimum.
"requirements_good":  [string] // <=6 items. ONLY from an explicit Preferred / Nice-to-have /
                               // Bonus section. [] otherwise — never demote a must-have.
"tech_stack":         [string] // <=12 short noun phrases. ONLY names that literally appear
                               // ("PostgreSQL", "React", "Airflow"). Not categories
                               // ("databases"), not soft skills ("communication").
"work_mode":          "On-site" | "Hybrid" | "Remote" | ""    // ONLY if stated.
"perks":              [string] // <=6 concretely enumerated benefits ("relocation assistance",
                               // "annual learning budget"). NEVER "competitive salary",
                               // "great culture", "growth opportunities". [] is normal.
"interview_process":  [string] // <=6 stages, ONLY when the posting lists them. [] otherwise.
"fit_note":           string   // <=220 chars, ONE sentence, second person, naming at least one
                               // concrete fact from the posting. May reference the course list.
                               // May NOT promise an outcome or describe culture.
```

Two things are **deliberately not model output**:

- **`highlights`** — computed in Python from fields we already hold. A model asked for
  "highlights" writes marketing copy; a function cannot.
- **`job_description`** — stops being generated and becomes **derived**. A new
  `compose_description(row) -> str` renders `role_summary` + `"Responsibilities:"` +
  `"Requirements:"` from the structured fields and writes it to the same column. This is the
  whole compatibility story, and it is roughly output-token-neutral: we stop paying the model to
  emit the same prose twice, which more than funds the extra keys.

One prompt amendment beyond the key swap: today the prompt says to strip "benefits blurbs"
wholesale. Narrow it to **"strip vague benefit marketing; keep concretely enumerated benefits"**,
or `perks` is always empty.

`ENRICH_MAX_TOKENS` 2000 → **3000**. `_DESCRIPTION_CAP` stays 6000.

**Expected fill rates**, against our source mix (Greenhouse / Lever / Ashby / SmartRecruiters /
Workday / JSearch). These are the numbers every FE section's self-omission is designed around:

| field | honest source | fill |
|---|---|---|
| `role_summary` | the posting's own intro | ~95% |
| `responsibilities` | its duties section | ~85% ATS, lower on JSearch |
| `requirements_must` | stated required qualifications | ~85% |
| `requirements_good` | an explicit preferred/bonus section | ~40% |
| `tech_stack` | tool names in the text | ~70% engineering, ~0% non-technical |
| `work_mode` | stated in text, or JSearch `job_is_remote`, or "Remote"/"Hybrid" in the location string | ~30% |
| `perks` | enumerated concrete benefits | ~15% |
| `interview_process` | an explicit process section (mostly Lever/Ashby) | ~10% |
| `fit_note` | our judgement, grounded in named posting facts | ~90% |

**Must NOT be added, because filling them means inventing:** team size / reporting line; company
culture / mission / "why join us" / growth path; `application_deadline`; `number_of_openings`;
and **an inferred `work_mode`** — a posting listing "Bengaluru" is not evidence of on-site, a
large share of those are hybrid, and empty is the correct answer.

`department` already stands in for the honest half of team context and is a real structured field
from Greenhouse, Lever (`categories.team`), Ashby and Workday. Render it; add no column.

### 6.2 Applier rules — `apply_enrichment`

Add `_list(key, current, max_items, max_chars)` mirroring the existing `_s()`:

- a missing or non-list value **never clobbers** an existing value — the same rule that already
  protects `relevance`;
- strip leading `-` / `•` / `*` and whitespace; drop empties; dedupe case-insensitively within
  each list;
- then `requirements_good = requirements_good - requirements_must`, so the two are disjoint by
  construction. Same structural fix `dedupe_skills` already applies to the skill chips, for the
  same reason: the UI renders both and must not show one item twice.

`work_mode` is validated against the four-value whitelist; anything else becomes `""`.

**Thin-source guard.** Capture `raw_len = len(row.job_description or "")` at the top of
`apply_enrichment`, **before** the composed description overwrites it. Below
`JOB_SCRAPER_MIN_SOURCE_CHARS_FOR_BULLETS` (start at **300**), reject `responsibilities` /
`requirements_must` / `requirements_good` entirely and keep only `role_summary`. Some JSearch rows
carry a two-line description; eight bullets cannot honestly come out of it, and this is
enforcement rather than a request for the model's restraint.

### 6.3 Columns — 8 new, additive, empty defaults

Added **identically** to `jobs_v2.JobDescription` and `job_scraper.ScrapedJobPosting`:

| column | type |
|---|---|
| `role_summary` | `TextField(blank=True, default="")` |
| `responsibilities` | `JSONField(default=list, blank=True)` |
| `requirements_must` | `JSONField(default=list, blank=True)` |
| `requirements_good` | `JSONField(default=list, blank=True)` |
| `tech_stack` | `JSONField(default=list, blank=True)` |
| `work_mode` | `CharField(max_length=20, blank=True, default="")` — `On-site \| Hybrid \| Remote \| ""` |
| `perks` | `JSONField(default=list, blank=True)` |
| `fit_note` | `TextField(blank=True, default="")` |

**Reused with no new column:** `role_process` ← `interview_process`, joined as `- ` lines (the
admin form already edits it as a textarea in `StepDescription.tsx` and `JobDetailView` already
renders it as "Selection process" — it is simply almost always empty today); `department`;
`company_info`; `education`; `industry_type`; `role_category`; `mandatory_skills`; `key_skills`;
`ug_requirements`; `pg_requirements`; the three percentage gates; `applicable_passout_year`;
and `job_description` as the derived flat projection.

`fit_note` needs its own column rather than reusing `relevance_reason`: that field is written
**for admins triaging the queue** and never leaves the staging row (`copy_to_draft_job` does not
copy it). Keep it internal and the student-facing framing separate.

**Do not collapse the four lists into one `job_content` JSON blob.** Discrete columns buy
per-field DRF validation, per-field `FieldProvenance` in the admin form, per-field diffing in
`resync_diff`, and a future `work_mode` / `tech_stack` facet. If fewer columns are demanded, cut
`perks` — empty on ~85% of rows.

**Wiring, all mechanical:** add all 8 to `RESYNC_FIELDS`, `_resync_values` and
`copy_to_draft_job` in `job_scraper/importing.py`. The existing resync guard
`if new in (None, "", []): continue` already covers the list fields correctly — a thin
re-enrichment can never blank bullets a human is relying on.

### 6.4 Serializers — additive fields

**`JobDescriptionListSerializer`** (`jobs_v2/serializers.py`) gains:

```
role_summary, work_mode, tech_stack,
eligible_to_apply, has_applied, is_open, visibility_reason
```

`eligible_to_apply` and `has_applied` are on the **detail** serializer only today, which means
the shipped board card's "Applied" and "Not eligible" signals **can never fire on list data**.
That is a live gap, not a new feature.

**N+1 is the whole risk here** and the fix is prescribed, not left to the implementer:

- `has_applied` — `JobListAPIView` computes one set,
  `applied_ids = set(JobApplication.objects.filter(student=profile, job__client=client, status__in=['applied','applying']).values_list('job_id', flat=True))`,
  and passes it in `context`. The serializer method is a set membership test.
- `is_favourited` — same treatment (it is a per-row `.filter().exists()` today).
- `eligible_to_apply` — precompute `eligible_ids` in the view from the same course/college sets
  `visible_job_ids()` already builds; the serializer reads the set.
- `visibility_reason` — derived from the sets `visible_job_ids()` **already computes**
  (`assigned`, `course_matched`, `adaptive_matched`, `cohort_matched`, `college_matched`,
  `untargeted`), returned as one of
  `"assigned" | "course" | "adaptive_course" | "cohort" | "college" | "open"`. Zero extra
  queries; the FE maps each to a sentence. **Every string is backed by the actual rule.**
- Never `.filter()` a prefetched relation — that discards the prefetch and reintroduces the N+1
  this section exists to prevent.

**`JobDescriptionDetailSerializer`** gains:

```
role_summary, responsibilities, requirements_must, requirements_good,
tech_stack, work_mode, perks, fit_note,
is_open, visibility_reason, eligibility, related_jobs
```

```jsonc
"eligibility": {
  "eligible": true,                    // null when there is no student profile
  "reason": null,                      // the named blocking criterion when false
  "checks": [
    {"key":"course","label":"Enrolled course","requirement":"Python Full-Stack",
     "yours":"Enrolled","status":"pass","enforced":true},
    {"key":"college","label":"College","requirement":"…","yours":"…",
     "status":"pass","enforced":true},
    {"key":"passout_year","label":"Passout year","requirement":"2025–2026",
     "yours":"2026","status":"pass","enforced":false},
    {"key":"graduation_percentage","label":"Graduation","requirement":"60%",
     "yours":"68%","status":"pass","enforced":false},
    {"key":"percentage_12","label":"Class 12","requirement":"70%",
     "yours":null,"status":"unknown","enforced":false}
  ]
}
```

`enforced: true` **only** for `course` and `college`, because those are the only two
`get_eligible_to_apply` actually checks. `eligibility.eligible` must equal today's
`eligible_to_apply` exactly — it is the same computation, re-serialised with its reasons. The
Apply button's disabled state continues to read `eligible_to_apply`; nothing about apply
behaviour changes.

```jsonc
"related_jobs": [ { "id":…, "job_title":…, "company_name":…, "company_logo":…,
                    "location":…, "work_mode":…, "employment_type":…,
                    "years_of_experience":…, "application_deadline":…,
                    "visibility_reason":"cohort" } ]
```

Up to 4, drawn from `visible_job_ids(client, profile)` (so it can never leak a job the student
cannot open), ranked by shared skill tokens → same `role_category` → recency, excluding this job.
One bounded query.

**`JobDescriptionCreateUpdateSerializer`** gains all 8 columns so the admin form can edit them.

**Not added, at any layer:** applicant counts of any kind, view counts, "trending", company
ratings, response-time claims, a match percentage, an "easy apply" flag.

### 6.5 The closed-role fix

- `JobListAPIView`: drop the `application_deadline__gte=now` clause from the `active` branch so an
  expired role stays in the list, and expose `is_open` (a serializer method:
  `status == 'active' and (application_deadline is None or application_deadline >= now)`).
  It renders as a Closed chip with a disabled apply button, not as a silent disappearance
  mid-search.
- `JobDetailAPIView`: no query change (it already returns the row); it gains the same `is_open`
  field, which is what stops an emailed link showing a live Apply button on a dead posting.
- **Apply is already server-guarded** — `JobApplyAPIView` is unchanged and remains the authority.
  This is a display fix, not a permission change.

### 6.6 Rollout

The blank period is removed **by construction**, not by sequencing: `job_description` keeps being
written (composed from the structured fields) and the detail page keeps its `<Prose>` render as a
**permanent** fallback whenever `role_summary` and `responsibilities` are both empty.

- **Phase 0 — schema.** One additive migration per app, empty defaults, deploys invisibly. Any
  data migration in this series must be **boot-safe** in the house style of
  `job_scraper/migrations/0004_reenrich_for_rich_fields.py` and `0007_student_quality_fixes.py`:
  per-row `try/except`, skipped under tests. Several containers race `migrate` on deploy and a
  raising migration aborts **boot**, not just the deploy.
- **Phase 1 — write path.** New prompt, `_list` applier with the disjointness and thin-source
  guards, `compose_description()`, the `importing.py` wiring and the serializer fields. Nothing
  reads the new fields yet. Ship the optional `JobV2` fields so the FE compiles.
- **Phase 2 — restage the ~1800 staging rows.** A data migration flipping
  `status in (ready, irrelevant) AND enriched_at IS NOT NULL` back to `new`, precisely as 0004 and
  0007 already did twice. One Batch API cycle: order of magnitude ~2.5k input / ~1.1k output
  tokens per row on Haiku 4.5 at the 50% batch rate — a few dollars, ~2 days. `content_hash` is
  computed from **fetched** content, so a re-enrichment never re-triggers itself.
- **Phase 3 — the ~486 published jobs**, two populations:
  - **(a)** those with a live `ScrapedJobDecision` need **no new machinery**: once their staging
    rows carry structure, the existing `resync_imported_job` pulls all 8 fields through. Run the
    management command `--dry-run` first and read the diff (standing prod workflow). The
    empty-value skip guard means a row that failed re-enrichment simply keeps what it has.
  - **(b)** manual jobs, and scraped jobs whose decision or job link is gone, have no staging row.
    A one-shot `structure_existing_jobs` command sends the job's **own stored
    `job_description`** back through the model under a strict *restructure-only, add nothing*
    instruction. That is a parse, not a generation, so it stays inside the no-invention rule.
    Scope it to jobs whose text already contains `Responsibilities` / `Requirements` markers, run
    `--dry-run` with a diff, and leave genuinely hand-written descriptions to the fallback
    renderer.
- **Phase 4 — read path.** §3's section stack. **Can ship before phases 2 and 3 finish**; rows
  improve underneath it as the cycle runs, and `parseFlatDescription` covers the interim. Update
  `components/jobs-v2/detail/group3.smoke.test.tsx` and
  `components/jobs-v2/board/board.smoke.test.tsx` with a structured row, a legacy flat row and an
  empty row.
- **Phase 5 — admin form.** Structured editors in
  `components/admin/jobs-v2/form/steps/StepDescription.tsx`: a summary textarea plus four
  bullet-list editors, each with its `FieldProvenance` marker, and `job_description` demoted to a
  read-only derived preview. **Ship this in the same release as phase 4.** If an admin keeps
  editing the flat text after the page starts preferring structured fields, their edits silently
  stop being visible — that is the one real drift hazard in this plan, and shipping the two
  together is what closes it.

---

## 7. BUILD GROUPS

Non-overlapping file sets. **A file appears in exactly one group.** Group A is blocking for the
FE groups; the BE groups are independent of all of them and of each other in the order given.

### Group A — kit (FE, blocking, land first)

```
components/jobs-v2/ui/Split.tsx                    (new)
components/jobs-v2/ui/BulletList.tsx               (new)
components/jobs-v2/ui/HighlightStrip.tsx           (new)
components/jobs-v2/ui/Eligibility.tsx              (new)
components/jobs-v2/ui/Chips.tsx                    (SignalChip/DeadlineChip move in)
components/jobs-v2/ui/Surfaces.tsx                 (DefinitionList columns/emptyValue, Notice quiet, MicroRuleList → BulletList)
components/jobs-v2/ui/FilterBar.tsx                (FacetList, SegmentedToggle, FilterSheet)
components/jobs-v2/ui/MetaRow.tsx                  (workMode in META_ORDER)
components/jobs-v2/ui/Skeletons.tsx                (rail + split skeletons)
components/jobs-v2/ui/index.ts
components/jobs-v2/ui/kit.smoke.test.tsx
app/globals.css                                    (--j-split-top, --j-rail-w in .jobs-scope ONLY)
lib/jobs-v2/content.ts                             (new)
lib/jobs-v2/eligibility.ts                         (new)
lib/jobs-v2/format.ts                              (applyDomain, formatWorkMode)
lib/jobs-v2/relevance.ts                           (tech_stack)
lib/jobs-v2/jobsLogic.test.ts
lib/services/jobs-v2.service.ts                    (OPTIONAL new fields on JobV2 only — no signature changes)
```

### Group B — board, rail, split, filters (FE)

```
app/jobs-v2/page.tsx
components/jobs-v2/board/JobBoard.tsx
components/jobs-v2/board/JobRailCard.tsx           (new)
components/jobs-v2/board/BoardPane.tsx             (new)
components/jobs-v2/board/JobCardV2.tsx
components/jobs-v2/board/JobRowV2.tsx
components/jobs-v2/board/BoardFilters.tsx
components/jobs-v2/board/useJobFilters.ts
components/jobs-v2/board/BoardShellSkeleton.tsx
components/jobs-v2/board/board.smoke.test.tsx
lib/jobs-v2/useJobsUrlState.ts
lib/guide/registry.ts                              (the jobs-filters narration line only)
```

### Group C — detail pane (FE)

```
app/jobs-v2/[id]/page.tsx
components/jobs-v2/detail/JobDetailView.tsx
components/jobs-v2/detail/JobHeroBar.tsx           (new)
components/jobs-v2/detail/StructuredDescription.tsx (new)
components/jobs-v2/detail/SimilarJobs.tsx          (new)
components/jobs-v2/detail/JobDetailsPanel.tsx
components/jobs-v2/detail/ApplyCta.tsx
components/jobs-v2/detail/useApply.ts
components/jobs-v2/detail/group3.smoke.test.tsx
```

Groups B and C both consume `JobRailCard`. It lives in **B**; C imports it. C must not edit it —
if C needs a change there, it lands in B first.

### Group D — enrichment write path (BE)

```
job_scraper/services/enrichment.py
job_scraper/models.py                              (8 columns on ScrapedJobPosting)
job_scraper/migrations/00XX_rich_content_fields.py
job_scraper/importing.py                           (RESYNC_FIELDS, _resync_values, copy_to_draft_job)
job_scraper/tests.py
jobs_v2/models.py                                  (8 columns on JobDescription)
jobs_v2/migrations/0010_rich_content_fields.py
```

### Group E — student API surface (BE)

```
jobs_v2/serializers.py                             (list + detail + create/update fields, eligibility, related_jobs, is_open, visibility_reason)
jobs_v2/views.py                                   (bulk applied/favourite/eligible sets, is_open list clause)
jobs_v2/visibility.py                              (expose the per-job reason from sets it already builds)
jobs_v2/tests_student_assignment.py
```

D and E both touch `jobs_v2/models.py` **only** in D (the migration and the fields); E is
serializer/view-only. Sequence D before E; they do not overlap on a file.

### Group F — restage + backfill + admin form (BE + FE, last)

```
job_scraper/migrations/00XX_restage_for_structured_content.py
job_scraper/management/commands/structure_existing_jobs.py   (new)
components/admin/jobs-v2/form/steps/StepDescription.tsx
```

Phase 5's admin form and Phase 4's read path (Group C) must ship in the **same release** (§6.6).

### Files no group may touch

`normalizeThemeSettings.ts` · `applyDocumentTheme.ts` · `ALLOWED_THEME_KEYS` ·
`ThemeModeProvider` · `:root` in `app/globals.css` · `components/common/ModulePageHeader` ·
`MainLayout` · `PageShell` · the orphan `/jobs` route and its five legacy components ·
`e2e/jobs/jobs.spec.ts` · `lib/services/admin-jobs-v2.service.ts` ·
`lib/services/admin-scraped-jobs.service.ts`.

---

## 8. NON-NEGOTIABLES

§10 of the Career Ledger spec holds in full. These are the ones this work can break, restated
with what is new.

1. **Never invent a job's fact.** Every string on these screens is either the employer's own text,
   a field an admin typed, a value the enrichment model was permitted to extract from the posting,
   or a computation over data we hold whose inputs we also print. Empty over guess — including an
   inferred `work_mode`, a demoted must-have masquerading as a nice-to-have, and a perk read out
   of a benefits blurb.
2. **Never show a signal our data cannot support.** Banned outright, on card, rail, pane, filter
   and email: applicant counts ("120 applicants", "Be an early applicant", "Under 10 applicants"),
   view counts, "trending"/"popular", "actively hiring", "urgently hiring", "responds within N
   days", company star ratings and review counts, "Easy Apply"/"1-click apply"/"Apply on AI Linc",
   and **any match percentage**. If it is not a stated rule with its inputs visible, do not print
   a number. `applications_count` and `favorites_count` are removed from student surfaces (§2.5).
3. **Honesty in the other direction.** A role whose deadline has passed or whose status is closed
   is marked **closed in place** with a disabled apply button and a reason — never silently
   dropped from the list, never left with a live button behind an emailed link.
4. **Eligibility never lies about enforcement.** Checks carry `enforced`; the verdict and the
   button read enforced checks only; non-enforced gates are labelled "stated by the employer".
5. **Preserve all existing behaviour**, each re-verified before merge: the URL contract
   (`q, loc, exp, type, emp, skills, posted, salary, fav, tab, view, page, size, sort, status` —
   new keys are added, none removed or renamed); every filter's current semantics; the favourite
   optimistic-toggle-with-rollback and its admin-mode hiding; the profile lock
   (`useModuleLocked("jobs")` → banner + locked card with preview); apply routing —
   `window.open` **first**, then `applyForJob({ external: true })`, then `confirmApplied`, with the
   three-answer "Did you apply?" confirm; every admin permission and feature gate; the scraped
   queue's stale-response and page-clamp logic; and `/jobs` + `e2e/jobs/jobs.spec.ts` passing
   untouched.
6. **MUI + tokens + dark mode.** No Tailwind. No raw hex in `components/jobs-v2/**`
   (ESLint-enforced). Colour via `var(--j-*)` through `J.*`; radii `R.*`; motion `MOTION.*`;
   weights 400/500/700/800; accent budget three per surface. Dark stays a one-attribute flip:
   the split, the rail, the sticky hero bar, the facet counts and every new chip must render
   correctly under `data-jobs-theme="dark"` with zero component edits.
7. **No new heavy dependencies.** No virtualization library for the rail (20 items per page is a
   plain list), no date library, no form library, no chart library, no markdown library — the
   structured description is arrays rendered by our own components, and HTML goes through the
   existing sanitising `RichHtml`.
8. **Four states on every data surface**, now doubled by the split: rail and pane each ship
   loading (content-shaped skeleton), empty-because-nothing-exists, empty-because-nothing-matches
   (with a reset action), and error (with Retry). **A `catch` that sets an empty array is a review
   blocker.**
9. **Additive only, backend.** No field removed, no type changed, no key's meaning changed, no
   endpoint retired. Every FE surface must degrade correctly against today's payload.
10. **No non-job content ever enters the result stream.** No promos, no upsells, no signup
    interstitials, no sponsored rows, no "register for free" block between cards 2 and 3.
11. **Every badge explains itself in situ.** Wellfound's discipline: a claim and its basis, in the
    same tooltip, in one sentence.
12. **The nested-scroller exception is exactly one.** The two split panes at `lg+`. Everything
    else — tables, lists, modals, the mobile board and the mobile detail — scrolls the page.

---

## Appendix — open risks

| Risk | Where | Mitigation |
|---|---|---|
| `eligible_to_apply` enforces courses + college only, while we render passout and three percentage gates | `jobs_v2/serializers.py:get_eligible_to_apply` | `enforced` flag on every check (§3.4, §6.4). **Do not ship the checklist without it.** |
| List serializer lacks `eligible_to_apply` / `has_applied`, so shipped board signals never fire | `JobDescriptionListSerializer` | §6.4, with bulk sets to avoid three N+1s |
| Adding per-row student state to the list is an N+1 farm | `JobListAPIView` | Precomputed sets in `context`; never `.filter()` a prefetched relation |
| An expired `active` job vanishes from the list but still opens with a live Apply button | `JobListAPIView` vs `JobDetailAPIView` | §6.5 |
| Sticky is unreliable under `MainLayout`'s `overflow: auto` ancestors | the split | Sticky lives **inside** the pane's own scroller, which is its containing block; the mobile bar stays `fixed` |
| An admin edits flat `job_description` after the page starts preferring structured fields | Phase 5 | Ship Phase 4 and Phase 5 in one release |
| `parseFlatDescription` over-parses a hand-written description | §5.5 | Returns `null` unless explicit markers are present and blocks are non-trivial; never runs when structured fields exist; three fixtures in `jobsLogic.test.ts` |
| Batch re-enrichment costs and lands over ~2 days | Phase 2 | Read path ships first and improves underneath; a few dollars at the 50% batch rate |
