import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { LearnerDashboard } from "@/lib/types/dashboard";

/**
 * "Continue your courses" and "Up Next" are ADAPTIVE panels: both are built from the adaptive
 * learner dashboard payload and link into /adaptive-courses. They used to be gated on the
 * tenant's `course` feature, which is the retiring CLASSIC catalogue's key. Removing `course`
 * from a tenant as part of the classic-course cutover would therefore have silently hidden both
 * panels from every adaptive learner on that tenant, with their courses still in the payload.
 */

const state = vi.hoisted(() => ({ features: [] as string[], dashboard: null as unknown }));
const nothing = vi.hoisted(() => () => null);

// Every feature hook reads the same list, so the component sees one consistent tenant. The
// classic hook is still implemented here (not stubbed to a constant) so that code which gates
// on it behaves exactly as it would in the app.
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { features: state.features.map((name, id) => ({ id, name })) } }),
  useHideLeaderboardView: () => state.features.includes("no_leaderboard_view"),
  useIsCourseEnabled: () => state.features.includes("course"),
  useIsAdaptiveQuizEnabled: () => state.features.includes("adaptive_quiz"),
}));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/services/adaptive-journey.service", () => ({
  adaptiveJourneyService: { getLearnerDashboard: () => Promise.resolve(state.dashboard) },
}));

// The rest of the dashboard is not what this file checks, and each of these fetches or measures
// on its own. Rendering nothing keeps the assertions about the two panels unambiguous.
vi.mock("./ProfileCompletionPanel", () => ({ ProfileCompletionPanel: nothing }));
vi.mock("./AiBriefingHero", () => ({ AiBriefingHero: nothing }));
vi.mock("./StatCards", () => ({ StatCards: nothing }));
vi.mock("./CourseReadinessCard", () => ({ CourseReadinessCard: nothing }));
vi.mock("./SkillProfilePanel", () => ({ SkillProfilePanel: nothing }));
vi.mock("./CertificatePanel", () => ({ CertificatePanel: nothing }));
vi.mock("./LeaderboardPanel", () => ({ LeaderboardPanel: nothing }));
vi.mock("./DashboardSkeleton", () => ({ DashboardSkeleton: nothing }));
vi.mock("./modules/DashboardModulesRow", () => ({ DashboardModulesRail: nothing }));
vi.mock("./FirstRunCoursesPanel", () => ({ FirstRunCoursesPanel: nothing }));
vi.mock("./TodayGoalPanel", () => ({ TodayGoalPanel: nothing }));
vi.mock("@/components/dashboard/DashboardContent", () => ({ DashboardContent: () => <div>legacy grid</div> }));
vi.mock("@/hooks/useDashboardData", () => ({ useDashboardData: () => ({ loading: false, courses: [] }) }));
// The course cards fade in through framer-motion's whileInView, which needs an observer jsdom
// does not have; without it the row throws on mount for a reason unrelated to the flag.
vi.mock("@/components/scorecard/shared", () => ({
  Reveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { DashboardV2 } from "./DashboardV2";

const cell = { percent: null, band: "not-started" as const };

function dashboardWithOneCourse(): LearnerDashboard {
  return {
    profile: { name: "Sara", weekNo: 1, weekDueAt: null, weekProgressPct: 0, streakDays: 0, bestStreak: 0 },
    aggregate: {
      totalPoints: 0,
      pointsThisWeek: 0,
      streak: { current: 0, best: 0, atRisk: false },
      momentum: 0,
      momentumInfo: {} as LearnerDashboard["aggregate"]["momentumInfo"],
      onTimeRate: null,
      overallMasteryAvg: null,
      cohortRank: { bestRank: null, rankDelta: 0, perCourse: {} },
    },
    courses: [
      {
        id: 40,
        title: "Data Science",
        cardImageUrl: null,
        completionPct: 12,
        readiness: { coverage: cell, precision: cell, craft: cell, clutch: cell, overall: cell },
        skillProfile: { abilityIndex: null, fieldTier: null, mastery: null, skillsTracked: 0, skills: [], aiTip: null },
        upNext: null,
        resumeSubmoduleId: 9,
        due: null,
        leaderboardRank: null,
        certificate: { enabled: false, pct: 0, threshold: 0 },
      },
    ],
    crossCourseUpNext: [
      {
        nodeId: 1,
        title: "Pandas basics",
        type: "topic",
        points: 10,
        weekNo: 1,
        ref: { submoduleId: 9 },
        dueAt: null,
        lockReason: null,
        why: "",
        courseId: 40,
        courseTitle: "Data Science",
        resumeSubmoduleId: 9,
      },
    ],
    leaderboard: { me: null, rows: [], aiTip: null },
    todayGoal: null,
    briefing: null,
    generatedAt: "2026-09-15T00:00:00Z",
  };
}

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DashboardV2 />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  state.dashboard = dashboardWithOneCourse();
});

describe("DashboardV2 adaptive panels and the classic `course` flag", () => {
  it("shows Continue and Up Next to a tenant that has adaptive courses but not `course`", async () => {
    state.features = ["dashboard", "adaptive_quiz", "admin_adaptive_quizzes"];
    renderDashboard();

    expect(await screen.findByText("Continue your courses")).toBeInTheDocument();
    expect(screen.getByText("Up Next")).toBeInTheDocument();
    expect(screen.getByText("Pandas basics")).toBeInTheDocument();
  });

  it("still shows both panels to a tenant that holds both keys", async () => {
    state.features = ["dashboard", "course", "adaptive_quiz"];
    renderDashboard();

    expect(await screen.findByText("Continue your courses")).toBeInTheDocument();
    expect(screen.getByText("Up Next")).toBeInTheDocument();
  });

  it("hides both panels when the learner has no adaptive courses, whatever the flags", async () => {
    state.features = ["dashboard", "adaptive_quiz"];
    state.dashboard = { ...dashboardWithOneCourse(), courses: [], crossCourseUpNext: [] };
    renderDashboard();

    // The layout renders (the payload arrived), but the two self-hiding panels do not.
    await screen.findByText((_, el) => el?.getAttribute("data-tour-id") === "dash-stats");
    expect(screen.queryByText("Continue your courses")).not.toBeInTheDocument();
    expect(screen.queryByText("Up Next")).not.toBeInTheDocument();
  });
});
