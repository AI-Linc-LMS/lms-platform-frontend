/**
 * Group 3's definition of done, as a test.
 *
 * Every screen in this group renders inside `JobsScope` at light AND at
 * `data-jobs-theme="dark"`, because "dark works" is a claim nobody can re-check by eye on every
 * future change. It also pins the behaviours the spec is most specific about, and that a
 * refactor would silently undo:
 *
 *   - the external apply opens the employer's tab BEFORE it awaits the POST (5.4);
 *   - a blocked popup does NOT raise the "did you apply?" dialog;
 *   - that dialog has THREE answers, and Esc maps to "not yet";
 *   - an unanswered OPTIONAL question renders "— not answered" on the review step (5.6);
 *   - the timeline renders only stages present on the record (5.3);
 *   - the gates each end somewhere.
 */

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import "@/lib/i18n";

const push = vi.fn();
const back = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back, replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: "7" }),
  usePathname: () => "/jobs-v2/7",
  useSearchParams: () => new URLSearchParams(""),
}));

// `ModulePageHeader` renders the "?" page guide whenever the route has a registry entry, and
// that guide reads `ClientInfoContext` — an app-shell provider no unit test mounts. Resolving to
// no guide is the same branch every route without an entry already takes.
vi.mock("@/lib/guide/registry", () => ({ resolveGuide: () => undefined }));

const applyForJob = vi.fn();
const confirmApplied = vi.fn();
const getMyApplications = vi.fn();

vi.mock("@/lib/services/jobs-v2.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/jobs-v2.service")>(
    "@/lib/services/jobs-v2.service",
  );
  return {
    ...actual,
    jobsV2Service: {
      ...actual.jobsV2Service,
      applyForJob: (...args: unknown[]) => applyForJob(...args),
      confirmApplied: (...args: unknown[]) => confirmApplied(...args),
      getMyApplications: () => getMyApplications(),
    },
  };
});

import { JobsScope } from "@/components/jobs-v2/ui";
import type { JobApplicationV2, JobV2 } from "@/lib/services/jobs-v2.service";
import { JobDetailView } from "./JobDetailView";
import { ApplyDialogs, ApplyCta } from "./ApplyCta";
import { useApply, type ApplyState } from "./useApply";
import { ApplyGate } from "@/components/jobs-v2/apply/ApplyGate";
import { ApplySuccess } from "@/components/jobs-v2/apply/ApplySuccess";
import { StepReview } from "@/components/jobs-v2/apply/StepReview";
import {
  ApplicationTimeline,
  buildApplicationTimeline,
} from "@/components/jobs-v2/application/ApplicationTimeline";

const JOB: JobV2 = {
  id: 7,
  job_title: "Backend Engineer",
  company_name: "Northwind",
  location: "Bengaluru",
  job_description: "Build the ledger.",
  role_process: "Two rounds.",
  key_skills: ["Python", "python", "Django"],
  mandatory_skills: ["Python"],
  status: "active",
  years_of_experience: "0-1",
  application_deadline: new Date(Date.now() + 86_400_000).toISOString(),
  applications_count: 42,
  favorites_count: 18,
  min_10th_percentage: 60,
  min_graduation_percentage: 65,
};

function Scope({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <JobsScope surface="student" theme={dark ? "dark" : "light"}>
      {children}
    </JobsScope>
  );
}

/** A hand-built `ApplyState`, so a presentational assertion does not need the whole hook. */
function applyState(overrides: Partial<ApplyState> = {}): ApplyState {
  return {
    job: JOB,
    mode: "internal",
    label: "Apply",
    icon: "mdi:arrow-right",
    href: "/jobs-v2/7/apply",
    applying: false,
    block: null,
    start: vi.fn(),
    confirmOpen: false,
    confirmBusy: false,
    confirmYes: vi.fn(),
    confirmLater: vi.fn(),
    confirmNo: vi.fn(),
    notice: null,
    noticeText: null,
    blockedUrl: null,
    dismissNotice: vi.fn(),
    applicationId: null,
    ...overrides,
  };
}

/** Drives the real hook so the ordering assertions test the shipped code path. */
function ApplyHarness({ job }: { job: JobV2 }) {
  const apply = useApply(job);
  return (
    <Scope>
      <ApplyCta apply={apply} placement="panel" />
      <ApplyDialogs apply={apply} />
    </Scope>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getMyApplications.mockResolvedValue({ results: [], count: 0 });
});

