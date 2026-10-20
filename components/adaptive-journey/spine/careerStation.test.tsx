// @vitest-environment jsdom
/**
 * Career stations on the spine: update your resume, and the roles now open to you.
 *
 * Two rules, both about honesty rather than layout.
 *
 * The jobs half must DISAPPEAR on a tenant with no jobs. Agileology holds zero JobDescription
 * rows; a "roles open to you" card there is an empty box on every learner's rail for ever. The
 * server omits `jobs` entirely and this must render the resume half alone rather than an empty
 * column.
 *
 * And nothing may say a job MATCHES the course. That was measured over 210 courses and does not
 * work — course skills come from content generation, job skills from recruiters, and the two
 * vocabularies do not share terms. The career rail already carries this assertion; the stations
 * repeat the same material, so they carry it too.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CareerMilestone } from "@/lib/types/adaptive-journey";

vi.mock("@/components/common/IconWrapper", () => ({ IconWrapper: () => null }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const JOB = (id: number, title: string, company = "Acme") => ({
  id, title, company, companyLogo: null, location: "Bengaluru",
  workMode: "Hybrid", employmentType: "Full time", salary: "",
});

function milestone(over: Partial<CareerMilestone> = {}): CareerMilestone {
  return {
    kind: "career",
    atPercent: 33,
    weekNo: 10,
    locked: false,
    reachedAt: 33,
    resume: {
      title: "Put this month on your resume",
      body: "You are a third of the way in.",
      hasResume: true,
      resumeCount: 1,
      lastSavedAt: null,
      cta: "Update resume",
      href: "/resume",
    },
    jobs: {
      title: "See what you are working towards",
      body: "Roles open right now that this course leads to.",
      label: "Roles this course leads to",
      openCount: 188,
      related: [],
      open: [JOB(1, "AI Engineer"), JOB(2, "Senior Data Scientist")],
      cta: "See roles",
      href: "/jobs",
    },
    ...over,
  };
}

async function draw(m: CareerMilestone) {
  const { CareerStation } = await import("./CareerStation");
  return render(<CareerStation milestone={m} />);
}

describe("a career station", () => {
  it("shows the resume nudge", async () => {
    await draw(milestone());
    expect(screen.getByText(/put this month on your resume/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /update resume/i })).toBeTruthy();
  });

  it("asks a learner with no resume to build one, not update one", async () => {
    await draw(milestone({
      resume: { ...milestone().resume, hasResume: false, cta: "Build resume" },
    }));
    expect(screen.getByRole("link", { name: /build resume/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /update resume/i })).toBeNull();
  });

  it("shows the roles and how many are open", async () => {
    await draw(milestone());
    expect(screen.getByText("AI Engineer")).toBeTruthy();
    expect(screen.getByRole("link", { name: /see roles \(188\)/i })).toBeTruthy();
  });

  it("puts an admin-tagged job before the open ones", async () => {
    await draw(milestone({
      jobs: { ...milestone().jobs!, related: [JOB(9, "Tagged Role")] },
    }));
    const rows = screen.getAllByTestId("career-station-job").map((n) => n.textContent ?? "");
    expect(rows[0]).toContain("Tagged Role");
    expect(rows[1]).toContain("AI Engineer");
  });

  it("shows at most three roles, however many are open", async () => {
    await draw(milestone({
      jobs: {
        ...milestone().jobs!,
        open: Array.from({ length: 9 }, (_, i) => JOB(100 + i, `Role ${i}`)),
      },
    }));
    expect(screen.queryByText("Role 3")).toBeNull();
  });
});

describe("a tenant with no jobs", () => {
  it("gets the resume half and NO jobs card", async () => {
    await draw(milestone({ jobs: undefined }));
    expect(screen.getByRole("link", { name: /update resume/i })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /see roles/i })).toBeNull();
  });

  it("renders no empty jobs heading either", async () => {
    await draw(milestone({ jobs: undefined }));
    expect(screen.queryByText(/roles this course leads to/i)).toBeNull();
    expect(screen.queryByText(/working towards/i)).toBeNull();
  });
});

describe("a station the learner has not reached", () => {
  it("still renders, so they can see what is coming", async () => {
    await draw(milestone({ locked: true }));
    expect(screen.getByTestId("career-station").dataset.locked).toBe("true");
    expect(screen.getByText(/put this month on your resume/i)).toBeTruthy();
  });

  it("does not let them act on it yet", async () => {
    await draw(milestone({ locked: true }));
    // A disabled MUI Button rendered as a link drops the href rather than offering a dead one.
    expect(screen.queryByRole("link", { name: /update resume/i })).toBeNull();
  });
});

describe("what the station is never allowed to claim", () => {
  it("never says a job is matched, a best fit, or recommended", async () => {
    await draw(milestone());
    const text = screen.getByTestId("career-station").textContent?.toLowerCase() ?? "";
    for (const forbidden of ["matched", "best fit", "recommended for you", "matches your"]) {
      expect(text).not.toContain(forbidden);
    }
  });

  it("uses the server's label verbatim rather than inventing one", async () => {
    await draw(milestone());
    expect(screen.getByText("Roles this course leads to")).toBeTruthy();
  });
});
