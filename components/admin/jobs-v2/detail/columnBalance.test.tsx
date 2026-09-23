/**
 * The admin job page's two columns stay balanced whatever the posting holds.
 *
 * Reported twice, in opposite directions. First: "the right-side column is disproportionately
 * long while the left has much less content" — #1618 moved skills, classification and links
 * left, #1631 moved eligibility after them. Then: "now the left column is too long than the
 * right." Both reports are true, of different postings. Measured on the demo tenant at 1440px
 * with the fixed split:
 *
 *     job 22   left 1838  right  525   ratio 3.50
 *     job 19   left  467  right  826   ratio 0.57
 *
 * So the column is chosen per posting now. These tests fix the PROPERTIES that matter — the
 * plan is the best split available, it is frozen while the admin works, and below md it does
 * not decide reading order — rather than which side a given card lands on, which is the thing
 * that came back twice.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import "@/lib/i18n";

process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { DESKTOP, PHONE, styleAt } from "@/components/jobs-v2/responsiveSx.testutil";
import {
  LEFT_ANCHOR,
  PUBLISHING_WEIGHT,
  QUIET_SECTION,
  RIGHT_ANCHOR,
  SECTION_ORDER,
  audienceWeight,
  chipsWeight,
  linksWeight,
  planColumns,
  proseWeight,
  rowsWeight,
  type JobSectionKey,
  type SectionWeights,
} from "./columnPlan";

/** Just under `md`, where the grid is still one track but the phone rules have stopped. */
const TABLET = 700;

const heightOf = (keys: JobSectionKey[], weights: SectionWeights) =>
  keys.reduce((total, key) => total + (weights[key] ?? 0), 0);

/**
 * The shortest taller-column ANY assignment could produce, given that the posting is pinned
 * left and the publishing card right. Exhaustive: at most five sections move.
 */
function bestPossible(weights: SectionWeights): number {
  const present = SECTION_ORDER.filter((key) => (weights[key] ?? 0) > 0);
  const packable = present.filter((key) => key !== LEFT_ANCHOR && key !== RIGHT_ANCHOR);
  const anchoredJob = present.includes(LEFT_ANCHOR) ? (weights[LEFT_ANCHOR] ?? 0) : 0;
  const anchoredAccess = present.includes(RIGHT_ANCHOR) ? (weights[RIGHT_ANCHOR] ?? 0) : 0;
  let best = Infinity;
  for (let mask = 0; mask < 1 << packable.length; mask += 1) {
    let left = anchoredJob;
    let right = anchoredAccess;
    packable.forEach((key, index) => {
      if (mask & (1 << index)) left += weights[key] ?? 0;
      else right += weights[key] ?? 0;
    });
    best = Math.min(best, Math.max(left, right));
  }
  return best;
}

/* ==========================================================================
 * The packer
 * ======================================================================== */

/** Heights read off the live admin page at 1440px. */
const DEMO: Record<string, SectionWeights> = {
  // A full JD: 1089px of prose, a company blurb, links, nothing narrowing the audience.
  "job 22 — long JD, open audience": {
    story: 1089 + 124,
    skills: 140,
    classification: 203,
    eligibility: 148,
    links: 134,
    publishing: 279,
    audience: 246,
  },
  // A scraped posting: three lines of prose, no gates, seventeen named students.
  "job 19 — three-line posting, 17 named students": {
    story: 99,
    skills: 104,
    classification: 116,
    eligibility: 148,
    links: 0,
    publishing: 279,
    audience: 547,
  },
  // In between: a short JD, a real classification, eight gates, one batch.
  "job 14 — short JD, eight gates": {
    story: 91 + 99 + 247,
    skills: 104,
    classification: 290,
    eligibility: 477,
    links: 0,
    publishing: 279,
    audience: 452,
  },
};

/**
 * Postings generated from the estimator itself, so the packer is judged on shapes nobody chose
 * for it — including the ones it cannot balance. A bare posting carrying an 8,000-character JD
 * is 2,834px of prose in one atomic section beside 736px of everything else: no two-column
 * layout can be shorter than its tallest section, so "the columns are within a third of each
 * other" is simply false in general. What CAN be asserted is that the plan is the best split
 * available, and that is what is asserted — exactly, with no tolerance.
 */
