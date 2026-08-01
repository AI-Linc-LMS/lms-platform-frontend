# Adaptive course admin: settings consolidation

Status: **phase 1 built** (Settings tab, roster, outcome-named switches, shrunken toolbar) on
top of the backend prerequisites in §3, which are also done. Reviewed and independently
verified 2026-08-01.
Surface: `app/admin/adaptive-courses/[courseId]/page.tsx` (1,319 lines), `components/admin/adaptive-course/*`.
Backend: `adaptive_quiz/` in `ai-linc-backend`.

Read this instead of re-deriving the surface from the code.

> **Revision note.** This document has been wrong twice.
>
> Draft 1 asserted the four course settings were independent. Draft 2 corrected that from a
> review, but one of the corrections was itself wrong. Draft 3 (this one) is the first version
> where every claim about backend behaviour was independently verified by an agent whose
> default verdict was REFUTED, reading the code rather than trusting the prior report.
>
> §9 keeps the wrong versions next to the right ones on purpose: the wrong model is the
> intuitive one, and the next person will arrive at it too.

---

## 1. What exists today

### 1.1 The toolbar

`page.tsx:400-489` renders one wrapping flex row. Every control is the same visual object,
an outline pill from `pillBtnSx("outline")`.

| # | Control | Kind | Line | Backing field | Conditional? |
|---|---|---|---|---|---|
| 1 | Content health pill | status | 410 | derived | only when `showHealthBanner` |
| 2 | Edit details | action → dialog | 417 | title/description | — |
| 3 | Add module (AI) | action → dialog | 421 | generation | — |
| 4 | Content locked / unlocked | **toggle** | 428 | `content_locked` | — |
| 5 | Auto-enroll on / off | **toggle** | 440 | `auto_enroll` | — |
| 6 | Self-enroll on / off | **toggle** | 452 | `self_enroll_enabled` | — |
| 7 | Free / ₹price | action → dialog | 467 | `is_paid`,`price`,`currency` | only when `canSetPricing` |
| 8 | Assign to cohort | action → dialog | 477 | cohort artifacts | — |
| 9 | Publish / Unpublish | lifecycle | 485 | `is_published` | — |

**Honest count: seven, not nine**, for a `course_manager` looking at a healthy course. Nine is
the worst case, and in that case the health pill is genuinely the most useful thing on screen.
The clutter is real; do not oversell it.

### 1.2 Why it reads as cluttered

The row mixes five kinds of thing rendered identically. Three defects follow:

1. **A toggle is indistinguishable from a button.** "Auto-enroll on" and "Add module (AI)" are
   the same object. One flips state on click, the other opens a dialog. Nothing predicts which.
2. **The label names the flag, not the outcome.** "Auto-enroll off" states a boolean. It does
   not say what *is* happening. All real explanation lives in `title` tooltips — invisible on
   touch, invisible to keyboard, gone when you look away.
3. **Three enrollment paths are scattered and look mutually exclusive.** Auto-enroll and
   self-enroll sit adjacent reading "on/off", implying one switch with two settings. Cohort
   assignment, a third path, is two pills away styled as an unrelated action.

**Cheaper alternative, considered and rejected:** defects 1 and 2 are fixable in place with a
switch component and outcome-named labels, at a fraction of the cost. Rejected because it
does not fix defect 3, and because settings need to be readable next to the enrollment roster
(§4). Noted so the cheap option is on the record.

---

## 2. The real model (corrected)

The settings are **not** independent. Getting this wrong is the main hazard in this area.

### 2.1 Constraints that actually exist

