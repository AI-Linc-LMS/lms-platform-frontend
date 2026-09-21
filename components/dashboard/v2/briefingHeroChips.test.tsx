import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { AiBriefing, LearnerDashboard } from "@/lib/types/dashboard";

/**
 * "In dashboard, week 1 due in - date UI seems to be going out." On a phone the briefing's
 * header held the badge, the week chip and the streak on one line, and the week chip could not
 * shrink, so the due date ran off the right edge. It now wraps onto its own full line on a phone.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/scorecard/shared", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  Reveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { AiBriefingHero } from "./AiBriefingHero";

const briefing = {
  headline: "Aarav, you're #6 in your cohort",
  lastWeek: "",
  thisWeek: { focus: "Lock in Python", course: "Advanced Python" },
  today: "Knock out one topic",
  weakestSkill: null,
  actions: [],
  focusRoute: "/adaptive-courses/1",
  source: "ai",
} as AiBriefing;
const profile = {
  name: "Aarav Sharma",
  weekNo: 1,
  weekDueAt: "2026-09-28T00:00:00Z",
  weekProgressPct: 40,
  streakDays: 3,
  bestStreak: 5,
} as LearnerDashboard["profile"];

function sheetText() {
  return Array.from(document.styleSheets)
    .flatMap((s) => Array.from(s.cssRules))
    .map((r) => r.cssText)
    .join("\n");
}

describe("the briefing header on a phone", () => {
  it("shows the week, its due date and the streak", () => {
    render(<AiBriefingHero briefing={briefing} profile={profile} />);
    expect(screen.getByText("Week 1")).toBeTruthy();
    expect(screen.getByText(/^due /)).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("gives the week chip a full line of its own below the phone breakpoint", () => {
    render(<AiBriefingHero briefing={briefing} profile={profile} />);
    const chip = screen.getByTestId("briefing-week-chip");
    const cls = Array.from(chip.classList).find((c) => c.startsWith("css-") || c.startsWith("mui-"));
    expect(cls).toBeTruthy();
    const css = sheetText();
    // Full width on xs, and allowed to shrink, which is what stops it running off the screen.
    expect(css).toMatch(new RegExp(`\\.${cls}[^}]*width:\\s*100%`));
    expect(css).toMatch(new RegExp(`\\.${cls}[^}]*min-width:\\s*0`));
  });
});
