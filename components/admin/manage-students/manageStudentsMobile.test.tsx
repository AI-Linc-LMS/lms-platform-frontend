import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * Manage Students on a phone.
 *
 * Measured on an iPhone 14 (390px) against the demo tenant: the student directory was a 920px
 * sticky-header table in a 390px screen, the row actions were 28px icons at its far edge, the
 * segment presets were 31px pills, and the add-student / bulk-enrol / delete dialogs were centred
 * desktop dialogs with their actions under the keyboard.
 *
 * jsdom has no layout, so nothing here measures a width. What is pinned is the structure that
 * makes the width right on a phone - one card per student, a sheet instead of a dialog, a filter
 * sheet behind one button - and that a screen of 600px or more still gets the original markup.
 * MUI picks its branch from `window.matchMedia`, so the viewport is driven through that.
 */

// ---- viewport ---------------------------------------------------------------------------------
const realMatchMedia = window.matchMedia;
function viewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    let matches = false;
    if (max) matches = width <= parseFloat(max[1]);
    else if (min) matches = width >= parseFloat(min[1]);
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }) as unknown as typeof window.matchMedia;
}
const PHONE = 390; // iPhone 14
const DESKTOP = 1440;

// ---- app seams --------------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  showToast: vi.fn(),
  quickEnroll: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: string | { defaultValue?: string; [k: string]: unknown }) => {
      const template = typeof opts === "string" ? opts : opts?.defaultValue;
      if (!template) return key;
      return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        typeof opts === "object" && opts && k in opts ? String(opts[k]) : "",
      );
    },
  }),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useIsCourseEnabled: () => true }));
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: { role: "admin" }, loading: false }) }));
vi.mock("@/lib/services/admin/admin-student-enrollment.service", () => ({
  adminStudentEnrollmentService: {
    quickEnrollStudent: mocks.quickEnroll,
    listAllJobs: () =>
      Promise.resolve([
        {
          id: 503,
          task_id: "t-503",
          status: "COMPLETED",
          students: [{}, {}],
          created_accounts: [{}],
          enrolled_students: [{}, {}],
          skipped_accounts: [],
          skipped_enrollments: [{}],
          failed_students: [],
          created_at: "2026-09-01T09:00:00Z",
          completed_at: "2026-09-01T09:05:00Z",
        },
      ]),
  },
}));
vi.mock("@/lib/services/admin/admin-courses.service", () => ({
  adminCoursesService: { getCourses: () => Promise.resolve([{ id: 1, title: "Python" }]) },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: () => Promise.resolve([]) },
  PAID_COURSE_NEEDS_COMP: "paid_course_requires_comp",
}));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    bulkCourseAction: vi.fn(),
    getProgressResetHistory: () => Promise.resolve([]),
    previewProgressReset: () => Promise.resolve({ counts: {}, preserved: [], total: 0 }),
  },
}));

import { StudentsTable } from "./StudentsTable";
import { StudentsFilters } from "./StudentsFilters";
import { StudentsPagination } from "./StudentsPagination";
import { QuickEnrollStudentDialog } from "./QuickEnrollStudentDialog";
import { BulkActionToolbar } from "./BulkActionToolbar";
import { EnrollmentJobHistory } from "./EnrollmentJobHistory";
import { ResponsiveConfirm } from "./mobile";
import { AssessmentsTab } from "./detail/AssessmentsTab";
import { ResetProgressCard } from "./detail/ResetProgressCard";
import { StatPill } from "./detail/shared";
import { PhoneStudentSegments } from "./PhoneStudentSegments";

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

/** A sheet is a bottom-anchored Drawer; a dialog is a centred Dialog. */
const sheetPaper = () => document.querySelector(".MuiDrawer-paperAnchorBottom");
const dialogPaper = () => document.querySelector(".MuiDialog-paper");

