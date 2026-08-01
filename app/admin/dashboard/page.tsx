"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";
import {
  adminInsightsService,
  type AdaptiveCourseOption,
  type AtRiskRow,
  type EngagementPayload,
  type LeaderboardPayload,
  type LearningPayload,
  type PeoplePayload,
  type PulsePayload,
  type RangeKey,
} from "@/lib/services/admin/admin-insights.service";
import { DashboardHero, HeroKpi, DeckSection } from "@/components/admin/dashboard/v2/surfaces";
import { useToast } from "@/components/common/Toast";
import { LeaderboardPanel } from "@/components/admin/dashboard/v2/LeaderboardPanel";
import { AtRiskPanel, PulseTrendPanel } from "@/components/admin/insights/PulseSection";
import { EngagementSection } from "@/components/admin/insights/EngagementSection";
import { LearningSection } from "@/components/admin/insights/LearningSection";
import { PeopleSection } from "@/components/admin/insights/PeopleSection";

/**
 * The admin dashboard — one deck, no tabs.
 *
 * Panels run in a single column grouped by the question they answer, in the order an admin asks
 * them: who is here, what are they learning, who needs help, how is the human side doing. The
 * alternative was tabs, which is a shorter page that hides three quarters of the content; on a
 * surface whose job is noticing things, a drop in activity sitting next to a spike in tickets is
 * the entire point, and tabs put them on different screens.
 *
 * **Everything here is adaptive-only.** That is not a filter over the old dashboard — the old
 * one could not do it. `UserActivity.course` is a FK to the legacy `lms_core.Course` and the
 * adaptive scorer writes `course=None`, so its course dropdown matched nothing and its daily
 * activity chart counted `COUNT(DISTINCT content_id)` over rows whose content is NULL. Charts
 * with no adaptive equivalent (attendance, session start times) are gone rather than left
 * showing legacy numbers under an adaptive heading.
 *
 * Admin-only, matching the server. On an adaptive tenant a scoped instructor or course_manager
 * already saw a fully zeroed dashboard here — `_scoped_courses_for_profile` resolves legacy
 * courses only — so they lose nothing that worked, and they keep `/instructor/*`.
 */

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { clientInfo } = useClientInfo();
  const isOrgAdmin = isClientOrgAdminRole(user?.role);

  const [range, setRange] = useState<RangeKey>("30d");
  const [courseId, setCourseId] = useState<number | null>(null);
  const [courses, setCourses] = useState<AdaptiveCourseOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [pulse, setPulse] = useState<PulsePayload | null>(null);
  const [atRisk, setAtRisk] = useState<{ results: AtRiskRow[]; rules: Record<string, string> } | null>(null);
  const [board, setBoard] = useState<LeaderboardPayload | null>(null);
  const [engagement, setEngagement] = useState<EngagementPayload | null>(null);
  const [learning, setLearning] = useState<LearningPayload | null>(null);
  const [people, setPeople] = useState<PeoplePayload | null>(null);

  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  // CSV rather than PDF: an admin exporting a dashboard almost always wants to pivot the
  // numbers, and a picture of a chart cannot be pivoted. The file is generated server-side
  // under the filters currently on screen, so it cannot disagree with what is displayed.
  const exportCsv = useCallback(async () => {
    setExporting(true);
    try {
      await adminInsightsService.exportCsv(range, courseId);
    } catch {
      showToast("Could not build the export. Try again.", "error");
    } finally {
      setExporting(false);
    }
  }, [range, courseId, showToast]);

  // Loading is derived, not stored: a section is loading exactly when it has no payload and
  // nothing has failed. Changing a filter clears the payloads, so the skeletons appear in the
  // same tick rather than a frame later, and no panel is ever shown under the wrong label.
  const busy = (p: unknown) => p === null && error === null;

  const invalidate = useCallback(() => {
    setPulse(null);
    setAtRisk(null);
    setBoard(null);
    setEngagement(null);
    setLearning(null);
    setPeople(null);
    setError(null);
  }, []);

  const changeRange = useCallback((next: RangeKey) => {
    setRange(next);
    invalidate();
  }, [invalidate]);

  const changeCourse = useCallback((next: number | null) => {
    setCourseId(next);
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    if (!isOrgAdmin) return;
    let cancelled = false;
    adminInsightsService
      .getCourseOptions()
      .then((c) => {
        if (!cancelled) setCourses(c);
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOrgAdmin]);

  useEffect(() => {
    if (!isOrgAdmin) return;
    let cancelled = false;

    // Each request lands independently so one slow section cannot hold up the rest of the deck,
    // and a failing one degrades to its own empty state instead of blanking the page.
    const settle = <T,>(p: Promise<T>, set: (v: T) => void, fallback?: T) =>
      p
        .then((v) => {
          if (!cancelled) set(v);
        })
        .catch(() => {
          if (cancelled) return;
          if (fallback !== undefined) set(fallback);
          else setError("Some of the dashboard could not load. Try again in a moment.");
        });

    settle(adminInsightsService.getPulse(range, courseId), setPulse);
    settle(adminInsightsService.getAtRisk(10, courseId), setAtRisk, { results: [], rules: {} });
    settle(adminInsightsService.getLeaderboard(courseId, 10), setBoard, {
      rows: [], scope: { course_id: courseId, label: "" }, total_ranked: 0,
    });
    settle(adminInsightsService.getEngagement(range, courseId), setEngagement);
    settle(adminInsightsService.getLearning(range, courseId), setLearning);
    settle(adminInsightsService.getPeople(range), setPeople);

    return () => {
      cancelled = true;
    };
  }, [range, courseId, isOrgAdmin]);

  if (!isOrgAdmin) {
    return (
      <PageShell>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <IconWrapper icon="mdi:lock" size={48} color="var(--font-tertiary)" />
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>
            Admin access required
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            This dashboard covers every student on the tenant, so it is limited to admins.
            Instructors have their own dashboard under Instructor.
          </Typography>
        </Box>
      </PageShell>
    );
  }

  const tiles = pulse?.tiles;

  // One sentence an admin can act on without reading a single chart. Built from the numbers
  // already on screen rather than a new endpoint, and written so the shape of the sentence
  // changes with the situation — a flat month and a collapsing one should not read alike.
  const summary = (() => {
    if (!tiles) return "Loading this tenant's adaptive activity…";
    const active = tiles.active_students.value;
    const total = tiles.active_students.denominator ?? 0;
    const pct = total > 0 ? Math.round((active / total) * 100) : null;
    const diff = tiles.active_students.diff;
    const periodLabel = pulse?.range.label ?? "this period";

    const direction =
      diff > 0 ? `up ${diff.toLocaleString()} on the period before`
        : diff < 0 ? `down ${Math.abs(diff).toLocaleString()} on the period before`
        : "level with the period before";

    const head = total
      ? `${active.toLocaleString()} of ${total.toLocaleString()} students (${pct}%) did something in the ${periodLabel}, ${direction}.`
      : `${active.toLocaleString()} students were active in the ${periodLabel}.`;

    const risk = atRisk?.results.length ?? 0;
    const tail = risk > 0
      ? ` ${risk} ${risk === 1 ? "student needs" : "students need"} attention.`
      : " Nobody is currently flagged as falling behind.";

    return head + tail;
  })();

  const facts = [
    {
      icon: "mdi:school-outline",
      label: courseId
        ? "1 course selected"
        : `${courses.length} adaptive ${courses.length === 1 ? "course" : "courses"}`,
    },
    ...(people?.cohorts?.length
      ? [{ icon: "mdi:account-group-outline", label: `${people.cohorts.length} cohorts` }]
      : []),
    ...(tiles ? [{ icon: "mdi:ticket-outline", label: `${tiles.stale_tickets.value} tickets waiting` }] : []),
  ];

  return (
    <PageShell>
      <Box className="profile-surface" sx={{ p: { xs: 2, md: 4 } }}>
        <DashboardHero
          tenantName={clientInfo?.name || undefined}
          summary={summary}
          facts={facts}
          range={range}
          onRangeChange={changeRange}
          courses={courses}
          courseId={courseId}
          onCourseChange={changeCourse}
          disabled={busy(pulse)}
          action={
            <Button
              onClick={exportCsv}
              disabled={exporting || busy(pulse)}
              size="small"
              startIcon={<IconWrapper icon="mdi:file-delimited-outline" size={16} />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.10)",
                borderRadius: 999,
                px: 1.75,
                "&:hover": { background: "rgba(255,255,255,0.16)" },
              }}
            >
              {exporting ? "Building…" : "Export CSV"}
            </Button>
          }
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
              gap: 1.5,
              mt: 2,
            }}
          >
            <HeroKpi
              label="Students active"
              value={tiles?.active_students.value ?? 0}
              denominator={tiles?.active_students.denominator}
              definition={
                tiles?.active_students.definition ??
                "Students who completed at least one activity in this range."
              }
              delta={
                tiles
                  ? { diff: tiles.active_students.diff, pct: tiles.active_students.pct }
                  : undefined
              }
            />
            <HeroKpi
              label="Activities completed"
              value={tiles?.items_completed.value ?? 0}
              definition={
                tiles?.items_completed.definition ??
                "First-attempt scored activities finished in this range."
              }
              delta={
                tiles
                  ? { diff: tiles.items_completed.diff, pct: tiles.items_completed.pct }
                  : undefined
              }
            />
            <HeroKpi
              label="Median study time"
              value={tiles?.median_minutes.value ?? 0}
              suffix="min"
              definition={
                tiles?.median_minutes.definition ??
                "Median minutes on a day a student actually studied."
              }
              footnote="per active day"
            />
            <HeroKpi
              label="Tickets waiting"
              value={tiles?.stale_tickets.value ?? 0}
              definition={
                tiles?.stale_tickets.definition ??
                "Unresolved tickets opened more than 48 hours ago."
              }
              footnote="unanswered over 48h"
            />
          </Box>
        </DashboardHero>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box>
          <DeckSection title="Who is here" />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <PulseTrendPanel data={pulse} loading={busy(pulse)} />
            <LeaderboardPanel data={board} loading={busy(board)} />
          </Box>
        </Box>

        <Box>
          <DeckSection title="What they are learning" />
          <LearningSection data={learning} loading={busy(learning)} />
        </Box>

        <Box>
          <DeckSection
            title="How they are working"
            hint="Activity mix, study times and consistency, from scored adaptive work."
          />
          <EngagementSection data={engagement} loading={busy(engagement)} />
        </Box>

        <Box>
          <DeckSection title="Who needs help" />
          <AtRiskPanel atRisk={atRisk} loading={busy(atRisk)} />
        </Box>

        <Box>
          <DeckSection
            title="Cohorts, support and instructors"
            hint="Tenant-wide. None of these have a course dimension, so the course filter does not apply."
          />
          <PeopleSection data={people} loading={busy(people)} />
        </Box>

        {pulse?.freshness?.note && (
          <Typography
            sx={{
              mt: 3,
              fontSize: "0.76rem",
              color: "var(--font-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <IconWrapper icon="mdi:clock-outline" size={14} />
            {pulse.freshness.note}
          </Typography>
        )}
      </Box>
    </PageShell>
  );
}
