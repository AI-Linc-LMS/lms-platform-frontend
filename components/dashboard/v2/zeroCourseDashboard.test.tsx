/**
 * The whole dashboard as a learner with ZERO enrolled courses sees it.
 *
 * "This is showing up in the dashboard and when there is no course enrolled, this is not working
 * properly." The banner's "Explore Adaptive Courses" went to the promoted course's page, which a
 * learner may open only if they are ENROLLED in it - so every not-yet-assigned learner landed on a
 * page whose entire contents were "You are not enrolled in this course." 549 learners across 8
 * adaptive tenants are in that state on prod today, and 539 of them are on a tenant with nothing
 * open to self-enroll into, so there is no course for them to press at all.
 *
 * These render the real panels (not stubs) against the payload prod actually returns, so a panel
 * that starts showing a spinner, a 0 where "not started" is meant, or a button into a locked
 * course fails here.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LearnerDashboard } from "@/lib/types/dashboard";
import type { AdaptivePromotion } from "@/lib/services/adaptive-course.service";
// Initialise the real i18n singleton so the assertions below read the SHIPPED English copy; a
// key missing from locales/en/common.json renders as the key and fails the test.
import "@/lib/i18n";

// framer-motion's whileInView needs one; jsdom has none, and CountUp/Reveal throw without it.
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
// @ts-expect-error jsdom has no IntersectionObserver
globalThis.IntersectionObserver = IO;

const push = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({
  dashboard: null as unknown,
  promotion: null as unknown,
  catalog: [] as unknown[],
  catalogCalls: 0,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }) }));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { features: [] } }),
  useHideLeaderboardView: () => false,
  useIsCourseEnabled: () => false,
  useIsAdaptiveQuizEnabled: () => true,
  useIsAssessmentEnabled: () => true,
  useIsLiveSessionsEnabled: () => true,
  useIsJobsEnabled: () => false,
}));
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useProfileGate: () => ({
    status: "ready",
    percentage: 40,
    lockedModules: [],
    applyServerLock: vi.fn(),
    completion: {
      is_complete: false,
      exempt: false,
      locked_modules: ["jobs"],
      required_fields: [{ field: "phone", label: "Phone number", filled: false }],
    },
  }),
  readProfileLock: () => null,
}));
vi.mock("@/lib/hooks/useB2CAllowance", () => ({
  useB2CAllowance: () => ({ isB2C: false, freeCoursesLeft: 0, refresh: vi.fn() }),
}));
vi.mock("@/lib/services/assessment.service", () => ({
  assessmentService: { getActiveAssessments: () => Promise.resolve([]) },
}));
vi.mock("@/lib/services/live-sessions", () => ({
  studentLiveSessionsService: { getSessions: () => Promise.resolve([]) },
  nextSitting: () => null,
}));
vi.mock("@/lib/services/adaptive-journey.service", () => ({
  adaptiveJourneyService: { getLearnerDashboard: () => Promise.resolve(state.dashboard) },
}));
vi.mock("@/lib/services/adaptive-course.service", () => ({
  adaptiveCourseService: {
    getCatalog: () => {
      state.catalogCalls += 1;
      return Promise.resolve(state.catalog);
    },
    getPromotion: () => Promise.resolve(state.promotion),
    dismissPromotion: vi.fn(() => Promise.resolve()),
  },
}));

import { adaptiveCourseService } from "@/lib/services/adaptive-course.service";
import { AdaptivePromo } from "@/components/courses/AdaptivePromo";
import { DashboardV2 } from "./DashboardV2";

/** Verbatim from prod: build_learner_dashboard + empty_state_briefing for profile 4888 (client 29,
 *  Impacteers), a real active student with zero adaptive enrolments and nothing open to join. */
function zeroCoursePayload(over: { catalogOpen?: boolean } = {}): LearnerDashboard {
  const catalogOpen = over.catalogOpen ?? false;
  return {
    profile: { name: "Utkarsh Singh", weekNo: null, weekDueAt: null, weekProgressPct: 0, streakDays: 0, bestStreak: 0 },
    aggregate: {
      totalPoints: 0, pointsThisWeek: 0, streak: { current: 0, best: 0, atRisk: true },
      momentum: 0, momentumInfo: {} as LearnerDashboard["aggregate"]["momentumInfo"],
      onTimeRate: null, overallMasteryAvg: null,
      cohortRank: { bestRank: null, rankDelta: 0, perCourse: {} },
    },
    courses: [],
    crossCourseUpNext: [],
    leaderboard: { me: null, rows: [], aiTip: null },
    todayGoal: null,
    briefing: catalogOpen
      ? {
          headline: "Welcome, Utkarsh Singh - your learning starts here.",
          lastWeek: "", thisWeek: { focus: "Enroll in a course to begin", course: "" },
          today: "Explore the catalog and pick your first course.",
          weakestSkill: null,
          actions: [{ label: "Explore courses", course: "", route: "/adaptive-courses/catalog", points: 0, kind: "explore" }],
          focusRoute: "/adaptive-courses/catalog", ctaLabel: "Browse courses",
          catalogOpen: true, source: "fallback",
        }
      : {
          headline: "Welcome, Utkarsh Singh - your courses are on their way.",
          lastWeek: "", thisWeek: { focus: "Complete your profile", course: "" },
          today: "Your organisation adds you to your courses. They will appear here as soon as it does.",
          weakestSkill: null,
          actions: [{ label: "Complete your profile", course: "", route: "/profile#profile-strength", points: 0, kind: "profile" }],
          focusRoute: "/profile#profile-strength", ctaLabel: "Complete your profile",
          catalogOpen: false, source: "fallback",
        },
    generatedAt: "2026-09-24T00:00:00Z",
  } as LearnerDashboard;
}

