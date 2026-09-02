/**
 * The student board's states and its honesty rules, as a test.
 *
 * The board rests on claims that are expensive to re-check by eye and easy to regress silently:
 *
 *   1. **One data source, two densities.** At `lg+` the rail is the only density; below it the
 *      full-width list keeps the card/list switch. Both are in the DOM and one is hidden with
 *      `display`, which is the kit's rule (spec 7.1) because `useMediaQuery` is `false` on the
 *      server and would flash the desktop layout on a phone. The thing that must never come
 *      back is the deleted *fork* — two hand-maintained copies of the page that drifted apart —
 *      so the suite asserts the two densities render the SAME jobs, in the same order, at the
 *      same hrefs, and that the controls above them exist exactly once.
 *   2. **No auto-selected first job.** `/jobs-v2` shows a board, never `jobs[0]`.
 *   3. **A failed fetch is an error, never an empty state.** "No jobs found" after a 500 is the
 *      module's worst lie, and it is what the shipped board did.
 *   4. **Never a signal our data cannot support.** No applicant counts, no view counts, no match
 *      percentage, no "urgently hiring" — on any surface, at any density.
 */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
const push = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, back: vi.fn() }),
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

/* -------------------------------------------------------------------------
 * The two densities. jsdom applies no media queries, so BOTH are in the DOM
 * and every job-level assertion has to say which one it means.
 * ---------------------------------------------------------------------- */

const rail = () => document.querySelector<HTMLElement>('[data-jobs-density="rail"]')!;
const full = () => document.querySelector<HTMLElement>('[data-jobs-density="full"]')!;

/** Every job title rendered inside one density, in DOM order. */
function titlesIn(scope: HTMLElement): string[] {
  return Array.from(scope.querySelectorAll("a[href^='/jobs-v2/']")).map(
    (node) => node.textContent ?? "",
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  search = "";
  showLock = false;
  learnerSkills = [];
  getJobs.mockResolvedValue({ results: [JOB, APPLIED_JOB], count: 137 });
  getMyApplications.mockResolvedValue({ results: [APPLICATION], count: 1 });
});

