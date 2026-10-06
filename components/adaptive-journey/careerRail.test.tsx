import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/**
 * The career rail, and the claim it is not allowed to make.
 *
 * "Jobs matching this course" was measured against production and does not work: word overlap
 * tied a German language course to four jobs on "assessment" and "review"; phrase overlap tied
 * 208 of 210 courses to nothing. So only an admin-tagged job may be headed "related", and
 * everything else is headed "open to you". These tests pin that wording, because the wording
 * IS the feature - a list of jobs under a false heading is worse than no list.
 */

const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, prefetch: vi.fn(), replace: vi.fn(), isPending: false }),
}));

import { CareerRail } from "./CareerRail";
import type { CareerJobCard, CareerPanel } from "@/lib/types/adaptive-journey";

const job = (id: number, title: string): CareerJobCard => ({
  id, title, company: "Acme Corp", companyLogo: null,
  location: "Pune", workMode: "remote", employmentType: "full_time", salary: "12 LPA",
});

const panel = (over: Partial<CareerPanel> = {}): CareerPanel => ({
  daysSinceStart: 20,
  unlocked: true,
  unlocksAfterDays: 14,
  related: [],
  open: [],
  openCount: 0,
  resumeNudge: true,
  ...over,
});

beforeEach(() => push.mockClear());

describe("the career rail", () => {
  it("renders nothing at all on a board served before it shipped", () => {
    const { container } = render(<CareerRail career={undefined} courseTitle="Python" />);
    expect(container.firstChild).toBeNull();
  });

  it("stays silent in a learner's first fortnight rather than counting down at them", () => {
    // "Come back in 9 days" helps nobody. Silence until there is something to do.
    const { container } = render(
      <CareerRail career={panel({ unlocked: false, daysSinceStart: 5, resumeNudge: false })} courseTitle="Python" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows an instructor-tagged job immediately, before the fortnight is up", () => {
    render(
      <CareerRail
        career={panel({ unlocked: false, resumeNudge: false, daysSinceStart: 2, related: [job(1, "Python Developer")] })}
        courseTitle="Python"
      />,
    );
    expect(screen.getByText("Python Developer")).toBeTruthy();
    expect(screen.getByText("Related to this course")).toBeTruthy();
  });

  it("only calls a job related when an instructor tied it to the course", () => {
    render(<CareerRail career={panel({ open: [job(2, "Warehouse Associate")], openCount: 1 })} courseTitle="Python" />);
    expect(screen.queryByText("Related to this course")).toBeNull();
    expect(screen.getByText("Open to you")).toBeTruthy();
  });

  it("renders the server's heading rather than composing its own", () => {
    // The predicate that built the list lives on the server, so the sentence describing it
    // does too. If the client wrote this, the two could drift - which is how a rail ends up
    // claiming a relevance it does not have.
    render(
      <CareerRail
        career={panel({
          open: [job(1, "Backend Engineer")], openCount: 1,
          openFilter: { applied: true, label: "Roles this course leads to" },
        })}
        courseTitle="Python"
      />,
    );
    expect(screen.getByText("Roles this course leads to")).toBeTruthy();
    expect(screen.queryByText("Open to you")).toBeNull();
  });

  it("falls back to Open to you when the server narrowed nothing", () => {
    render(
      <CareerRail
        career={panel({
          open: [job(1, "Backend Engineer")], openCount: 1,
          openFilter: { applied: false, label: "Open to you" },
        })}
        courseTitle="Python"
      />,
    );
    expect(screen.getByText("Open to you")).toBeTruthy();
  });

  it("still renders on a board served before the filter existed", () => {
    render(<CareerRail career={panel({ open: [job(1, "Backend Engineer")], openCount: 1 })} courseTitle="Python" />);
    expect(screen.getByText("Open to you")).toBeTruthy();
  });

  it("never describes the open list as matched or recommended", () => {
    // The whole point. If this assertion ever has to change, the relevance signal behind it
    // had better be real.
    const { container } = render(
      <CareerRail career={panel({ open: [job(2, "Backend Engineer")], openCount: 1 })} courseTitle="Python" />,
    );
    const text = (container.textContent ?? "").toLowerCase();
    for (const word of ["matched", "matching", "recommended", "best fit", "suited to you"]) {
      expect(text).not.toContain(word);
    }
  });

  it("reports the real total when it is showing only a page of it", () => {
    render(<CareerRail career={panel({ open: [job(1, "A"), job(2, "B")], openCount: 31 })} courseTitle="Python" />);
    expect(screen.getByText("· 31 roles open right now")).toBeTruthy();
  });

  it("does not claim a total when it is showing everything", () => {
    render(<CareerRail career={panel({ open: [job(1, "A")], openCount: 1 })} courseTitle="Python" />);
    expect(screen.queryByText(/roles open right now/)).toBeNull();
  });

  it("says so plainly when nothing is open to this learner", () => {
    render(<CareerRail career={panel()} courseTitle="Python" />);
    expect(screen.getByText(/No roles are open to you right now/)).toBeTruthy();
  });

  it("opens a job on the v2 detail route, which is the one that exists", () => {
    render(<CareerRail career={panel({ open: [job(77, "Backend Engineer")], openCount: 1 })} courseTitle="Python" />);
    fireEvent.click(screen.getByRole("button", { name: /Backend Engineer at Acme Corp/ }));
    expect(push).toHaveBeenCalledWith("/jobs-v2/77");
  });

  it("sends the learner to the resume builder at the route that exists", () => {
    render(<CareerRail career={panel()} courseTitle="Python Basics" />);
    fireEvent.click(screen.getByRole("button", { name: /Open resume builder/ }));
    expect(push).toHaveBeenCalledWith("/resume");
  });

  it("names the course in the resume nudge so it reads as advice, not a banner", () => {
    render(<CareerRail career={panel()} courseTitle="Python Basics" />);
    expect(screen.getByText(/Add what Python Basics taught you/)).toBeTruthy();
  });

  it("withholds the resume nudge until the gate opens", () => {
    render(
      <CareerRail
        career={panel({ unlocked: false, resumeNudge: false, related: [job(1, "Python Developer")] })}
        courseTitle="Python"
      />,
    );
    expect(screen.queryByText(/Open resume builder/)).toBeNull();
  });
});