| Constraint | Where | Effect |
|---|---|---|
| `auto_enroll` ⊕ `is_paid` | `models.py:638-641`, `CheckConstraint("adaptive_course_paid_not_auto_enroll")` | A course cannot be both paid and auto-enrolling. **DB-enforced.** |
| catalog = `self_enroll_enabled OR is_paid` | `enrollment.py:250`, `migrations/0026_paid_courses_on_storefront.py:18-20` | A paid course is catalog-listed even with self-enroll off. **This is intentional** — it fixes priced courses being invisible on every surface, and is pinned by `tests_paid_storefront.py:49-75`. Do not "simplify" line 250 or the exclude at 254-255. |
| catalog excludes enrolled | `enrollment.py:254-255` | Conditional on `user_profile is not None`, and only the catalog view passes one. `can_self_enroll` (`:282`) and the enroll endpoint (`views.py:478-485`) never exclude and both still hard-check `self_enroll_enabled`. |
| `auto_enroll` off removes nothing | `admin_views.py:501-512,642` | The handler only tracks the ON transition; there is no OFF side-effect anywhere. Enrollment rows, mirrored `CohortMembership` rows and `JourneyNodeProgress` rows all survive. Reversal exists but is **admin-only and incomplete** (below). |
| reversal is incomplete | `enrollment.py:285-292` | `AdminAdaptiveCourseUnenrollView` deletes only `AdaptiveCourseEnrollment`, leaving the mirrored `CohortMembership` and `JourneyNodeProgress` rows behind. |
| enabling `auto_enroll` silently creates a Cohort | `cohort/services.py:71-87` | The fan-out calls `default_cohort_for_adaptive_course(create=True)`, which creates a Cohort named after the course plus a primary `CohortArtifact`. It survives turning auto-enroll back off. |

### 2.2 The three enrollment paths

| Path | Direction | Scope | Reversible? |
|---|---|---|---|
| `auto_enroll` | push | whole tenant, now + future joiners | **Not automatically.** Off is a no-op; an admin-only bulk unenroll exists (`admin_views.py:1108`) but leaves mirrored `CohortMembership` and `JourneyNodeProgress` rows behind |
| catalog (`self_enroll_enabled` or `is_paid`) | pull | whole tenant | Yes (delisting stops new joins) |
| cohort assignment | push | selected cohorts, now + future joiners | Partially |

`content_locked` is **not** enrollment. It is pacing, and it sits between two enrollment
toggles in the same row, which is why it reads as a fourth access setting.

### 2.3 Pacing is three settings across two surfaces

| Field | Where | UI today |
|---|---|---|
| `AdaptiveCourse.content_locked` | `models.py:482` | toolbar pill |
| `adaptive_journey.CohortSchedule.start_date` | — | **already has UI**: `CohortScheduleSection.tsx`, rendered at `page.tsx:551` on the Content tab |
| `Cohort.content_locked`, `week_stagger_days`, `week_window_days` | `cohort/models.py:226-228` | none; help text says *"relocated from AdaptiveCourse"* |

**Answered by verification: `AdaptiveCourse.content_locked` is authoritative. The four `Cohort`
pacing fields have ZERO runtime readers.** Gating reads `AdaptiveCourse.content_locked` at
`adaptive_journey/journey/board.py:72,188,192,398` and `scoring/service.py:46`; the calendar is
`adaptive_journey.CohortSchedule`, written only at `adaptive_journey/admin_views.py:127`.
`cohort/services.py`, `cohort/access.py` and `cohort/admin_views.py` reference none of them.

Two traps that follow:

1. **`cohort/models.py:228` help text is factually false at runtime** — it claims "the weekly
   gate reads from this cohort's calendar". It does not.
2. **The defaults are inverted.** `AdaptiveCourse.content_locked` defaults **True**;
   `Cohort.content_locked` defaults **False** (`cohort/models.py:227`). Repointing the read to
   the cohort field without a backfill would silently unlock every course on the platform.

Those fields are writable and echoed back through `cohort/admin_serializers.py:112`, so admins
can configure pacing today that does nothing at all.

Consequence for copy: `content_locked=true` with **no** `CohortSchedule` means sequence and
calibration gating with **no deadlines and no penalties** (`board.py:78-85` builds an empty
calendar). `CohortScheduleSection.tsx:73` already tells the admin *"week deadlines and late
penalties stay inactive until you set a start date."* Any pacing sentence must branch on
whether a schedule exists, or it will contradict a sentence already on screen one tab over.

---

## 3. Prerequisites (backend, do first)

These are not part of the UI work. The UI cannot tell the truth until they land.