function* generatedShapes(): Generator<SectionWeights> {
  const text = (n: number) => (n === 0 ? "" : "x".repeat(n));
  for (const description of [0, 120, 800, 2900, 8000])
    for (const process of [0, 300])
      for (const company of [0, 600])
        for (const skills of [0, 3, 12])
          for (const classification of [0, 2, 5])
            for (const gates of [0, 3, 8])
              for (const links of [
                { jd: false, apply: false, jdFailed: false },
                { jd: false, apply: true, jdFailed: false },
                { jd: true, apply: true, jdFailed: false },
              ])
                for (const audience of [
                  { courses: 0, retiredCourses: 0, batches: 0, students: 0, colleges: 0 },
                  { courses: 0, retiredCourses: 0, batches: 1, students: 0, colleges: 0 },
                  { courses: 2, retiredCourses: 1, batches: 1, students: 0, colleges: 0 },
                  { courses: 0, retiredCourses: 0, batches: 0, students: 17, colleges: 0 },
                  { courses: 3, retiredCourses: 2, batches: 4, students: 40, colleges: 6 },
                ]) {
                  yield {
                    story: Math.max(
                      proseWeight(text(description)) +
                        proseWeight(text(process)) +
                        proseWeight(text(company)),
                      QUIET_SECTION,
                    ),
                    skills: chipsWeight(skills),
                    classification: rowsWeight(classification),
                    eligibility: rowsWeight(gates, 34),
                    links: linksWeight(links),
                    publishing: PUBLISHING_WEIGHT,
                    audience: audienceWeight(audience),
                  };
                }
}

describe("planColumns", () => {
  it("produces the shortest taller column available, on every generated posting", () => {
    let checked = 0;
    let worst = 1;
    for (const weights of generatedShapes()) {
      const plan = planColumns(weights);
      const taller = Math.max(heightOf(plan.job, weights), heightOf(plan.access, weights));
      const ratio = taller / bestPossible(weights);
      if (ratio > worst) worst = ratio;
      checked += 1;
    }
    expect(checked).toBeGreaterThan(8000);
    // Exhaustive rather than greedy, so this is an equality and not a tolerance. A longest-first
    // greedy measured 1.11 here.
    expect(worst).toBe(1);
  });

  it("closes most of the gap on the three postings that produced the reports", () => {
    // Not a universal bound — see `generatedShapes` — but these are the real ones.
    const observed: Record<string, number> = {};
    for (const [label, weights] of Object.entries(DEMO)) {
      const plan = planColumns(weights);
      const left = heightOf(plan.job, weights);
      const right = heightOf(plan.access, weights);
      observed[label] = Math.max(left, right) / Math.min(left, right);
    }
    for (const [label, ratio] of Object.entries(observed)) {
      expect(ratio, `${label}: ${ratio.toFixed(2)}`).toBeLessThanOrEqual(1.35);
    }
  });

  it("beats the fixed split it replaced, on every one of those postings", () => {
    // What shipped before: the posting, skills, classification, eligibility and links on the
    // left; publishing and the audience on the right. Named here so the bar above is anchored
    // to the layout that produced the two reports, not to the new code's own output.
    const FIXED = {
      job: ["story", "skills", "classification", "eligibility", "links"] as JobSectionKey[],
      access: ["publishing", "audience"] as JobSectionKey[],
    };
    const ratio = (plan: { job: JobSectionKey[]; access: JobSectionKey[] }, w: SectionWeights) => {
      const left = heightOf(plan.job, w);
      const right = heightOf(plan.access, w);
      return Math.max(left, right) / Math.min(left, right);
    };
    for (const [label, weights] of Object.entries(DEMO)) {
      expect(ratio(FIXED, weights), `the old fixed split was already balanced on ${label}`)
        .toBeGreaterThan(1.35);
      expect(ratio(planColumns(weights), weights)).toBeLessThan(ratio(FIXED, weights));
    }
  });

  it("shows every present section exactly once, and reads in canonical order down each column", () => {
    for (const weights of generatedShapes()) {
      const plan = planColumns(weights);
      const all = [...plan.job, ...plan.access];
      expect(new Set(all).size).toBe(all.length);
      expect(all.slice().sort()).toEqual(
        SECTION_ORDER.filter((key) => (weights[key] ?? 0) > 0).slice().sort(),
      );
      for (const column of [plan.job, plan.access]) {
        const positions = column.map((key) => SECTION_ORDER.indexOf(key));
        expect(positions).toEqual(positions.slice().sort((a, b) => a - b));
      }
    }
  });

  it("leads the left with the posting and the right with its controls", () => {
    for (const weights of generatedShapes()) {
      const plan = planColumns(weights);
      expect(plan.job[0]).toBe("story");
      expect(plan.access[0]).toBe("publishing");
    }
  });

  it("gives a section with no content no space at all", () => {
    const plan = planColumns({ story: 200, publishing: 279, links: 0 });
    expect([...plan.job, ...plan.access]).not.toContain("links");
  });

  it("is a pure function of the weights", () => {
    const weights = DEMO["job 14 — short JD, eight gates"];
    expect(planColumns(weights)).toEqual(planColumns({ ...weights }));
  });
});

