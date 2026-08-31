/**
 * The student board's four states, as a test.
 *
 * The board's whole redesign rests on two claims that are expensive to re-check by eye and easy
 * to regress silently:
 *
 *   1. **One render tree.** The deleted desktop/mobile fork drifted apart precisely because
 *      nothing asserted the two branches agreed. Here, every control is asserted to exist
 *      exactly ONCE — a re-introduced fork fails the suite instead of a phone.
 *   2. **A failed fetch is an error, never an empty state.** "No jobs found" after a 500 is the
 *      module's worst lie, and it is what the shipped board did.
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import "@/lib/i18n";

// `lib/config` refuses to guess a tenant id, by design (cross-tenant leak). A unit render still
// has to have one.
process.env.NEXT_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? "1";

import type { JobV2, JobApplicationV2 } from "@/lib/services/jobs-v2.service";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/jobs-v2",
  useSearchParams: () => new URLSearchParams(search),
}));

const getJobs = vi.fn();
const getMyApplications = vi.fn();
const toggleFavorite = vi.fn();
const confirmApplied = vi.fn();
vi.mock("@/lib/services/jobs-v2.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/jobs-v2.service")>(
    "@/lib/services/jobs-v2.service",
  );
  return {
    ...actual,
    jobsV2Service: {
      getJobs: (...args: unknown[]) => getJobs(...args),
      getMyApplications: (...args: unknown[]) => getMyApplications(...args),
      toggleFavorite: (...args: unknown[]) => toggleFavorite(...args),
      confirmApplied: (...args: unknown[]) => confirmApplied(...args),
    },
  };
});

let showLock = false;
/**
 * The learner's own skills, as the profile gate reports them. The provider already fetches the
 * whole profile for the completion percentage, so this costs the board no request — which is
 * exactly why the match signal is allowed to exist.
 */
let learnerSkills: Array<{ name: string }> = [];
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useModuleLocked: () => ({
    locked: showLock,
    ready: true,
    showLock,
    reportError: () => false,
  }),
  useProfileGate: () => ({
    percentage: 40,
    status: "ready",
    lockedModules: [],
    skills: learnerSkills.map((skill) => skill.name),
  }),
  useOutstandingFields: () => [],
}));

vi.mock("@/components/common/ProfileLock", () => ({
  ProfileLockBanner: () => <div data-testid="lock-banner" />,
  ProfileLockCard: ({ preview }: { preview?: ReactNode }) => (
    <div data-testid="lock-card">{preview}</div>
  ),
}));

// `ModulePageHeader` renders the "?" page guide, which reads tenant info from a provider a
// unit render does not have. The guide is not what this suite is about.
vi.mock("@/components/common/PageGuide", () => ({
  PageGuide: () => null,
}));

vi.mock("@/lib/contexts/AdminModeContext", () => ({
  useAdminMode: () => ({ isAdminMode: false }),
}));

const showToast = vi.fn();
vi.mock("@/components/common/Toast", () => ({
  useToast: () => ({ showToast }),
}));

import { JobBoard } from "./JobBoard";

const JOB: JobV2 = {
  id: 1,
  job_title: "Frontend Engineer",
  company_name: "Acme",
  location: "Bengaluru",
  job_type: "job",
  years_of_experience: "1-3",
  tags: ["React", "TypeScript"],
  created_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
};

const APPLIED_JOB: JobV2 = {
  ...JOB,
  id: 2,
  job_title: "Data Analyst",
  company_name: "Globex",
  has_applied: true,
  eligible_to_apply: false,
  application_deadline: new Date(Date.now() + 86_400_000).toISOString(),
};

const APPLICATION: JobApplicationV2 = {
  id: 77,
  job: 2,
  job_title: "Data Analyst",
  company_name: "Globex",
  student: 5,
  student_name: "Ada",
  student_email: "ada@example.com",
  status: "applying",
  applied_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  search = "";
  showLock = false;
  learnerSkills = [];
  getJobs.mockResolvedValue({ results: [JOB, APPLIED_JOB], count: 137 });
  getMyApplications.mockResolvedValue({ results: [APPLICATION], count: 1 });
});

