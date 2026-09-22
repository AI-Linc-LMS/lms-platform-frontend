import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

/**
 * Points System and Leaderboard & Streaks on a phone (390px, iPhone 14).
 *
 * Measured against the demo tenant before this change: 52 text nodes under 12px on
 * /points-system (the decay charts' axis labels came out near 6px) and 30 on
 * /leaderboard-streaks, plus a 20px Back button, a 31px period picker and 17px "i" buttons.
 *
 * jsdom has no layout, so what is pinned here is the emitted CSS and the markup the phone
 * branch chooses: a phone-only size lives in the max-width:599.95px block and nowhere a desktop
 * browser can see, and a 600px+ screen gets the original chart.
 */

import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import type { PointsSystem } from "@/lib/types/points-system";
import type { LeaderboardStreaks } from "@/lib/types/leaderboard-streaks";

const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

const momentumInfo = { value: 40, current: 4, perDay: 10, cap: 100, daysToMax: 6, atMax: false, formula: "4 x 10" };

const spec = (title: string) => ({
  title,
  base: 100,
  grace: 20,
  dec: 1,
  iv: 10,
  floor: 20,
  tMax: 600,
  curve: [
    { t: 0, pts: 100 },
    { t: 20, pts: 100 },
    { t: 600, pts: 40 },
  ],
});

const POINTS: PointsSystem = {
  title: "Points System",
  subtitle: "How points work",
  formula: "pts = base x mult",
  formulaNote: "Wrong answers earn 0.",
  activities: [{ key: "quiz", icon: "mdi:help", accent: "#6366f1", label: "Quiz", sub: "By difficulty", points: "10", unit: "pts" }],
  decay: { quizEasy: spec("Quiz Easy"), codingHard: spec("Coding Hard") },
  difficulty: [{ label: "Easy", mult: 1, quiz: 10, coding: 20 }],
  late: { windowDays: 10, halfWindowDays: 5, staggerDays: 7, bands: [{ label: "On time", note: "within window", mult: 1, caption: "Full points" }] },
  workedExample: { summary: "One week", latePct: 50, rows: [{ label: "Quiz", raw: 10, late: false, final: 10 }], total: 10 },
};

const BOARD: LeaderboardStreaks = {
  period: "all",
  leaderboard: {
    me: { rank: 2, score: 900, trend: "up", percentile: 15, rankDelta: 1 },
    rows: [{ rank: 1, name: "Asha", score: 1200, trend: "up", rankDelta: 1, profile_pic_url: null, is_current_user: false }],
    total: 10,
    climbText: "",
    rankDelta: 1,
  },
  streak: { current: 4, longest: 9, momentum: 40, momentumInfo, atRisk: false, forecast: "Keep going", atRiskTip: "", bestDay: "Tuesdays" },
  calendar: { label: "September", firstWeekday: 0, todayDay: 3, days: [{ day: 1, active: true }] },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/components/scorecard/shared", () => ({ Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/services/adaptive-journey.service", () => ({
  adaptiveJourneyService: {
    getPointsSystem: () => Promise.resolve(POINTS),
    getLeaderboardStreaks: () => Promise.resolve(BOARD),
  },
}));

import { PointsSystemContent } from "./PointsSystemContent";
import { LeaderboardStreaksContent } from "@/components/leaderboard-streaks/LeaderboardStreaksContent";
import { PointsInfo } from "@/components/common/PointsInfo";
import { StreakInfo } from "@/components/common/StreakInfo";
import { MomentumInfo } from "@/components/common/MomentumInfo";

