# Platform admin dashboard ("Insights")

Status: **specified, not built.** Every claim below was checked against the code by agents whose
default verdict was REFUTED; file:line references are load-bearing, not decoration.

Repos: `ai-linc-backend` (Django/DRF) · `lms-platform-frontend-1` (Next.js, **Recharts 3.6 already
installed**).
Replaces: `app/admin/dashboard/page.tsx` + `components/admin/dashboard/*`.
Scale constraint: a **7,800-student tenant**, with documented prior N+1 timeouts
(`admin_dashboard/views.py:2791-2795`).

---

## 0. Six shipped numbers are wrong. Fix the label before designing the card.

A dashboard that inherits a wrong number launders it into a decision. These come first.

| # | Shipped today | What it actually is | Action |
|---|---|---|---|
| **C1** | `active_students`, tooltipped in the FE as "logged in the last 15 days" (`app/admin/dashboard/page.tsx:302`) | `user.is_active` — an **account-enabled flag with no timestamp**. On most tenants it equals total students, and it cannot be bucketed by date at all. | Rename to **"Enabled accounts."** Add a real `active_students_30d` (lift `instructor/views.py:373-380`). |
| **C2** | `daily_login_count` / `daily_login_data` | **Not logins.** Distinct students with a `UserTimeTracking` heartbeat = DAU. No login-event table exists; `User.last_login` is never written (no path calls `django.contrib.auth.login()`, and SIMPLE_JWT has no `UPDATE_LAST_LOGIN`). | Rename to **"Daily active students."** Drop `last_login` from the student list payload — it is NULL or stale for every LMS-only user. |
| **C3** | Course completion % | **Two incompatible definitions ship.** Item-based (`adaptive_quiz/progress.py:93`, excludes articles) vs node-based (`adaptive_journey/journey/board.py:301`, includes them). The certificate gate uses one; the admin roster shows the other. | Pick **item-based** — it is the only one with a batch implementation. Write the choice into the glossary. |
| **C4** | `UserActivity` as "activity by content type" | Two sources mashed together: real legacy completions **plus** a mirror of adaptive `ScoreEvent`s whose type map (`adaptive_journey/scoring/service.py:73-82`) collapses interview + checkpoint + week_final + calibration into `'Quiz'` with `course=None`. | **Do not use `UserActivity` for per-type charts.** Use `ScoreEvent.activity_type` (8 real types). |
| **C5** | Ticket resolution time | `resolved_at` is **set to NULL on every reopen** (`apis/views.py:1809`), so reopened tickets vanish from the metric. | Label it "currently-resolved tickets", or add `first_resolved_at`. |
| **C6** | Anything per-instructor from live sessions | `LiveClass.instructor_profile` is written in only 2 of 3 create paths. Admin-created sessions leave it NULL. | **Do not ship a per-instructor chart** until that is fixed. |

**And the filter you asked for is currently fake.** The FE already sends `start_date`/`end_date`
(`admin-dashboard.service.ts:141-142`) and the backend **silently ignores them**. The existing
weekly/bimonthly/monthly toggle slices a fixed 30-day array client-side — so "bimonthly" renders
30 days of data labelled as 60. That toggle must be deleted, not extended.

---

## 1. Information architecture

One landing that answers *is it OK?*, six drill-downs that each own one question.

```
/admin/insights            Pulse: 4 tiles · 1 trend · at-risk list
  ├── /engagement          when and how consistently they show up
  ├── /courses             is the content working
  ├── /cohorts             who is ahead or behind
  ├── /assessments         outcomes
  ├── /live                attendance and feedback
  └── /support             tickets and instructor load
```

**Why not one wall of charts.** You asked for a lot on one page. Twelve equal cards in a uniform
grid means nothing leads and the eye has no entry point — the answer to "show me everything" is
depth by navigation, not density by cramming.

Rules that hold on every page: three tiers (stat row → 1-2 trends → distribution/table),
**one hero per page**, 5-9 metrics per screen, unequal card sizes, and **card titles that are
questions or findings, never nouns** — "Are students finishing?" beats "Completion Chart".