| # | Fix | Severity | Where |
|---|---|---|---|
| **P0-1** | **`auto_enroll` ON fans out synchronously inside the HTTP request.** Per active student: `get_or_create` + `mirror_adaptive_enrollment` (own savepoint) + a per-student re-resolve of `default_cohort_for_adaptive_course` + a `post_save` that bulk-creates one `JourneyNodeProgress` per node. No batching, no Celery. On a 7,800-student tenant that is tens of thousands of queries in one request → gateway 504. **The flag is committed at `:641` before the fan-out at `:647`**, so the admin sees an error, the setting is on, enrollment is partial, and clicking again re-runs the whole thing. `AdminAdaptiveCoursePublishView:715-717` re-runs it on **every publish**. | **critical** | `admin_views.py:642-647`, `enrollment.py:172-212`, `cohort/services.py:129,152-164` |
| **P0-2** | **No role gate on the tenant-reach toggles.** Inside `patch`, the only role check is for pricing. `content_locked`, `auto_enroll` and `self_enroll_enabled` have none, so a **`course_manager` can auto-enroll an entire tenant**. See §3.1 — this may be intentional and is a policy call, not a unilateral fix. | **security** | `admin_permissions.py:17`, `admin_views.py:470,~560` |
| **P0-3** | `PATCH {auto_enroll:true}` on an already-paid course is an **unhandled 500** (empirically reproduced: `<h1>Server Error (500)</h1>`). Boolean-shape validation only, no `try/except` around `save()`, no DRF `EXCEPTION_HANDLER` in the repo. Only fires when the payload carries no pricing key — i.e. exactly a bare UI toggle. | high | `admin_views.py:501-512,639-641`; constraint `models.py:638-641` |
| **P0-4** | The PATCH is **not atomic**: no `transaction.atomic`, no `select_for_update`, no `IntegrityError` handling. Two admins editing different settings can collide into the DB constraint and produce a 500 with no `detail` body. | high | `admin_views.py:473-668`, `_get_course` at `:319` |
| P1-1 | CSV bulk import skips the auto-enroll signal: `UserProfile.objects.bulk_create` fires no `post_save`, and profiles are never re-saved. **Scope:** only tenant-wide `auto_enroll` courses *not* explicitly listed on the import job — students still get their ticked courses and cohorts. Self-heals if an admin re-toggles or re-publishes; otherwise needs the manual `backfill_adaptive_enrollments` command. | medium | `admin_dashboard/tasks.py:425-429`, `adaptive_quiz/signals.py:23-26` |
| P1-2 | FE toggle handlers **discard the server payload and write through a stale closure**: `setCourse({ ...course, X: res.X })` throws away the rest of the full detail payload and reads the render-time `course`. Two in-flight toggles revert each other. `handleSaveDetails:303` in the same file already does the correct `setCourse(updated)`. | high | `page.tsx:212,229,246,262` |
| P1-3 | No course→cohorts reverse lookup; no enrolled count on the detail payload. Both needed for cohort chips and blast-radius copy. | high | `admin_serializers.py:484-515` |

### 3.1 The permission question (needs a human)

`tests_pricing_api.py:68` is named `test_a_course_manager_can_still_edit_other_settings` and
asserts a 200 when a `course_manager` PATCHes `self_enroll_enabled`. Somebody decided this on
purpose. So "a course_manager can auto-enroll the whole tenant" is either an accepted trade or
an oversight that the test then froze, and the two are indistinguishable from the code.

Do not change the permission model without deciding which it is. If `auto_enroll` should be
admin-only like pricing, that test changes too.

P0-1 and P0-3 are hit by the exact control this redesign puts front and centre. Shipping a
prettier auto-enroll switch on top of a synchronous tenant-wide fan-out makes the problem more
reachable, not less. P1-1 is one reason admins reach for both enrollment flags at once.

---

## 4. Proposed design

### 4.1 Principle

**State the outcome, not the flag**, and **show the blast radius before the click**.

The question an admin actually has is not "what is `auto_enroll` set to". It is *"who is in
this course, how did they get here, and what happens to that set if I flip this."*

### 4.2 Roster first

The data already exists and is unused: `access_source` on the enrollment
(`self | paid | admin | bulk | seed | migration`, already surfaced in `EnrolledAdaptiveStudent`).

Settings opens with a roster summary:

> **412 students enrolled** — 380 auto-enrolled · 22 via Cohort A · 10 self-joined

Each number filters the Students tab. Every switch shows its consequence before it fires
("turning this on enrolls 47 more students"). This answers the real question, makes the
confirmations in §4.4 fall out for free, and would have surfaced P0-1 the day it shipped.

