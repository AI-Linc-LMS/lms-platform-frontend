import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

/**
 * The instructor portal on a phone.
 *
 * A phone gets bottom sheets that cannot be dismissed mid-request, cards instead of tables, and
 * 44px targets; a desktop gets the original Dialogs, drawer and table. Every phone-only size is
 * emitted inside the max-width:599.95px block and nowhere a desktop browser can see it.
 */

let phone = false;
const realMatchMedia = window.matchMedia;
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: phone && /max-width:\s*599\.95px/.test(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  phone = false;
  vi.clearAllMocks();
});

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  push: vi.fn(),
  resolve: vi.fn(),
  listInstructor: vi.fn(),
  getStudents: vi.fn(),
  getDashboard: vi.fn(),
  getStudent: vi.fn(),
  messageCohort: vi.fn(),
  getSubmissions: vi.fn(),
}));

vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push: mocks.push, prefetch: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: "462" }),
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ user: { id: 5, email: "teacher@x.com" } }),
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/scorecard/shared", () => ({
  Reveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: ({ title, action }: { title: string; action?: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {action}
    </header>
  ),
  HeaderActionButton: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
vi.mock("@/lib/services/ticket.service", () => ({
  TICKET_CATEGORY_OPTIONS: [{ value: "content", label: "Content" }],
  INSTRUCTOR_TICKET_CATEGORIES: ["content"],
  ticketService: { listInstructor: mocks.listInstructor, resolve: mocks.resolve },
}));
vi.mock("@/lib/services/instructor.service", () => ({
  instructorService: {
    getStudents: mocks.getStudents,
    getDashboard: mocks.getDashboard,
    getStudent: mocks.getStudent,
    messageCohort: mocks.messageCohort,
    nudgeStudent: vi.fn(),
    getAssessmentSubmissions: mocks.getSubmissions,
  },
}));
vi.mock("@/lib/services/admin/admin-assessment.service", () => ({
  getQuestionsExportJson: vi.fn(async () => ({ assessment: { title: "Paper" }, sections: [] })),
  getSubmissionsExportJson: vi.fn(),
  isCodingQuestion: () => false,
  isMCQQuestion: () => false,
  isSubjectiveQuestion: () => false,
}));
vi.mock("@/lib/utils/assessment-result-pdf.utils", () => ({ generateAssessmentResultPdfVector: vi.fn() }));
vi.mock("@/lib/utils/assessment-pdf-assets", () => ({ preloadPdfBrandAssets: vi.fn() }));
vi.mock("@/lib/utils/admin-submission-export-to-assessment-result.utils", () => ({
  mapSubmissionsExportRowToAssessmentResult: vi.fn(),
  safeAssessmentPdfFileName: vi.fn(),
}));

import { InstructorDialog } from "./InstructorDialog";
import { StudentDetailDrawer } from "./StudentDetailDrawer";
import InstructorTicketsPage from "@/app/instructor/tickets/page";
import InstructorStudentsPage from "@/app/instructor/students/page";
import InstructorAssessmentDetailPage from "@/app/instructor/assessments/[id]/page";

function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

const sheet = () => document.querySelector(".MuiDrawer-paperAnchorBottom") as HTMLElement | null;

/* ------------------------------ InstructorDialog ------------------------------ */

describe("InstructorDialog", () => {
  const renderDialog = (busy: boolean, onClose = vi.fn()) =>
    render(
      <InstructorDialog
        open
        onClose={onClose}
        busy={busy}
        title="Message a cohort"
        titleSx={{ fontWeight: 800 }}
        actionsSx={{ px: 3, pb: 2 }}
        actions={<button>Send</button>}
      >
        <p>body</p>
      </InstructorDialog>,
    );

  it("is a bottom sheet on a phone, with a close button while idle", () => {
    phone = true;
    const onClose = vi.fn();
    renderDialog(false, onClose);
    expect(sheet()).toBeTruthy();
    fireEvent.click(within(sheet()!).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cannot be closed on a phone while its request runs", () => {
    phone = true;
    const onClose = vi.fn();
    renderDialog(true, onClose);
    expect(within(sheet()!).queryByRole("button", { name: "Close" })).toBeNull();
    fireEvent.keyDown(sheet()!, { key: "Escape" });
    fireEvent.click(document.querySelector(".MuiBackdrop-root")!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("is the original centred Dialog on a desktop", () => {
    renderDialog(false);
    expect(sheet()).toBeNull();
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".MuiDialogTitle-root")?.textContent).toBe("Message a cohort");
    expect(dialog.querySelector(".MuiDialogActions-root")).toBeTruthy();
  });
});

/* -------------------------------- tickets page -------------------------------- */

const TICKET = {
  id: 7,
  subject: "Video 3 will not play",
  status: "OPEN",
  status_display: "Open",
  category_display: "Video",
  cohort_name: "Batch A",
  raised_by: { full_name: "Asha" },
  assigned_to_user: { id: 5, user_id: 5, email: "teacher@x.com", full_name: "Teacher" },
  assigned_by_user: null,
  admin_resolution_notes: "",
};

describe("cohort tickets", () => {
  it("filter chips and Resolve are 44px on a phone only", async () => {
    mocks.listInstructor.mockResolvedValue([TICKET]);
    render(<InstructorTicketsPage />);
    await screen.findByText("Video 3 will not play");
    const all = screen.getByText("All").closest(".MuiChip-root")!;
    expectPhoneOnly(all, /height:44px/);
    expectPhoneOnly(screen.getByText("All categories").closest(".MuiChip-root")!, /height:44px/);
    expectPhoneOnly(screen.getByText("Resolve").closest(".MuiChip-root")!, /height:44px/);
  });

  it("the status pill is 12px on a phone and keeps its authored size on a desktop", async () => {
    mocks.listInstructor.mockResolvedValue([TICKET]);
    render(<InstructorTicketsPage />);
    const pill = await screen.findByText("Open", { selector: "div" });
    const css = cssByMedia(pill);
    expect(css.phone).toMatch(/font-size:0\.75rem/);
    expect(css.unscoped).toMatch(/font-size:0\.68rem/);
    expect(css.unscoped).not.toMatch(/font-size:0\.75rem/);
  });

  it("resolve is a bottom sheet on a phone that stays open while the request runs", async () => {
    phone = true;
    mocks.listInstructor.mockResolvedValue([TICKET]);
    mocks.resolve.mockImplementation(() => new Promise(() => {}));
    render(<InstructorTicketsPage />);
    fireEvent.click(await screen.findByText("Resolve"));
    const paper = await waitFor(() => {
      expect(sheet()).toBeTruthy();
      return sheet()!;
    });
    fireEvent.change(within(paper).getByRole("textbox"), { target: { value: "Re-uploaded the file." } });
    fireEvent.click(within(paper).getByRole("button", { name: /Resolve & notify/ }));
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledTimes(1));
    expect(within(paper).queryByRole("button", { name: "Close" })).toBeNull();
    fireEvent.keyDown(paper, { key: "Escape" });
    expect(sheet()).toBeTruthy();
  });

  it("resolve is the original Dialog on a desktop", async () => {
    mocks.listInstructor.mockResolvedValue([TICKET]);
    render(<InstructorTicketsPage />);
    fireEvent.click(await screen.findByText("Resolve"));
    const dialog = await screen.findByRole("dialog");
    expect(sheet()).toBeNull();
    expect(dialog.querySelector(".MuiDialogTitle-root")?.textContent).toBe("Resolve ticket · Video 3 will not play");
  });
});

/* -------------------------------- students page ------------------------------- */

const STUDENT = {
  student_id: 11,
  name: "Ravi Kumar",
  email: "ravi@x.com",
  phone: "",
  progress: 42,
  avg_score: 67,
  points: 120,
  last_active: null,
  cohort: "Batch A",
  status: "watch",
};

function seedStudents() {
  mocks.getStudents.mockResolvedValue({
    count: 1,
    page: 1,
    page_size: 25,
    results: [STUDENT],
    summary: { count: 1, avg_progress: 42, avg_score: 67, at_risk: 0 },
  });
  mocks.getDashboard.mockResolvedValue({
    cohorts_detailed: [
      { id: 1, name: "Batch A", student_count: 12 },
      { id: 2, name: "Batch B", student_count: 9 },
    ],
  });
}

describe("student reports", () => {
  it("a row carries status, progress, score and points under the name on a phone", async () => {
    phone = true;
    seedStudents();
    render(<InstructorStudentsPage />);
    const meta = await screen.findByTestId("student-phone-meta", {}, { timeout: 5000 });
    expect(within(meta).getByText("Watch")).toBeTruthy();
    expect(within(meta).getByText("42%")).toBeTruthy();
    expect(within(meta).getByText("67%")).toBeTruthy();
    expect(within(meta).getByText("120")).toBeTruthy();
  });

  it("the cohort filter is one sideways row on a phone and the original wrap on a desktop", async () => {
    phone = true;
    seedStudents();
    const { unmount } = render(<InstructorStudentsPage />);
    const group = await screen.findByRole("group", { name: "Cohorts" });
    expect(within(group).getByText("Batch B")).toBeTruthy();
    unmount();

    phone = false;
    seedStudents();
    render(<InstructorStudentsPage />);
    await screen.findByText("Batch B", {}, { timeout: 5000 });
    expect(screen.queryByRole("group", { name: "Cohorts" })).toBeNull();
    expect(screen.queryByTestId("student-phone-meta")).toBeNull();
  });

  it("status tabs and cohort chips are 44px on a phone only", async () => {
    seedStudents();
    render(<InstructorStudentsPage />);
    await screen.findByText("Batch B", {}, { timeout: 5000 });
    expectPhoneOnly(screen.getByText("On track"), /min-height:44px/);
    expectPhoneOnly(screen.getByText("Batch B").closest(".MuiChip-root")!, /height:44px/);
  });

  it("Message cohort is a bottom sheet on a phone that stays open while it sends", async () => {
    phone = true;
    seedStudents();
    mocks.messageCohort.mockImplementation(() => new Promise(() => {}));
    render(<InstructorStudentsPage />);
    await screen.findByTestId("student-phone-meta", {}, { timeout: 5000 });
    fireEvent.click(screen.getByRole("button", { name: "Message cohort" }));
    const paper = await waitFor(() => {
      expect(sheet()).toBeTruthy();
      return sheet()!;
    });
    expect(within(paper).getByText("Message a cohort")).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: /Message a cohort/ })).toBeNull();
  });

  it("Message cohort is the original Dialog on a desktop", async () => {
    seedStudents();
    render(<InstructorStudentsPage />);
    await screen.findByText("Batch B", {}, { timeout: 5000 });
    fireEvent.click(screen.getByRole("button", { name: "Message cohort" }));
    const dialog = await screen.findByRole("dialog");
    expect(sheet()).toBeNull();
    expect(dialog.querySelector(".MuiDialogTitle-root")?.textContent).toBe("Message a cohort");
  });
});

