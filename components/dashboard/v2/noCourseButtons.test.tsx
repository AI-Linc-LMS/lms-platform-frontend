/**
 * "The buttons of this block don't work if I am not enrolled in any course."
 *
 * On a tenant whose admins assign every course, the welcome briefing's buttons and the "Browse
 * courses" card all led to a catalog that says "No courses are open to join right now".
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AiBriefing, LearnerDashboard } from "@/lib/types/dashboard";

const push = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({ dashboard: null as unknown, catalogCalls: 0 }));
const nothing = vi.hoisted(() => () => null);

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }) }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { features: [] } }),
  useHideLeaderboardView: () => true,
  useIsCourseEnabled: () => false,
  useIsAdaptiveQuizEnabled: () => true,
}));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/services/adaptive-journey.service", () => ({
  adaptiveJourneyService: { getLearnerDashboard: () => Promise.resolve(state.dashboard) },
}));
vi.mock("@/lib/services/adaptive-course.service", () => ({
  adaptiveCourseService: {
    getCatalog: () => {
      state.catalogCalls += 1;
      return Promise.resolve([]);
    },
  },
}));
vi.mock("@/lib/hooks/useB2CAllowance", () => ({ useB2CAllowance: () => ({ isB2C: false, freeCoursesLeft: 0 }) }));
vi.mock("./ProfileCompletionPanel", () => ({ ProfileCompletionPanel: nothing }));
vi.mock("./StatCards", () => ({ StatCards: nothing }));
vi.mock("./SkillProfilePanel", () => ({ SkillProfilePanel: nothing }));
vi.mock("./LeaderboardPanel", () => ({ LeaderboardPanel: nothing }));
vi.mock("./modules/DashboardModulesRow", () => ({ DashboardModulesRail: nothing }));
vi.mock("./TodayGoalPanel", () => ({ TodayGoalPanel: nothing }));
vi.mock("@/components/scorecard/shared", () => ({
  Reveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { AiBriefingHero } from "./AiBriefingHero";
import { DashboardV2 } from "./DashboardV2";

const PROFILE = { name: "Sara", weekNo: 1, weekDueAt: null, weekProgressPct: 0, streakDays: 0, bestStreak: 0 };

function briefing(over: Partial<AiBriefing>): AiBriefing {
  return {
    headline: "Welcome, Sara - your courses are on their way.",
    lastWeek: "",
    thisWeek: { focus: "You're all set", course: "" },
    today: "Your organisation adds you to your courses.",
    weakestSkill: null,
    actions: [],
    focusRoute: null,
    ctaLabel: null,
    catalogOpen: false,
    source: "fallback",
    ...over,
  };
}

function dashboard(b: AiBriefing): LearnerDashboard {
  return {
    profile: PROFILE,
    aggregate: {
      totalPoints: 0, pointsThisWeek: 0, streak: { current: 0, best: 0, atRisk: false }, momentum: 0,
      momentumInfo: {} as LearnerDashboard["aggregate"]["momentumInfo"], onTimeRate: null,
      overallMasteryAvg: null, cohortRank: { bestRank: null, rankDelta: 0, perCourse: {} },
    },
    courses: [],
    crossCourseUpNext: [],
    leaderboard: { me: null, rows: [], aiTip: null },
    todayGoal: null,
    briefing: b,
    generatedAt: "2026-09-18T00:00:00Z",
  } as LearnerDashboard;
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
  push.mockReset();
  state.catalogCalls = 0;
});

describe("the welcome briefing with no courses", () => {
  it("offers no button when there is nowhere useful to go", () => {
    render(<AiBriefingHero briefing={briefing({})} profile={PROFILE} />);
    expect(screen.queryByText(/Start this week/)).toBeNull();
    fireEvent.click(screen.getByText("You're all set"));
    fireEvent.click(screen.getByText(/adds you to your courses/));
    expect(push).not.toHaveBeenCalled();
  });

  it("sends an incomplete profile to the profile, under that name", () => {
    const b = briefing({
      thisWeek: { focus: "Complete your profile", course: "" },
      actions: [{ label: "Complete your profile", course: "", route: "/profile#profile-strength", points: 0, kind: "profile" }],
      focusRoute: "/profile#profile-strength",
      ctaLabel: "Complete your profile",
    });
    render(<AiBriefingHero briefing={b} profile={PROFILE} />);
    fireEvent.click(screen.getByRole("button", { name: /Complete your profile →/ }));
    expect(push).toHaveBeenCalledWith("/profile#profile-strength");
  });

  it("keeps the old button for a learner with courses", () => {
    render(<AiBriefingHero briefing={briefing({ focusRoute: "/adaptive-courses/4", ctaLabel: undefined })} profile={PROFILE} />);
    fireEvent.click(screen.getByText(/Start this week's focus/));
    expect(push).toHaveBeenCalledWith("/adaptive-courses/4");
  });
});

describe("the course slot with no courses", () => {
  it("says what happens next instead of linking to an empty catalog", async () => {
    state.dashboard = dashboard(briefing({}));
    renderDashboard();
    expect(await screen.findByTestId("courses-on-their-way")).toBeTruthy();
    expect(screen.queryByText("Browse courses")).toBeNull();
    // The server already said the catalog is closed; no need to ask it again.
    expect(state.catalogCalls).toBe(0);
  });

  it("falls back to the same card when the catalog turns out to be empty", async () => {
    state.dashboard = dashboard(briefing({ catalogOpen: undefined }));
    renderDashboard();
    expect(await screen.findByTestId("courses-on-their-way")).toBeTruthy();
    expect(state.catalogCalls).toBe(1);
    expect(screen.queryByText("Browse courses")).toBeNull();
  });
});
