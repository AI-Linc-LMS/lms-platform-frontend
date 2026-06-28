"use client";

import { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import {
  useHideLeaderboardView,
  useIsCourseEnabled,
  useIsScorecardEnabled,
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

/** Degraded view for learners with no adaptive courses — the existing dashboard
 *  (regular-course grid + streak + leaderboard). Mounts useDashboardData only here. */
function DegradedDashboard() {
  const { loading, courses } = useDashboardData();
  // streak props are deprecated on DashboardContent (StreakTable fetches the real streak
  // from the API); don't pass placeholder values.
  return <DashboardContent courses={courses} loading={loading} />;
}

export function DashboardV2() {
  const hideLeaderboard = useHideLeaderboardView();
  const scorecardEnabled = useIsScorecardEnabled();
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
        // Tenants without the adaptive feature 403 here — that's not an error, just fall
        // back to the regular-course dashboard. Reserve the error banner for real failures.
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 403 || status === 404) setDegraded(true);
        else setError(e instanceof Error ? e.message : "Failed to load your dashboard.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardSkeleton hideLeaderboard={hideLeaderboard} />;
  if (error) return <Typography sx={{ color: "#b91c1c", py: 6, textAlign: "center", fontWeight: 600 }}>{error}</Typography>;
  if (degraded || !data || data.courses.length === 0) return <DegradedDashboard />;

  const activeCourse = data.courses.find((c) => c.id === activeCourseId) ?? data.courses[0];
  const showSidebar =
    (scorecardEnabled) || activeCourse?.certificate.enabled || courseEnabled || !hideLeaderboard;

  return (
    // Two columns like the mockup: AI briefing + stats + readiness + continue on the
    // left; skill profile + certificate + up-next + leaderboard on the right.
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: showSidebar ? "minmax(0,1fr) 390px" : "1fr" }, gap: 2.5, alignItems: "start" }}>
      <Box sx={{ minWidth: 0 }}>
        {data.briefing && <AiBriefingHero briefing={data.briefing} profile={data.profile} />}
        <StatCards aggregate={data.aggregate} hideLeaderboard={hideLeaderboard} />
        {scorecardEnabled && (
          <CourseReadinessCard courses={data.courses} activeCourseId={activeCourse?.id ?? null} onSelect={setActiveCourseId} />
        )}
        {courseEnabled && <ContinueCoursesRow courses={data.courses} />}
      </Box>

      {showSidebar && (
        <Stack spacing={2}>
          {scorecardEnabled && (
            <SkillProfilePanel
              courses={data.courses}
              activeCourseId={activeCourse?.id ?? null}
              onSelect={setActiveCourseId}
              crossCourseMastery={data.aggregate.overallMasteryAvg}
            />
          )}
          {activeCourse?.certificate.enabled && <CertificatePanel course={activeCourse} />}
          {courseEnabled && <UpNextPanel items={data.crossCourseUpNext} />}
          {!hideLeaderboard && <LeaderboardPanel leaderboard={data.leaderboard} />}
        </Stack>
      )}
    </Box>
  );
}