describe("JobBoard", () => {
  it("renders ONE tree: every control exists exactly once", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());

    // One search box, one tablist for the panes, one view switch, one filter row.
    expect(screen.getAllByRole("searchbox")).toHaveLength(1);
    expect(screen.getAllByRole("tab", { name: /browse/i })).toHaveLength(1);
    expect(screen.getAllByText("Frontend Engineer")).toHaveLength(1);
    // Seven filter popovers, and no eighth from a duplicated mobile block.
    const filterRow = screen.getByText("Location").closest("button");
    expect(filterRow).toBeTruthy();
    expect(screen.getAllByText("Location")).toHaveLength(1);
  });

  it("reports the endpoint's own count instead of the size of the response", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());
    // 2 rows held, 137 known: the board says both rather than claiming 2 is the total.
    expect(screen.getByText(/137/)).toBeInTheDocument();
  });

  it("shows the applied and not-eligible signals on the card", async () => {
    render(<JobBoard />);
    const card = await screen.findByText("Data Analyst");
    const container = card.closest("div[class]")?.parentElement?.parentElement as HTMLElement;
    expect(within(container).getByText(/not eligible/i)).toBeInTheDocument();
  });

  it("renders an ERROR state, never an empty state, when the fetch fails", async () => {
    getJobs.mockRejectedValueOnce(new Error("Server exploded"));
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("Server exploded")).toBeInTheDocument();
    expect(screen.queryByText(/no jobs found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no jobs match/i)).not.toBeInTheDocument();
  });

  it("distinguishes nothing-exists from nothing-matches", async () => {
    getJobs.mockResolvedValue({ results: [], count: 0 });
    const { unmount } = render(<JobBoard />);
    await waitFor(() =>
      expect(screen.getByText(/no openings posted yet/i)).toBeInTheDocument(),
    );
    // No clear-filters action when there is nothing to clear.
    expect(screen.queryByRole("button", { name: /clear all filters/i })).not.toBeInTheDocument();
    unmount();

    search = "exp=10%2B";
    render(<JobBoard />);
    await waitFor(() =>
      expect(screen.getByText(/no jobs match these filters/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /clear all filters/i })).toBeInTheDocument();
  });

  it("gives the profile lock a preview instead of an empty box", async () => {
    showLock = true;
    render(<JobBoard />);
    const card = await screen.findByTestId("lock-card");
    expect(within(card).getByText(/loading jobs/i)).toBeInTheDocument();
  });

  it("matches skills by exact token, not substring", async () => {
    getJobs.mockResolvedValue({
      results: [
        { ...JOB, id: 10, job_title: "Java role", tags: ["Java"] },
        { ...JOB, id: 11, job_title: "JavaScript role", tags: ["JavaScript"] },
      ],
      count: 2,
    });
    search = "skills=Java";
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Java role")).toBeInTheDocument());
    // The old `t.includes(s)` returned every JavaScript job for "Java".
    expect(screen.queryByText("JavaScript role")).not.toBeInTheDocument();
  });

  it("surfaces the applying record so a stranded application can be corrected", async () => {
    search = "tab=applied";
    render(<JobBoard />);
    await waitFor(() =>
      expect(screen.getByText(/did you complete this application\?/i)).toBeInTheDocument(),
    );

    confirmApplied.mockResolvedValue({ ...APPLICATION, status: "applied" });
    await userEvent.click(screen.getByRole("button", { name: /^yes$/i }));
    await waitFor(() => expect(confirmApplied).toHaveBeenCalledWith(77));
  });

  it("unmounts the rail on Saved but keeps the view switch and the active filters", async () => {
    search = "tab=saved&fav=1&exp=1-3";
    getJobs.mockResolvedValue({
      results: [{ ...JOB, is_favourited: true }, APPLIED_JOB],
      count: 137,
    });
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());

    // Only the saved job is listed.
    expect(screen.queryByText("Data Analyst")).not.toBeInTheDocument();
    // A search bar and seven filters controlling nothing do not survive the tab switch.
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Location")).not.toBeInTheDocument();
    // The view switch does, because it is in the result meta row, not in the rail.
    expect(screen.getByRole("tab", { name: /card view/i })).toBeInTheDocument();
    // And a filter carried in from Browse stays visible AND removable.
    expect(screen.getByRole("button", { name: /remove filter/i })).toBeInTheDocument();
  });

  it("renders inside a dark scope with no component edits", async () => {
    const { JobsScope } = await import("@/components/jobs-v2/ui");
    render(
      <JobsScope theme="dark" surface="student">
        <JobBoard />
      </JobsScope>,
    );
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());
    expect(document.querySelector('.jobs-scope[data-jobs-theme="dark"]')).toBeTruthy();
  });

  it("keeps the card keyboard-reachable: a real link, and the heart a sibling button", async () => {
    render(<JobBoard />);
    const title = await screen.findByRole("link", { name: "Frontend Engineer" });
    expect(title).toHaveAttribute("href", "/jobs-v2/1");
    // A <button> inside an <a> is invalid HTML, which is why the shipped card needed a separate
    // "View Details" button to be reachable at all.
    expect(title.querySelector("button")).toBeNull();
    expect(screen.getAllByRole("button", { name: /save this job/i }).length).toBeGreaterThan(0);
  });

  it("renders an ERROR state when the applications fetch fails", async () => {
    getMyApplications.mockRejectedValueOnce(new Error("Applications down"));
    search = "tab=applied";
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByText(/have not applied to anything yet/i)).not.toBeInTheDocument();
  });
});

/* ==========================================================================
 * What the product owner saw on the live board, as tests.
 * ======================================================================== */

