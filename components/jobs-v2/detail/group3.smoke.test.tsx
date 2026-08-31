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
 *
 * The job-site spec adds the loudest complaint — "the about-the-job description is very plain" —
 * so the description's four shapes are pinned here too: a structured row, a legacy flat row WITH
 * markers (which must parse into the same sections), a hand-written row WITHOUT them (which must
 * NOT be chopped up), and an empty row. Plus the honesty rules that a well-meaning future edit
 * is most likely to break: no applicant or saved counts, no match percentage, "Not disclosed"
 * only in the Role snapshot, and a closed role marked in place rather than left looking live.
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

/**
 * The detail page reads the learner's own skills from the profile the gate provider ALREADY
 * fetched for this route, so it can name which of a role's skills the learner has. Mocking the
 * context keeps `auth-context` (and the tenant-id guard it trips on) out of a unit render, and
 * lets a test set the learner's skills to whatever it needs.
 */
let learnerSkills: string[] = [];
vi.mock("@/lib/contexts/ProfileGateContext", () => ({
  useProfileGate: () => ({
    status: "ready",
    completion: null,
    skills: learnerSkills,
    isComplete: true,
    percentage: 100,
    lockedModules: [],
    missingFields: [],
    refresh: async () => {},
    applyServerLock: () => {},
  }),
  useModuleLocked: () => ({ locked: false, ready: true, showLock: false, reportError: () => false }),
  useOutstandingFields: () => [],
}));

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
import { SimilarJobs } from "./SimilarJobs";
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
    destination: null,
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
  learnerSkills = [];
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

/* ==========================================================================
 * "The about-the-job description is very plain."
 *
 * The complaint's root cause was that we generate structure and destroy it at the boundary. The
 * four shapes below are the whole contract: whichever one a row is in, the reader gets sections.
 * ======================================================================== */

const STRUCTURED: JobV2 = {
  ...JOB,
  job_description: "",
  role_summary: "Own the money movement path end to end, from capture to settlement.",
  responsibilities: ["Own the billing service", "- Ship the ledger migration"],
  requirements_must: ["3 years of Python", "Postgres in production"],
  requirements_good: ["Kafka", "3 years of Python"],
  tech_stack: ["PostgreSQL", "Airflow", "Kubernetes", "Terraform"],
  perks: ["Relocation assistance"],
  work_mode: "Hybrid",
  number_of_openings: 3,
};

/** A row our own composer wrote: one string, but carrying the markers. ~486 of these are live. */
const LEGACY_FLAT: JobV2 = {
  ...JOB,
  job_description: [
    "We are hiring a backend engineer for the payments group.",
    "",
    "Responsibilities:",
    "- Own the billing service",
    "- Ship the ledger migration",
    "",
    "Requirements:",
    "- 3 years of Python",
    "- Postgres in production",
  ].join("\n"),
};

/** A description a human typed. It must NOT be chopped into a list that misrepresents it. */
const HANDWRITTEN: JobV2 = {
  ...JOB,
  job_description:
    "We are a small team and we would love to meet you. Write to us and tell us what you have built.",
};

const EMPTY_ROW: JobV2 = {
  id: 9,
  job_title: "Analyst",
  company_name: "Northwind",
  status: "active",
};

function renderDetail(job: JobV2, extra: Partial<ApplyState> = {}) {
  return render(
    <Scope>
      <JobDetailView
        job={job}
        apply={applyState({ job, ...extra })}
        appliedHref="/jobs-v2?tab=applied"
        showFavorite
        favoriteBusy={false}
        onToggleFavorite={() => {}}
      />
    </Scope>,
  );
}