**Hard cap on the landing: 4 stat tiles + 1 trend + 1 list.** TalentLMS caps at 5; Google
Classroom ships 3.

Role scoping is **one parameter, not a second dashboard**: the same components render for admin
(unbounded) and instructor (`instructor/scope.py`).

---

## 2. The global time filter

**Separate RANGE from GRAIN. You pick the range; grain is derived** to land in 10-60 buckets.
Below ~5 buckets a trend chart is a stat tile in disguise; above ~200 a line is noise.

| Preset | Range | Grain | Compare against |
|---|---|---|---|
| `7d` | last 7 complete days | daily | prior 7d |
| `30d` **default** | last 30 complete days | daily | prior 30d |
| `60d` | last 60 complete days | weekly | prior 60d |
| `90d` | last 90 complete days | weekly | prior 90d |
| `6m` | 182 days | weekly | prior 6m |
| `12m` | 365 days | monthly | prior 12m |

Your "daily / weekly / bimonthly / monthly / 6-month" maps onto these. One sticky filter row above
everything: **Range · Scope (cohort/course) · Compare**. No per-card date pickers — a card that
needs its own range belongs on a different page.

### Metrics whose natural grain does not match

| Kind | Rule |
|---|---|
| **Intrinsic-grain** (hour heatmap, calendar heatmap, histograms, progression) | Range filters the underlying events; the form's own buckets are untouched. Subtitle must say so: *"by hour · last 90 days"*. |
| **Stocks** (open tickets, enrolled students) | Rendered **as-of range end**, never summed across buckets. Silently summing a stock is a real and common bug. |
| **Flows** (activities, submissions, minutes) | Aggregate over the range at derived grain. |
| **Ratios** (completion %, pass rate) | **Ratio-of-sums per bucket**, never average-of-daily-ratios — otherwise a 3-student Sunday weighs the same as a 300-student Tuesday and the chart contradicts the tile above it. |
| **Snapshot-only** (content health, skill graph) | Ignores range. Card badge: *"current state"*. |

### Partial and empty buckets