describe("Points System decay chart", () => {
  it("draws a 320-unit canvas with 12-unit labels on a phone, so the ticks render near 12px", async () => {
    viewport(390);
    const { container } = render(<PointsSystemContent />);
    await screen.findByText("Points System");
    const svgs = container.querySelectorAll("svg[viewBox]");
    expect(svgs.length).toBe(2);
    for (const svg of svgs) {
      expect(svg.getAttribute("viewBox")).toBe("0 0 320 160");
      for (const t of svg.querySelectorAll("text")) expect(t.getAttribute("font-size")).toBe("12");
    }
  });

  it("keeps the original 480-unit chart and 9-unit labels on a desktop", async () => {
    viewport(1440);
    const { container } = render(<PointsSystemContent />);
    await screen.findByText("Points System");
    for (const svg of container.querySelectorAll("svg[viewBox]")) {
      expect(svg.getAttribute("viewBox")).toBe("0 0 480 150");
      for (const t of svg.querySelectorAll("text")) expect(t.getAttribute("font-size")).toBe("9");
    }
  });

  it("raises the badge to 12px on a phone and leaves 0.62rem for sm and up", async () => {
    viewport(390);
    render(<PointsSystemContent />);
    const badge = await screen.findByText("UNIFIED");
    const css = cssByMedia(badge);
    expect(css.base).toContain("font-size:0.75rem");
    expect(css.desktop).toContain("font-size:0.62rem");
  });
});

describe("Leaderboard & Streaks on a phone", () => {
  it("makes the period picker 44px tall only inside the phone block", async () => {
    viewport(390);
    render(<LeaderboardStreaksContent />);
    const picker = await screen.findByRole("button", { name: /All time/ });
    const css = cssByMedia(picker);
    expect(css.phone).toContain("min-height:44px");
    expect(css.unscoped).not.toContain("min-height:44px");
  });

  it("keeps the column labels at 0.6rem for sm and up, 12px on a phone", async () => {
    viewport(390);
    render(<LeaderboardStreaksContent />);
    const label = await screen.findByText("This wk");
    const css = cssByMedia(label);
    expect(css.base).toContain("font-size:0.75rem");
    expect(css.desktop).toContain("font-size:0.6rem");
  });
});

describe("points, streak and momentum explainer buttons", () => {
  it.each([
    ["How points work", () => <PointsInfo size={13} />],
    ["How streaks work", () => <StreakInfo size={13} />],
    ["How momentum is calculated", () => <MomentumInfo info={momentumInfo} size={13} />],
  ])("%s: a 44px target on a phone that gives back its growth, nothing on desktop", (name, make) => {
    viewport(390);
    render(make());
    const css = cssByMedia(screen.getByRole("button", { name }));
    expect(css.phone).toContain("min-width:44px");
    expect(css.phone).toContain("min-height:44px");
    // 13px icon + 3.2px padding: the negative margin returns (44 - 16.2) / 2 on each side.
    expect(css.phone).toContain("margin:calc((13px + 3.2px - 44px) / 2)");
    expect(css.unscoped).not.toContain("min-height:44px");
    expect(css.unscoped).not.toContain("calc((13px");
  });
});

describe("no sub-12px literal survives on these surfaces", () => {
  // A plain `fontSize: "0.62rem"` applies at every width. Every size under 0.75rem on these
  // screens goes through phoneText() so a phone gets the 12px floor.
  const files = [
    "components/points-system/PointsSystemContent.tsx",
    "components/leaderboard-streaks/LeaderboardStreaksContent.tsx",
    "app/credentials/[credentialId]/CredentialView.tsx",
    "app/purchases/page.tsx",
    // The dashboard files that carried sub-12px literals on main. Files that never had one are
    // left out so no case here passes vacuously.
    ...[
      "AiBriefingHero", "CertificatePanel", "ContinueCoursesRow", "CourseReadinessCard", "LeaderboardPanel",
      "ProfileCompletionPanel", "SkillProfilePanel", "TodayGoalPanel", "UpNextPanel", "parts",
      "modules/CommunityHighlightsPanel", "modules/JobOpeningsPanel", "modules/LiveSessionsPanel",
      "modules/UpcomingAssessmentsPanel", "modules/shared",
    ].map((f) => `components/dashboard/v2/${f}.tsx`),
  ];
  it.each(files)("%s", (file) => {
    const src = fs.readFileSync(path.resolve(file), "utf8");
    const small = [...src.matchAll(/fontSize: "(0\.\d+)rem"/g)].filter((m) => parseFloat(m[1]) < 0.75).map((m) => m[0]);
    expect(small).toEqual([]);
  });
});
