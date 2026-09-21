import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import type { CohortDetail, CohortListItem } from "@/lib/services/admin/admin-cohorts.service";

/**
 * The admin Cohorts screens on a phone.
 *
 * jsdom has no layout, so what is pinned here is structure and emitted CSS: a phone gets bottom
 * sheets (and they cannot be dismissed mid-request), a desktop gets the original centred Dialog,
 * and every phone-only size lives inside the max-width:599.95px block where no desktop sees it.
 */

// ---- viewport ---------------------------------------------------------------------------------
// MUI's useMediaQuery asks matchMedia; the phone query is `(max-width:599.95px)`.
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
  vi.unstubAllGlobals();
});

// ---- app seams --------------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  push: vi.fn(),
  enrollMembers: vi.fn(),
  createCohort: vi.fn(),
  assignArtifact: vi.fn(),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
vi.mock("@/components/admin/manage-students/BulkEnrollmentDialog", () => ({ BulkEnrollmentDialog: () => null }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ cohortId: "11" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/admin/cohorts/11",
}));
vi.mock("@/lib/services/instructor.service", () => ({
  instructorService: {
    listCohortStaff: vi.fn(async () => [
      { profile_id: 5, name: "Asha Rao", email: "asha@x.com", role: "instructor", can_edit_content: false },
    ]),
    listCourseStaff: vi.fn(async () => []),
  },
}));
vi.mock("@/lib/services/admin/admin-instructors.service", () => ({
  adminInstructorsService: {
    listInstructors: vi.fn(async () => [{ id: 9, full_name: "Ben Ito", email: "ben@x.com" }]),
  },
}));

const cohort: CohortListItem = {
  id: 11,
  name: "Data Science Jan",
  code: "DS-JAN",
  status: "active",
  start_date: null,
  end_date: null,
  timezone: "Asia/Kolkata",
  capacity: null,
  waitlist_enabled: false,
  enroll_mode: "invite_only",
  is_template: false,
  member_count: 68,
  artifact_count: 2,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};
const cohortDetail: CohortDetail = {
  ...cohort,
  description: "",
  week_stagger_days: 7,
  week_window_days: 10,
  content_locked: false,
  cloned_from: null,
  artifacts: [],
  staff: [],
};
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: {
    listCohorts: vi.fn(async () => [cohort]),
    listMembers: vi.fn(async () => ({ results: [], count: 0 })),
    listArtifacts: vi.fn(async () => []),
    getCohort: vi.fn(async () => cohortDetail),
    enrollMembers: mocks.enrollMembers,
    createCohort: mocks.createCohort,
    updateCohort: vi.fn(),
    deleteCohort: vi.fn(),
    assignArtifact: mocks.assignArtifact,
    removeArtifact: vi.fn(),
  },
  PAID_COURSE_NEEDS_GRANT: "paid_course_needs_grant",
}));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: vi.fn(async () => ({ students: [{ id: 7, name: "Sara", email: "sara@x.com" }] })),
  },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: vi.fn(async () => [{ id: 21, title: "Python Basics" }]) },
}));
vi.mock("@/lib/services/admin/admin-assessment.service", () => ({
  getAssessments: vi.fn(async () => [{ id: 3, title: "Week 1 quiz" }]),
}));

import AdminCohortsPage from "@/app/admin/cohorts/page";
import { CohortCard } from "./CohortCard";
import { EnrollCohortStudentsDialog } from "./EnrollCohortStudentsDialog";
import { CohortAssignmentsTab } from "./CohortAssignmentsTab";
import { CohortConfirm } from "./cohortPhone";
import { CohortRosterTab } from "./CohortRosterTab";
import { CohortCourseMatrix } from "./CohortCourseMatrix";
import AdminCohortDetailPage from "@/app/admin/cohorts/[cohortId]/page";
import { InstructorAssignPanel } from "@/components/instructor/InstructorAssignPanel";

/** A sheet mid-request: its backdrop, Cancel and close button must all leave it open. */
async function expectSheetHeldOpen(sheet: HTMLElement, onClose: ReturnType<typeof vi.fn>) {
  await waitFor(() => expect(within(sheet).getByRole("button", { name: "Cancel" })).toHaveProperty("disabled", true));
  expect(within(sheet).queryByRole("button", { name: "Close" })).toBeNull();
  const backdrop = sheet.querySelector(".MuiBackdrop-root");
  expect(backdrop).toBeTruthy();
  fireEvent.click(backdrop!);
  expect(onClose).not.toHaveBeenCalled();
}

/** Every declaration a desktop browser can see must be free of the phone-only sizes. */
function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