function promotion(over: Partial<AdaptivePromotion> = {}): AdaptivePromotion {
  return {
    eligible: true,
    adaptive_course: { id: 236, title: "Foundation Course", route: "/adaptive-courses" },
    has_prior_courses: true,
    enrolled: false,
    cta_route: null,
    cta_kind: "none",
    show_banner: true,
    show_intro_modal: false,
    ...over,
  };
}

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdaptivePromo />
      <DashboardV2 />
    </QueryClientProvider>,
  );
}

/** The banner is found by its own headline, not a test id: the assertions below must fail against
 *  the OLD component for the reason they name, not because a hook was missing from it. */
const BANNER_TITLE = /just got an upgrade/;

/** Every course page a learner may not open, so no button on this page may point at one. */
const LOCKED_COURSE_ROUTE = /^\/adaptive-courses\/\d+/;

beforeEach(() => {
  push.mockReset();
  state.catalogCalls = 0;
  state.catalog = [];
  state.dashboard = null;
  state.promotion = null;
});

describe("the Adaptive Courses banner with nothing enrolled", () => {
  it("offers no button when the server says there is nowhere this learner can go", async () => {
    state.dashboard = zeroCoursePayload();
    state.promotion = promotion();
    renderDashboard();
    await screen.findByText(BANNER_TITLE);

    expect(screen.queryByRole("button", { name: /Explore Adaptive Courses/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Browse courses/ })).toBeNull();
    // ...and it says so, instead of inviting them to "pick one".
    expect(screen.getByText(/Your organisation picks yours/)).toBeTruthy();
    expect(screen.queryByText(/pick one and the engine/)).toBeNull();
  });

  it("sends a learner who can self-enroll to the catalog, not into a locked course", async () => {
    state.dashboard = zeroCoursePayload({ catalogOpen: true });
    state.promotion = promotion({ cta_route: "/adaptive-courses/catalog", cta_kind: "catalog", has_prior_courses: false });
    renderDashboard();
    await screen.findByText(BANNER_TITLE);

    fireEvent.click(screen.getByRole("button", { name: "Browse courses" }));
    expect(push).toHaveBeenCalledWith("/adaptive-courses/catalog");
    expect(push).not.toHaveBeenCalledWith(expect.stringMatching(LOCKED_COURSE_ROUTE));
  });

  it("still opens the course for someone who is actually enrolled in it", async () => {
    state.dashboard = zeroCoursePayload();
    state.promotion = promotion({ cta_route: "/adaptive-courses/236", cta_kind: "course", enrolled: true });
    renderDashboard();
    await screen.findByText(BANNER_TITLE);

    fireEvent.click(screen.getByRole("button", { name: "Explore Adaptive Courses" }));
    expect(push).toHaveBeenCalledWith("/adaptive-courses/236");
  });

  it("falls back to the legacy route field when the server predates cta_route", async () => {
    state.dashboard = zeroCoursePayload();
    state.promotion = { ...promotion(), cta_route: undefined, cta_kind: undefined };
    renderDashboard();
    await screen.findByText(BANNER_TITLE);

    fireEvent.click(screen.getByRole("button", { name: "Explore Adaptive Courses" }));
    expect(push).toHaveBeenCalledWith("/adaptive-courses");
  });

  it("dismissal hides it and is persisted server-side", async () => {
    state.dashboard = zeroCoursePayload();
    state.promotion = promotion();
    renderDashboard();
    await screen.findByText(BANNER_TITLE);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(adaptiveCourseService.dismissPromotion).toHaveBeenCalledWith("banner");
    await waitFor(() => expect(screen.queryByText(BANNER_TITLE)).toBeNull());
  });

  it("ends the intro walkthrough on Got it rather than a button into a locked course", async () => {
    state.dashboard = zeroCoursePayload();
    state.promotion = promotion({ show_banner: false, show_intro_modal: true });
    renderDashboard();
    await screen.findByText("Meet Adaptive Courses");

    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    fireEvent.click(screen.getByRole("button", { name: /Got it/ }));
    await waitFor(() => expect(adaptiveCourseService.dismissPromotion).toHaveBeenCalledWith("intro_modal"));
    expect(push).not.toHaveBeenCalled();
  });
});