describe("the structured description", () => {
  it("renders the section stack from the structured columns", () => {
    renderDetail(STRUCTURED);

    expect(screen.getByRole("heading", { name: /about this role/i })).toBeInTheDocument();
    expect(screen.getByText(/own the money movement path/i)).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /what you'll do/i })).toBeInTheDocument();
    // The applier strips the leading "- " the model or a paste left behind.
    expect(screen.getByText("Ship the ledger migration")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /what they're looking for/i })).toBeInTheDocument();
    expect(screen.getByText(/must have/i)).toBeInTheDocument();
    expect(screen.getByText(/good to have/i)).toBeInTheDocument();
    expect(screen.getByText("Kafka")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /perks and benefits/i })).toBeInTheDocument();
  });

  it("never shows an item in both Must have and Good to have", () => {
    renderDetail(STRUCTURED);
    // "3 years of Python" is in both arrays on the fixture; `good - must` makes them disjoint.
    expect(screen.getAllByText("3 years of Python")).toHaveLength(1);
  });

  it("computes the highlight chips instead of asking a model for them", () => {
    renderDetail(STRUCTURED);
    // Work mode is one of the module's canonical facts, so it legitimately appears in the hero
    // meta row and the Role snapshot too. What matters is that it came from `work_mode` and was
    // never inferred from a location.
    expect(screen.getAllByText("Hybrid").length).toBeGreaterThan(0);
    expect(screen.getByText(/3 openings/i)).toBeInTheDocument();
    expect(screen.getByText(/4 technologies/i)).toBeInTheDocument();
  });

  it("promotes the skills the learner already has, and never a percentage", () => {
    learnerSkills = ["airflow"];
    renderDetail(STRUCTURED);

    // Matched chips sort FIRST, so a clamped row shows the reason the role is worth reading.
    const stack = screen.getByRole("heading", { name: /skills and stack/i }).closest("section");
    const chips = Array.from(stack?.querySelectorAll("span") ?? [])
      .map((el) => el.textContent?.trim())
      .filter((text) => text === "Airflow" || text === "PostgreSQL");
    expect(chips[0]).toBe("Airflow");

    // The tint is explained, so it is not a colour-only signal.
    expect(screen.getByText(/already on your profile/i)).toBeInTheDocument();
    // And it is never a score. (The percentages that DO appear are the employer's own stated
    // gates, "Class 10: at least 60%", which are a rule with its inputs printed beside it.)
    expect(screen.queryByText(/\d+\s*%\s*match/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/match score/i)).not.toBeInTheDocument();
  });

  it("says nothing about a match when we do not know the learner's skills", () => {
    learnerSkills = [];
    renderDetail(STRUCTURED);
    expect(screen.queryByText(/already on your profile/i)).not.toBeInTheDocument();
  });

  it("parses a LEGACY flat description into the same sections", () => {
    renderDetail(LEGACY_FLAT);
    expect(screen.getByRole("heading", { name: /what you'll do/i })).toBeInTheDocument();
    expect(screen.getByText("Own the billing service")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /what they're looking for/i })).toBeInTheDocument();
    expect(screen.getByText("Postgres in production")).toBeInTheDocument();
    // The lead survives as the lead, not as a bullet.
    expect(screen.getByText(/hiring a backend engineer/i)).toBeInTheDocument();
  });

  it("leaves a hand-written description alone rather than inventing a list", () => {
    renderDetail(HANDWRITTEN);
    expect(screen.getByText(/we are a small team/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /what you'll do/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /what they're looking for/i })).not.toBeInTheDocument();
  });

  it("renders the sparse state for a posting with nothing on it", () => {
    renderDetail(EMPTY_ROW);
    expect(screen.getByText(/no description yet/i)).toBeInTheDocument();
  });
});

/* ==========================================================================
 * The honesty rules. Each of these is one edit away from being broken.
 * ======================================================================== */

describe("what this page must never show", () => {
  it("does not render applicant or saved counts, even though both are on the payload", () => {
    renderDetail({ ...JOB, applications_count: 42, favorites_count: 18 });
    expect(screen.queryByText(/42 applicants/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/18 saved/i)).not.toBeInTheDocument();
    // And never a percentage: the match signal is named skills or nothing.
    expect(screen.queryByText(/%\s*match/i)).not.toBeInTheDocument();
  });

  it("says 'Not disclosed' for salary in the Role snapshot, and nowhere else", () => {
    renderDetail({ ...JOB, salary: undefined });
    expect(screen.getAllByText(/not disclosed/i)).toHaveLength(1);
    // An unstated experience range is ABSENT, not "not disclosed" — no row is printed for it.
    expect(screen.queryByText(/^experience$/i)).not.toBeInTheDocument();
  });

  it("prints the salary verbatim when the employer stated one", () => {
    renderDetail({ ...JOB, salary: "12-18 LPA" });
    expect(screen.getAllByText("12-18 LPA").length).toBeGreaterThan(0);
    expect(screen.queryByText(/not disclosed/i)).not.toBeInTheDocument();
  });

  it("marks a role closed in place instead of leaving it looking live", () => {
    renderDetail({ ...JOB, is_open: false });
    expect(screen.getAllByText(/^closed$/i).length).toBeGreaterThan(0);
  });

  it("disables apply on a closed role and names the date", async () => {
    render(
      <ApplyHarness
        job={{
          ...JOB,
          is_open: false,
          apply_link: "https://employer.example/apply",
          application_deadline: "2026-08-12T00:00:00Z",
        }}
      />,
    );
    const button = screen.getByRole("button", { name: /applications closed/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/closed on/i)).toBeInTheDocument();
  });
});

/* ==========================================================================
 * The apply affordance.
 * ======================================================================== */

describe("the apply affordance says where it goes", () => {
  it("prints the destination host under an external apply", () => {
    render(
      <Scope>
        <ApplyCta
          apply={applyState({ mode: "external", destination: "greenhouse.io", href: null })}
          placement="panel"
        />
      </Scope>,
    );
    expect(screen.getByText(/greenhouse\.io/i)).toBeInTheDocument();
  });

  it("prints no destination for an internal apply", () => {
    render(
      <Scope>
        <ApplyCta apply={applyState()} placement="panel" />
      </Scope>,
    );
    expect(screen.queryByText(/opens /i)).not.toBeInTheDocument();
  });

  it("resolves the host from the link the employer gave us", () => {
    render(<ApplyHarness job={{ ...JOB, apply_link: "https://www.greenhouse.io/x/y" }} />);
    expect(screen.getByText(/greenhouse\.io/i)).toBeInTheDocument();
  });
});

/* ==========================================================================
 * ONE tree, two layouts.
 *
 * The hero, the hero BAR, the side rail and the mobile apply bar are all present at once and
 * hidden by CSS — never by `useMediaQuery`, which returns `false` on the server and is what made
 * the admin tables flash the desktop layout on a phone. Rendering a second copy for `lg+` is how
 * the shipped board's desktop branch came to drop `onFavoriteChange`.
 * ======================================================================== */

describe("the split pane and the page are one tree", () => {
  it("mounts the platform hero AND the sticky pane bar, each exactly once", () => {
    renderDetail(STRUCTURED);
    // Exactly ONE h1, and it is the pane's sticky bar. `ModulePageHeader` renders its title as
    // plain text rather than a heading (a shared file, unchanged here), so the document outline
    // has one top-level heading whichever layout is visible.
    expect(screen.getAllByRole("heading", { level: 1, name: STRUCTURED.job_title })).toHaveLength(1);
    // The below-lg chrome is mounted at the same time, not swapped in by a media query.
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to jobs/i })).toBeInTheDocument();
    // ...and exactly one apply card, one Role snapshot, one of every section.
    expect(screen.getAllByRole("heading", { name: /what you'll do/i })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { name: /role snapshot/i })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { name: /apply for this position/i })).toHaveLength(1);
  });

  it("keeps the apply affordance reachable from more than one place", () => {
    renderDetail(STRUCTURED);
    // The hero action, the hero bar, the apply card and the mobile bar are all bound to the same
    // `useApply(job)` state — there is no "real" apply plus decorative links that record nothing.
    expect(screen.getAllByRole("link", { name: /^apply$/i }).length).toBeGreaterThanOrEqual(3);
  });
});

/* ==========================================================================
 * Similar jobs.
 * ======================================================================== */

describe("similar jobs", () => {
  it("renders nothing rather than a padded row", () => {
    const { container } = render(
      <Scope>
        <SimilarJobs jobs={[]} currentJobId={7} />
      </Scope>,
    );
    expect(container.querySelector("section")).toBeNull();
  });

  it("names why each row is visible, backed by the actual rule", () => {
    render(
      <Scope>
        <SimilarJobs
          currentJobId={7}
          boardQuery="loc=Bengaluru&page=4"
          jobs={[
            { id: 8, job_title: "Platform Engineer", company_name: "Acme", visibility_reason: "cohort" },
            // The job being read is excluded even if the backend forgets to.
            { id: 7, job_title: "Backend Engineer" },
            { id: 9, job_title: "Data Engineer", visibility_reason: "open" },
          ]}
        />
      </Scope>,
    );
    expect(screen.getByRole("link", { name: /platform engineer/i })).toHaveAttribute(
      "href",
      "/jobs-v2/8?loc=Bengaluru&page=4",
    );
    expect(screen.getByText(/open to your cohort/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^backend engineer$/i })).not.toBeInTheDocument();
    // `"open"` has no sentence worth printing, so no line is printed.
    expect(screen.getByRole("link", { name: /data engineer/i })).toBeInTheDocument();
  });
});

/* ==========================================================================
 * Eligibility — the section none of the five boards has.
 * ======================================================================== */

describe("eligibility", () => {
  const TARGETED: JobV2 = {
    ...JOB,
    eligible_to_apply: true,
    courses: [{ id: 1, title: "Python Full-Stack" }],
    min_graduation_percentage: 60,
  };

  it("prints the verdict, the rule and its inputs", () => {
    renderDetail(TARGETED);
    expect(screen.getByText(/you can apply to this role/i)).toBeInTheDocument();
    expect(screen.getAllByText(/python full-stack/i).length).toBeGreaterThan(0);
  });

  it("labels a gate apply does not enforce, rather than implying it blocks", () => {
    renderDetail(TARGETED);
    expect(screen.getAllByText(/stated by the employer/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/do not block your application/i).length).toBeGreaterThan(0);
  });

  it("renders no verdict at all for a student we know nothing about", () => {
    renderDetail({ ...JOB, eligible_to_apply: undefined });
    expect(screen.queryByText(/you can apply to this role/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/you cannot apply to this role/i)).not.toBeInTheDocument();
  });
});