/* ==========================================================================
 * The page itself
 * ======================================================================== */

/**
 * Deliberately minimal, and deliberately the shape where ONE batch changes the plan: with a
 * 20-character description, adding a batch swaps `skills` and `classification` between the
 * columns. That is what the freeze test below needs.
 */
const { JOB, svc } = vi.hoisted(() => ({
  JOB: {
    id: 1,
    job_title: "Site Reliability Engineer",
    company_name: "GitLab",
    location: "Remote",
    status: "active",
    is_published: true,
    created_at: "2026-09-01T10:00:00Z",
    job_description: "GitLab is open core.",
    key_skills: ["Kubernetes", "Linux"],
    employment_type: "Full-time",
    apply_link: "https://job-boards.greenhouse.io/gitlab/jobs/1",
    cohorts: [],
  } as JobV2,
  svc: {
    getJob: vi.fn(),
    getJobApplications: vi.fn(),
    getJobCohorts: vi.fn(),
    updateJobCohorts: vi.fn(),
  },
}));

vi.mock("@/lib/services/admin/admin-jobs-v2.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, adminJobsV2Service: svc };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "1" }),
  usePathname: () => "/admin/jobs-v2/1",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
// The header's "?" guide reads tenant info from a provider too, and is not what this is about.
vi.mock("@/components/common/PageGuide", () => ({ PageGuide: () => null }));

// The app layout needs tenant providers a unit render does not have; the columns are inside it.
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { JobsScope } from "@/components/jobs-v2/ui";
import { JobDetailView } from "./JobDetailView";

const column = (name: "job" | "access") =>
  document.querySelector<HTMLElement>(`[data-column="${name}"]`)!;

/** Which column each section is rendered into, right now. */
const layout = () =>
  Object.fromEntries(
    Array.from(document.querySelectorAll<HTMLElement>("[data-section]")).map((el) => [
      el.dataset.section,
      el.closest("[data-column]")!.getAttribute("data-column"),
    ]),
  );

const BATCH = { id: 7, name: "8024-E", status: "active", member_count: 40 };

beforeEach(() => {
  svc.getJob.mockReset().mockResolvedValue(JOB);
  svc.getJobApplications.mockReset().mockResolvedValue({ results: [], count: 0 });
  svc.getJobCohorts.mockReset().mockResolvedValue({ posted: [], available: [BATCH] });
  svc.updateJobCohorts.mockReset().mockResolvedValue({ posted: [BATCH], available: [] });
});

async function renderPage() {
  render(
    <JobsScope surface="admin">
      <JobDetailView jobId={1} />
    </JobsScope>,
  );
  await waitFor(() => expect(column("job")).toBeTruthy());
}

describe("the admin job page", () => {
  it("draws every section exactly once, wherever the plan put it", async () => {
    await renderPage();
    for (const heading of [
      "About this role",
      "Key skills",
      "Classification",
      "Eligibility",
      "Attachments and links",
      "Publishing",
      "Who can see this job",
    ]) {
      expect(screen.getAllByRole("heading", { name: heading })).toHaveLength(1);
    }
  });

  it("leads the left column with the posting and the right with its controls", async () => {
    await renderPage();
    expect(column("job").textContent).toMatch(/^About this role/);
    expect(column("access").textContent).toMatch(/^Publishing/);
  });

  it("spends one quiet line on an empty section, not a whole card", async () => {
    await renderPage();
    const quiet = Array.from(document.querySelectorAll("[data-quiet-section]")).map((el) =>
      el.textContent?.trim(),
    );
    expect(quiet.some((text) => /No eligibility gates/i.test(text ?? ""))).toBe(true);
  });

  it("gives the two columns equal width, so a section's height does not depend on its side", async () => {
    // The packer compares heights across columns. With 1.2fr / 1fr the same card was 20% taller
    // on one side than the other, which would make every comparison it draws a lie.
    await renderPage();
    const grid = column("job").parentElement!;
    expect(styleAt(grid, DESKTOP, "grid-template-columns")).toBe("repeat(2, minmax(0, 1fr))");
    // The phone pass stays: one track, and one that cannot be widened by a long apply URL.
    expect(styleAt(grid, PHONE, "grid-template-columns")).toBe("minmax(0, 1fr)");
  });

  /**
   * The plan decides WHERE a card goes; below md there is only one place, so it would instead be
   * deciding reading order — and it varies per posting, so "Publishing" would land between two
   * descriptive sections at a depth that depends on how long the description is. Two similar
   * postings would read, tab and be announced in different orders.
   */
  it("reads in one canonical order below md, whatever the plan decided", async () => {
    await renderPage();
    for (const width of [PHONE, TABLET]) {
      // The column boxes dissolve, so every section is a grid item of the single track...
      expect(styleAt(column("job"), width, "display")).toBe("contents");
      expect(styleAt(column("access"), width, "display")).toBe("contents");
      // ...and each one's `order` puts it back into SECTION_ORDER.
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
      const sorted = sections
        .map((el) => ({
          key: el.dataset.section as JobSectionKey,
          order: Number(styleAt(el, width, "order")),
        }))
        .sort((a, b) => a.order - b.order)
        .map((s) => s.key);
      expect(sorted).toEqual(SECTION_ORDER.filter((key) => sorted.includes(key)));
    }
  });

  it("is two real columns again from md up", async () => {
    await renderPage();
    expect(styleAt(column("job"), DESKTOP, "display")).toBe("block");
    expect(styleAt(column("access"), DESKTOP, "display")).toBe("block");
  });

  /**
   * The plan is frozen for the posting it was computed from.
   *
   * `job` is edited in place while the admin works: posting to a batch rewrites `job.cohorts`,
   * which is worth +32px to the audience section and is enough to change the plan. Re-planning
   * there would move a section between the two column elements, and a section that changes
   * parent UNMOUNTS — the batch picker would close mid-flow, "Show all 17 students" would
   * collapse, and the request's own `finally` would set state on a dead tree.
   */
  it("does not move a card because the admin posted the job to a batch", async () => {
    // First: the plan really does depend on this, so the assertion below is not vacuous.
    const weights = (batches: number): SectionWeights => ({
      story: Math.max(proseWeight(JOB.job_description), QUIET_SECTION),
      skills: chipsWeight(2),
      classification: rowsWeight(1),
      eligibility: rowsWeight(0),
      links: linksWeight({ jd: false, apply: true, jdFailed: false }),
      publishing: PUBLISHING_WEIGHT,
      audience: audienceWeight({ courses: 0, retiredCourses: 0, batches, students: 0, colleges: 0 }),
    });
    expect(
      planColumns(weights(0)),
      "this posting's plan is insensitive to a batch, so the render check below proves nothing",
    ).not.toEqual(planColumns(weights(1)));

    await renderPage();
    const before = layout();

    fireEvent.click(screen.getByTestId("post-to-batches"));
    const options = await screen.findByTestId("batch-options");
    fireEvent.click(within(options).getByLabelText(BATCH.name));
    fireEvent.click(screen.getByTestId("confirm-post-to-batches"));

    // The job really was edited in place: the batch is on the card now.
    await waitFor(() => expect(screen.getByTestId("posted-batches")).toBeTruthy());
    await waitFor(() => expect(screen.getByText(/members of 1 batch\(es\)/)).toBeTruthy());

    expect(layout(), "a card moved column mid-interaction, which unmounts it").toEqual(before);
  });
});
