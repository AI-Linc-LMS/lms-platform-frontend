import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import type {
  AdminAdaptiveCourseDetail,
  AdminAdaptiveCourseListItem,
  AdminAdaptiveCourseModule,
} from "@/lib/services/admin/admin-adaptive-course.service";
import type { AdminAdaptiveQuiz } from "@/lib/services/admin/admin-adaptive-quiz.service";

/**
 * The adaptive course builder and adaptive quiz admin on a phone.
 *
 * jsdom has no layout, so this pins structure and emitted CSS. Every phone size must sit inside
 * the max-width:599.95px block and nowhere a desktop browser can see it, because the desktop
 * screens are meant to stay exactly as they were.
 */

// ---- viewport ---------------------------------------------------------------------------------
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
// framer-motion's in-view reveal needs an IntersectionObserver, which jsdom does not have.
class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", NoopIntersectionObserver);

afterEach(() => {
  window.matchMedia = realMatchMedia;
  phone = false;
});

// ---- app seams --------------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  push: vi.fn(),
  deleteCourse: vi.fn(),
  enrollStudents: vi.fn(),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => "/admin/adaptive-courses",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  HeaderActionButton: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
vi.mock("@/components/scorecard/shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/scorecard/shared")>()),
  Reveal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: {
      role: "admin",
      email: "admin@x.com",
    },
  }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      key === "adaptiveCoursesAdmin.deleteCourse" ? "Delete " + String(opts?.title) : key,
  }),
}));

const listCourse = {
  id: 5,
  title: "Python Basics",
  description: "",
  is_published: false,
  is_paid: false,
  price: null,
  currency: "INR",
  module_count: 2,
  submodule_count: 6,
  quiz_count: 6,
  article_count: 6,
  coding_count: 0,
} as unknown as AdminAdaptiveCourseListItem;

vi.mock("@/lib/services/admin/admin-adaptive-course.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/admin/admin-adaptive-course.service")>()),
  adminAdaptiveCourseService: {
    listCourses: vi.fn(async () => [listCourse]),
    listJobs: vi.fn(async () => []),
    deleteCourse: mocks.deleteCourse,
    publishCourse: vi.fn(),
    enrollStudents: mocks.enrollStudents,
  },
}));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: vi.fn(async () => ({
      students: [{ id: 7, name: "Sara Ahmed", email: "sara@x.com" }],
      pagination: { total_pages: 1 },
    })),
  },
}));

import AdminAdaptiveCoursesPage from "@/app/admin/adaptive-courses/page";
import { RowDeleteButton, InlineEditableTitle } from "./TreeRowControls";
import { ModuleNavigator } from "./ModuleNavigator";
import { CourseSettingsPanel } from "./CourseSettingsPanel";
import { EnrollAdaptiveStudentsDialog } from "./EnrollAdaptiveStudentsDialog";
import { ManualCourseDialog } from "./ManualCourseDialog";
import { AdminQuizCard } from "@/components/admin/adaptive-quiz/AdminQuizCard";

/** A phone-only declaration: present in the phone block, absent from everything a desktop sees. */
function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

// ---- dialogs ----------------------------------------------------------------------------------
describe("dialogs on a phone", () => {
  it("rise from the bottom as a full-width sheet, and only below 600px", async () => {
    render(<ManualCourseDialog open onClose={vi.fn()} onCreated={vi.fn()} />);
    await screen.findByText("Build a course manually");
    const css = cssByMedia(document.querySelector(".MuiDialog-root")!);
    expect(css.phone).toMatch(/\.MuiDialog-container\{[^}]*align-items:flex-end;\}/);
    expect(css.phone).toMatch(/border-radius:20px 20px 0 0/);
    expect(css.phone).toMatch(/\.MuiDialogActions-root>\.MuiButtonBase-root\{min-height:44px/);
    expect(css.unscoped).not.toMatch(/flex-end|20px 20px 0 0|min-height:44px/);
  });

  it("the course delete confirm is a sheet that stays open while the delete runs", async () => {
    phone = true;
    mocks.deleteCourse.mockImplementation(() => new Promise(() => {}));
    render(<AdminAdaptiveCoursesPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete Python Basics" }));
    const sheet = await screen.findByTestId("confirm-dialog-sheet");
    fireEvent.click(within(sheet).getByRole("button", { name: "Delete" }));
    expect(mocks.deleteCourse).toHaveBeenCalledWith(5);
    await waitFor(() =>
      expect(within(sheet).getByRole("button", { name: "Cancel" })).toHaveProperty("disabled", true),
    );
    fireEvent.click(sheet.querySelector(".MuiBackdrop-root")!);
    expect(screen.getByTestId("confirm-dialog-sheet")).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: "Deleting…" })).toBeTruthy();
  });

  it("enrolling students holds the phone sheet open mid-request", async () => {
    phone = true;
    mocks.enrollStudents.mockImplementation(() => new Promise(() => {}));
    const onClose = vi.fn();
    render(
      <EnrollAdaptiveStudentsDialog open courseId={40} enrolledIds={new Set()} onClose={onClose} onEnrolled={vi.fn()} />,
    );
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));
    await waitFor(() => expect(mocks.enrollStudents).toHaveBeenCalled());
    fireEvent.click(document.querySelector(".MuiBackdrop-root")!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("on a desktop the enrol dialog still closes from its backdrop, as before", async () => {
    mocks.enrollStudents.mockImplementation(() => new Promise(() => {}));
    const onClose = vi.fn();
    render(
      <EnrollAdaptiveStudentsDialog open courseId={40} enrolledIds={new Set()} onClose={onClose} onEnrolled={vi.fn()} />,
    );
    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /enroll selected/i }));
    await waitFor(() => expect(mocks.enrollStudents).toHaveBeenCalled());
    fireEvent.click(document.querySelector(".MuiBackdrop-root")!);
    expect(onClose).toHaveBeenCalled();
  });
});