describe("the whole zero-course dashboard", () => {
  it("renders every card in a sensible state and offers no dead ends", async () => {
    state.dashboard = zeroCoursePayload();
    state.promotion = promotion();
    const { container } = renderDashboard();
    await screen.findByTestId("courses-on-their-way");

    // The course-dependent panels hide rather than render empty shells.
    expect(screen.queryByText("Course readiness")).toBeNull();
    expect(screen.queryByText("Continue your courses")).toBeNull();
    expect(screen.queryByText("Your Skill Profile")).toBeNull();
    expect(screen.queryByText("Up Next")).toBeNull();
    expect(screen.queryByText(/You're #/)).toBeNull();          // leaderboard
    expect(screen.queryByText("TODAY'S GOAL")).toBeNull();

    // The tenant module rail keeps its own empty states rather than a permanent shimmer.
    expect(screen.getByText(/no assessments waiting/)).toBeTruthy();
    expect(screen.getByText(/No live sessions scheduled/)).toBeTruthy();
    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(0);

    // A first-time learner is not welcomed BACK.
    expect(screen.getByText(/^WELCOME, UTKARSH SINGH$/)).toBeTruthy();

    // Momentum is a measurement that has not been taken, not a score of zero.
    expect(screen.getByText("not started yet")).toBeTruthy();
    expect(screen.queryByText("of 100")).toBeNull();

    // The course slot no longer repeats the briefing's sentence back at the learner.
    const body = container.textContent ?? "";
    expect(body.match(/Your organisation adds you to your courses/g)).toHaveLength(1);

    // Nothing on the page routes into a course this learner cannot open.
    for (const b of Array.from(container.querySelectorAll("button"))) fireEvent.click(b);
    for (const call of push.mock.calls) {
      expect(String(call[0])).not.toMatch(LOCKED_COURSE_ROUTE);
    }
  });

  it("shows the courses a learner can join, and self-enrolment is one click away", async () => {
    state.dashboard = zeroCoursePayload({ catalogOpen: true });
    state.promotion = promotion({ cta_route: "/adaptive-courses/catalog", cta_kind: "catalog" });
    state.catalog = [7, 8, 9, 10].map((id) => ({
      id, title: `Course ${id}`, module_count: 4, is_paid: false, price: null, currency: "INR",
    }));
    renderDashboard();

    expect(await screen.findByText("Course 7")).toBeTruthy();
    expect(state.catalogCalls).toBe(1);
    // The panel's own button counts what the catalog holds, so it agrees with the page it opens.
    fireEvent.click(screen.getByRole("button", { name: "Browse all 4 courses" }));
    expect(push).toHaveBeenCalledWith("/adaptive-courses/catalog");
    // ...and the banner beside it leads to the same place rather than into a locked course.
    fireEvent.click(screen.getByRole("button", { name: "Browse courses" }));
    expect(push).not.toHaveBeenCalledWith(expect.stringMatching(LOCKED_COURSE_ROUTE));
  });

  it("does not ask for the catalog when the server already said nothing is open", async () => {
    state.dashboard = zeroCoursePayload();
    state.promotion = promotion();
    renderDashboard();
    await screen.findByTestId("courses-on-their-way");
    expect(state.catalogCalls).toBe(0);
  });
});

describe("a learner who DOES have courses is untouched", () => {
  it("keeps welcome back, the momentum number and the continue row", async () => {
    const withCourse = zeroCoursePayload();
    withCourse.aggregate.totalPoints = 240;
    withCourse.aggregate.momentum = 35;
    withCourse.profile.bestStreak = 3;
    withCourse.courses = [
      {
        id: 41, title: "Advanced Python", cardImageUrl: null, completionPct: 22,
        readiness: {
          coverage: { percent: 20, band: "needs-work" }, precision: { percent: 30, band: "needs-work" },
          craft: { percent: 10, band: "needs-work" }, clutch: { percent: 0, band: "not-started" },
          overall: { percent: 18, band: "needs-work" },
        },
        skillProfile: { abilityIndex: null, fieldTier: null, mastery: 30, skillsTracked: 2, skills: [], aiTip: null },
        upNext: null, resumeSubmoduleId: 9, due: null, leaderboardRank: null,
        // A learner who is already IN the course has done its calibration - otherwise the CTA
        // resolver would send them to the assessment and this fixture would stop being
        // "a learner who DOES have courses".
        calibration: { required: true, done: true, pending: false, assessmentId: 7, assessmentSlug: "python-calibration" },
        certificate: { enabled: false, pct: 22, threshold: 80 },
      },
    ] as LearnerDashboard["courses"];
    state.dashboard = withCourse;
    state.promotion = promotion({ cta_route: "/adaptive-courses/41", cta_kind: "course", enrolled: true });
    renderDashboard();

    expect(await screen.findByText("Continue your courses")).toBeTruthy();
    expect(screen.getByText(/^WELCOME BACK, UTKARSH SINGH$/)).toBeTruthy();
    expect(screen.getByText("of 100")).toBeTruthy();
    expect(screen.queryByTestId("courses-on-their-way")).toBeNull();
    expect(screen.getByText("Course readiness")).toBeTruthy();
  });
});
