/**
 * Opening a job keeps the board around it.
 *
 * Reported as "the fix was applied, but when I click a job it lands me on a page where I cannot see
 * the header and filter anymore". `/jobs-v2/[id]` rendered a bare split of its own, so opening any
 * posting took the header, the tabs and the filter bar away. It now renders this same board with
 * the posting in the pane - these pin that the chrome is there, the posting is there, and the
 * list beside it marks the job that is open.
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
  useParams: () => ({ id: "1" }),
}));

const getJobs = vi.fn();
const getJobById = vi.fn();
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
      getJobById: (...args: unknown[]) => getJobById(...args),
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

// The app layout (sidebar, top bar) needs tenant providers a unit render does not have, and it is
// not what this is about: the question is what the ROUTE puts inside it.
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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


/** jsdom applies no media queries; this makes `useMediaQuery(up("lg"))` answer as a desktop would. */
function asViewport(desktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: desktop && /min-width/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const POSTING = <div data-testid="posting">The full Frontend Engineer posting</div>;

describe("a job opened on the board", () => {
  it("keeps the header, the tabs and the filters on screen", async () => {
    asViewport(true);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    // The page header, identified by its own line rather than the one-word title it shares with
    // the sidebar.
    expect(screen.getByText(/Discover roles matched to you/)).toBeInTheDocument();
    expect(screen.getAllByRole("tab", { name: /browse/i })).toHaveLength(1);
    expect(screen.getAllByRole("searchbox")).toHaveLength(1);
    expect(screen.getAllByText("Location")).toHaveLength(1);
  });

  it("shows the posting in the pane instead of the pick-a-role placeholder", async () => {
    asViewport(true);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    expect(screen.getByTestId("posting")).toBeInTheDocument();
    expect(screen.queryByText("Pick a role to read the full posting")).not.toBeInTheDocument();
  });

  it("marks the open job in the list beside it", async () => {
    asViewport(true);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    const current = rail().querySelector('[aria-current="true"]');
    expect(current?.textContent).toContain("Frontend Engineer");
  });

  it("goes back to the board when switching to Applied", async () => {
    // Applied is not a split view; staying on /jobs-v2/1 would show a list under a URL naming a
    // job the page no longer shows.
    asViewport(true);
    search = "loc=Bengaluru&ids=1,2";
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await waitFor(() => expect(within(rail()).getByText("Frontend Engineer")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("tab", { name: /applied/i }));
    expect(push).toHaveBeenCalledTimes(1);
    const [href] = push.mock.calls[0] as [string];
    expect(href.startsWith("/jobs-v2?")).toBe(true);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("tab")).toBe("applied");
    expect(params.get("loc")).toBe("Bengaluru");
    expect(params.get("ids")).toBeNull();
  });

  it("does not fetch the whole board on a phone, where the list is not shown", async () => {
    // An emailed job link opened on a phone is just the posting. Keep it that way.
    asViewport(false);
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    expect(screen.getByTestId("posting")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getJobs).not.toHaveBeenCalled();
  });

  it("still shows the posting when the filters in the URL match nothing", async () => {
    // The board's empty state describes the LIST. The learner came to read the job.
    asViewport(true);
    getJobs.mockResolvedValue({ results: [], count: 0 });
    render(<JobBoard selection={{ id: 1, pane: POSTING }} />);
    await waitFor(() => expect(getJobs).toHaveBeenCalled());
    expect(screen.getByTestId("posting")).toBeInTheDocument();
  });
});

describe("the job page itself", () => {
  it("renders the posting inside the board, header and filters included", async () => {
    // The route is where the bug was: it drew a bare split of its own.
    const { default: JobDetailPage } = await import("@/app/jobs-v2/[id]/page");
    asViewport(true);
    getJobById.mockResolvedValue(JOB);
    render(<JobDetailPage />);

    await waitFor(() => expect(getJobById).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.getByText(/Discover roles matched to you/)).toBeInTheDocument());
    expect(screen.getAllByRole("searchbox")).toHaveLength(1);
    expect(screen.getAllByRole("tab", { name: /browse/i })).toHaveLength(1);
    expect(screen.queryByText("Pick a role to read the full posting")).not.toBeInTheDocument();
  });
});
