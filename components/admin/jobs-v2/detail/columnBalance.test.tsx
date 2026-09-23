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
 * So the column is chosen per posting now. These tests fix the PROPERTY — neither column runs
 * away from the other — rather than a particular card's side, which is what came back twice.
 *
 * The section weights below are the heights actually measured on those postings, so the packer
 * is judged on real jobs rather than on invented ones.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import "@/lib/i18n";

process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { DESKTOP, PHONE, styleAt } from "@/components/jobs-v2/responsiveSx.testutil";
import {
  SECTION_ORDER,
  planColumns,
  type JobSectionKey,
  type SectionWeights,
} from "./columnPlan";

/* ==========================================================================
 * The packer, on the postings that produced the two reports
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

const heightOf = (keys: JobSectionKey[], weights: SectionWeights) =>
  keys.reduce((total, key) => total + (weights[key] ?? 0), 0);

describe("planColumns, on real postings", () => {
  for (const [label, weights] of Object.entries(DEMO)) {
    it(`keeps the columns within a third of each other — ${label}`, () => {
      const plan = planColumns(weights);
      const left = heightOf(plan.job, weights);
      const right = heightOf(plan.access, weights);
      const ratio = Math.max(left, right) / Math.min(left, right);
      expect(ratio, `left ${left} vs right ${right}`).toBeLessThanOrEqual(1.35);
    });

    it(`shows every section exactly once — ${label}`, () => {
      const plan = planColumns(weights);
      const all = [...plan.job, ...plan.access];
      expect(new Set(all).size).toBe(all.length);
      const expected = SECTION_ORDER.filter((key) => (weights[key] ?? 0) > 0);
      expect(all.slice().sort()).toEqual(expected.slice().sort());
    });

    it(`reads in canonical order down each column — ${label}`, () => {
      const plan = planColumns(weights);
      for (const column of [plan.job, plan.access]) {
        const positions = column.map((key) => SECTION_ORDER.indexOf(key));
        expect(positions).toEqual(positions.slice().sort((a, b) => a - b));
      }
    });
  }

  it("leads the left with the posting and the right with its controls", () => {
    for (const weights of Object.values(DEMO)) {
      const plan = planColumns(weights);
      expect(plan.job[0]).toBe("story");
      expect(plan.access[0]).toBe("publishing");
    }
  });

  it("gives a section with no content no space at all", () => {
    const plan = planColumns({ story: 200, publishing: 279, links: 0 });
    expect([...plan.job, ...plan.access]).not.toContain("links");
  });

  it("moves the audience LEFT when the posting itself is tiny", () => {
    // The shape behind "the right-side column is disproportionately long".
    const plan = planColumns(DEMO["job 19 — three-line posting, 17 named students"]);
    expect(plan.job).toContain("audience");
  });

  it("moves the small cards RIGHT when the posting is a full JD", () => {
    // The shape behind "now the left column is too long than the right".
    const plan = planColumns(DEMO["job 22 — long JD, open audience"]);
    for (const key of ["skills", "classification", "eligibility", "links"] as const) {
      expect(plan.access).toContain(key);
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

  it("is a pure function of the weights", () => {
    const weights = DEMO["job 14 — short JD, eight gates"];
    expect(planColumns(weights)).toEqual(planColumns({ ...weights }));
  });
});

/* ==========================================================================
 * The page itself
 * ======================================================================== */

const { JOB } = vi.hoisted(() => ({
  JOB: {
    id: 1,
    job_title: "Site Reliability Engineer",
    company_name: "GitLab",
    location: "Remote",
    status: "active",
    is_published: true,
    created_at: "2026-09-01T10:00:00Z",
    job_description: "GitLab is an open-core company.",
    key_skills: ["Kubernetes", "Linux"],
    apply_link: "https://job-boards.greenhouse.io/gitlab/jobs/1",
  } as JobV2,
}));

vi.mock("@/lib/services/admin/admin-jobs-v2.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    adminJobsV2Service: {
      getJob: vi.fn().mockResolvedValue(JOB),
      getJobApplications: vi.fn().mockResolvedValue({ results: [], count: 0 }),
    },
  };
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
    // This posting records no classification and sets no eligibility gates.
    const quiet = Array.from(document.querySelectorAll("[data-quiet-section]")).map((el) =>
      el.textContent?.trim(),
    );
    expect(quiet).toContain("Nothing recorded here yet.");
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
});
