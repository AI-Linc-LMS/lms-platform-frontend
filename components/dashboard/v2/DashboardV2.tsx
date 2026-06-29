"use client";

import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import {
  useHideLeaderboardView,
  useIsCourseEnabled,
} from "@/lib/contexts/ClientInfoContext";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { LearnerDashboard } from "@/lib/types/dashboard";
import { AiBriefingHero } from "./AiBriefingHero";
import { StatCards } from "./StatCards";
import { CourseReadinessCard } from "./CourseReadinessCard";
import { SkillProfilePanel } from "./SkillProfilePanel";
import { CertificatePanel } from "./CertificatePanel";
import { UpNextPanel } from "./UpNextPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { ContinueCoursesRow } from "./ContinueCoursesRow";
import { DashboardSkeleton } from "./DashboardSkeleton";

/** Legacy fallback — ONLY for tenants WITHOUT the adaptive feature (the dashboard endpoint 403s) or
 *  an unrecoverable load failure. Every adaptive-enabled tenant gets DashboardV2 (the full layout or
 *  the empty state below), so this old grid is no longer the default for normal students. */
function LegacyFallback() {
  const { loading, courses } = useDashboardData();
  // streak props are deprecated on DashboardContent (StreakTable fetches the real streak); don't pass them.
  return <DashboardContent courses={courses} loading={loading} />;
}

/** v2 empty state for students on an adaptive-enabled tenant who aren't in any adaptive course yet
 *  (including legacy-only students — the AdaptivePromo banner mounted above this nudges them to
 *  start). Keeps the v2 chrome instead of dropping back to the old dashboard. */
function EmptyAdaptiveDashboard({ data, hideLeaderboard }: { data: LearnerDashboard | null; hideLeaderboard: boolean }) {
  const { push } = useInstantNavigation();
  return (
    <Stack spacing={2.5}>
      {data && <StatCards aggregate={data.aggregate} hideLeaderboard={hideLeaderboard} />}
      <Box sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, textAlign: "center", border: "1px solid #eef2f7", bgcolor: "#faf9ff" }}>
        <Box sx={{ width: 56, height: 56, mx: "auto", mb: 2, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
          <Icon icon="mdi:rocket-launch-outline" width={28} color="#fff" />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "#0f172a" }}>Start your adaptive journey</Typography>
        <Typography sx={{ color: "#64748b", mt: 1, mb: 2.5, maxWidth: 460, mx: "auto" }}>
          You&apos;re not in an adaptive course yet. Adaptive courses adjust to your skill level as you learn — pick one to begin.
        </Typography>
        <Button onClick={() => push("/adaptive-courses")} variant="contained" endIcon={<Icon icon="mdi:arrow-right" width={18} />}
          sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 3, py: 1.1, background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
          Browse adaptive courses
        </Button>
      </Box>
      {!hideLeaderboard && data?.leaderboard && <LeaderboardPanel leaderboard={data.leaderboard} />}
    </Stack>
  );
}

export function DashboardV2() {
  const hideLeaderboard = useHideLeaderboardView();
  const courseEnabled = useIsCourseEnabled();

  const [data, setData] = useState<LearnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    adaptiveJourneyService
      .getLearnerDashboard()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => {
        if (cancelled) return;
        // Feature-off tenants 403/404; a transient 5xx or a network error (no status) shouldn't blank
        // the page with a scary banner — degrade to the legacy grid instead. Reserve the error text
        // for explicit client errors we genuinely can't recover from.
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 403 || status === 404 || !status || status >= 500) setDegraded(true);
        else setError(e instanceof Error ? e.message : "Failed to load your dashboard.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardSkeleton hideLeaderboard={hideLeaderboard} />;
  if (error) return <Typography sx={{ color: "#b91c1c", py: 6, textAlign: "center", fontWeight: 600 }}>{error}</Typography>;
  // Only tenants without the adaptive feature (403/404) or a hard failure see the old dashboard.
  if (degraded) return <LegacyFallback />;
  // Everyone else gets v2 — even with zero adaptive courses (legacy-only / brand-new students).
  if (!data || data.courses.length === 0) return <EmptyAdaptiveDashboard data={data} hideLeaderboard={hideLeaderboard} />;

  const activeCourse = data.courses.find((c) => c.id === activeCourseId) ?? data.courses[0];

  return (
    // Two columns like the mockup: AI briefing + stats + readiness + continue on the left;
    // skill profile + certificate + up-next + leaderboard on the right. Course Readiness and Skill
    // Profile are core to the adaptive dashboard, so they render whenever there's an active course
    // (no separate feature flag — that mismatch was what made them intermittently disappear).
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 390px" }, gap: 2.5, alignItems: "start" }}>
      <Box sx={{ minWidth: 0 }}>
        {data.briefing && <AiBriefingHero briefing={data.briefing} profile={data.profile} />}
        <StatCards aggregate={data.aggregate} hideLeaderboard={hideLeaderboard} />
        <CourseReadinessCard courses={data.courses} activeCourseId={activeCourse?.id ?? null} onSelect={setActiveCourseId} />
        {courseEnabled && <ContinueCoursesRow courses={data.courses} />}
      </Box>

      <Stack spacing={2}>
        <SkillProfilePanel
          courses={data.courses}
          activeCourseId={activeCourse?.id ?? null}
          onSelect={setActiveCourseId}
          crossCourseMastery={data.aggregate.overallMasteryAvg}
        />
        {activeCourse?.certificate.enabled && <CertificatePanel course={activeCourse} />}
        {courseEnabled && <UpNextPanel items={data.crossCourseUpNext} />}
        {!hideLeaderboard && <LeaderboardPanel leaderboard={data.leaderboard} />}
      </Stack>
    </Box>
  );
}
