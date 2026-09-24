"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProfileCompletionPanel } from "./ProfileCompletionPanel";
import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import { useHideLeaderboardView } from "@/lib/contexts/ClientInfoContext";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { AiBriefingHero } from "./AiBriefingHero";
import { StatCards } from "./StatCards";
import { CourseReadinessCard } from "./CourseReadinessCard";
import { SkillProfilePanel } from "./SkillProfilePanel";
import { CertificatePanel } from "./CertificatePanel";
import { UpNextPanel } from "./UpNextPanel";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { ContinueCoursesRow } from "./ContinueCoursesRow";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardModulesRail } from "./modules/DashboardModulesRow";
import { FirstRunCoursesPanel } from "./FirstRunCoursesPanel";
import { TodayGoalPanel } from "./TodayGoalPanel";

/** Shared key so other surfaces can invalidate the learner dashboard after a scoring event. */
export const DASHBOARD_QUERY_KEY = ["learner-dashboard"] as const;

/** Legacy fallback - ONLY for tenants WITHOUT the adaptive feature (the dashboard endpoint 403s) or
 *  an unrecoverable load failure. Every adaptive-enabled tenant gets DashboardV2 (the full layout or
 *  the empty state below), so this old grid is no longer the default for normal students. */
function LegacyFallback() {
  // No course fetch any more: the only thing it fed was the classic "My courses" row, which has
  // gone with the classic course module. What is left here is the welcome, the scorecard widget
  // and the right rail, all of which fetch their own data.
  return <DashboardContent />;
}

/** What a learner with no courses sees when there is no course open for them to join.
 *
 *  It used to be "Start your learning journey" with a "Browse courses" button. But this card only
 *  renders when the catalog is EMPTY (FirstRunCoursesPanel lists the courses otherwise), so that
 *  button always led to "No courses are open to join right now" - reported as "the buttons of
 *  this block don't work if I am not enrolled in any course". On a tenant whose admins assign every
 *  course there is nothing for the learner to press here, so it says what happens next instead.
 *
 *  It then said it in the SAME words as the briefing card directly above it ("Your organisation
 *  adds you to your courses..."), so the page opened by telling a learner the same thing twice.
 *  The briefing owns "what happens next"; this card owns what this SLOT will hold, which is the
 *  one thing nothing else on the page explains.
 */
function CoursesOnTheirWayCard() {
  const { t } = useTranslation("common");
  return (
    <Box
      data-testid="courses-on-their-way"
      sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, textAlign: "center", border: "1px solid #eef2f7", bgcolor: "#faf9ff" }}
    >
      <Box sx={{ width: 56, height: 56, mx: "auto", mb: 2, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,var(--module-tile-from, #7c3aed),var(--module-tile-to, #a855f7))" }}>
        <Icon icon="mdi:school-outline" width={28} color="#fff" />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "#0f172a" }}>
        {t("zeroCourseDashboard.courseSlotTitle", { defaultValue: "Your course will appear here" })}
      </Typography>
      <Typography sx={{ color: "#64748b", mt: 1, maxWidth: 480, mx: "auto" }}>
        {t("zeroCourseDashboard.courseSlotBody", {
          defaultValue:
            "The moment your organisation adds you to one, this is where your next lesson, your progress and your readiness score live.",
        })}
      </Typography>
    </Box>
  );
}

