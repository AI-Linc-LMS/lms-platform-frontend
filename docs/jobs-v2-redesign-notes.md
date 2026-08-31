# Jobs v2 redesign — cross-group notes

Append-only. One section per group.

**How to use this file.** If you need a change in another group's file, you do not make it. You
append a note here, under your own group's heading, naming the file and the change, and the
owning group makes it. The only files touched by more than one group are the two shared ones in
Group 1 (`ModulePageHeader.tsx`'s `ACCENTS` map and the appended `globals.css` block), and both
landed with Group 1 before anyone else started.

---

## Group 1 — shared kit, tokens, shared logic

_(Notes from Group 1 to the surface groups. Nothing here asks another group for a change; it
records decisions the kit made that the surfaces need to know about.)_

### Deprecated `primaryColor` on the illustrations

`components/jobs-v2/illustrations/*` now take `{ width, height, tone }` per spec 4.21, with
`tone` defaulting to `"muted"`. `primaryColor` is retained as a **deprecated** prop for one
reason only: `components/jobs/MobileJobFilters.tsx` imports `JobSearchIllustration` and lives in
the "no group may touch" list, so removing the prop would break a file nobody is allowed to fix.
Groups 2-5: **do not pass `primaryColor`.** Pass `tone="accent"` or nothing. The prop can be
deleted the day `/jobs` is retired (Appendix B).

### Multi-select answers now use a unit separator on the wire

`lib/jobs-v2/questions.ts` exports `MULTI_ANSWER_SEPARATOR = ""`. Per spec 4.22, a
multi-choice answer is joined on the ASCII unit separator instead of `", "`, so an option
containing a comma survives a round trip. **The payload shape is unchanged** — the service still
receives `{ question_id, response_text: string }`, so `applyForJob` is untouched. Read answers
back with `parseAnswerText()`, which accepts both the new separator and the legacy comma form,
and render them with `displayAnswer()`, which joins on a comma for humans. Group 5: the admin
applicant table and the candidate modal must go through `displayAnswer()` or they will render a
control character.

### `SectionHeader` and `BulkActionBar` take an already-pluralised noun

Neither appends an "s". Pass `t("jobsV2.noun.job", { count })` — the plural forms exist in both
`locales/en/common.json` and `locales/ar/common.json`.

### `useSelection` clears on `deps`, and that is load-bearing

`lib/jobs-v2/useSelection.ts` clears the selection whenever its `deps` array changes. Group 4:
pass exactly what `app/admin/jobs-v2/scraped/page.tsx` passes today —
`[tab, page, perPage, search, sourceKind]` — and the existing behaviour is preserved verbatim.
`selectAll()` is additive per page (toggles the visible ids in or out, keeping selections made
on other pages), which is that page's `toggleSelectAll` semantics unchanged.

### `useSeq` is the scraped queue's guard, extracted

`seq.next()` then `if (!seq.isCurrent(token)) return;` in both the success and the catch branch.
The object identity is stable, so it is safe in a `useCallback` dependency array.

### The ESLint rule is live and will fail on unmigrated files

`eslint.config.mjs` now errors on any raw hex or `var(--font-light)` inside
`components/jobs-v2/**`, `components/admin/jobs-v2/**`, `app/jobs-v2/**`,
`app/admin/jobs-v2/**` and `lib/jobs-v2/**`. Every file that has not been rewritten yet will
report errors until its owning group lands. That is intended (spec section 9, Group 1
definition of done); it is not a regression to work around with an inline disable.

### `JCard` elevation comes from `JobsScope`

`<JobsScope surface="student">` gives cards `SHADOW.panel`; `surface="admin"` gives them none.
Do not pass `elevated` unless you are deliberately overriding that for one card.

### `JModal` is a bottom sheet below `md` unless you say otherwise

Pass `mobile="fullscreen"` for anything with a form in it, so a soft keyboard does not crush the
sheet. `dirty` must be wired on every modal that holds typed data.

---

## Group 3 — student job detail, apply flow, application detail

### For Group 1 — `jobsV2.*` keys to fold into `locales/{en,ar}/common.json`

Every user-visible string in Group 3 goes through `t()`, but the keys below do not exist in the
bundles yet and `locales/**` is Group 1's file. They ship as `t("key", { defaultValue: "…" })`,
which renders the English copy today and starts rendering the bundle's value the moment Group 1
adds the key — **no component edit is needed**. The Arabic bundle needs all of them.

Namespaces used: `jobsV2.detail.*`, `jobsV2.apply.*`, `jobsV2.gate.*`, `jobsV2.success.*`,
`jobsV2.timeline.*`, `jobsV2.application.*`. Grep for `defaultValue:` under
`app/jobs-v2/**`, `components/jobs-v2/detail/**`, `components/jobs-v2/apply/**` and
`components/jobs-v2/application/**` for the exact list and copy.

### For Group 2 — the `?ids=` handoff for prev/next on the detail page

Spec 5.4 asks for "prev/next job navigation … when the board handed a result set through the
URL". `JobDetailView` reads **`?ids=12,44,7`** (the current page's result ids, in order) and
renders Previous / Next only when the current job's id is in that list; with no `ids` param it
renders nothing, so this is inert until the board opts in. When the board links to a job, append
`?ids=` with the ids of the results it is showing, and the detail page will carry it forward on
both arrows. Nothing else is needed and no other param is read.

Two links Group 3 emits into Group 2's screens, so they need to resolve:
- `/jobs-v2?tab=applied` — used by the apply notice, the "already applied" gate and the
  application detail's back link.
- `/jobs-v2/applications/{applicationId}` — the new route (5.3).

### API gaps Group 3 hit, and what it does instead (section 10.5)

1. **There is no per-application GET.** `app/jobs-v2/applications/[id]/page.tsx` loads
   `jobsV2Service.getMyApplications()` and finds the row by id — the endpoint that exists, no
   service change. A row that is not in the list is a real "this application no longer exists"
   branch, separate from a fetch failure.
2. **`JobV2` carries `has_applied` as a bare boolean with no application id**, so "View your
   application" had nowhere to point. `useApplicationForJob(jobId, enabled)` resolves the row
   from the same endpoint and falls back to `/jobs-v2?tab=applied` when it cannot. That fallback
   is why the link is never broken.
3. **The `applications/me` payload does not include the submitted question answers.** Spec 5.3
   asks the "Your submission" card to show "every question and answer exactly as submitted"; the
   card shows the resume that was sent and omits the answers rather than rendering an empty
   block that implies none were given. Surfacing them needs `responses` on that serializer —
   an API change, which section 10.5 puts out of scope.
4. **There is no withdraw / cancel endpoint** (Appendix B keeps one out of scope). The third
   answer on "Did you apply?" — "No, I changed my mind" — therefore says exactly what happened:
   the record stays at `applying` and can be corrected from the Applied tab. It does not pretend
   to have cancelled anything. **Group 2: 5.2.1's inline correction prompt on an `applying` row
   is the surface that closes this loop**, and the copy Group 3 shows points learners at it.

### `DefinitionList` may belong in the kit

`components/jobs-v2/detail/JobDetailsPanel.tsx` exports a small `DefinitionList` (`<dl>`, label
in `TYPE.label` over value in `TYPE.bodyStrong`, a hairline on every row but the last). Group 5
needs the same thing for the admin detail's "Classification" card (spec 5.9.4). If Group 5
wants it shared, Group 1 should lift it into `components/jobs-v2/ui/Surfaces.tsx` unchanged;
Group 3 will import it from the kit instead. Until then, do not copy it — that is how four
`SectionCard`s happened.

### "Did you apply?" is a `JModal`, not a `JConfirm`

Spec 5.4 asks for three answers ("Yes, I applied" / "Not yet — remind me" / "No, I changed my
mind") and `JConfirm` only knows two. `ApplyDialogs` in `components/jobs-v2/detail/ApplyCta.tsx`
uses `JModal size="sm"` with a three-button footer — the same shell `JConfirm` itself is built
from, so it is one dialog language, not a fifth. If any other surface needs three answers,
consider a `JConfirm` variant in the kit rather than a second copy of this.

### The success screen does not refetch the job

Spec 5.5 asks that the success state avoid "the redundant refetch of a job the detail page
fetched one click earlier". `app/jobs-v2/[id]/apply/page.tsx` fetches the job once and hands the
same object to `ApplyFlow` and then to `ApplySuccess`, so submitting triggers no second GET at
all. No router-state handoff was introduced: caching a job across routes would let a stale
`status` / `eligible_to_apply` past the apply gates, which is worse than one request.

---

## Group 2 — student board (Browse / Applied / Saved)

### For Group 1: `jobsV2.board.*`, `jobsV2.board.posted.*`, `jobsV2.board.salary.*`, `jobsV2.board.jobType.*` and `jobsV2.applied.*` are needed in both bundles

Every user-visible string on the board goes through `t()`, but the board needed 60-odd keys that
do not exist in `locales/en/common.json` or `locales/ar/common.json` yet. Rather than block on a
file Group 2 may not touch, each call carries a `defaultValue` — the repo's existing pattern
(`t("lock.jobsTitle", { defaultValue: ... })` in the old board). **The English copy is therefore
correct today and Arabic falls back to English until the keys land.** Please add them; the call
sites need no change once they exist.

Keys used, with the English copy they currently fall back to:

```
jobsV2.board.eyebrow            "01 · CAREER"
jobsV2.board.description        "Discover roles matched to you, filter by what matters, and
                                 track every application from one board."
jobsV2.board.tabsLabel          "Job board sections"
jobsV2.board.tabBrowse          "Browse"
jobsV2.board.tabApplied         "Applied"
jobsV2.board.tabSaved           "Saved"
jobsV2.board.savedCount         "Saved ({{count}})"
jobsV2.board.searchLabel        "Search jobs by title, company or skill"
jobsV2.board.viewLabel          "Result layout"
jobsV2.board.viewCards          "Card view"
jobsV2.board.viewList           "List view"
jobsV2.board.resultCount        "{{matching}} jobs"        (count = plural driver)
jobsV2.board.totalHint          "{{total}} total"          (count = plural driver)
jobsV2.board.sortLabel          "Sort jobs"
jobsV2.board.sortRecent         "Most recent"
jobsV2.board.sortOldest         "Oldest first"
jobsV2.board.sortCompany        "Company A-Z"
jobsV2.board.sortDeadline       "Closing soonest"
jobsV2.board.untitledRole       "Untitled role"
jobsV2.board.addFavorite        "Save this job"
jobsV2.board.removeFavorite     "Remove from saved"
jobsV2.board.favoriteFailed     "Failed to update favourite"
jobsV2.board.filter.any         "Any"
jobsV2.board.filter.search      "Search"
jobsV2.board.filter.location    "Location"
jobsV2.board.filter.jobType     "Job type"
jobsV2.board.filter.employmentType "Employment type"
jobsV2.board.filter.experience  "Experience"
jobsV2.board.filter.skills      "Skills"
jobsV2.board.filter.skill       "Skill"
jobsV2.board.filter.posted      "Posted"
jobsV2.board.filter.salary      "Salary"
jobsV2.board.jobType.job        "Job"
jobsV2.board.jobType.internship "Internship"
jobsV2.board.posted.1d / .7d / .30d   "Last 24 hours" / "Last 7 days" / "Last 30 days"
jobsV2.board.salary.disclosed / .undisclosed  "Salary disclosed" / "Salary not disclosed"
jobsV2.board.salaryHelper       "Employers write salary as free text, so we can only tell you
                                 whether a figure was disclosed."
jobsV2.board.noSkills           "No skills are listed on the current results."
jobsV2.board.skillOverflow      "Showing the most common skills. {{count}} more appear as you
                                 narrow the search."
jobsV2.board.excluding          "{{filter}} is hiding {{count}} of these roles"

jobsV2.applied.title            "Your applications"
jobsV2.applied.stripLabel       "Filter your applications by status"
jobsV2.applied.railLabel        "Stage {{current}} of {{total}}: {{stage}}"
jobsV2.applied.sortLabel/.sortNewest/.sortOldest/.sortCompany
jobsV2.applied.refresh          "Refresh"
jobsV2.applied.updatedAgo       "Updated {{when}}"
jobsV2.applied.appliedOn        "Applied {{date}}"
jobsV2.applied.showAll          "Show all ({{count}})"
jobsV2.applied.noMatchTitle     "No applications with status \"{{status}}\""
jobsV2.applied.noMatchBody      "Nothing sits at that stage right now."
jobsV2.applied.didYouApply      "Did you complete this application?"
jobsV2.applied.didNotApply      "No, I did not"
jobsV2.applied.markApplied      "Mark as applied"
jobsV2.applied.hiddenNotice     "{{title}} is hidden. It will reappear if the employer confirms it."
jobsV2.applied.confirmed        "Marked as applied"
jobsV2.applied.confirmFailed    "We could not update that application"
jobsV2.applied.browseMore       "Browse more jobs"
jobsV2.applied.offerTitle       "Offer received"
jobsV2.applied.offerBody        "Congratulations. Open the application to see the details."
jobsV2.applied.offerSince       "Updated {{date}}"
```

### For Group 1: `SignalChip` wants to be in the kit

`components/jobs-v2/board/JobCardV2.tsx` defines a small `SignalChip` (and `DeadlineChip` on top
of it) because spec 5.1 asks the card and the row for two chips the kit cannot render: a dashed
**"Not eligible"** pill and a **deadline** chip tinted by `deadlineLabel().urgency`. Neither is a
`Tone` in `jobsTokens.ts`, so `StatusPill` cannot express them. It is defined once and imported
by `JobRowV2`, and every colour goes through `J.*`, so dark works — but it is a pill living
outside the kit, which spec 10.9 would rather it did not. If Group 1 wants it, the shape is
`{ icon, children, fg, bg, bd, dashed?, title? }` and Group 3's detail page will want the
deadline variant too.

### For Group 3: the board links to `/jobs-v2/applications/{id}`

Both the Applied rows and the placement banner link to the application detail route, not to the
job. If that route is not live, those links 404 — they are the spec's 5.2 requirement and are
written on the assumption Group 3 lands `app/jobs-v2/applications/[id]/page.tsx`.

### For Group 3: `stretchedLink` is exported from `components/jobs-v2/board/JobCardV2.tsx`

The whole card is clickable but the tab stop is the title `<a>` and the favourite is a sibling
`<button>` — a `<button>` inside an `<a>` is invalid HTML and is why the shipped card needed a
separate "View Details" button to be reachable at all. If the detail page wants the same
pattern, import it rather than re-deriving it.

### Decisions Group 2 made where the spec left room

- **The view switch lives in the result meta row, not in the search rail.** Spec 5.1 puts it in
  both places (item 3 "the remaining space holds the view switch", item 5 "the card/list switch
  rendered as JTabs size='sm'"). Item 4 settles it: the rail unmounts on Applied and Saved, so a
  switch inside the rail would disappear on Saved. The meta row renders on Browse and Saved, so
  that is where it lives. The rail is now the search box plus the seven filters and nothing
  else.
- **The Salary filter is "disclosed / not disclosed"**, not a numeric band. `job.salary` is free
  text ("8-12 LPA", "Not disclosed", sometimes a bare number) and inventing LPA bands over it
  would fabricate a figure the API never sent — the same class of lie as `postedLabel` saying
  "Recently". The popover says so in its helper text.
- **Location, job type and employment type stay SERVER filters** (exactly as today) and
  experience, skills, posted, salary and favourites stay CLIENT filters (exactly as today). No
  filter is applied on both sides. Facet option lists are built from the last *unfiltered*
  response, so narrowing to one location never leaves that location as the only option — a facet
  control that locks itself shut.
- **The Applied pane's status filter writes the board's `status` URL key**, so an Applied view is
  shareable; its sort and page stay local, because the board's `sort` key means a different thing
  on Browse.

### `lib/guide/registry.ts`

Only the `jobs-filters` step's `narration` changed, per spec 9. Its `placement: "right"` is still
sidebar-shaped for what is now a full-width filter row; that is one word outside Group 2's
allowance, so it is left for whoever owns the tour copy.

---

## Group 4 — admin jobs list, scraped review queue, reports

_(Requests to other groups are marked **ASK**. Everything else is a decision recorded so the
other surfaces stay consistent with it.)_

### ASK Group 1 — `jobsV2.*` keys used by the three admin screens

Group 4 does not own `locales/en/common.json` or `locales/ar/common.json`, so every string it
adds goes through `t("<key>", "<English default>")`. That renders correctly today and starts
using the bundle the moment the keys land — but **Arabic falls back to English until they do.**
The new namespaces are `jobsV2.admin.*`, `jobsV2.scraped.*` and `jobsV2.reports.*`; grep the
three screens and their five components for `t("jobsV2.` with a second string argument to get
the exhaustive list.

Two conventions to keep when adding them:

- Interpolation variables in these keys are named **`n`, `total`, `pct`, `done`**, never
  `count`. `t(key, defaultValue, options)` types `count` against i18next's plural machinery and
  a formatted (string) count fails to typecheck on that overload. `count` survives only where
  the 2-argument `t(key, options)` form is used against a key Group 1 already shipped
  (`jobsV2.bulk.consequence*`).
- `jobsV2.noun.job` is passed to `BulkActionBar` and `SectionHeader` already pluralised, as
  Group 1's note asks.

### ASK Group 1 — `JobsUrlState` has no key for source or visibility

`lib/jobs-v2/useJobsUrlState.ts` covers `q, loc, exp, type, emp, skills, posted, salary, fav,
tab, view, page, size, sort, status`. The admin jobs list needs a **visibility** filter and the
scraped queue needs a **source kind** filter, and neither has a key. Rather than overload an
unrelated one (`emp`, say) and make the URL contract lie, both screens kept local state for
their query. Add `vis` and `src` and the two screens can move onto the hook in one commit each —
the state shapes are already flat and named the same way.

This is also why the scraped queue's `seqRef` guard, page clamp and selection-clear are still
driven by plain `useState`: keeping the query local is what let those three behaviours be
preserved **verbatim** (they are now `useSeq` + `useSelection` calls with identical semantics
and identical `deps`: `[tab, page, perPage, search, sourceKind]`).

### The bulk bar keeps its selection after a run — deliberately

`BulkActionBar` hides itself at `count === 0` and clears its outcome summary when it hides
(`useEffect(() => { if (!visible) setOutcome(null) })`). So a bulk handler that clears the
selection on success **destroys the outcome summary and the "Retry failed" button** it just
produced. Group 4's two lists therefore do NOT auto-clear after a bulk run: the rows are
refetched, the summary stays readable, and the operator dismisses it with the bar's own Clear.
Groups 5 and 2, do the same on the applications pipeline or the summary will never be seen.

### `BulkAction.render` entries need a placeholder `onRun`/`confirm`

`BulkAction` requires both even for a `render` entry, which `BulkActionBar` never calls. The two
target pickers on the jobs list pass a no-op and an empty confirm with a comment. If Group 1
ever revisits the type, making `onRun`/`confirm` optional **when `render` is set** (a discriminated
union) would remove the dead fields.

### Honesty gaps that need API work before the UI can close them

Recorded here rather than faked in the UI (spec 10.5 and 10.8):

- **Export date range.** `downloadExportReport` accepts `job_id` and `status` only. The export
  modal renders the two date fields **disabled**, with the reason stated in place, behind a
  `SUPPORTS_DATE_RANGE` constant. Flip that one constant the day the endpoint grows the params.
- **Export column checklist.** The server generates the CSV's columns, so a checklist would not
  change the file. The modal shows the scope, an estimated row count and a note saying the
  server decides the columns, instead of a control that does nothing.
- **Scraped sort.** The queue endpoint has no `ordering` param. The new Relevance / Most recent
  / Company A-Z select sorts the **current page**, and says so in its helper text whenever more
  than one page exists.
- **"Applicants (30d)" on the jobs list strip.** The list payload carries a lifetime
  `applications_count` per job and no dated applications, so the cell is labelled "Applicants"
  with the hint "All time, all jobs" rather than quoting a 30-day window it cannot compute.
- **Reports fan-out.** The funnel needs per-application data, which only
  `getJobApplications(jobId)` provides. The page therefore fans out over the jobs that have at
  least one applicant, four at a time, and fills the numbers in progressively with a live
  "Counting applicants: N of M jobs" line. A per-job failure renders that job's figures as
  "n/a" with the reason in a `title`, **never as a zero**. One `GET /admin/jobs/reports/summary/`
  would replace the whole fan-out.

### The funnel reads the pipeline fields, not the status word

`components/admin/jobs-v2/reports/ReportFunnel.tsx` exports `reachedStages(application)`, which
derives the furthest stage an application actually reached from `internal_shortlisting`,
`shortlisted_by_hr`, `round_1..4`, `drive` and `offered` — because a rejected candidate may have
been rejected after round 3, and a current-status histogram would silently zero the middle of
the funnel. Group 5's `PipelineRail` on the applications pipeline should read the same helper
rather than deriving its own, so the rail and the funnel cannot disagree.

### A smoke test ships beside the code

`components/admin/jobs-v2/group4.smoke.test.tsx` (20 tests, `npx vitest run`) covers the three
screens' components in the light **and** dark scopes, the error-not-empty fork on both tables,
the per-row busy state, and the funnel arithmetic. It is not in the spec's Group 4 file list;
it is additive, lives entirely in Group 4's own tree, and follows Group 1's `kit.smoke.test.tsx`
precedent. Delete it if the file list is meant to be exhaustive.

---

## Group 5 — admin detail, create/edit form, applications pipeline, admin modals

### For Group 1 — `jobsV2.*` keys to fold into `locales/en/common.json` and `locales/ar/common.json`

Every user-visible string in Group 5 goes through `t()`, but the keys below do not exist in the
bundles yet, so each call site passes an **English default as the second argument**
(`t("jobsV2.form.jobTitle", "Job title")`). That renders correctly today in `en` and falls back
to English in `ar`; adding the keys is a pure data change with no component edits.

Namespaces used: `jobsV2.form.*` (the four steps, every field label, helper and error),
`jobsV2.audience.*`, `jobsV2.detail.*`, `jobsV2.candidate.*`, `jobsV2.pipeline.*`,
`jobsV2.bulkPipeline.*`, `jobsV2.questionModal.*`, `jobsV2.questionType.*`, `jobsV2.students.*`,
`jobsV2.export.*`, `jobsV2.resume.*`, `jobsV2.new.*`, `jobsV2.edit.*`, plus
`jobsV2.admin.jobs` and `jobsV2.admin.backToJobs` (which Group 4 also uses).

`grep -rn 't("jobsV2\.' components/admin/jobs-v2 app/admin/jobs-v2` lists every key with the
exact English string it should carry.

### For Group 1 — three small kit gaps Group 5 worked around rather than editing

1. **`JCardProps` declares no `onKeyDown` and no `aria-*` passthrough**, although `JCard` spreads
   `...rest` onto its `Box`. The question-picker card needed checkbox semantics, so it is
   rendered as `component="button" role="checkbox"` (Enter and Space then work natively) with
   `aria-checked` passed through a `Record<string, unknown>` cast. Declaring
   `onKeyDown?: React.KeyboardEventHandler` and `"aria-checked"?: boolean` on `JCardProps` would
   let that cast go.
2. **`JModal` has no header slot for a custom node.** Spec 5.12 asks for a `JAvatar 52` in the
   candidate modal's header. `JModal`'s header takes `icon` (an Iconify name), so the avatar is
   the first row of the modal BODY instead — visually equivalent, and it kept the shared dialog
   unedited.
3. **`BulkAction.render` bypasses the confirm and the outcome summary.** The applications bar
   needs two *inputs* (a target status and a rejection reason) alongside three real actions, so
   two entries are `render`-only controls with a no-op `onRun` and an empty `confirm`. A first-
   class `{ kind: "control", render }` member on the `BulkAction` union would express that
   honestly instead of leaning on a no-op.

### "Advance stage" is a per-row fan-out, and that is deliberate

Spec 4.20 says each bulk action is one request. Two of the three applicant actions can honour
that (`bulkUpdateApplicationStatus` is one call). **"Advance stage" and "Reject with a reason"
cannot**, because the only endpoint that writes a pipeline field or a rejection reason is the
per-application PATCH, and section 10 forbids new endpoints and service changes. They therefore
run a concurrency-capped fan-out (4 at a time) and report a real `BulkOutcome` naming every row
that failed and why — which is exactly what the outcome summary exists for. "Reject with a
reason" still takes the single-request path when no reason is typed.

"Advance stage" writes the **next empty** stage on each row with that stage's positive marker
(`Internal → ops shortlisted`, `HR → hr selected`, `Round 1 → test select`, `Rounds 2-3 →
technical interview select`, `Round 4 → hr interview select`, `Offered → offer accepted`) and
never overwrites a stage that already carries a value. The confirm's `consequences` list groups
the selection by the exact stage and value each row will receive, so nothing is written that the
dialog did not name first.

### For Group 4 — the applicants cell has a canonical destination

`/admin/jobs-v2/{id}/applications` is unchanged and is the only applicants route. The detail
page's "Applicants" strip cell and its header CTA both point there, so the jobs list's
`Applicants` `CountPill` linking to the same URL keeps all three surfaces consistent.

### For Group 3 — clearing a rejection reason now really clears it

`reason_not_shortlisted` was sent as `?.trim() || undefined`, so an emptied field was dropped
from the PATCH body and the old reason persisted forever. The candidate modal now sends `""`
explicitly when the field was touched and left empty. The student-side "Outcome" card (5.3)
should therefore treat an empty string as "no reason recorded" and render nothing, not an empty
information tile.

### `ResumeUrlPreviewModal` props are unchanged

`components/admin/ResumeUrlPreviewModal.tsx` is now a `JModal` and imports from the jobs kit, but
its props (`open`, `onClose`, `resumeUrl`, `resumeName`) are byte-for-byte the same. Its only
importer is the applications page, which stacks it OVER the candidate modal instead of closing
it first.

### Payload shape: unchanged, except the one correction the spec names

`JobCreateUpdatePayload` keys and coercions out of the create/edit form are identical to the
shipped ones — including `assigned_student_ids: []` always being sent, because `[]` is how an
admin clears a curated list. The single difference is that `mandatory_skills` now carries the
must-have list instead of a copy of `key_skills`, which is the root of the duplicated-skills bug
on the detail page (spec 5.11). The scraped-import path still sends `scraped_job_id`.

### For Group 1 — `focusFirstError` throws where there is no layout engine

`components/jobs-v2/ui/Field.tsx`'s `focusFirstError` calls
`node.scrollIntoView({ block: "center", behavior: "smooth" })` unguarded. jsdom implements no
layout and therefore ships no `Element.prototype.scrollIntoView`, so the call throws in every
test that submits an invalid form — and would throw in any other environment missing it. Group 5
shims it locally in `group5.smoke.test.tsx` rather than editing a Group 1 file; the real fix is a
one-line guard in `Field.tsx`:

```ts
node.scrollIntoView?.({ block: "center", behavior: "smooth" });
```

---

# Job-site rebuild — Group A (kit) notes

## For Group B — delete the local `SignalChip` / `DeadlineChip` from `JobCardV2.tsx`

Per job-site spec 5.9 these two **move up** into `components/jobs-v2/ui/Chips.tsx`, because the
rail card, the detail pane, the hero bar and the similar-jobs list all need them now and none of
them should be importing sideways out of a board component.

They are landed in the kit and exported from `ui/index.ts`. `board/JobCardV2.tsx` is **Group B's
file**, so its local copies are still there and still the ones the board renders — nothing is
broken, but there are two definitions of each until B does this:

1. delete the local `SignalChip`, `DeadlineChip` and the `URGENCY_TONE` map from
   `JobCardV2.tsx`;
2. import them from `@/components/jobs-v2/ui`;
3. **re-export them** from `JobCardV2.tsx` (`export { SignalChip, DeadlineChip }`), because
   `JobRowV2.tsx` and the smoke test import them from there and the spec promises no existing
   import breaks.

The kit copies are byte-compatible with the old ones plus one additive prop: `explain`. When set,
the chip becomes a real button that reveals the sentence in a `Popover` on tap — spec 2.3's "every
badge explains itself in situ", for touch users who have no hover and therefore no tooltip. It is
**opt-in**, because a chip that is a button is a tab stop and the rail card's only tab stop is its
title. Pass `explain` on the detail pane; leave it off in the rail.

## For Group B — `--j-split-top` is a variable, and 216px is a guess

`app/globals.css`'s `.jobs-scope` block now declares:

```css
--j-split-top: 216px;   /* app bar + ModulePageHeader + sticky search/filter rail */
--j-rail-w: 400px;
```

`JobsSplitLayout` sizes itself `calc(100dvh - var(--j-split-top) - 16px)`. The 216px is a
placeholder measured against the shipped header stack; **Group B owns the real number**, because
Group B owns what actually sits above the split. Override it on the board's own wrapper
(`sx={{ "--j-split-top": "232px" }}`) rather than editing the token — the token is the contract,
not the measurement. If it is wrong the split is merely too tall or too short by that much; it
cannot break the layout, because the panes are their own scrollers.

## For Group B — the rail card needs `data-rail-id`

`useRailKeys` moves focus by querying `[data-rail-id="<id>"]` inside the rail region. `JobRailCard`
must therefore put `data-rail-id={job.id}` and `tabIndex={-1}` on its root (the title stays the
real tab stop and the real `<Link>`; the root is only a focus target for j/k).

Enter is deliberately **not** intercepted when focus is already inside an `<a href>` — the link
handles its own Enter and intercepting would double-navigate.

## For Groups B and C — `MetaRow`'s fixed order gained `workMode`

`META_ORDER` is now `location · workMode · jobType · experience · salary · posted · deadline`.
`workMode` sits directly after `location` because it qualifies it: "Bengaluru · Hybrid" is one
thought. Build the chip with `formatWorkMode(job.work_mode)` from `lib/jobs-v2/format.ts`, which
returns `null` for anything outside the three-value whitelist — **an unstated location is not
evidence of on-site**, so the chip is omitted, never inferred.

## For Group C — `resolveJobContent` is the only thing you should call

`lib/jobs-v2/content.ts` decides between the four shapes (structured / parsed / flat / empty) once.
Do not branch on `job.role_summary` in `StructuredDescription.tsx` — call `resolveJobContent(job)`
and switch on `content.origin`:

- `"structured"` / `"parsed"` → render the section stack. **`content.flat` is `undefined` in both
  cases**, deliberately, so there is no way to render the blob a second time under the sections.
- `"flat"` → `content.flat` is the raw string; render it through the existing `<Prose>` exactly as
  today. This is a **permanent** path, not a shim — manual admin-authored jobs will always exist.
- `"empty"` → the sparse state. `isContentEmpty(content)` is the guard.

`requirementsGood` is already `good − must`, case-folded, on every path — the UI renders both lists
together and must not show one item twice, and the frontend cannot assume the backend applier has
landed yet.

`stackOverlap(content.techStack, skillTokens)` and `STACK_MERGE_THRESHOLD` implement spec 3.3's
"if `tech_stack` overlaps the skills by more than 80%, render one merged section".

## For Group C — eligibility, and the one thing that must not be re-derived

`buildEligibility(job, profile)` returns `summary.eligible`, which **is** `eligible_to_apply` and
nothing else. Keep reading `job.eligible_to_apply` for the Apply button's `disabled` state, exactly
as today; the summary is for display. A stated gate the student fails (a percentage, a passout
year) can never flip the verdict, because apply does not enforce it — `enforcedVerdict(summary)`
exists to make that explicit at the call site.

Client-side, when the verdict is `false` and the role targets **both** courses and colleges, both
enforced rows read `"unknown"` rather than guessing which one blocked it. That is not a gap to fill
in: naming the wrong blocking criterion is the failure this whole section exists to prevent. It
resolves itself the moment §6.4's `eligibility.checks` ships, which `buildEligibility` prefers
automatically.

`visibilityReasonLabel(job.visibility_reason)` returns `null` for `"open"` and for any value we do
not have a sentence for, so the "Why you're seeing this" chip is omitted rather than invented.

## For Group C — `usePaneScrolled` and `usePaneScrollReset`

Both are no-ops outside a `JobsSplitLayout`, so `JobHeroBar` can mount below `lg` without a guard.
`usePaneScrolled` falls back to `window.scrollY` when there is no pane scroller, so the shadow rule
("only once scrolled; a permanently shadowed bar reads as a modal header") holds at every
breakpoint. Reset the pane on selection with `usePaneScrollReset(job.id)` — the rail's own scroll
position is deliberately untouched.

## Unowned in this wave — `Field.tsx`'s `scrollIntoView`

The earlier note asking Group 1 for a one-line guard in `components/jobs-v2/ui/Field.tsx`
(`node.scrollIntoView?.(…)`) is **still open**. `Field.tsx` appears in no group of the job-site
spec, so Group A did not touch it under the one-file-one-group rule. It still needs the guard.

---

# Group C — the posting, the rich description and the apply affordance

## What landed

`app/jobs-v2/[id]/page.tsx` is now the split's other half: `JobsSplitLayout showBelowLg="pane"`
with `JobsDetailRail` (Group B) on the left and `JobDetailView` in the pane. `JobDetailView` is
**one render tree** at every breakpoint — the `ModulePageHeader` hero, the breadcrumb, the sticky
`JobHeroBar`, the 340px side rail and the fixed mobile bar are all mounted at once and hidden by
CSS. The side group (apply card, Role snapshot, attached JD) moves between the `md` sticky rail
and the `lg+` flow by `gridColumn` / `gridRow` alone, so there is exactly one apply card and one
of every section however wide the window is. No `variant` prop, no second copy for a fix to miss.

The description now goes through `resolveJobContent`, so a structured row, a legacy flat row with
markers, a hand-written row and an empty row all render correctly, and the ~486 published jobs
look sectioned before a single backend phase lands. Sections, eligibility, the company panel, the
safety notice and similar jobs are all self-omitting.

## For Group B — `SimilarJobs` does not use `JobRailCard`, and this is deliberate

`components/jobs-v2/detail/SimilarJobs.tsx` renders its own compact row from the kit atoms
(`CompanyLogo`, `MetaRow`, `DeadlineChip`) rather than `JobRailCard density="compact"`. Three
reasons, all of them about the data rather than the component:

1. **`related_jobs` is a reduced payload shape**, not a `JobV2`: nine optional fields, no skills,
   no description, no `is_favourited`. `JobRailCardProps.job` is `JobV2`, whose `job_title` and
   `company_name` are required, so passing a related row means casting or fabricating two strings.
2. **`density="compact"` drops `JobSignals`, and with it the "why you're seeing this" line** that
   §3.6 makes mandatory for every similar-jobs row. That line is the whole reason our similar
   list can claim "Other roles you can **apply to**" rather than "you might be interested in".
3. **`FavoriteButton` would misreport saved state.** `related_jobs` carries no `is_favourited`, so
   every row would render an unfilled heart — including for roles the student has already saved.

If B would rather have one component, the change belongs in `JobRailCard` (B's file): widen `job`
to the reduced shape, render `visibilityReasonLabel(job.visibility_reason)` at `compact` density,
and take a flag that suppresses the heart when saved state is unknown. `SimilarJobs` will switch
to it in one line. Until then, the duplication is one 60-line row, and it is honest.

## For Group B — the detail route overrides `--j-split-top`

The board's split clears the app bar, the header and the sticky filter rail (216px). This route
carries none of those above the split, so it sets `--j-split-top: 88px` on the `JobsSplitLayout`
wrapper — using the variable exactly as its note in `globals.css` asks, rather than hardcoding a
height in a component. If the board's chrome height changes, only the board's token moves.

## For Group A — two small kit gaps C worked around rather than editing

- **`DefinitionList`'s `columns` is a scalar.** The Role snapshot wants one column in the 340px
  side rail at `md` and two in the full-width pane at `lg`; a scalar can only be one of those, so
  it ships at `columns={1}` everywhere. A responsive `columns?: 1 | 2 | { md?: 1 | 2; lg?: 1 | 2 }`
  would let §3.3's two-column Naukri-shaped block land without a descendant-selector override.
- **`SkillChip selected` is colour-only on a non-interactive chip.** `aria-pressed` is set only
  when `onToggle` is passed, so a matched skill on the detail page is distinguished by tint alone
  — which a colour-blind reader and a screen reader both miss. C added an explanatory line
  ("Highlighted skills are already on your profile.") above the chip row rather than reaching into
  the kit, but a `matched?: boolean` that renders a visually-hidden "on your profile" would fix it
  properly for every caller.

## Unowned in this wave

- **`app/jobs-v2/[id]/loading.tsx`** still renders `HeroSkeleton` + `JobDetailSkeleton`, which was
  right for the old full-width page and is now a relayout against the split at `lg+`. The route's
  own in-component loading branch was updated to the split shell (rail skeleton + pane skeleton,
  hero skeleton `lg`-scoped); `loading.tsx` appears in no group's file list and needs the same
  four lines.
- **`jobsV2.applyOnExternalLink` still reads "Apply on External Link"** in `locales/en/common.json`
  (and its `ar` counterpart). §3.2 asks for "Apply on the company site". The locale bundles are in
  no group's file list, and replacing the key with an inline `defaultValue` would drop the existing
  Arabic string, so the key stands. The substantive half of "the button says where it goes" did
  ship: `apply.destination` renders the resolved host ("Opens greenhouse.io") under every external
  CTA, and `applyDomain` returns `null` for anything unparseable so we never print a destination we
  did not resolve.
- **`fit_note` has no home.** §6.1 specifies the column and §3.3 enumerates the sections without
  it. C did not invent a placement — adding an unspecified section is the drift the spec exists to
  prevent. It needs one line in §3.3 before it can render.

## Behaviour preserved, and where to look if you doubt it

`components/jobs-v2/detail/group3.smoke.test.tsx` pins all of it: `window.open` runs first and
synchronously (the popup-blocker fix), a blocked popup shows an inline link instead of the dialog,
the "Did you apply?" dialog still has three answers with `Esc` mapped to "not yet", the disabled
CTA still names its reason and deep-links the profile, and the favourite toggle, admin-mode hiding,
profile lock, `?ids=` prev/next and `router.back()` fallback are all untouched.

Two display-only changes, both from §3.7: `is_open === false` now marks the role **closed in
place** (a `Closed` pill plus a disabled CTA naming the closing date) instead of leaving a live
Apply button behind an emailed link, and `applications_count` / `favorites_count` are **no longer
rendered** — they count clicks on our own button, not applications the employer received, and a
student reads them as competition. `JobApplyAPIView` remains the authority; no permission changed.

---

# Group B — board, rail, split, filters (landed)

## For Group C — what to import, and what NOT to rebuild

`components/jobs-v2/board/JobBoard.tsx` exports two things for the detail route:

```tsx
// Self-contained. This is the one you want in app/jobs-v2/[id]/page.tsx.
<JobsSplitLayout
  showBelowLg="pane"
  railLabel={…}
  paneLabel={…}
  rail={<JobsDetailRail selectedId={job.id} />}
  pane={<JobDetailView job={job} … />}
/>
```

- **`JobsDetailRail`** owns `useJobFilters({ enabled })`, the `?ids=`/board-query hrefs, the
  left-click interception into `router.push`, `useRailKeys`, the four states and the pagination.
  It also holds the module's **only** surviving `useMediaQuery`, and it decides a *request*, not a
  layout: it starts `false`, so a phone opening a posting from an emailed link issues no board
  fetch it will never show.
- **`JobResultsRail`** is the presentational half (`{ filters, selectedId, header }`) if you ever
  need to hand it a hook instance you already hold. Prefer `JobsDetailRail`.
- **`JobRailCard`** lives in B and C imports it for `SimilarJobs` — pass `density="compact"`,
  which drops the signal strip, and pass a real `href`. If C needs a change to it, it lands in B
  first.

`JobCardV2.tsx` still re-exports `SignalChip` and `DeadlineChip` (they now live in `ui/Chips.tsx`),
so nothing that already imported them from there breaks.

## For Group C — every card href now carries the board query

`JobCardV2` and `JobRowV2` gained an optional `href`. It defaults to `/jobs-v2/${id}` so an admin
preview or a test still links correctly, but the board always passes
`?<serializeState(...)>&ids=<page ids>`. That is what makes the rail come back correct on the
detail route and "Back to jobs" land on page 4 of the filtered search. **`?ids=` is now actually
written** — `JobDetailView`'s prev/next sibling contract was reading a parameter no one produced.

## `--j-split-top` — measured, not guessed

The token in `.jobs-scope` stays the contract; the board measures the real number. `JobBoard`
wraps the split in a `Box` and writes `--j-split-top` onto it from the split's own distance to the
top of the viewport, on mount and on resize. Two guards make it safe rather than clever: the
reading is discarded whenever anything above is scrolled (a `getBoundingClientRect().top` on a
scrolled page under-reports the stack), and the variable is written only when the value actually
changed, so the `ResizeObserver` cannot feed itself. If it never lands, the token's 216px stands
and the split is merely a little tall or short — it cannot break, because each pane is its own
scroller. **Group C's route needs the same wrapper** if its stack above the split differs.

## Decisions that deviate from the letter of the job-site spec, and why

1. **Empty, error and profile-locked render FULL WIDTH, outside the split** — not inside the pane
   (spec 1.6/1.7). The split hides its pane below `lg`, so an empty state that lived only in the
   pane would be invisible on a phone, and an error rendered into both panes announces itself
   twice to a screen reader. One surface, one message, at every breakpoint.
2. **Location, job type and employment type carry NO counts.** Spec 4.2 asks for a count on every
   facet. Those three are applied by the *server* and we do not hold the predicate it applies
   (a `location` of "Bengaluru" may or may not match a row stored as "Bengaluru, KA"), so a
   locally computed leave-one-out count would be a lower bound printed as a fact — which
   non-negotiable #2 forbids more strongly than 4.2 asks. Every client-side facet
   (`role`, `wm`, `exp`, `skills`, `posted`, `close`, `salary`) is counted exactly, zero-count
   options render disabled, and `COUNTED_FACETS` in `useJobFilters.ts` is the list.
   **This resolves itself the day the list endpoint returns facet counts**; nothing else changes.
3. **The mobile sheet holds only the client-side facets.** Spec 4.4's quick strip is
   "Eligible · Job type · Location · Posted"; ours is "Eligible · Job type · Location ·
   Employment type", with Posted moved into the sheet. The reason is (2): the sheet **defers**,
   and its footer states "Show 84 jobs". A deferred filter whose outcome we cannot count is a
   button that lies, so the three server facets stay outside it and apply instantly.
4. **No "Saved" filter pill** (spec 4.1 row 11). `fav` is the Saved *tab*, and `useJobFilters`
   derives `tab` from it; a pill would be a second control for the same state. The Saved tab and
   the `BoardPane` strip cell are the two ways in, and `fav` stays out of `FILTER_KEYS` so
   "Clear all filters" cannot eject a learner from the pane they are standing in.
5. **The eligibility toggle is not rendered when no row carries `eligible_to_apply`**, and `?elig=1`
   is ignored in that case (`canFilterByEligibility`). The list serializer does not send the field
   on every deployment — see the spec's own open-risks appendix — and a toggle that empties the
   board because a field is absent is a filter blaming the student for our payload. Same discipline
   as `canSortByRelevance`. It lights up on its own once Group E ships.
6. **Both densities are in the DOM, one hidden with `display`** (rail at `lg+`, the card/list at
   `xs`–`lg`). That is spec 7.1's rule and what `JDataTable` already does, because `useMediaQuery`
   is `false` on the server and would flash the desktop layout on a phone. The invariant the suite
   now guards is stronger than the old "exists exactly once": the two densities are one `jobs.map`,
   so they are asserted to render the **same jobs, in the same order, at the same hrefs**. Scope
   job-level queries with `[data-jobs-density="rail"]` / `[data-jobs-density="full"]`.

## New URL keys

`elig` (bool), `wm`, `role`, `close` join `JobsUrlState`, `JOBS_URL_DEFAULTS`, `FILTER_KEYS`,
`parseState` and `serializeState`. **No key was removed or renamed**, defaults are still omitted
from the query string, and `fav` is still deliberately outside `FILTER_KEYS`.

## Still open, and still unowned

`components/jobs-v2/ui/Field.tsx` needs the `node.scrollIntoView?.(…)` guard. It appears in no
group of the job-site spec either, so it survived this wave too.