### 4.3 Toolbar after the change

```
[health]   [Edit details]  [Add module (AI)]        [Settings ⚙]  [Publish]
 status           content actions                    config      lifecycle
```

Publish **stays in the toolbar and is not duplicated in Settings** — it is a lifecycle verb
that should be reachable from every tab. Settings Group 4 is the danger zone only.

### 4.4 Settings groups, in order

0. **Status summary** — published/draft · roster · cost · who can join. Ships in phase 1, not
   later; without it the first three phases have no orientation.
1. **Who can join** — the push flag and the catalog predicate (below).
2. **Cost** — adjacent to Group 1 **because of the DB constraint**, not for tidiness.
3. **Pacing** — `content_locked` **and** the cohort start date, moved here from the Content tab.
4. **Danger zone** — unpublish, with confirmation stated in student terms.
5. **Cover art** — last; it is the only file-upload group and keeps its own error states.

### 4.5 Group 1, modelled correctly

Two controls, not two symmetrical booleans:

- **Enroll everyone at this institution** (`auto_enroll`) — push. Requires confirmation naming
  the count, because it is a one-way door: *"This enrolls 7,842 students. Turning it off later
  does not remove them."* Disabled with an inline reason when the course is paid.
- **List in the student catalog** — the derived predicate `self_enroll_enabled || is_paid`.
  When `auto_enroll` is on, render it inert with *"no effect — everyone is already enrolled"*,
  which is what the code does. When the course is paid, show that listing is forced by pricing.

Then the assigned cohorts as chips (needs P1-1), so all three paths sit together.

**Do not build a three-way radio.** It cannot represent `is_paid`-forced listing and would
re-create the invisible-course bug `tests_paid_storefront.py` exists to prevent.

Switch labels are **outcome-named**, never "Auto-enroll".

### 4.6 Copy: composable clauses, not a sentence table

The first draft proposed a 4-row table of full sentences. That is combinatorial — adding
paid/free makes it 8, cohorts makes it 16 — and those strings rot into mutual contradiction.

Instead: **one short independent clause per mechanism**, rendered as a "Right now:" list. Two
booleans cost two strings; a third mechanism costs one more, not eight.

Constraints that killed the sentence table:
- `<Trans>` appears **zero** times in this repo, so bold interpolation has no mechanism.
- `ClientInfo.name` is optional, so "Every student in **{tenant}**" degrades to a gap.
- Generated multi-clause English does not survive Arabic; a translator cannot re-split it
  along boolean boundaries. `surfaces.tsx:186,293` already carry RTL scar tissue.

**Decide before building: is Settings translated?** This page has **zero** `useTranslation`
calls today while 89 of 256 admin files use it. "Later" means never.

### 4.7 Save model

Instant-apply per control, **except** `auto_enroll`, which gets a blast-radius confirmation
(§4.5) because it is irreversible. Pricing **stays a dialog** — it is a real multi-field
transaction (`is_paid` + `price` + `currency`, currency frozen after payment activity) and it
owns the grandfathered-students confirmation screen, which has nowhere to live inline.

**Correction to the first draft:** it claimed the handlers already do optimistic-update-and-revert.
They do not. `page.tsx:224-239` awaits the PATCH, then sets state. There is no optimistic
update, no pending flag, and no in-flight disable, so a double-click fires two PATCHes. Add
per-control pending state; that is new work, not existing behaviour.

### 4.8 States to specify before coding

Write the matrix per group: loading, saving, error (persistent inline, not a 4s toast for a
tenant-wide setting), permission-denied (what does a `course_manager` see — does the tab still
render?), empty (no cohorts, Razorpay not connected), and blocked (`is_template` can never be
priced; currency frozen once money moved).

### 4.9 One shared component

`SettingRow` — switch + outcome label + helper + resolved clause + disabled-reason + pending.
It appears 3+ times. There is no switch atom in the design system today; the only `Switch` in
the repo is raw MUI in `CoursePricingDialog`. Specify it once or three people build three.

### 4.10 Tab addressability

`?tab=` **does not exist today** — `page.tsx:86` is plain `useState`, no `useSearchParams` on
the page. The first draft used deep-linking as a reason to prefer a tab over a modal; it is
unbuilt work that applies equally to a modal, so it is not a reason for anything. If wanted,
build it in phase 1 for **all** tabs, reading a whitelist on mount and using `router.replace`
so Back exits the page rather than walking seven tabs.