// ---- dialogs ----------------------------------------------------------------------------------
describe("New cohort", () => {
  it("is a bottom sheet on a phone", async () => {
    phone = true;
    render(<AdminCohortsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "New cohort" }));
    const sheet = await screen.findByTestId("create-cohort-sheet");
    expect(sheet.querySelector(".MuiDrawer-paperAnchorBottom")).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: "Create cohort" })).toBeTruthy();
  });

  it("cannot be dismissed on a phone while the cohort is being created", async () => {
    phone = true;
    mocks.createCohort.mockImplementation(() => new Promise(() => {}));
    render(<AdminCohortsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "New cohort" }));
    const sheet = await screen.findByTestId("create-cohort-sheet");
    fireEvent.change(within(sheet).getByLabelText("Name"), { target: { value: "Batch 9" } });
    fireEvent.click(within(sheet).getByRole("button", { name: "Create cohort" }));
    expect(mocks.createCohort).toHaveBeenCalled();
    // The page owns this sheet's onClose (it flips createOpen), so "held open" is the sheet
    // still being in the document after the backdrop click.
    await waitFor(() => expect(within(sheet).getByRole("button", { name: "Cancel" })).toHaveProperty("disabled", true));
    expect(within(sheet).queryByRole("button", { name: "Close" })).toBeNull();
    fireEvent.click(sheet.querySelector(".MuiBackdrop-root")!);
    expect(screen.getByTestId("create-cohort-sheet")).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: "Creating…" })).toBeTruthy();
  });

  it("is the original centred Dialog on a desktop", async () => {
    render(<AdminCohortsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "New cohort" }));
    const dialog = await screen.findByRole("dialog");
    expect(screen.queryByTestId("create-cohort-sheet")).toBeNull();
    expect(dialog.closest(".MuiDialog-root")).toBeTruthy();
    expect(within(dialog).getByText("New cohort").closest(".MuiDialogTitle-root")).toBeTruthy();
  });
});

describe("Enroll students", () => {
  const props = { open: true, cohortId: 11, enrolledIds: new Set<number>(), onClose: vi.fn(), onEnrolled: vi.fn() };

  it("is a sheet on a phone that cannot be dismissed while the request is in flight", async () => {
    phone = true;
    mocks.enrollMembers.mockImplementation(() => new Promise(() => {}));
    const onClose = vi.fn();
    render(<EnrollCohortStudentsDialog {...props} onClose={onClose} />);
    const sheet = await screen.findByTestId("enroll-students-sheet");
    fireEvent.click(await within(sheet).findByText("Sara"));
    fireEvent.click(within(sheet).getByRole("button", { name: /^enroll 1/i }));
    await expectSheetHeldOpen(sheet, onClose);
  });

  it("keeps the desktop Dialog, with its own scrolling list", async () => {
    render(<EnrollCohortStudentsDialog {...props} />);
    const dialog = await screen.findByRole("dialog");
    expect(screen.queryByTestId("enroll-students-sheet")).toBeNull();
    expect(dialog.querySelector(".MuiDialogActions-root")).toBeTruthy();
  });
});

describe("Add assignment", () => {
  it("opens a sheet on a phone and the original Dialog on a desktop", async () => {
    phone = true;
    const { unmount } = render(<CohortAssignmentsTab cohortId={11} artifacts={[]} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /add assignment/i }));
    expect(await screen.findByTestId("assign-artifact-sheet")).toBeTruthy();
    unmount();

    phone = false;
    render(<CohortAssignmentsTab cohortId={11} artifacts={[]} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /add assignment/i }));
    const dialog = await screen.findByRole("dialog");
    expect(screen.queryByTestId("assign-artifact-sheet")).toBeNull();
    expect(dialog.querySelector(".MuiDialogTitle-root")?.textContent).toContain("Give this batch something");
  });

  it("cannot be dismissed on a phone while the assignment is being written", async () => {
    phone = true;
    mocks.assignArtifact.mockImplementation(() => new Promise(() => {}));
    render(<CohortAssignmentsTab cohortId={11} artifacts={[]} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /add assignment/i }));
    const sheet = await screen.findByTestId("assign-artifact-sheet");
    // Pick a target so submit gets past its "Pick a target" guard.
    const picker = await within(sheet).findByRole("combobox", { name: /which one/i });
    await waitFor(() => expect(picker.getAttribute("aria-disabled")).not.toBe("true"));
    fireEvent.mouseDown(picker);
    fireEvent.click(await screen.findByRole("option", { name: "Week 1 quiz" }));
    fireEvent.click(within(sheet).getByRole("button", { name: "Assign" }));
    expect(mocks.assignArtifact).toHaveBeenCalled();
    await waitFor(() => expect(within(sheet).getByRole("button", { name: "Cancel" })).toHaveProperty("disabled", true));
    expect(within(sheet).queryByRole("button", { name: "Close" })).toBeNull();
    fireEvent.click(sheet.querySelector(".MuiBackdrop-root")!);
    expect(screen.getByTestId("assign-artifact-sheet")).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: "Assigning…" })).toBeTruthy();
  });
});

