// @vitest-environment jsdom
/**
 * A readiness signal the course has no material for is not shown at all.
 *
 * Reported: a learner who had finished "How To Prevent Narcotics Addiction" was still told
 * "Applied Craft: Not started". That course has six submodules and no coding problems, so there
 * was nothing to start and no way to clear the row. 64 of the 210 adaptive courses on production
 * contain no coding, so it is a permanent, unactionable deficiency on nearly a third of them.
 *
 * It was never counted in the overall percentage - that renormalises over the signals which
 * have data - so hiding the row changes what is shown and not what is scored.
 */

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// The ring animates in on scroll; jsdom has no IntersectionObserver.
beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", class {
    constructor(private cb: IntersectionObserverCallback) {}
    observe() {
      this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
    }
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  });
});

import { CourseReadinessCard } from "./CourseReadinessCard";
import type { DashboardCourse, ReadinessCell } from "@/lib/types/dashboard";

const cell = (percent: number | null, band: ReadinessCell["band"], applicable?: boolean):
  ReadinessCell => ({ percent, band, ...(applicable === undefined ? {} : { applicable }) });

function course(over: Partial<DashboardCourse["readiness"]> = {}): DashboardCourse {
  return {
    id: 184,
    title: "How To Prevent Narcotics Addiction",
    cardImageUrl: null,
    completionPct: 100,
    readiness: {
      coverage: cell(100, "strong", true),
      precision: cell(100, "strong", true),
      craft: cell(null, "not-applicable", false),
      clutch: cell(11, "needs-work", true),
      overall: cell(72, "building"),
      ...over,
    },
    skillProfile: { skills: [], band: "emerging" },
    upNext: null,
    resumeSubmoduleId: null,
    calibration: { required: false, done: true, nodeId: null },
    due: null,
    leaderboardRank: null,
    certificate: { enabled: false, pct: 0, threshold: 80 },
  } as unknown as DashboardCourse;
}

const show = (c: DashboardCourse) =>
  render(<CourseReadinessCard courses={[c]} activeCourseId={c.id} onSelect={() => {}} />);

describe("readiness signals a course does not contain", () => {
  it("does not render the row at all", () => {
    show(course());
    expect(screen.queryByText("Applied Craft")).toBeNull();
  });

  it("still renders the signals the course DOES contain", () => {
    show(course());
    expect(screen.getByText("Curriculum Coverage")).toBeInTheDocument();
    expect(screen.getByText("Practice Precision")).toBeInTheDocument();
    expect(screen.getByText("Clutch Performance")).toBeInTheDocument();
  });

  it("leaves the overall percentage exactly as the server sent it", () => {
    // Hiding a row must not re-derive the number from the rows that remain.
    show(course());
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("DOES show a signal the course has but the learner has not begun", () => {
    // "Not started" is a real gap when the work exists. Only absence of the work hides it.
    show(course({ craft: cell(null, "not-started", true) }));
    expect(screen.getByText("Applied Craft")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
  });

  it("shows every row when the server omits `applicable` entirely", () => {
    // An older server. Absent must read as applicable, or rows vanish on deploy skew.
    show(course({ craft: cell(null, "not-started") }));
    expect(screen.getByText("Applied Craft")).toBeInTheDocument();
  });
});
