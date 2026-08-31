import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobsScope } from "@/components/jobs-v2/ui";
import type { JobApplicationV2, JobV2 } from "@/lib/services/jobs-v2.service";
import { AudiencePanel } from "./detail/AudiencePanel";
import { EligibilityPanel } from "./detail/EligibilityPanel";
import { AudienceSummary, useAudienceDescription } from "./form/AudienceSummary";
import { useJobForm, clampPercentage, isHttpUrl } from "./form/useJobForm";
import { useUnsavedChanges } from "./form/useUnsavedChanges";
import { JobForm } from "./form/JobForm";
import { ApplicationsTable } from "./applications/ApplicationsTable";
import { CandidateModal } from "./applications/CandidateModal";
import { PipelineRail, furthestStageIndex, nextStage } from "./applications/PipelineRail";

vi.mock("@/lib/services/admin/admin-jobs-v2.service", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    adminJobsV2Service: {
      getQuestions: vi.fn().mockResolvedValue([]),
      createQuestion: vi.fn(),
    },
  };
});

vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: { getManageStudents: vi.fn().mockResolvedValue({ students: [], pagination: {} }) },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "1" }),
  usePathname: () => "/admin/jobs-v2/1",
  useSearchParams: () => new URLSearchParams(),
}));

const job = (over: Partial<JobV2> = {}): JobV2 => ({
  id: 1,
  job_title: "Backend Engineer",
  company_name: "Acme",
  location: "Remote",
  status: "on_hold",
  is_published: false,
  created_at: "2026-01-05T10:00:00Z",
  mandatory_skills: ["Python"],
  key_skills: ["python", "SQL"],
  min_10th_percentage: 60,
  min_12th_percentage: 65,
  min_graduation_percentage: 70,
  applicable_passout_year: "2026",
  courses: [{ id: 3, title: "Python 101" }],
  adaptive_courses: [{ id: 9, title: "Adaptive Python" }],
  assigned_students: [{ id: 4, name: "Rita", email: "rita@example.com" }],
  college_mappings: [{ college_name: "IIT Bombay" }],
  ...over,
});

const app = (over: Partial<JobApplicationV2> = {}): JobApplicationV2 => ({
  id: 11,
  job: 1,
  job_title: "Backend Engineer",
  company_name: "Acme",
  student: 4,
  student_name: "Rita Roy",
  student_email: "rita@example.com",
  student_college: "IIT Bombay",
  student_phone: "9990001111",
  status: "applied",
  applied_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-04T00:00:00Z",
  ...over,
});

const noop = () => undefined;