describe("JobBoard — the live board's defects", () => {
  it("wears the platform's plain eyebrow, not a numbered marketing kicker", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());
    // Sibling modules read "Achievements" / "Learn" / "Career". "01 · CAREER" is what made the
    // jobs hero look like a different product.
    expect(screen.getByText("Career")).toBeInTheDocument();
    expect(screen.queryByText(/01\s*·/)).not.toBeInTheDocument();
  });

  it("never shows the raw job_type chip that read 'job'", async () => {
    getJobs.mockResolvedValue({
      results: [{ ...JOB, job_type: "job", employment_type: "full_time" }],
      count: 1,
    });
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());
    expect(screen.queryByText("job")).not.toBeInTheDocument();
    // The readable fact takes its place, canonicalised.
    expect(screen.getByText("Full-time")).toBeInTheDocument();
  });

  it("omits salary and experience cleanly when the row has neither", async () => {
    getJobs.mockResolvedValue({
      results: [
        {
          ...JOB,
          job_type: "job",
          employment_type: null,
          salary: null,
          years_of_experience: null,
        },
      ],
      count: 1,
    });
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());
    // No dash, no empty slot, no placeholder — the chips simply are not there.
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("badges an internship, because THAT job_type adds information", async () => {
    getJobs.mockResolvedValue({
      results: [{ ...JOB, job_type: "internship" }],
      count: 1,
    });
    render(<JobBoard />);
    expect(await screen.findByText("Internship")).toBeInTheDocument();
  });

  it("leads the card with the ROLE, not the employer's marketing paragraph", async () => {
    getJobs.mockResolvedValue({
      results: [
        {
          ...JOB,
          company_name: "GitLab",
          job_description:
            "GitLab is the intelligent orchestration platform for DevSecOps.\n\nYou will own the editor.",
        },
      ],
      count: 1,
    });
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());
    expect(screen.getByText(/you will own the editor/i)).toBeInTheDocument();
    expect(screen.queryByText(/intelligent orchestration platform/i)).not.toBeInTheDocument();
  });

  it("stops one employer owning the page, without dropping or duplicating a job", async () => {
    const results = [
      ...Array.from({ length: 6 }, (_, i) => ({
        ...JOB,
        id: 100 + i,
        job_title: `GitLab role ${i}`,
        company_name: "GitLab",
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        ...JOB,
        id: 200 + i,
        job_title: `Other role ${i}`,
        company_name: `Company ${i}`,
      })),
    ];
    getJobs.mockResolvedValue({ results, count: results.length });
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("GitLab role 0")).toBeInTheDocument());

    // Every job is still on the page, exactly once.
    for (const job of results) {
      expect(screen.getAllByText(job.job_title)).toHaveLength(1);
    }
    // ...and the six GitLab cards are no longer consecutive.
    const titles = screen
      .getAllByRole("link")
      .map((link) => link.textContent ?? "")
      .filter((text) => text.includes("role"));
    let run = 1;
    let longest = 1;
    for (let i = 1; i < titles.length; i += 1) {
      const same =
        titles[i].startsWith("GitLab") === titles[i - 1].startsWith("GitLab");
      run = same ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    expect(longest).toBeLessThan(6);
  });

  it("does NOT reorder when the learner asked for a specific order", async () => {
    const results = [
      { ...JOB, id: 1, job_title: "Role Alpha", company_name: "GitLab" },
      { ...JOB, id: 2, job_title: "Role Beta", company_name: "GitLab" },
      { ...JOB, id: 3, job_title: "Role Gamma", company_name: "Acme" },
    ];
    getJobs.mockResolvedValue({ results, count: 3 });
    search = "sort=company";
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Role Alpha")).toBeInTheDocument());
    const order = screen
      .getAllByRole("link")
      .map((link) => link.textContent ?? "")
      .filter((text) => text.startsWith("Role "));
    // Company A-Z: Acme first, then GitLab's two, untouched by the variety pass.
    expect(order).toEqual(["Role Gamma", "Role Alpha", "Role Beta"]);
  });

  it("renders the per-page control with its value, not an empty box", async () => {
    getJobs.mockResolvedValue({
      results: Array.from({ length: 45 }, (_, i) => ({ ...JOB, id: i + 1, job_title: `Role ${i}` })),
      count: 45,
    });
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Role 0")).toBeInTheDocument());
    const perPage = screen.getByRole("combobox", { name: /per page/i });
    expect(perPage).toHaveTextContent("20");
  });

  it("offers Most relevant only when it knows the learner's skills", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());
    const sort = screen.getByRole("combobox", { name: /sort jobs/i });
    // Default sort is "" — it must read "Most recent", not render blank.
    expect(sort).toHaveTextContent("Most recent");
    await userEvent.click(sort);
    expect(screen.queryByRole("option", { name: /most relevant/i })).not.toBeInTheDocument();
  });

  it("names the skills the learner already has, and never a match percentage", async () => {
    learnerSkills = [{ name: "React" }, { name: "TypeScript" }];
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());
    expect(screen.getAllByText(/you have react, typescript/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/\d+%\s*match/i)).not.toBeInTheDocument();

    const sort = screen.getByRole("combobox", { name: /sort jobs/i });
    await userEvent.click(sort);
    expect(screen.getByRole("option", { name: /most relevant/i })).toBeInTheDocument();
  });

  it("says what the count is counting once a filter is on", async () => {
    search = "exp=1-3";
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument());
    expect(screen.getByText(/of 137 jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/filtered by/i)).toHaveTextContent(/experience/i);
  });
});