describe("JobBoard", () => {
  it("renders ONE data source at two densities, and every control exactly once", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    // One search box, one tablist for the panes, one view switch, one filter row.
    expect(screen.getAllByRole("searchbox")).toHaveLength(1);
    expect(screen.getAllByRole("tab", { name: /browse/i })).toHaveLength(1);
    expect(screen.getAllByText("Location")).toHaveLength(1);

    // The two densities are one `jobs.map` rendered twice, so they cannot drift: same jobs,
    // same order, same hrefs. THAT is what the deleted desktop/mobile fork broke.
    expect(titlesIn(rail())).toEqual(titlesIn(full()));
    expect(titlesIn(rail())).toEqual(["Frontend Engineer", "Data Analyst"]);
    const hrefs = (scope: HTMLElement) =>
      Array.from(scope.querySelectorAll("a[href^='/jobs-v2/']")).map((n) =>
        n.getAttribute("href"),
      );
    expect(hrefs(rail())).toEqual(hrefs(full()));
    // ...and nothing renders a job outside those two blocks.
    expect(screen.getAllByText("Frontend Engineer")).toHaveLength(2);
  });

  it("auto-selects nothing: /jobs-v2 shows a board, not jobs[0]", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    // Auto-select would promote whichever employer sorts first and desync the URL from the pane.
    expect(document.querySelector('[data-rail-id][aria-current="true"]')).toBeNull();
    expect(screen.getByText(/pick a role to read the full posting/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("carries the whole board query, and the page's own ids, onto the posting URL", async () => {
    search = "exp=1-3&loc=Bengaluru";
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    const href = within(rail()).getByRole("link", { name: "Frontend Engineer" }).getAttribute("href")!;
    // The board's filter state rides on the detail URL: that is what makes the rail come back
    // correct and "Back to jobs" land on the filtered search rather than an unfiltered page 1.
    expect(href).toContain("exp=1-3");
    expect(href).toContain("loc=Bengaluru");
    // `?ids=` is the sibling contract the detail pane's prev/next walks.
    expect(href).toContain("ids=1%2C2");
  });

  it("intercepts a plain left click into a push, and leaves cmd-click to the browser", async () => {
    render(<JobBoard />);
    const link = await waitFor(() => within(rail()).getByRole("link", { name: "Frontend Engineer" }));

    await userEvent.click(link);
    // One history entry per real choice, and the rail keeps its scroll position.
    expect(push).toHaveBeenCalledWith(expect.stringContaining("/jobs-v2/1"), { scroll: false });

    push.mockClear();
    // Everything a browser means by "open this somewhere else" is left to the browser.
    fireEvent.click(link, { metaKey: true });
    expect(push).not.toHaveBeenCalled();
  });

  it("reports the endpoint's own count instead of the size of the response", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    // 2 rows held, 137 known: the board says both rather than claiming 2 is the total.
    expect(screen.getAllByText(/137/).length).toBeGreaterThan(0);
  });

  it("shows the applied and not-eligible signals at both densities", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Data Analyst")).toBeInTheDocument());
    expect(within(rail()).getByText(/not eligible/i)).toBeInTheDocument();
    expect(within(full()).getByText(/not eligible/i)).toBeInTheDocument();
  });

  it("renders an ERROR state, never an empty state, when the fetch fails", async () => {
    getJobs.mockRejectedValueOnce(new Error("Server exploded"));
    render(<JobBoard />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("Server exploded")).toBeInTheDocument();
    expect(screen.queryByText(/no jobs found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no jobs match/i)).not.toBeInTheDocument();
    // One message, not one per pane: the split doubles the surfaces, never the announcement.
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("distinguishes nothing-exists from nothing-matches, at every breakpoint", async () => {
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
    // The empty state is full width, NOT hidden inside the pane — the pane is `display: none`
    // below `lg`, so a phone would have been shown an empty rail and no explanation.
    expect(screen.getAllByText(/no jobs match these filters/i)).toHaveLength(1);
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
    await waitFor(() => expect(within(rail()).getByText("Java role")).toBeInTheDocument());
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
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    // Only the saved job is listed.
    expect(screen.queryByText("Data Analyst")).not.toBeInTheDocument();
    // A search bar and eleven filters controlling nothing do not survive the tab switch.
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
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    expect(document.querySelector('.jobs-scope[data-jobs-theme="dark"]')).toBeTruthy();
  });

  it("keeps the rail card keyboard-reachable: one tab stop, the heart a sibling button", async () => {
    render(<JobBoard />);
    const card = await waitFor(() => rail().querySelector<HTMLElement>('[data-rail-id="1"]')!);
    const title = within(card).getByRole("link", { name: "Frontend Engineer" });
    expect(title.getAttribute("href")).toContain("/jobs-v2/1");
    // A <button> inside an <a> is invalid HTML, which is why the shipped card needed a separate
    // "View Details" button to be reachable at all.
    expect(title.querySelector("button")).toBeNull();
    // The root is a focus target for j/k, never a tab stop.
    expect(card).toHaveAttribute("tabindex", "-1");
    expect(within(card).getByRole("button", { name: /save this job/i })).toBeInTheDocument();
  });

  it("moves the rail cursor with j/k and opens with Enter", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    const first = rail().querySelector<HTMLElement>('[data-rail-id="1"]')!;
    first.focus();
    // With no posting selected the cursor starts before the list, so the first press lands on
    // the first result rather than skipping it.
    await userEvent.keyboard("j");
    expect(document.activeElement).toBe(rail().querySelector('[data-rail-id="1"]'));
    await userEvent.keyboard("j");
    expect(document.activeElement).toBe(rail().querySelector('[data-rail-id="2"]'));
    await userEvent.keyboard("k");
    expect(document.activeElement).toBe(rail().querySelector('[data-rail-id="1"]'));
    await userEvent.keyboard("j");

    await userEvent.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith(expect.stringContaining("/jobs-v2/2"), { scroll: false });
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
 * Filters — counts are the load-bearing feature
 * ======================================================================== */

describe("JobBoard — filters", () => {
  it("counts every option leave-one-out, so a facet never renumbers itself to nothing", async () => {
    getJobs.mockResolvedValue({
      results: [
        { ...JOB, id: 1, years_of_experience: "1-3" },
        { ...JOB, id: 2, job_title: "Second junior role", years_of_experience: "1-3" },
        { ...JOB, id: 3, job_title: "Senior role", years_of_experience: "5-10" },
      ],
      count: 3,
    });
    // One band already applied. Leave-one-out means the OTHER bands still report what they
    // would give you — without it they would all read 0 and the facet would lock itself shut.
    search = "exp=5-10";
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Senior role")).toBeInTheDocument());
    expect(titlesIn(rail())).toEqual(["Senior role"]);

    // The pill, not the "Experience: 5-10 years" chip that removes it.
    await userEvent.click(screen.getByText("Experience").closest("button")!);
    expect(await screen.findByRole("radio", { name: /1-3 years/i })).toHaveTextContent("2");
    expect(screen.getByRole("radio", { name: /5-10 years/i })).toHaveTextContent("1");
  });

  it("renders a zero-count option DISABLED rather than hiding it", async () => {
    // No row states a deadline, so no closing window can produce anything.
    getJobs.mockResolvedValue({ results: [JOB, { ...JOB, id: 2, job_title: "Second" }], count: 2 });
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    await userEvent.click(screen.getByText("Closing").closest("button")!);
    const option = await screen.findByRole("radio", { name: /closing in 3 days/i });
    // Hiding it would make the list shift under the cursor between openings; "0" is the truth.
    expect(option).toHaveTextContent("0");
    expect(option).toBeDisabled();
  });

  it("offers the eligibility toggle only when the payload can answer it", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    // APPLIED_JOB carries `eligible_to_apply: false`, so we know something.
    expect(screen.getByRole("switch", { name: /only jobs i'm eligible for/i })).toBeInTheDocument();
  });

  it("hides the eligibility toggle rather than emptying the board when nothing answers it", async () => {
    getJobs.mockResolvedValue({ results: [JOB], count: 1 });
    search = "elig=1";
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    // A toggle that empties the board because a field is missing is a filter blaming the
    // student for our own response shape. It is not offered, and `?elig=1` is ignored.
    expect(screen.queryByRole("switch", { name: /eligible/i })).not.toBeInTheDocument();
    expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument();
  });

  it("offers work mode only for modes the postings themselves state", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    // Neither fixture states a work mode, and an unstated location is not evidence of on-site.
    expect(screen.queryByText("Work mode")).not.toBeInTheDocument();

    getJobs.mockResolvedValue({
      results: [{ ...JOB, work_mode: "Remote" }, APPLIED_JOB],
      count: 2,
    });
    search = "q=x";
    const { unmount } = render(<JobBoard />);
    await waitFor(() => expect(screen.getAllByText("Work mode").length).toBeGreaterThan(0));
    unmount();
  });

  it("filters on a closing window without ever calling a passed deadline 'closing soon'", async () => {
    getJobs.mockResolvedValue({
      results: [
        { ...JOB, id: 1, application_deadline: new Date(Date.now() + 2 * 86_400_000).toISOString() },
        {
          ...JOB,
          id: 2,
          job_title: "Expired role",
          application_deadline: new Date(Date.now() - 86_400_000).toISOString(),
        },
      ],
      count: 2,
    });
    search = "close=3d";
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    expect(screen.queryByText("Expired role")).not.toBeInTheDocument();
  });

  it("keeps the salary filter to disclosed / not disclosed, never a band", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /salary/i }));
    // `salary` is unparsed free text, so a "6-10 LPA" facet over it would be a filter that lies.
    expect(screen.getByRole("radio", { name: /salary disclosed/i })).toBeInTheDocument();
    expect(screen.queryByText(/lpa/i)).not.toBeInTheDocument();
  });

  it("does not wipe the search box in the frame between a submit and the URL", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    const box = screen.getByRole("searchbox");
    await userEvent.type(box, "react");
    await userEvent.keyboard("{Enter}");
    // The box holds the SUBMITTED query while the URL catches up. Tracking what we submitted,
    // rather than what we have seen, is what made it blank itself for a frame.
    expect(box).toHaveValue("react");
    await waitFor(() => expect(replace).toHaveBeenCalledWith(expect.stringContaining("q=react"), {
      scroll: false,
    }));
    expect(box).toHaveValue("react");
  });

  it("defers the mobile sheet, and its footer states the real outcome", async () => {
    getJobs.mockResolvedValue({
      results: [
        { ...JOB, id: 1, years_of_experience: "1-3" },
        { ...JOB, id: 2, job_title: "Senior role", years_of_experience: "5-10" },
      ],
      count: 2,
    });
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Senior role")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /^filters$/i }));
    const sheet = await screen.findByRole("dialog");
    await userEvent.click(within(sheet).getByRole("radio", { name: /5-10 years/i }));

    // Nothing is applied yet — the sheet defers, because on a phone the list is behind it.
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining("exp=5-10"), expect.anything());
    // ...and the footer button states the outcome, counted exactly, because every facet in the
    // sheet is evaluated on the client.
    const apply = within(sheet).getByRole("button", { name: /show 1 job/i });
    await userEvent.click(apply);
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(expect.stringContaining("exp=5-10"), { scroll: false }),
    );
  });

  it("names every active filter in human words and keeps each one removable", async () => {
    search = "wm=Remote&close=7d&role=Engineering";
    getJobs.mockResolvedValue({
      results: [
        {
          ...JOB,
          work_mode: "Remote",
          role_category: "Engineering",
          application_deadline: new Date(Date.now() + 2 * 86_400_000).toISOString(),
        },
      ],
      count: 1,
    });
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    // "Work mode: Remote", never "wm=Remote".
    expect(screen.getByText("Work mode: Remote")).toBeInTheDocument();
    expect(screen.getByText("Role: Engineering")).toBeInTheDocument();
    expect(screen.queryByText(/wm=/)).not.toBeInTheDocument();
  });
});