describe("Archive / delete confirm", () => {
  it("opens as a sheet from the cohorts page on a phone", async () => {
    phone = true;
    render(<AdminCohortsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete cohort" }));
    const sheet = await screen.findByTestId("cohort-confirm-sheet");
    expect(within(sheet).getByRole("heading", { name: "Delete cohort?" })).toBeTruthy();
  });

  it("is a sheet on a phone whose buttons are inert while busy", () => {
    phone = true;
    const onCancel = vi.fn();
    render(
      <CohortConfirm open title="Delete cohort?" message="Gone." confirmText="Deleting…" busy onConfirm={vi.fn()} onCancel={onCancel} />,
    );
    const sheet = screen.getByTestId("cohort-confirm-sheet");
    expect(within(sheet).getByRole("button", { name: "Cancel" })).toHaveProperty("disabled", true);
    expect(within(sheet).getByRole("button", { name: "Deleting…" })).toHaveProperty("disabled", true);
  });

  it("is the shared ConfirmDialog on a desktop", () => {
    render(<CohortConfirm open title="Delete cohort?" message="Gone." confirmText="Delete" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByTestId("cohort-confirm-sheet")).toBeNull();
    expect(screen.getByRole("dialog").querySelector(".MuiDialogTitle-root")?.textContent).toBe("Delete cohort?");
  });
});

// ---- phone-only CSS ---------------------------------------------------------------------------
describe("phone sizes stay on the phone", () => {
  it("cohort card actions are 44px on a phone and untouched elsewhere", () => {
    render(<CohortCard cohort={cohort} onOpen={vi.fn()} onArchive={vi.fn()} onDelete={vi.fn()} />);
    expectPhoneOnly(screen.getByRole("button", { name: "Archive cohort" }), /width:44px/);
    expectPhoneOnly(screen.getByRole("button", { name: "Delete cohort" }), /height:44px/);
    expectPhoneOnly(screen.getByRole("button", { name: "Open" }), /min-height:44px/);
    // The 0.68rem stat labels come up to 12px on a phone only.
    expectPhoneOnly(screen.getByText("Members"), /font-size:0\.75rem/);
  });

  it("the list row shows member counts on a phone only", async () => {
    render(<AdminCohortsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "List view" }));
    const line = await screen.findByTestId("cohort-row-phone-stats");
    expect(line.textContent).toContain("68 members");
    const css = cssByMedia(line);
    expect(css.unscoped).toMatch(/display:none/);
    expect(css.phone).toMatch(/display:block/);
  });

  it("the status tabs are 44px tall on a phone only", async () => {
    render(<AdminCohortsPage />);
    const tabs = await screen.findByRole("tab", { name: /Active/ });
    const wrapper = tabs.closest("[data-tour-id=cohorts-tabs]")!;
    expectPhoneOnly(wrapper, /\[role=tab\]\{min-height:44px/);
  });

  it("the roster search takes the full row and its actions are 44px, on a phone only", async () => {
    render(<CohortRosterTab cohortId={11} cohortName="Data Science Jan" onChanged={vi.fn()} />);
    const toolbar = await screen.findByTestId("roster-toolbar");
    expectPhoneOnly(toolbar, /MuiTextField-root\{min-width:0;[^}]*flex-basis:100%/);
    expectPhoneOnly(toolbar, /MuiButton-root\{[^}]*min-height:44px/);
  });

  it("the course matrix pins a 132px cohort column on a phone only", async () => {
    render(<CohortCourseMatrix />);
    const header = await screen.findByRole("columnheader", { name: "Cohort" });
    expectPhoneOnly(header, /min-width:132px/);
    // Desktop keeps its 220px pinned column.
    expect(cssByMedia(header).unscoped).toMatch(/min-width:220px/);
  });

  it("the cohort hero chips wrap and reach 12px on a phone only", async () => {
    // The hero's entrance animation (framer-motion whileInView) needs an observer jsdom lacks.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    );
    render(<AdminCohortDetailPage />);
    const chips = await screen.findByTestId("cohort-hero-chips");
    expectPhoneOnly(chips, /flex-wrap:wrap/);
    expectPhoneOnly(chips, /font-size:0\.75rem/);
  });
});

// InstructorAssignPanel is shared with the adaptive course page, so its phone rules are pinned
// here too: none of them may reach that page's desktop layout.
describe("InstructorAssignPanel on a phone", () => {
  it("lets the picker shrink beside Assign, on a phone only", async () => {
    render(<InstructorAssignPanel scope="cohort" id={11} />);
    const row = await screen.findByTestId("instructor-add-row");
    expectPhoneOnly(row, /MuiInputBase-root\{min-width:0/);
    expectPhoneOnly(row, /MuiButton-root\{min-height:44px/);
  });

  it("makes Unassign a 44px target on a phone only", async () => {
    render(<InstructorAssignPanel scope="cohort" id={11} />);
    const unassign = await screen.findByRole("button", { name: "Unassign Asha Rao" });
    expectPhoneOnly(unassign, /width:44px/);
    expect(cssByMedia(unassign).unscoped).toMatch(/width:26px/);
  });

  it("drops Stack's margin on a wrapped header line, on a phone only", async () => {
    render(<InstructorAssignPanel scope="cohort" id={11} />);
    const title = await screen.findByText("Instructors");
    const header = title.parentElement!;
    expectPhoneOnly(header, /flex-wrap:wrap/);
    expectPhoneOnly(header, /:not\(style\)~:not\(style\)\{margin-left:0/);
  });
});