export function DashboardV2() {
  const hideLeaderboard = useHideLeaderboardView();

  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);

  // Served from the PERSISTED query cache, so a revisit — or a return after the tab sat idle — paints
  // the real dashboard immediately and revalidates in the background, instead of showing the skeleton
  // again behind a cold request. (The previous service-level cache was in-memory only, so it was lost
  // on every reload, which is exactly the "came back later and it takes forever" case.)
  const { data: dashboard, isPending, error: queryError } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: () => adaptiveJourneyService.getLearnerDashboard(),
  });
  const data = dashboard ?? null;

  // Same triage as before: feature-off tenants 403/404, and a transient 5xx or a network error (no
  // status) shouldn't blank the page with a scary banner - degrade to the legacy grid instead.
  // Reserve the error text for explicit client errors we genuinely can't recover from.
  const failStatus = (queryError as { response?: { status?: number } } | null)?.response?.status;
  const degraded =
    Boolean(queryError) &&
    (failStatus === 403 || failStatus === 404 || !failStatus || failStatus >= 500);
  const error =
    queryError && !degraded
      ? queryError instanceof Error
        ? queryError.message
        : "Failed to load your dashboard."
      : null;

  // Only blocks when there is genuinely nothing cached to show.
  if (isPending) return <DashboardSkeleton hideLeaderboard={hideLeaderboard} />;
  if (error) return <Typography sx={{ color: "#b91c1c", py: 6, textAlign: "center", fontWeight: 600 }}>{error}</Typography>;
  // Only tenants without the adaptive feature (403/404) or a hard failure see the old dashboard.
  if (degraded) return <LegacyFallback />;
  // A learner with zero courses gets the SAME dashboard as everyone else, not a stripped-down
  // alternate one. The course-dependent panels each hide themselves; what is left — the welcome
  // briefing, profile completion, today's goal, the module panels and the leaderboard — is
  // exactly what a brand-new learner most needs to see.
  if (!data) return <LegacyFallback />;

  const hasCourses = data.courses.length > 0;
  const activeCourse = data.courses.find((c) => c.id === activeCourseId) ?? data.courses[0];
  // Nothing enrolled, nothing earned, no streak ever: this learner has not been here before, so
  // the hero greets them rather than welcoming them BACK.
  const firstRun =
    !hasCourses && data.aggregate.totalPoints === 0 && data.profile.bestStreak === 0;

  return (
    // Two columns like the mockup: AI briefing + stats + readiness + continue on the left;
    // skill profile + certificate + up-next + leaderboard on the right. Course Readiness and Skill
    // Profile are core to the adaptive dashboard, so they render whenever there's an active course
    // (no separate feature flag - that mismatch was what made them intermittently disappear).
    // The tenant-gated module widgets live in the right rail (they fill it out
    // and each sizes to its content) rather than a sparse full-width grid.
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1fr) 390px" },
        gap: 2.5,
        alignItems: "start",
        // A grid item's min-width is `auto`, so a wide child (the stat row, a long unbroken
        // word) makes the COLUMN wider than the phone: the page measured 395px inside a 390px
        // screen and the briefing card was cut off at both edges.
        "& > *": { minWidth: 0 },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {data.briefing && (
          <Box data-tour-id="dash-briefing">
            <AiBriefingHero briefing={data.briefing} profile={data.profile} firstRun={firstRun} />
          </Box>
        )}
        <Box data-tour-id="dash-stats">
          <StatCards aggregate={data.aggregate} hideLeaderboard={hideLeaderboard} />
        </Box>
        {hasCourses ? (
          <Box data-tour-id="dash-courses">
            <CourseReadinessCard courses={data.courses} activeCourseId={activeCourse?.id ?? null} onSelect={setActiveCourseId} />
          </Box>
        ) : (
          // Shows the courses they can actually start, falling back to the plain CTA when the
          // catalog is empty — which it is by design on a tenant whose admins assign everything.
          // The server already knows when nothing is open to join; skip the catalog request then.
          data.briefing?.catalogOpen === false ? (
            <CoursesOnTheirWayCard />
          ) : (
            <FirstRunCoursesPanel fallback={<CoursesOnTheirWayCard />} />
          )
        )}
        {/* Not gated on the tenant's `course` flag. That key belongs to the retiring classic
            catalogue, but this row lists the learner's ADAPTIVE enrolments from the dashboard
            payload, so a tenant that dropped `course` lost "Continue your courses" while
            keeping every course in it. The endpoint already refuses tenants without adaptive
            courses, and the row renders nothing when the learner has none. */}
        <ContinueCoursesRow courses={data.courses} />
      </Box>

      <Stack spacing={2}>
        {/* First in the rail, and it renders NOTHING for a learner with nothing to fix.
            Deliberately not wrapped in a <Box> here: an empty wrapper still occupies a
            Stack spacing slot, which pushed the whole rail 16px out of alignment with the
            briefing card next to it. The tour anchor lives on the panel's own card instead. */}
        <ProfileCompletionPanel />
        {data.todayGoal && (
          <Box data-tour-id="dash-goal">
            <TodayGoalPanel goal={data.todayGoal} />
          </Box>
        )}
        <Box data-tour-id="dash-skills">
          <SkillProfilePanel
            courses={data.courses}
            activeCourseId={activeCourse?.id ?? null}
            onSelect={setActiveCourseId}
            crossCourseMastery={data.aggregate.overallMasteryAvg}
          />
        </Box>
        {activeCourse?.certificate.enabled && <CertificatePanel course={activeCourse} />}
        {/* Same as ContinueCoursesRow: adaptive data, so no classic `course` gate. */}
        <UpNextPanel items={data.crossCourseUpNext} />
        <DashboardModulesRail />
        {!hideLeaderboard && (
          <Box data-tour-id="dash-leaderboard">
            <LeaderboardPanel leaderboard={data.leaderboard} />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
