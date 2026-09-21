import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

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
});

// ---- app seams --------------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  push: vi.fn(),
  enrollMembers: vi.fn(),
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
vi.mock("@/components/admin/cohorts/CohortCourseMatrix", () => ({ CohortCourseMatrix: () => <div /> }));
vi.mock("@/components/admin/manage-students/BulkEnrollmentDialog", () => ({ BulkEnrollmentDialog: () => null }));

const cohort = {
  id: 11,
  name: "Data Science Jan",
  code: "DS-JAN",
  status: "active" as const,
  start_date: null,
  end_date: null,
  member_count: 68,
  artifact_count: 2,
};
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: {
    listCohorts: vi.fn(async () => [cohort]),
    listMembers: vi.fn(async () => ({ results: [], count: 0 })),
    enrollMembers: mocks.enrollMembers,
    createCohort: vi.fn(),
    updateCohort: vi.fn(),
    deleteCohort: vi.fn(),
    assignArtifact: vi.fn(),
    removeArtifact: vi.fn(),
  },
}));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: vi.fn(async () => ({ students: [{ id: 7, name: "Sara", email: "sara@x.com" }] })),
  },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: vi.fn(async () => []) },
}));
vi.mock("@/lib/services/admin/admin-assessment.service", () => ({ getAssessments: vi.fn(async () => []) }));

import AdminCohortsPage from "@/app/admin/cohorts/page";
import { CohortCard } from "./CohortCard";
import { EnrollCohortStudentsDialog } from "./EnrollCohortStudentsDialog";
import { CohortAssignmentsTab } from "./CohortAssignmentsTab";
import { CohortConfirm } from "./cohortPhone";
import { CohortRosterTab } from "./CohortRosterTab";

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
    await waitFor(() => expect(within(sheet).getByRole("button", { name: "Cancel" })).toHaveProperty("disabled", true));
    expect(within(sheet).queryByRole("button", { name: "Close" })).toBeNull();
    // The backdrop is the other way out of a sheet; it must be inert too.
    const backdrop = sheet.querySelector(".MuiBackdrop-root");
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();
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
});

describe("Archive / delete confirm", () => {
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
});