/* ==========================================================================
 * What the product owner saw on the live board, as tests.
 * ======================================================================== */

describe("JobBoard — the live board's defects", () => {
  it("wears the platform's plain eyebrow, not a numbered marketing kicker", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
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
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    expect(screen.queryByText("job")).not.toBeInTheDocument();
    // The readable fact takes its place, canonicalised — on the card, not on the rail, whose
    // three facts are location, work mode and experience.
    expect(within(full()).getByText("Full-time")).toBeInTheDocument();
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
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    // No dash, no empty slot, no placeholder — the chips simply are not there.
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    expect(screen.queryByText(/not specified/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not disclosed/i)).not.toBeInTheDocument();
  });

  it("badges an internship, because THAT job_type adds information", async () => {
    getJobs.mockResolvedValue({
      results: [{ ...JOB, job_type: "internship" }],
      count: 1,
    });
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getAllByText("Internship").length).toBe(1));
  });

  it("does not badge an internship twice when employment_type already said so", async () => {
    getJobs.mockResolvedValue({
      results: [{ ...JOB, job_type: "internship", employment_type: "Internship" }],
      count: 1,
    });
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    expect(within(rail()).queryByText("Internship")).not.toBeInTheDocument();
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
    await waitFor(() => expect(within(full()).getByText("Frontend Engineer")).toBeInTheDocument());
    expect(within(full()).getByText(/you will own the editor/i)).toBeInTheDocument();
    expect(screen.queryByText(/intelligent orchestration platform/i)).not.toBeInTheDocument();
  });

  it("prefers role_summary over the flat blob, and keeps the blob as the legacy fallback", async () => {
    getJobs.mockResolvedValue({
      results: [
        {
          ...JOB,
          role_summary: "Own the design-system layer of a React app used by 40,000 students.",
          job_description: "A long flat blob nobody structured.",
        },
      ],
      count: 1,
    });
    render(<JobBoard />);
    await waitFor(() => expect(within(full()).getByText(/design-system layer/i)).toBeInTheDocument());
    expect(screen.queryByText(/long flat blob/i)).not.toBeInTheDocument();
  });

  it("promotes the skills the learner already has, and clamps the rest behind a +N", async () => {
    learnerSkills = [{ name: "TypeScript" }];
    getJobs.mockResolvedValue({
      results: [
        {
          ...JOB,
          tags: ["React", "Redux", "GraphQL", "Jest", "Webpack", "TypeScript"],
        },
      ],
      count: 1,
    });
    render(<JobBoard />);
    const card = await waitFor(() =>
      within(full()).getByRole("link", { name: "Frontend Engineer" }).closest("div[class]")!
        .parentElement!.parentElement as HTMLElement,
    );
    // The matched skill is first AND marked, so a row clamped at five reads at a glance.
    const chips = within(card).getAllByText(
      /React|Redux|GraphQL|Jest|Webpack|TypeScript/,
    );
    expect(chips[0]).toHaveTextContent("TypeScript");
    expect(within(card).getByText("+1")).toBeInTheDocument();
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
    await waitFor(() => expect(within(rail()).getByText("GitLab role 0")).toBeInTheDocument());

    // Every job is still on the page, exactly once per density.
    for (const job of results) {
      expect(within(rail()).getAllByText(job.job_title)).toHaveLength(1);
    }
    // ...and the six GitLab cards are no longer consecutive.
    const titles = titlesIn(rail());
    let run = 1;
    let longest = 1;
    for (let i = 1; i < titles.length; i += 1) {
      const same = titles[i].startsWith("GitLab") === titles[i - 1].startsWith("GitLab");
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
    await waitFor(() => expect(within(rail()).getByText("Role Alpha")).toBeInTheDocument());
    // Company A-Z: Acme first, then GitLab's two, untouched by the variety pass.
    expect(titlesIn(rail())).toEqual(["Role Gamma", "Role Alpha", "Role Beta"]);
  });

  it("paginates by number, in the URL, and never by infinite scroll", async () => {
    getJobs.mockResolvedValue({
      results: Array.from({ length: 45 }, (_, i) => ({ ...JOB, id: i + 1, job_title: `Role ${i}` })),
      count: 45,
    });
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Role 0")).toBeInTheDocument());
    const perPage = screen.getByRole("combobox", { name: /per page/i });
    expect(perPage).toHaveTextContent("20");
    // Twenty per page, and a numbered control rather than a sentinel that eats your place.
    expect(titlesIn(rail())).toHaveLength(20);
    // Our own labelled nav, not MUI's inner "pagination navigation".
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("offers Most relevant only when it knows the learner's skills", async () => {
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    const sort = screen.getByRole("combobox", { name: /sort jobs/i });
    // Default sort is "" — it must read "Most recent", not render blank.
    expect(sort).toHaveTextContent("Most recent");
    await userEvent.click(sort);
    expect(screen.queryByRole("option", { name: /most relevant/i })).not.toBeInTheDocument();
  });

  it("names the skills the learner already has, and never a match percentage", async () => {
    learnerSkills = [{ name: "React" }, { name: "TypeScript" }];
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    // Both fixtures carry React and TypeScript, so both rail cards name them — and neither
    // names a number.
    expect(within(rail()).getAllByText(/you have react, typescript/i)).toHaveLength(2);
    expect(screen.queryByText(/\d+%\s*match/i)).not.toBeInTheDocument();

    const sort = screen.getByRole("combobox", { name: /sort jobs/i });
    await userEvent.click(sort);
    expect(screen.getByRole("option", { name: /most relevant/i })).toBeInTheDocument();
  });

  it("says what the count is counting once a filter is on", async () => {
    search = "exp=1-3";
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    expect(screen.getByText(/of 137 jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/filtered by/i)).toHaveTextContent(/experience/i);
  });

  it("ships nothing from the applicant-count family, on any surface", async () => {
    getJobs.mockResolvedValue({
      results: [{ ...JOB, applications_count: 42, favorites_count: 18 }],
      count: 1,
    });
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    // These count applications recorded on OUR platform, not applications the employer
    // received; a reader would inevitably read them as competition.
    expect(screen.queryByText(/42/)).not.toBeInTheDocument();
    expect(screen.queryByText(/applicant/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/urgently hiring|early applicant|actively hiring|trending/i))
      .not.toBeInTheDocument();
    // ...and no Apply button on a card: apply is an outbound jump that deserves the detail
    // page's destination, eligibility check and safety notice.
    expect(screen.queryByRole("button", { name: /^apply/i })).not.toBeInTheDocument();
  });

  it("marks a closed role in place instead of dropping it", async () => {
    getJobs.mockResolvedValue({
      results: [{ ...JOB, is_open: false }],
      count: 1,
    });
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());
    expect(within(rail()).getByText("Closed")).toBeInTheDocument();
  });

  it("states why a role is visible, and says nothing when the rule is just 'open'", async () => {
    getJobs.mockResolvedValue({
      results: [
        { ...JOB, id: 1, visibility_reason: "assigned" },
        { ...JOB, id: 2, job_title: "Open role", visibility_reason: "open" },
      ],
      count: 2,
    });
    render(<JobBoard />);
    await waitFor(() => expect(within(rail()).getByText("Open role")).toBeInTheDocument());
    expect(within(rail()).getByText(/assigned to you by your mentor/i)).toBeInTheDocument();
    // "open" gets no chip: a badge whose justification is "everyone can see it" is noise.
    expect(within(rail()).queryAllByText(/open to everyone/i)).toHaveLength(0);
  });
});