// jsdom implements no layout, so it ships no `Element.prototype.scrollIntoView`. The kit's
// `focusFirstError` calls it. Shimming it here keeps this suite honest without editing a
// Group 1 file; the note to Group 1 asks for the guard in `Field.tsx` itself.
if (!("scrollIntoView" in Element.prototype)) {
  (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = noop;
}

function scoped(node: React.ReactNode, theme: "light" | "dark" = "light") {
  return render(<JobsScope surface="admin" theme={theme}>{node}</JobsScope>);
}

/* ==========================================================================
 * The audience question the admin detail page could not answer
 * ======================================================================== */
describe("AudiencePanel", () => {
  it("names all four targeting mechanisms, including the two that were invisible", () => {
    scoped(<AudiencePanel job={job()} />);
    expect(screen.getAllByText(/Python 101/).length).toBeGreaterThan(0);
    // Adaptive targeting and individually assigned students were both unrenderable before.
    expect(screen.getAllByText(/Adaptive Python/).length).toBeGreaterThan(0);
    expect(screen.getByText("Rita")).toBeTruthy();
    expect(screen.getByText("rita@example.com")).toBeTruthy();
    expect(screen.getAllByText(/IIT Bombay/).length).toBeGreaterThan(0);
  });

  it("states 'visible to everyone' only when nothing narrows the audience", () => {
    const { unmount } = scoped(
      <AudienceSummary courseTitles={[]} adaptiveTitles={[]} collegeNames={[]} studentCount={0} />,
    );
    expect(screen.getByText(/every student/i)).toBeTruthy();
    unmount();

    scoped(
      <AudienceSummary
        courseTitles={["A", "B"]}
        adaptiveTitles={[]}
        collegeNames={["X"]}
        studentCount={3}
      />,
    );
    expect(screen.queryByText(/^Visible to every student who/i)).toBeNull();
  });

  it("computes one sentence, so the step and the dialog cannot disagree", () => {
    const { result } = renderHook(() =>
      useAudienceDescription({
        courseTitles: ["A"],
        adaptiveTitles: ["B"],
        collegeNames: [],
        studentCount: 2,
      }),
    );
    expect(result.current.everyone).toBe(false);
    expect(result.current.sentence).toContain("2");
  });
});

/* ==========================================================================
 * The three percentages the form collected and the detail page never showed
 * ======================================================================== */
describe("EligibilityPanel", () => {
  it("renders all three academic minimums and the passout year exactly once", () => {
    scoped(<EligibilityPanel job={job()} />);
    expect(screen.getByText("60%")).toBeTruthy();
    expect(screen.getByText("65%")).toBeTruthy();
    expect(screen.getByText("70%")).toBeTruthy();
    expect(screen.getAllByText("2026")).toHaveLength(1);
  });

  it("says so plainly when there are no gates at all", () => {
    scoped(
      <EligibilityPanel
        job={job({
          min_10th_percentage: null,
          min_12th_percentage: null,
          min_graduation_percentage: null,
          applicable_passout_year: null,
          education: "",
          ug_requirements: "",
          pg_requirements: "",
          years_of_experience: "",
        })}
      />,
    );
    expect(screen.getByText(/No eligibility gates/i)).toBeTruthy();
  });
});

/* ==========================================================================
 * The form's brain
 * ======================================================================== */
const messages = {
  required: "This field is required",
  invalidUrl: "Enter a full link",
  minOpenings: "Enter a whole number",
  logoUnreachable: "That URL did not load an image",
};

describe("useJobForm", () => {
  it("keeps mandatory_skills and key_skills SEPARATE in the payload", () => {
    const { result } = renderHook(() =>
      useJobForm({ initialKey: "job:1", initialData: job(), draftId: "t1", messages }),
    );
    const payload = result.current.buildPayload();
    expect(payload.mandatory_skills).toEqual(["Python"]);
    expect(payload.key_skills).toEqual(["python", "SQL"]);
    expect(payload.mandatory_skills).not.toEqual(payload.key_skills);
  });

  it("opens an on_hold job at on_hold, so saving cannot silently reactivate it", () => {
    const { result } = renderHook(() =>
      useJobForm({ initialKey: "job:1", initialData: job(), draftId: "t2", messages }),
    );
    expect(result.current.data.status).toBe("on_hold");
    expect(result.current.buildPayload().status).toBe("on_hold");
  });

  it("does NOT reset typed input when initialData's object identity changes", () => {
    const { result, rerender } = renderHook(
      ({ data }) =>
        useJobForm({ initialKey: "job:1", initialData: data, draftId: "t3", messages }),
      { initialProps: { data: job() } },
    );
    act(() => result.current.setField("job_title", "Typed by hand"));
    // A late course fetch re-creates the memo, handing a NEW object with the SAME key.
    rerender({ data: job() });
    expect(result.current.data.job_title).toBe("Typed by hand");
  });

  it("makes the logo optional and validates the two URLs it does accept", () => {
    const { result } = renderHook(() =>
      useJobForm({ initialKey: "new", draftId: "t4", messages }),
    );
    act(() => {
      result.current.setField("job_title", "T");
      result.current.setField("company_name", "C");
    });
    expect(result.current.errors.company_logo).toBeUndefined();
    act(() => result.current.setField("company_logo", "not a url"));
    expect(result.current.errors.company_logo).toBe(messages.invalidUrl);
    act(() => result.current.setField("apply_link", "javascript:alert(1)"));
    expect(result.current.errors.apply_link).toBe(messages.invalidUrl);
  });

  it("clamps a percentage in onChange rather than by an advisory inputProps", () => {
    expect(clampPercentage("500")).toBe(100);
    expect(clampPercentage("-3")).toBe(0);
    expect(clampPercentage("")).toBeNull();
    expect(isHttpUrl("https://a.example")).toBe(true);
    expect(isHttpUrl("ftp://a.example")).toBe(false);
  });

  it("marks the step that actually holds the offending field", () => {
    const { result } = renderHook(() =>
      useJobForm({ initialKey: "new", draftId: "t5", messages }),
    );
    act(() => {
      result.current.validateAll();
    });
    expect(result.current.stepHasError(0)).toBe(true);
    expect(result.current.stepHasError(3)).toBe(false);
    expect(result.current.firstInvalidStep).toBe(0);
  });

  it("tracks dirt so Cancel and beforeunload can guard it", () => {
    const { result } = renderHook(() =>
      useJobForm({ initialKey: "job:1", initialData: job(), draftId: "t6", messages }),
    );
    expect(result.current.dirty).toBe(false);
    act(() => result.current.setField("salary", "9 LPA"));
    expect(result.current.dirty).toBe(true);
    act(() => result.current.markSaved());
    expect(result.current.dirty).toBe(false);
  });
});

describe("useUnsavedChanges", () => {
  it("runs the action immediately when clean and prompts when dirty", () => {
    const clean = renderHook(() => useUnsavedChanges(false));
    const ran = vi.fn();
    act(() => clean.result.current.requestLeave(ran));
    expect(ran).toHaveBeenCalledTimes(1);
    expect(clean.result.current.promptOpen).toBe(false);

    const dirty = renderHook(() => useUnsavedChanges(true));
    const parked = vi.fn();
    act(() => dirty.result.current.requestLeave(parked));
    expect(parked).not.toHaveBeenCalled();
    expect(dirty.result.current.promptOpen).toBe(true);
    act(() => dirty.result.current.confirmLeave());
    expect(parked).toHaveBeenCalledTimes(1);
  });

  it("drops the parked action on cancel, so Escape never navigates later", () => {
    const { result } = renderHook(() => useUnsavedChanges(true));
    const parked = vi.fn();
    act(() => result.current.requestLeave(parked));
    act(() => result.current.cancelLeave());
    act(() => result.current.confirmLeave());
    expect(parked).not.toHaveBeenCalled();
  });
});

/* ==========================================================================
 * The pipeline that was invisible on every surface
 * ======================================================================== */
describe("PipelineRail", () => {
  it("reads the furthest stage reached and names the next one to write", () => {
    const fresh = app();
    expect(furthestStageIndex(fresh)).toBe(-1);
    expect(nextStage(fresh)?.field).toBe("internal_shortlisting");

    const midway = app({ internal_shortlisting: "ops shortlisted", round_1: "test select" });
    expect(furthestStageIndex(midway)).toBe(2);
    expect(nextStage(midway)?.field).toBe("round_2");

    const done = app({
      internal_shortlisting: "ops shortlisted",
      shortlisted_by_hr: "hr selected",
      round_1: "test select",
      round_2: "test select",
      round_3: "test select",
      round_4: "hr interview select",
      offered: "offer accepted",
    });
    expect(nextStage(done)).toBeNull();
  });

  it("describes itself to a screen reader instead of being six mute bars", () => {
    scoped(<PipelineRail app={app({ round_1: "test select" })} />);
    const rail = screen.getByRole("img");
    expect(rail.getAttribute("aria-label")).toMatch(/Pipeline/i);
  });
});

/* ==========================================================================
 * The applicant table
 * ======================================================================== */
const tableProps = {
  loading: false,
  error: null,
  onRetry: noop,
  isFiltered: false,
  empty: <div>empty</div>,
  emptyFiltered: <div>empty-filtered</div>,
  selection: { selectedIds: new Set<string | number>(), onChange: noop, selectableIds: [11] },
  sort: { key: "applied_at", dir: "desc" as const, onSort: noop },
  updatingIds: new Set<number>(),
  rowErrors: {},
  onOpen: noop,
  onOpenResume: noop,
  onStatusChange: noop,
};

describe("ApplicationsTable", () => {
  it("carries the college and the pipeline the desktop table used to omit", () => {
    scoped(<ApplicationsTable {...tableProps} rows={[app({ round_1: "test select" })]} />);
    const table = screen.getByRole("table");
    expect(within(table).getAllByText(/IIT Bombay/).length).toBeGreaterThan(0);
    expect(within(table).getAllByText(/Round 1/).length).toBeGreaterThan(0);
  });

  it("has no renumbering '#' column", () => {
    scoped(<ApplicationsTable {...tableProps} rows={[app()]} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.trim());
    expect(headers).not.toContain("#");
  });

  it("renders an error, never an empty state, when the load failed", () => {
    scoped(<ApplicationsTable {...tableProps} rows={[]} error="boom" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByText("empty")).toBeNull();
  });

  it("separates nothing-exists from nothing-matches", () => {
    const { unmount } = scoped(<ApplicationsTable {...tableProps} rows={[]} />);
    expect(screen.getByText("empty")).toBeTruthy();
    unmount();
    scoped(<ApplicationsTable {...tableProps} rows={[]} isFiltered />);
    expect(screen.getByText("empty-filtered")).toBeTruthy();
  });
});

/* ==========================================================================
 * The candidate modal
 * ======================================================================== */
describe("CandidateModal", () => {
  it("sends an EMPTY string when a reason is cleared, so the old one goes away", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    scoped(
      <CandidateModal
        open
        app={app({ reason_not_shortlisted: "Too junior" })}
        onClose={noop}
        onSave={onSave}
        onOpenResume={noop}
      />,
    );
    const reason = screen.getByLabelText(/Reason not shortlisted/i);
    await user.clear(reason);
    await user.click(screen.getByRole("button", { name: /^Save$/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][1].reason_not_shortlisted).toBe("");
  });

  it("keeps the modal open when the resume is requested", async () => {
    const user = userEvent.setup();
    const onOpenResume = vi.fn();
    const onClose = vi.fn();
    scoped(
      <CandidateModal
        open
        app={app({ resume_url: "https://example.com/cv.pdf" })}
        onClose={onClose}
        onSave={vi.fn()}
        onOpenResume={onOpenResume}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^Resume$/i }));
    expect(onOpenResume).toHaveBeenCalledWith("https://example.com/cv.pdf");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("exposes every pipeline stage as a labelled control", () => {
    scoped(
      <CandidateModal open app={app()} onClose={noop} onSave={vi.fn()} onOpenResume={noop} />,
    );
    ["Internal", "HR", "Round 1", "Round 2", "Round 3", "Round 4", "Offered", "Drive"].forEach(
      (label) => {
        expect(screen.getByLabelText(new RegExp(`^${label}$`, "i"))).toBeTruthy();
      },
    );
  });
});

/* ==========================================================================
 * The rebuilt stepper actually mounts
 * ======================================================================== */
describe("JobForm", () => {
  const formProps = {
    mode: "create" as const,
    initialKey: "new",
    draftId: "smoke-form",
    courses: [],
    coursesLoading: false,
    coursesError: null,
    onRetryCourses: noop,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: noop,
    saveLabel: "Create job",
  };

  it("mounts on step 1 with four clickable steps and a Save on every one", async () => {
    scoped(<JobForm {...formProps} />);
    const nav = await screen.findByRole("navigation", { name: /job form steps/i });
    // Every step is reachable: Save must not cost four Next clicks.
    expect(within(nav).getAllByRole("button")).toHaveLength(4);
    expect(screen.getByRole("button", { name: /create job/i })).toBeTruthy();
    expect(screen.getByLabelText(/Job title/i)).toBeTruthy();
    // The logo is optional now, so step 1 no longer blocks on the hardest field on the form.
    expect(screen.getByLabelText(/Company logo URL/i)).toBeTruthy();
  });

  it("shows a field-level error instead of a silent disabled gate", async () => {
    const user = userEvent.setup();
    scoped(<JobForm {...formProps} />);
    await screen.findByRole("navigation", { name: /job form steps/i });
    await user.click(screen.getByRole("button", { name: /create job/i }));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });
});

/* ==========================================================================
 * Dark is a one-attribute flip with zero component edits
 * ======================================================================== */
describe("dark", () => {
  it("renders every Group 5 surface under data-jobs-theme=dark", () => {
    const { container } = scoped(
      <>
        <AudiencePanel job={job()} />
        <EligibilityPanel job={job()} />
        <PipelineRail app={app({ round_2: "test select" })} />
        <ApplicationsTable {...tableProps} rows={[app()]} />
      </>,
      "dark",
    );
    expect(container.querySelector('.jobs-scope[data-jobs-theme="dark"]')).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
  });
});