- **The in-progress bucket is excluded from every trend.** It always renders as a dip and someone
  always escalates it as a regression. Its running value goes in the stat tile instead ("2,140 so
  far today").
- **Counts/sums with no data → plot 0.** You know it was none; breaking the line implies unknown.
- **Rates with a zero denominator → undefined, so break the line.** A 0% completion rate on a day
  with zero starts is a fabricated point that drags trendlines.
- **Never silently interpolate.** Smoothing across missing data is the chart lying with a straight face.
- **Whole series empty → keep the card and its axes**, centred empty state with a one-click widen.
  Never collapse (layout jump), never blank (looks broken), never flat-zero (looks like data).

**Timezone:** bucket in `Asia/Kolkata` (`settings.py:206`) with a tz-aware `Trunc`. A raw
`EXTRACT(hour)` returns UTC and is **5h30m wrong**, which inverts the hour-of-day finding.
**Half-open ranges** (`__gte` / `__lt`), never `__date` — that is a function-on-column and defeats
every index below.

---

## 3. Charts, and why each form

Variety where the *question* differs — not for visual interest.

### Landing — Pulse
| Question | Form | Why |
|---|---|---|
| Are students showing up? | Stat + sparkline, vs prior period | A number needs a comparator and a denominator |
| Are they finishing things? | Stat + sparkline | Reach vs depth, paired with the above |
| How much learning time? | Stat: **median** min / active student / active day | Median, not mean — time-per-student is right-skewed by a few heavy users |
| Anything on fire? | Stat: open tickets > 48h | The one number with a deadline |
| Trend | Multi-line, **2 series max**, dual-panel never dual-axis | Continuous time |
| **Who needs help now?** | **Ranked list of 10, one-line reason, inline Message button** | Not a chart. The strongest convergent finding across Canvas / 360Learning / LearnUpon: an exception list without an action button is a to-do you handed the admin |

**At-risk heuristic (v1, explainable, no ML):** no activity 14d (and enrolled >21d); below the
25th percentile of same-course peers; last-5 first-attempt correctness < 0.5. Renders as
*"Priya M — no activity 17 days · 2 of 9 modules · was on pace through week 3."* Peer-relative
means **nobody has to pick a threshold**.

### Engagement
- **Hour-of-day heatmap** (24×7, single hue, ≤6 steps) — cyclical data; a 24-point line hides the
  weekday/weekend split and draws a false cliff at the midnight wrap.
- **Calendar heatmap** — streaks and gaps at a glance; a 180-point daily line is unreadable spikes.
- **Histogram of active-days** — *the most decision-changing chart on the page*. Engagement is
  bimodal (a pile at zero, a pile at high); **the mean describes nobody**.
- **Stacked column by activity type**, ≤4 series + Other — beyond 4 bands are unreadable.
- **Per-student vs per-active-student**, small-multiple pair — conflating those two is the most
  common LMS dashboard lie.

### Courses
Sorted horizontal bars (sorting *is* the analysis); **progression bars, not a trapezoid funnel** —
sloping sides encode nothing, and % of previous finds the leak while % of first gives scale; a
content-health table (most dashboards only ever blame the learner); **dot plot, explicitly not a
radar chart** — radar area grows as value², axis order is arbitrary but changes the shape, and two
students overlap into mush.

### Cohorts
Dumbbell (now vs 30 days ago — two points per entity, a grouped bar wastes the pairing);
**small-multiple histograms on a shared scale** (free scales make small multiples a lie); 100%
stacked roster health.

⚠ **Never label anything "cohort completion rate."** `CohortMembership.completed_at` is serialized
but **never written by any code path**, `status='completed'` is never set, and `CohortCertificate`
has zero creators. Ship "average course progress" and say exactly that.

⚠ The cohort schedule fields on `cohort.Cohort` are **read by nothing** — the live gate reads
`adaptive_journey.CohortSchedule`. Never display `Cohort.start_date` as the cohort's schedule.

### Heatmaps need a custom component
Recharts has none. CSS grid + SVG, quantised to 5 steps, and **zero must be visually distinct from
no-data** (neutral hatch outside the ramp) — that is the number one heatmap bug.

---

## 4. What I recommend cutting, including things you asked for

**1. "Daily logins."** No login event table, `last_login` never written, and the JWT access token
lives **365 days** — so even after building one, a heavy user "logs in" once a year and the chart
looks dead. Ship **"Daily active students"** and drop the word "login" from the product.

**2. Session start times / duration / sessions-per-day.** Today's `session_id` is a localStorage
UUID cleared only on logout — a "session" is really a *browser install*, and row count is *devices
used*. Any "avg session length" tile built today is wrong by an unknown multiple. Fixing it is a
coordinated FE+BE change that **cannot be backfilled**. **The hour-of-day heatmap answers the
underlying question — "when do they study?" — today, for free, honestly labelled.**

**3. Time spent per course/module.** `UserTimeTracking` has no course dimension, and the existing
`?course_id` filter on the time tile **already silently does nothing**. Proportional allocation is
an estimate, not a measurement. Ship `SUM(ScoreEvent.time_spent_ms)` labelled **"time on scored
activities"** — and note it is hard-coded 0 for articles and videos, so it is a floor.

**4. Instructor feedback / ratings.** **There is no instructor rating model anywhere.** The only
candidate rates a single live session, is nullable, and is unattributable for every admin-created
session (C6). Ship instructor **load** (assigned tickets, courses, cohorts, students reached),
which is real, until someone decides what "instructor feedback" means.

**5. Leaderboards / points / XP on the admin dashboard.** They exist in **five** parallel
implementations. "Top 10 point earners" answers no administrative question, correlates with gaming
more than learning, and the legacy one is the **single most expensive query on the current page**
(two full tenant scans per cache miss, on every load). Removing it is the biggest perf win
available. Keep leaderboards learner-facing.

**6. "Total time on platform" as a hero tile.** Vanity, corrupted by idle tabs, and it rewards
inefficient content — a course that takes twice as long scores twice as well.

**7. Real-time counters.** Docebo refreshes daily; Google publishes a 24h lag. Nobody decides
anything on a number that moved four minutes ago, and it costs 10-50× nightly rollups.

**8. A drag-and-drop widget builder.** Without a BI team, every admin builds a worse dashboard than
your default and then blames you for the numbers.

**9. ML at-risk prediction.** The three-rule heuristic catches most true positives on day one and
is explainable to the person you are about to email. Graduate to ML only when you can prove the
heuristic's error rate.

---

## 5. Backend work, ranked

| # | Work | Effort | Verdict |
|---|---|---|---|
| NB-1 | **Indexes.** `UserActivity` has **zero declared indexes**; the only usable one is `client_id`, which selects the whole tenant. | 0.5d | **Blocking. Nothing ships first.** |
| NB-2 | **Honour `start_date`/`end_date`** on the tenant endpoints (already sent, silently ignored). | 1d | **Blocking for the filter.** |
| NB-3 | Real `active_students_30d`. | 0.5d | Correctness fix. |
| NB-4 | **Batch at-risk evaluator** — three grouped queries. | 1-2d | **Highest product value on the page.** |
| NB-5 | **Rollup tables + nightly beat** (`TenantDayRollup`, `StudentDayRollup`, `CourseProgressSnapshot`). | 3-4d | Unlocks cohorts entirely — there is no stored progress value anywhere today. |
| NB-6 | Ticket `first_resolved_at`. | 0.5d | Cheap; history unrecoverable. |
| NB-9 | Persist `device_type` the FE **already posts** and the BE drops. | 0.5d | Cheap; not backfillable. |
| NB-10 | Signup/enrollment funnel endpoint. | 1d | Data exists, nothing aggregates it. |

Deferred: cohort completion (needs a product definition first), article re-reads, ticket CSAT,
retention curves, instructor rating.

---

## 6. Performance

**Budget per endpoint: ≤15 queries, ≤800ms p95 at 7,800 students.** Assert query counts in CI.
**Any endpoint returning one row per student is rejected in review** — return bins, top-N, or a page.

Must come from rollups, never live: every per-student aggregate across the tenant (activity-days
histogram, per-course progress, all cohort charts, live-session attendance).

Safe live after indexes: the Pulse tiles, calendar heatmap, hour-of-day, activity-by-type,
assessments (already cached — **reuse the `AssessmentAnalyticsCache` fingerprint pattern**),
content health.

### Do not call these from a widget

| Location | Problem |
|---|---|
| `activity/leaderboard_utils.py:179-238` | **Worst offender.** No date bound; pulls every marks-bearing row for the tenant **twice** and reduces in Python — on *every* core-dashboard load, just to make a top-10 list. |
| `admin_dashboard/views.py:3115` | 2-4 queries **per student**, unpaginated: ~15-30k queries. |
| `views.py:2875` `StudentListAPIView` | `limit` from the query string with **no cap**. `?limit=7800` ≈ 55,000 queries in one request. Cap at 100. |
| `views.py:3410` | Up to **365 sequential `.exists()`** for one student's streak. Use `activity/utils/streak.py` — one query. |
| `instructor/views.py:417-451` | `course_progress_for_students` in a nested loop — ~900 queries, unbounded for an admin. |
| `apis/views.py:1661` | Unpaginated ticket list; for an admin that is every ticket in the tenant, each row re-signing S3 URLs. |

---

## 7. The data contract, rendered on every page

> Updated 04:15 IST · rollups refresh nightly, live metrics real-time · excludes deactivated
> accounts and unpublished courses · times in Asia/Kolkata · assessment data before 16 Jul 2026 is
> approximate

Every tile label carries an ⓘ with a one-line definition **and its denominator**. Undefined metrics
are the top cause of dashboard abandonment, and the first time a number disagrees with reality
with no stated contract, the admin stops trusting the whole page permanently.