// ---- emitted CSS, split by where it applies -----------------------------------------------------
const MEDIA_BLOCK = /@media ([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g;
const PHONE_QUERY = "(max-width:599.95px)";
/**
 * The CSS emotion emitted for one element: `phone` is what sits inside the max-width:599.95px
 * block; `unscoped` is every rule a desktop browser can match, including the `(min-width:0px)`
 * block MUI emits for the xs half of a responsive value.
 */
function cssOf(el: Element): { phone: string; unscoped: string } {
  const sheets = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-") || c.startsWith("mui-"));
  const pick = (text: string) =>
    classes
      .flatMap((c) => text.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`)))
      .join("\n");
  let phone = "";
  for (const m of sheets.matchAll(MEDIA_BLOCK)) if (m[1].trim() === PHONE_QUERY) phone += `\n${m[2]}`;
  const unscoped = sheets.replace(MEDIA_BLOCK, (block, q: string) => (q.trim() === PHONE_QUERY ? "" : block));
  return { phone: pick(phone), unscoped: pick(unscoped) };
}

// ---- fixtures -----------------------------------------------------------------------------------
const student = (id: number, name: string, extra: Record<string, unknown> = {}) =>
  ({
    id,
    user_id: id + 1000,
    name,
    email: `${name.toLowerCase().replace(/\s/g, ".")}@example.com`,
    is_active: true,
    enrollment_count: 2,
    most_active_course: "Python Basics",
    has_saved_resume: false,
    cohorts: [{ id: 1, name: "Batch 28" }],
    live_attendance: { percent: 75 },
    total_marks: 0,
    current_streak: 0,
    ...extra,
  }) as never;
const students = [student(7, "Asha Rao"), student(8, "Omar Khan", { is_active: false })];
const stats = {
  1007: { student_id: 1007, completion_percentage: 42, attendance_percentage: 0, total_attendance_activities: 0 },
} as never;

function renderTable(over: Record<string, unknown> = {}) {
  const props = {
    students,
    completionStats: stats,
    loading: false,
    loadingStats: false,
    sortBy: "name" as const,
    sortOrder: "asc" as const,
    onSort: vi.fn(),
    selectable: true,
    selectedIds: new Set<number>(),
    onToggleSelect: vi.fn(),
    onToggleSelectAll: vi.fn(),
    onDelete: vi.fn(),
    ...over,
  };
  render(<StudentsTable {...props} />);
  return props;
}

// ================================================================================================

describe("the student directory", () => {
  it("is one card per student on a phone, not a 920px table", () => {
    viewport(PHONE);
    renderTable();
    expect(screen.getAllByTestId("student-card")).toHaveLength(2);
    expect(document.querySelector("table")).toBeNull();
    // What an admin decides on is on the card.
    const card = screen.getAllByTestId("student-card")[0];
    expect(within(card).getByText("Asha Rao")).toBeTruthy();
    expect(within(card).getByText("asha.rao@example.com")).toBeTruthy();
    expect(within(card).getByText("42%")).toBeTruthy();
    expect(within(card).getByText("75%")).toBeTruthy();
    expect(within(card).getByText("Batch 28")).toBeTruthy();
    expect(within(screen.getAllByTestId("student-card")[1]).getByText("adminManageStudents.inactive")).toBeTruthy();
  });

  it("is still the table on a desktop, with no cards", () => {
    viewport(DESKTOP);
    renderTable();
    expect(document.querySelector("table")).toBeTruthy();
    expect(screen.queryAllByTestId("student-card")).toHaveLength(0);
    // The row actions are the original three icon buttons.
    expect(screen.getAllByRole("button", { name: "Delete student" })).toHaveLength(2);
  });

  it("keeps every row action on a phone, behind one menu", () => {
    viewport(PHONE);
    const props = renderTable();
    fireEvent.click(screen.getByRole("button", { name: "Actions for Omar Khan" }));
    const menu = screen.getByRole("menu");
    fireEvent.click(within(menu).getByRole("menuitem", { name: /profile.tabProfile/ }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/profile/8");

    fireEvent.click(screen.getByRole("button", { name: "Actions for Omar Khan" }));
    fireEvent.click(within(screen.getByRole("menu")).getByRole("menuitem", { name: /Delete student/ }));
    expect(props.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 8 }));
  });

  it("opens the student from the card's title", () => {
    viewport(PHONE);
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "manageStudents.courseManagement: Asha Rao" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/manage-students/7");
  });

  it("still selects students for the bulk toolbar on a phone", () => {
    viewport(PHONE);
    const props = renderTable();
    const box = screen.getByRole("checkbox", { name: "Select Omar Khan" });
    // On the card, not in a table row two screens to the left.
    expect(box.closest("[data-testid=student-card]")).toBeTruthy();
    fireEvent.click(box);
    expect(props.onToggleSelect).toHaveBeenCalledWith(8);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all students" }));
    expect(props.onToggleSelectAll).toHaveBeenCalled();
  });

  it("turns the click-to-sort headers into sort pills on a phone", () => {
    viewport(PHONE);
    const props = renderTable({ sortBy: "completion_pct" });
    const row = screen.getByRole("group", { name: "Sort by" });
    const pills = within(row).getAllByRole("button");
    expect(pills.map((p) => p.getAttribute("aria-pressed"))).toEqual(["false", "true", "false", "false"]);
    fireEvent.click(pills[2]);
    expect(props.onSort).toHaveBeenCalledWith("attendance_pct");
  });

  it("folds a long batch list into a count a thumb can expand", () => {
    viewport(PHONE);
    const many = Array.from({ length: 9 }, (_, i) => ({ id: i + 1, name: `Batch ${i + 1}` }));
    renderTable({ students: [student(9, "Riya Sen", { cohorts: many })] });
    expect(screen.getByText("Batch 3")).toBeTruthy();
    expect(screen.queryByText("Batch 9")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show all 9 batches" }));
    expect(screen.getByText("Batch 9")).toBeTruthy();
  });
});

describe("search and filters", () => {
  const renderFilters = () => {
    const props = {
      courses: [{ id: 1, title: "Python" }],
      selectedCourses: [] as string[],
      emptySelectionMeansAllCourses: true,
      status: "inactive",
      resumeFilter: "all" as const,
      searchTerm: "",
      onCourseChange: vi.fn(),
      onStatusChange: vi.fn(),
      onResumeFilterChange: vi.fn(),
      onSearchChange: vi.fn(),
    };
    render(<StudentsFilters {...props} />);
    return props;
  };

  it("is a full-width search and one Filters button on a phone, the selects in a sheet", () => {
    viewport(PHONE);
    const props = renderFilters();
    expect(screen.getByTestId("phone-student-filters")).toBeTruthy();
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "asha" } });
    expect(props.onSearchChange).toHaveBeenCalledWith("asha");

    // One filter is set (status), and the button says so.
    fireEvent.click(screen.getByRole("button", { name: "Filters (1)" }));
    expect(sheetPaper()).toBeTruthy();
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(props.onStatusChange).toHaveBeenCalledWith("all");
    expect(props.onCourseChange).not.toHaveBeenCalled();
  });

  it("is the original four-field card on a desktop", () => {
    viewport(DESKTOP);
    renderFilters();
    expect(screen.queryByTestId("phone-student-filters")).toBeNull();
    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    expect(screen.getByText("adminManageStudents.filterSectionTitle")).toBeTruthy();
  });
});

describe("segment presets on a phone", () => {
  it("are one scrolling row of pills, the active one pressed", () => {
    viewport(PHONE);
    const onSegmentChange = vi.fn();
    render(<PhoneStudentSegments segment="inactive" onSegmentChange={onSegmentChange} />);
    const row = screen.getByRole("group", { name: "Segments" });
    const pills = within(row).getAllByRole("button");
    expect(pills.map((p) => p.textContent)).toEqual(["At risk", "Inactive 30d", "Low completion", "High performers"]);
    expect(pills[1]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(pills[0]);
    expect(onSegmentChange).toHaveBeenCalledWith("at_risk");
    // The "how is this calculated" button is kept.
    expect(screen.getByRole("button", { name: "How segments are calculated" })).toBeTruthy();
  });
});

describe("pagination", () => {
  const renderIt = () =>
    render(<StudentsPagination totalPages={19} page={1} totalCount={186} limit={10} onPageChange={vi.fn()} onLimitChange={vi.fn()} />);

  it("drops first/last and fits one line of 44px pages on a phone", () => {
    viewport(PHONE);
    renderIt();
    expect(screen.queryByRole("button", { name: /first page/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /last page/i })).toBeNull();
    const item = screen.getByRole("button", { name: /page 2/i });
    const root = item.closest(".MuiPagination-root") as Element;
    const css = cssOf(root);
    expect(css.phone).toMatch(/min-width:44px/);
    // Never outside the phone block: a desktop pagination keeps its 32px items.
    expect(css.unscoped).not.toMatch(/min-width:44px|height:44px/);
  });

  it("keeps first/last on a desktop", () => {
    viewport(DESKTOP);
    renderIt();
    expect(screen.getByRole("button", { name: /first page/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /last page/i })).toBeTruthy();
  });
});

describe("Add a student", () => {
  const renderIt = () => render(<QuickEnrollStudentDialog open onClose={vi.fn()} />);

  it("comes up from the bottom of a phone", async () => {
    viewport(PHONE);
    renderIt();
    expect(sheetPaper()).toBeTruthy();
    expect(dialogPaper()).toBeNull();
    await screen.findByText("adminManageStudents.quickEnroll.coursesOptionalHint");
  });

  it("is the original dialog on a desktop", async () => {
    viewport(DESKTOP);
    renderIt();
    expect(dialogPaper()).toBeTruthy();
    expect(sheetPaper()).toBeNull();
    expect(document.querySelector(".MuiDialogTitle-root")).toBeTruthy();
    expect(document.querySelector(".MuiDialogActions-root")).toBeTruthy();
    expect(screen.getByRole("button", { name: "close" })).toBeTruthy();
    await screen.findByText("adminManageStudents.quickEnroll.coursesOptionalHint");
  });

  it("cannot be dismissed on a phone while the enrol request is in flight", async () => {
    viewport(PHONE);
    mocks.quickEnroll.mockReturnValue(new Promise(() => {}));
    renderIt();
    await screen.findByText("adminManageStudents.quickEnroll.coursesOptionalHint");
    fireEvent.change(screen.getByLabelText(/nameLabel/), { target: { value: "Asha Rao" } });
    fireEvent.change(screen.getByLabelText(/emailLabel/), { target: { value: "asha@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "adminManageStudents.quickEnroll.enrollAction" }));
    // The confirmation is a sheet too.
    const confirmSheet = await screen.findByRole("heading", { name: "adminManageStudents.quickEnroll.confirmTitle" });
    fireEvent.click(
      within(confirmSheet.closest(".MuiDrawer-paper") as HTMLElement).getByRole("button", {
        name: "adminManageStudents.quickEnroll.enrollAction",
      }),
    );
    await waitFor(() => expect(mocks.quickEnroll).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("button", { name: "Close" })).toBeNull());
    expect(screen.getByRole("button", { name: "adminManageStudents.cancel" })).toBeDisabled();
  });
});

describe("bulk actions on selected students", () => {
  const selected = [student(7, "Asha Rao"), student(8, "Omar Khan")];
  const renderIt = () =>
    render(<BulkActionToolbar selected={selected} courses={[{ id: 1, title: "Python" }]} onClear={vi.fn()} onDone={vi.fn()} />);

  it("is a pinned bar of 44px actions on a phone, and enrols through a sheet", () => {
    viewport(PHONE);
    renderIt();
    const bar = screen.getByTestId("phone-bulk-toolbar");
    expect(within(bar).getByText("2 selected")).toBeTruthy();
    fireEvent.click(within(bar).getByRole("button", { name: /Enroll to course/ }));
    expect(sheetPaper()).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Enroll 2 students/ })).toBeTruthy();
  });

  it("is the original wrapped toolbar and centred dialog on a desktop", () => {
    viewport(DESKTOP);
    renderIt();
    expect(screen.queryByTestId("phone-bulk-toolbar")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Enroll to course/ }));
    expect(dialogPaper()).toBeTruthy();
    expect(sheetPaper()).toBeNull();
    expect(screen.getByRole("dialog", { name: /Enroll 2 students/ })).toBeTruthy();
  });
});

describe("the delete confirmation", () => {
  const props = {
    open: true,
    title: "Delete student permanently?",
    message: "This permanently removes Asha Rao.",
    confirmText: "Delete permanently",
    confirmColor: "error" as const,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("is a sheet on a phone that cannot be dismissed while deleting", () => {
    viewport(PHONE);
    render(<ResponsiveConfirm {...props} busy />);
    expect(sheetPaper()).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.getByRole("button", { name: "Delete permanently" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("is the shared ConfirmDialog on a desktop", () => {
    viewport(DESKTOP);
    render(<ResponsiveConfirm {...props} busy />);
    expect(dialogPaper()).toBeTruthy();
    expect(sheetPaper()).toBeNull();
    // Exactly as before: ConfirmDialog has no busy state, so its buttons stay enabled.
    expect(screen.getByRole("button", { name: "Delete permanently" })).not.toBeDisabled();
  });
});

describe("enrollment job history", () => {
  it("is a list of tappable job cards on a phone, with the result spelled out", async () => {
    viewport(PHONE);
    render(<EnrollmentJobHistory embedded />);
    const cards = await screen.findByTestId("phone-job-cards", {}, { timeout: 3000 });
    expect(document.querySelector("table")).toBeNull();
    // "C 1 / E 2 / S 1" with hover tooltips became words: a tooltip does not exist on touch.
    for (const text of ["1 created", "2 enrolled", "1 skipped", "2 students"]) {
      expect(within(cards).getByText(text)).toBeTruthy();
    }
    const job = within(cards).getByRole("button", { name: /enrollmentJobRowLabel/ });
    expect(job).toHaveAttribute("aria-expanded", "false");
  });

  it("is the original table on a desktop", async () => {
    viewport(DESKTOP);
    render(<EnrollmentJobHistory embedded />);
    await waitFor(() => expect(document.querySelector("table")).toBeTruthy(), { timeout: 3000 });
    expect(screen.queryByTestId("phone-job-cards")).toBeNull();
  });
});

describe("the student's page", () => {
  const assessments = [
    {
      id: 11,
      assessment_title: "Python midterm",
      score: 72,
      status: "submitted",
      offered_scholarship_percentage: null,
      started_at: "2026-09-01T09:00:00Z",
      submitted_at: "2026-09-01T10:00:00Z",
    },
  ] as never[];

  it("shows assessments as cards on a phone", () => {
    viewport(PHONE);
    render(<AssessmentsTab assessments={assessments} />);
    const rows = screen.getByTestId("phone-assessment-rows");
    expect(within(rows).getAllByText("Python midterm").length).toBeGreaterThan(0);
  });

  it("keeps the assessments table on a desktop", () => {
    viewport(DESKTOP);
    render(<AssessmentsTab assessments={assessments} />);
    expect(screen.queryByTestId("phone-assessment-rows")).toBeNull();
    expect(document.querySelector("table")).toBeTruthy();
  });

  it("resets progress through a sheet on a phone and the original dialog on a desktop", async () => {
    viewport(PHONE);
    const { unmount } = render(<ResetProgressCard studentId={7} studentEmail="asha@example.com" studentName="Asha Rao" />);
    fireEvent.click(screen.getByRole("button", { name: /Reset progress…/ }));
    expect(sheetPaper()).toBeTruthy();
    expect(dialogPaper()).toBeNull();
    await screen.findByText(/Nothing/);
    unmount();

    viewport(DESKTOP);
    render(<ResetProgressCard studentId={7} studentEmail="asha@example.com" studentName="Asha Rao" />);
    fireEvent.click(screen.getByRole("button", { name: /Reset progress…/ }));
    expect(dialogPaper()).toBeTruthy();
    expect(sheetPaper()).toBeNull();
    await screen.findByText(/Nothing/);
  });

  it("raises 10.6px labels to 12px on a phone only", () => {
    viewport(PHONE);
    render(<StatPill label="Sessions" value={3} />);
    const label = screen.getByText("Sessions");
    const css = cssOf(label);
    expect(css.phone).toMatch(/font-size:0\.75rem/);
    // The desktop size is untouched and the phone size never leaks into a rule a desktop sees -
    // not even the `(min-width:0px)` half of an `{ xs, sm }` value.
    expect(css.unscoped).toMatch(/font-size:0\.66rem/);
    expect(css.unscoped).not.toMatch(/font-size:0\.75rem/);
  });
});
