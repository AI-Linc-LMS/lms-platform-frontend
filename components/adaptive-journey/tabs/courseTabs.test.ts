import { describe, expect, it } from "vitest";
import { averageScore, coursePapers, courseTabs, resolveTab } from "./courseTabs";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";

/**
 * Which sections a course page offers.
 *
 * The rule throughout: a tab appears only when the course genuinely HAS that thing. An empty
 * tab is worse than a missing one - it promises a surface and then explains why it is blank.
 */

const node = (over: Record<string, unknown> = {}) =>
  ({ id: 1, type: "topic", title: "M", status: "available", isCalibration: false,
     score: { earned: 0, total: 30 }, weight: 1, questionCount: 0, ref: {}, ...over });

const board = (over: Record<string, unknown> = {}): JourneyBoard =>
  ({
    course: { id: 1, title: "C", certificateEnabled: false, certificateThreshold: 80,
              fieldTier: null, completionPct: 0 },
    progressCard: { completionPct: 0, nodesDone: 0, nodesTotal: 1, pointsEarned: 0, pointsTotal: 1, onTimeRate: null },
    interview: { card: null },
    weeks: [{ weekNo: 1, nodes: [node()] }],
    ...over,
  }) as unknown as JourneyBoard;

describe("which tabs a course has", () => {
  it("always offers the journey", () => {
    expect(courseTabs(board(), false).map((t) => t.id)).toEqual(["journey"]);
  });

  it("offers the tutor only to a tenant that has it", () => {
    expect(courseTabs(board(), true).map((t) => t.id)).toContain("tutor");
    expect(courseTabs(board(), false).map((t) => t.id)).not.toContain("tutor");
  });

  it("offers assessments when the course has papers, and counts the passed ones", () => {
    const b = board({ weeks: [{ weekNo: 1, nodes: [
      node(), node({ id: 9, type: "week_final", status: "done" }),
      node({ id: 10, type: "week_final", status: "locked" }),
    ] }] });
    const tab = courseTabs(b, false).find((t) => t.id === "assessments");
    expect(tab?.badge).toBe("1/2");
  });

  it("offers no assessments tab on a course that has none", () => {
    expect(courseTabs(board(), false).map((t) => t.id)).not.toContain("assessments");
  });

  it("does not count the calibration as one of the course's papers", () => {
    // It is the entry assessment and has its own card above the timeline.
    const b = board({ weeks: [{ weekNo: 0, nodes: [
      node({ id: 9, type: "checkpoint", isCalibration: true }),
    ] }] });
    expect(coursePapers(b)).toHaveLength(0);
    expect(courseTabs(b, false).map((t) => t.id)).not.toContain("assessments");
  });

  it("offers the interview only when one is configured", () => {
    const configured = board({ interview: { card: { templateId: 5, configured: true, status: "not_started" } } });
    expect(courseTabs(configured, false).map((t) => t.id)).toContain("interview");
    const half = board({ interview: { card: { templateId: null, configured: true, status: "not_started" } } });
    expect(courseTabs(half, false).map((t) => t.id)).not.toContain("interview");
    const unconfigured = board({ interview: { card: { templateId: 5, configured: false, status: "not_configured" } } });
    expect(courseTabs(unconfigured, false).map((t) => t.id)).not.toContain("interview");
  });

  it("offers jobs only when there are jobs, and badges the real number", () => {
    const b = board({ career: { openCount: 12, open: [], related: [{ id: 1 }], unlocked: true,
                                daysSinceStart: 40, unlocksAfterDays: 14, resumeNudge: true } });
    expect(courseTabs(b, false).find((t) => t.id === "jobs")?.badge).toBe("13");
    const none = board({ career: { openCount: 0, open: [], related: [], unlocked: true,
                                   daysSinceStart: 40, unlocksAfterDays: 14, resumeNudge: true } });
    expect(courseTabs(none, false).map((t) => t.id)).not.toContain("jobs");
  });

  it("offers the certificate only when the course issues one", () => {
    const b = board({ course: { ...board().course, certificateEnabled: true } });
    expect(courseTabs(b, false).map((t) => t.id)).toContain("certificate");
    expect(courseTabs(board(), false).map((t) => t.id)).not.toContain("certificate");
  });

  it("keeps them in the order a learner moves through them", () => {
    const b = board({
      course: { ...board().course, certificateEnabled: true },
      interview: { card: { templateId: 5, configured: true, status: "not_started" } },
      career: { openCount: 3, open: [], related: [], unlocked: true, daysSinceStart: 40, unlocksAfterDays: 14, resumeNudge: true },
      weeks: [{ weekNo: 1, nodes: [node(), node({ id: 9, type: "week_final" })] }],
    });
    expect(courseTabs(b, true).map((t) => t.id))
      .toEqual(["journey", "tutor", "assessments", "interview", "jobs", "certificate"]);
  });
});

describe("which tab opens", () => {
  const tabs = courseTabs(board(), true);

  it("falls back to the journey for an unknown tab", () => {
    // A stale `?tab=` from a bookmark must not leave the page blank.
    expect(resolveTab("nonsense", tabs)).toBe("journey");
    expect(resolveTab(null, tabs)).toBe("journey");
  });

  it("falls back when the tab exists in principle but not on THIS course", () => {
    expect(resolveTab("certificate", tabs)).toBe("journey");
  });

  it("opens the requested tab when the course has it", () => {
    expect(resolveTab("tutor", tabs)).toBe("tutor");
  });
});

describe("the average score", () => {
  const withPapers = (papers: Record<string, unknown>[]) =>
    board({ weeks: [{ weekNo: 1, nodes: papers.map((p, i) => node({ id: 100 + i, type: "week_final", ...p })) }] });

  it("averages the papers that were actually finished", () => {
    expect(averageScore(withPapers([
      { status: "done", score: { earned: 86, total: 100 } },
      { status: "done", score: { earned: 74, total: 100 } },
      { status: "locked", score: { earned: 0, total: 100 } },
    ]))).toBe(80);
  });

  it("is null when nothing has been finished, not zero", () => {
    // "0%" reads as a failure. Nothing has happened yet.
    expect(averageScore(withPapers([{ status: "locked", score: { earned: 0, total: 100 } }]))).toBeNull();
  });

  it("ignores a paper worth nothing rather than dividing by zero", () => {
    expect(averageScore(withPapers([
      { status: "done", score: { earned: 0, total: 0 } },
      { status: "done", score: { earned: 50, total: 100 } },
    ]))).toBe(50);
  });
});