// ---- course list ------------------------------------------------------------------------------
describe("course list on a phone", () => {
  it("card actions are 44px and the status and price pills reach 12px, on a phone only", async () => {
    render(<AdminAdaptiveCoursesPage />);
    const del = await screen.findByRole("button", { name: "Delete Python Basics" });
    expectPhoneOnly(del, /min-width:44px;min-height:44px/);
    expectPhoneOnly(screen.getByRole("button", { name: "Open" }), /min-height:44px/);
    expectPhoneOnly(screen.getByText("Draft").parentElement!, />span\{font-size:0\.75rem;\}/);
  });
});

// ---- course tree ------------------------------------------------------------------------------
describe("course tree on a phone", () => {
  it("row actions (trash, rename) are 44px on a phone and unchanged above it", () => {
    render(
      <>
        <RowDeleteButton label="Delete this topic" onClick={vi.fn()} />
        <InlineEditableTitle value="Loops" label="Rename this topic" onSave={vi.fn(async () => {})} />
      </>,
    );
    expectPhoneOnly(screen.getByRole("button", { name: "Delete this topic" }), /width:44px;height:44px/);
    expectPhoneOnly(screen.getByRole("button", { name: "Rename this topic" }), /min-height:44px/);
  });

  it("the module index is one sideways row of 44px chips on a phone", () => {
    const modules = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      weekno: i + 1,
      title: "Week " + (i + 1),
      submodules: [],
    })) as unknown as AdminAdaptiveCourseModule[];
    render(<ModuleNavigator modules={modules} page={0} onPageChange={vi.fn()} onJumpToModule={vi.fn()} />);
    expectPhoneOnly(screen.getByTestId("module-index"), /flex-wrap:nowrap;overflow-x:auto/);
    expectPhoneOnly(screen.getByRole("button", { name: /Week 1$/ }), /min-height:44px/);
    expectPhoneOnly(screen.getByRole("button", { name: /Next/ }), /min-height:44px/);
  });
});

// ---- settings tab -----------------------------------------------------------------------------
describe("course settings on a phone", () => {
  it("its buttons are 44px and its small print reaches 12px, on a phone only", () => {
    const course = {
      id: 1,
      title: "Python Basics",
      description: "",
      is_published: false,
      is_paid: false,
      price: null,
      currency: "INR",
      auto_enroll: false,
      self_enroll_enabled: false,
      content_locked: false,
      allow_clipboard: false,
      module_only_structure: false,
      assigned_cohorts: [],
      enrollment_summary: { total: 0, by_source: {} },
    } as unknown as AdminAdaptiveCourseDetail;
    render(
      <CourseSettingsPanel
        course={course}
        tenantName="Demo"
        pendingSetting={null}
        canSetPricing
        onToggleAutoEnroll={vi.fn()}
        onToggleSelfEnroll={vi.fn()}
        onToggleContentLock={vi.fn()}
        onToggleModuleStructure={vi.fn()}
        onToggleClipboard={vi.fn()}
        onOpenPricing={vi.fn()}
        onAssignCohorts={vi.fn()}
        onEditDetails={vi.fn()}
        onPublish={vi.fn()}
      />,
    );
    for (const name of ["Edit title & description", "Publish course", "Assign to a cohort", "Charge for this course"]) {
      expectPhoneOnly(screen.getByRole("button", { name }), /min-height:44px/);
    }
    expectPhoneOnly(screen.getAllByText("Right now")[0], /font-size:0\.75rem/);
  });
});

// ---- adaptive quizzes -------------------------------------------------------------------------
describe("adaptive quiz cards on a phone", () => {
  const quiz = {
    config_id: 3,
    title: "Design Thinking",
    is_active: true,
    target_skills: ["problem_definition", "stakeholder_research", "ideation", "testing"],
    mcq_count: 20,
    min_questions: 10,
    max_questions: 12,
    se_threshold: 0.3,
  } as unknown as AdminAdaptiveQuiz;

  it("the status label and skill chips reach 12px on a phone, and stay as authored above it", () => {
    render(<AdminQuizCard quiz={quiz} onRequestDelete={vi.fn()} />);
    const eyebrow = screen.getByText("Adaptive · Live");
    expectPhoneOnly(eyebrow, /font-size:0\.75rem/);
    expect(cssByMedia(eyebrow).unscoped).toMatch(/font-size:0\.62rem/);
    expectPhoneOnly(screen.getByText("Problem Definition"), /font-size:0\.75rem/);
    expectPhoneOnly(screen.getByText("+1"), /font-size:0\.75rem/);
  });

  it("delete keeps a 44px target on a phone instead of being squeezed by Edit", () => {
    render(<AdminQuizCard quiz={quiz} onRequestDelete={vi.fn()} />);
    expectPhoneOnly(
      screen.getByRole("button", { name: "Delete adaptive quiz" }),
      /min-width:44px;min-height:44px;[^}]*flex-shrink:0;/,
    );
  });
});