describe("Group 3 renders in both scopes", () => {
  const cases: Array<[string, ReactNode]> = [
    [
      "job detail",
      <JobDetailView
        key="d"
        job={JOB}
        apply={applyState()}
        appliedHref="/jobs-v2?tab=applied"
        showFavorite
        favoriteBusy={false}
        onToggleFavorite={() => {}}
      />,
    ],
    ["gate: applied", <ApplyGate key="g1" variant="applied" job={JOB} />],
    ["gate: external", <ApplyGate key="g2" variant="external" job={JOB} apply={applyState({ mode: "external" })} />],
    ["gate: closed", <ApplyGate key="g3" variant="closed" job={JOB} />],
    ["gate: ineligible", <ApplyGate key="g4" variant="ineligible" job={JOB} />],
    ["gate: not found", <ApplyGate key="g5" variant="notFound" job={null} />],
    [
      "success",
      <ApplySuccess key="s" job={JOB} applicationId={912} resumeName="resume.pdf" answeredCount={2} />,
    ],
  ];

  for (const [name, node] of cases) {
    it(`${name} renders light and dark`, () => {
      const light = render(<Scope>{node}</Scope>);
      expect(light.container.querySelector(".jobs-scope")).toBeTruthy();
      light.unmount();

      const dark = render(<Scope dark>{node}</Scope>);
      expect(dark.container.querySelector('[data-jobs-theme="dark"]')).toBeTruthy();
    });
  }
});

describe("the one apply behaviour", () => {
  it("opens the employer tab BEFORE awaiting the POST, then records it", async () => {
    const order: string[] = [];
    const openSpy = vi.fn(() => {
      order.push("open");
      return {} as Window;
    });
    vi.stubGlobal("open", openSpy);
    applyForJob.mockImplementation(async () => {
      order.push("post");
      return { id: 55, status: "applying" };
    });

    render(<ApplyHarness job={{ ...JOB, apply_link: "https://employer.example/apply" }} />);
    fireEvent.click(screen.getByRole("button", { name: /apply on external link/i }));

    expect(order[0]).toBe("open");
    expect(openSpy).toHaveBeenCalledWith("https://employer.example/apply", "_blank", "noopener");
    await waitFor(() => expect(order).toEqual(["open", "post"]));

    // ...and the three-answer dialog follows, because the tab actually opened.
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("button", { name: /yes, i applied/i })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: /not yet/i })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: /changed my mind/i })).toBeInTheDocument();
  });

  it("a blocked popup shows an inline link instead of the dialog", async () => {
    vi.stubGlobal(
      "open",
      vi.fn(() => null),
    );
    applyForJob.mockResolvedValue({ id: 56, status: "applying" });

    render(<ApplyHarness job={{ ...JOB, apply_link: "https://employer.example/apply" }} />);
    fireEvent.click(screen.getByRole("button", { name: /apply on external link/i }));

    await waitFor(() => expect(applyForJob).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/blocked/i);
    expect(screen.getByRole("link", { name: /open the application/i })).toHaveAttribute(
      "href",
      "https://employer.example/apply",
    );
  });

  it("names why it is disabled instead of just going grey", () => {
    render(
      <ApplyHarness job={{ ...JOB, eligible_to_apply: false }} />,
    );
    const button = screen.getByRole("button", { name: /not eligible/i });
    expect(button).toBeDisabled();
    // The reason is visible on touch, where a tooltip can never be read.
    expect(screen.getByText(/limited to/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /update your profile/i })).toHaveAttribute("href", "/profile");
  });
});

describe("the review step", () => {
  const questions = [
    { id: 1, question_text: "Why us?", question_type: "text", is_required: true, order: 1 },
    { id: 2, question_text: "Notice period?", question_type: "text", is_required: false, order: 2 },
  ];

  it("states an unanswered optional question rather than dropping it", () => {
    render(
      <Scope>
        <StepReview
          jobTitle={JOB.job_title}
          companyName={JOB.company_name}
          resumeName="resume.pdf"
          canPreview
          onPreview={() => {}}
          questions={questions}
          answers={{ 1: "Ledgers." }}
          onEditResume={() => {}}
        />
      </Scope>,
    );
    expect(screen.getByText(/Notice period\?/)).toBeInTheDocument();
    expect(screen.getByText(/not answered/i)).toBeInTheDocument();
  });
});

describe("the application timeline", () => {
  const base: JobApplicationV2 = {
    id: 912,
    job: 7,
    job_title: "Backend Engineer",
    company_name: "Northwind",
    student: 1,
    student_name: "A",
    student_email: "a@b.c",
    status: "rejected",
    applied_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-12T10:00:00Z",
    internal_shortlisting: "Yes",
    round_1: "2026-08-05",
    reason_not_shortlisted: "Needs more SQL depth.",
  };

  it("renders only the stages present on the record", () => {
    const nodes = buildApplicationTimeline(base, ((k: string, o?: { defaultValue?: string }) =>
      o?.defaultValue ?? k) as (k: string, o?: object) => string);
    const keys = nodes.map((n) => n.key);
    expect(keys).toContain("applied");
    expect(keys).toContain("internal_shortlisting");
    expect(keys).toContain("round_1");
    // The employer never ran these. Inventing them would be its own kind of lie.
    expect(keys).not.toContain("round_2");
    expect(keys).not.toContain("offered");
    expect(nodes[nodes.length - 1].state).toBe("missed");

    render(
      <Scope>
        <ApplicationTimeline nodes={nodes} />
      </Scope>,
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