---

## 5. Phasing (corrected)

| Phase | Scope | Backend needed? | Risk |
|---|---|---|---|
| **P0** | The two critical backend fixes in §3 | yes | Must land first |
| 1 | Settings tab; move lock/enroll/pricing/cohorts in; move `CohortScheduleSection` in; status summary; shrink toolbar | no | Low |
| 2 | Roster + blast-radius panel; `SettingRow`; outcome labels; composable clauses | **yes** (P1-1, P1-2) | Medium |
| 3 | Auto-enroll confirmation; unpublish confirmation | no | Medium |
| 4 | Cover art moves in | no | Low |
| 5 | Audit trail (who changed what) | yes, new API | Separate scope |

The first draft claimed phases 1, 2 and 4 needed no backend. **Phase 2 does** — cohort chips
and blast-radius counts both need serializer fields that do not exist.

---

## 6. Not covered

Content tab and module/AI generation; the student-facing side; calibration, mock interview and
certificate tabs; the backend permission model beyond preserving `canSetPricing`.

---

## 7. Open questions

1. Which `content_locked` is authoritative, course or cohort? Blocks all pacing copy.
2. Should unpublishing a course with active students be blocked or confirmed? Recommend
   confirmed — blocking strands an admin who published by mistake — but the string must be in
   student terms and needs a count source.
3. Is Settings translated at launch?
4. Does `course_manager` get the tab at all, or a reduced version?

**Closed by review:** "is auto-enroll + self-enroll both-on a real use case?" No. It is a
workaround for P0-1, and while auto-enroll is on the self-enroll flag does nothing. Both flags
stay in the data model (they are not redundant — catalog listing is independently driven by
`is_paid`), but the UI models catalog listing as a derived predicate, not a peer switch.

---

## 8. References

- Toolbar `page.tsx:400-489` · tabs `491-520` · toggle handlers `207-256` · schedule section mounted `551`
- `lib/services/admin/admin-adaptive-course.service.ts:286-299` (type), `570-577` (PATCH keys)
- Backend: `adaptive_quiz/enrollment.py:196-212,250-255`, `models.py:482,638-641`,
  `admin_views.py:501-512,600-604`, `signals.py:23-37`, `admin_dashboard/tasks.py:428`,
  `cohort/models.py:226-228`, `adaptive_journey/board.py:78-85`
- Tests that constrain this: `adaptive_quiz/tests_paid_storefront.py`, `tests_pricing_api.py:85`
- Surface language: `components/profile/theme/surfaces.tsx`, `components/dashboard/v2/parts.tsx`

---

## 9. Corrections to the first draft (kept deliberately)

The wrong model is the intuitive one. Recording it so the next person does not re-derive it.

| Claimed | Actually |
|---|---|
| The four settings are independent | `auto_enroll` ⊕ `is_paid` is DB-enforced |
| `self_enroll_enabled` is the pull counterpart to `auto_enroll` | Broadly right. My *correction* to it was wrong: I said it has no effect while `auto_enroll` is on. Verification refuted that — the catalog exclude is conditional on a profile being passed, and `can_self_enroll` plus the enroll endpoint still hard-check the flag |
| Catalog listing = `self_enroll_enabled` | `self_enroll_enabled OR is_paid`, and that OR is **deliberate**, pinned by `tests_paid_storefront.py` |
| Both-on lets "anyone who unenrolls rejoin" | There is no student-facing unenroll endpoint. The sentence described nothing. |
| Handlers already optimistically update and revert | They await, then set state. No optimistic update, no pending flag. |
| Phases 1, 2, 4 need no backend | Phase 2 needs two new serializer fields |
| `?tab=settings` deep-linking is a reason to pick a tab | No tab is URL-synced today; it is unbuilt work either way |
| Preventing paid-with-null-price is a new improvement | Already enforced in `CoursePricingDialog.tsx:89,102` |
| Nine controls | Seven for the common case; nine only on a broken course |
| `content_locked` is one setting | Three fields across two surfaces, but only `AdaptiveCourse.content_locked` is ever read. The four `Cohort` pacing fields have zero runtime readers and their help text is false |