/* ---------------------------- student detail drawer --------------------------- */

describe("student detail", () => {
  const DETAIL = { name: "Ravi Kumar", email: "ravi@x.com", phone: "", courses: [], cohorts: [] };

  it("is a bottom sheet with a close button on a phone", async () => {
    phone = true;
    mocks.getStudent.mockResolvedValue(DETAIL);
    const onClose = vi.fn();
    render(<StudentDetailDrawer studentId={11} open onClose={onClose} />);
    await screen.findByText("Ravi Kumar");
    expect(sheet()).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-paperAnchorRight")).toBeNull();
    fireEvent.click(within(sheet()!).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is the original right-hand drawer on a desktop", async () => {
    mocks.getStudent.mockResolvedValue(DETAIL);
    render(<StudentDetailDrawer studentId={11} open onClose={vi.fn()} />);
    await screen.findByText("Ravi Kumar");
    expect(document.querySelector(".MuiDrawer-paperAnchorRight")).toBeTruthy();
    expect(sheet()).toBeNull();
  });
});

/* ---------------------------- gradebook submissions --------------------------- */

describe("gradebook submissions", () => {
  const ROW = {
    submission_id: 91,
    student_id: 11,
    name: "Ravi Kumar",
    email: "ravi@x.com",
    score: 14,
    max_marks: 20,
    status: "submitted",
    review_status: "evaluated",
    started_at: null,
    submitted_at: "2026-09-20T10:00:00Z",
  };

  it("is one card per submission on a phone, with a 44px download button", async () => {
    phone = true;
    mocks.getSubmissions.mockResolvedValue({ results: [ROW], pending_grading: 0 });
    render(<InstructorAssessmentDetailPage />);
    const card = await screen.findByTestId("submission-card");
    expect(screen.queryByRole("table")).toBeNull();
    expect(within(card).getByText("Ravi Kumar")).toBeTruthy();
    expect(within(card).getByRole("button", { name: /Download report/ })).toBeTruthy();
  });

  it("is the original table on a desktop", async () => {
    mocks.getSubmissions.mockResolvedValue({ results: [ROW], pending_grading: 0 });
    render(<InstructorAssessmentDetailPage />);
    await screen.findByText("Ravi Kumar");
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.queryByTestId("submission-card")).toBeNull();
  });

  it("the Gradebook back button and the tabs are 44px on a phone only", async () => {
    mocks.getSubmissions.mockResolvedValue({ results: [ROW], pending_grading: 0 });
    render(<InstructorAssessmentDetailPage />);
    await screen.findByText("Ravi Kumar");
    expectPhoneOnly(screen.getByRole("button", { name: /Gradebook/ }), /min-height:44px/);
    expectPhoneOnly(screen.getByRole("tablist").closest(".MuiTabs-root")!, /min-height:44px/);
  });
});
