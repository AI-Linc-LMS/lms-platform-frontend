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
