import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

/**
 * /admin/instructors (and /admin/pending-instructors, which redirects to it) on a phone.
 *
 * A phone gets one card per instructor and bottom sheets that cannot be dismissed mid-request;
 * a desktop gets the original table and centred Dialogs. Every phone-only size lives inside the
 * max-width:599.95px block.
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
});

// react-i18next without an instance returns the key; pin that so assertions are stable. `t` must
// be one stable function, as the real hook's is: the page's loaders list it as a dependency.
vi.mock("react-i18next", () => {
  const t = (key: string) => key;
  const value = { t, i18n: { language: "en" } };
  return { useTranslation: () => value };
});

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  approve: vi.fn(),
  createInstructor: vi.fn(),
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
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
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useIsCourseEnabled: () => false }));
vi.mock("@/lib/services/instructor.service", () => ({
  instructorService: { getInstructorDirectory: vi.fn(async () => []), setInstructorCode: vi.fn() },
}));
vi.mock("@/lib/services/admin/admin-course-builder.service", () => ({
  adminCourseBuilderService: { getCourses: vi.fn(async () => []) },
}));
vi.mock("@/lib/services/admin/admin-courses.service", () => ({
  adminCoursesService: { getCourses: vi.fn(async () => []) },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: vi.fn(async () => []) },
}));
vi.mock("@/lib/services/admin/admin-instructors.service", () => ({
  adminInstructorsService: {
    listInstructors: vi.fn(async (status: string) =>
      status === "pending"
        ? [
            {
              id: 4,
              full_name: "Kishore Pedapenki",
              email: "kishore@x.com",
              phone_number: "+91 98300",
              created_at: "2026-09-18T00:00:00Z",
              instructor_cv_url: null,
            },
          ]
        : [],
    ),
    approveInstructor: mocks.approve,
    rejectInstructor: vi.fn(),
    reopenInstructor: vi.fn(),
    assignCoursesToInstructor: vi.fn(),
    removeInstructor: vi.fn(),
    createInstructor: mocks.createInstructor,
  },
}));

import InstructorsPage from "@/app/admin/instructors/page";
import { AddInstructorDialog } from "./AddInstructorDialog";

function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

describe("instructor list", () => {
  it("is one card per instructor on a phone, with full-width actions", async () => {
    phone = true;
    render(<InstructorsPage />);
    const card = await screen.findByTestId("instructor-card");
    expect(screen.queryByRole("table")).toBeNull();
    expect(within(card).getByText("Kishore Pedapenki")).toBeTruthy();
    expect(within(card).getByText("+91 98300")).toBeTruthy();
    // Approve and Reject are on the card, not past the right edge of a scrolling table.
    const approve = within(card).getByRole("button", { name: /adminInstructors\.actions\.approve/ });
    expect(cssByMedia(approve).unscoped).toMatch(/min-height:44px/);
    expect(within(card).getByRole("button", { name: /adminInstructors\.actions\.reject/ })).toBeTruthy();
  });

  it("is the original table on a desktop", async () => {
    render(<InstructorsPage />);
    expect(await screen.findByText("Kishore Pedapenki")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.queryByTestId("instructor-card")).toBeNull();
  });
});

describe("approve", () => {
  it("is a bottom sheet on a phone that stays open while the approval runs", async () => {
    phone = true;
    mocks.approve.mockImplementation(() => new Promise(() => {}));
    render(<InstructorsPage />);
    const card = await screen.findByTestId("instructor-card");
    fireEvent.click(within(card).getByRole("button", { name: /adminInstructors\.actions\.approve/ }));
    const paper = await waitFor(() => {
      const p = document.querySelector(".MuiDrawer-paperAnchorBottom");
      expect(p).toBeTruthy();
      return p as HTMLElement;
    });
    fireEvent.click(within(paper).getByRole("button", { name: "adminInstructors.confirm.approveCta" }));
    expect(mocks.approve).toHaveBeenCalledWith(4);
    await waitFor(() =>
      expect(within(paper).getByRole("button", { name: "adminInstructors.confirm.cancel" })).toHaveProperty("disabled", true),
    );
    expect(within(paper).queryByRole("button", { name: "Close" })).toBeNull();
    fireEvent.click(document.querySelector(".MuiDrawer-root .MuiBackdrop-root")!);
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).toBeTruthy();
  });

  it("is the original centred Dialog on a desktop", async () => {
    render(<InstructorsPage />);
    await screen.findByText("Kishore Pedapenki");
    fireEvent.click(screen.getByRole("button", { name: /adminInstructors\.actions\.approve/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.closest(".MuiDialog-root")).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).toBeNull();
    expect(dialog.querySelector(".MuiDialogActions-root")).toBeTruthy();
  });
});

describe("add instructor", () => {
  it("is a bottom sheet on a phone that cannot be dismissed while the account is created", async () => {
    phone = true;
    mocks.createInstructor.mockImplementation(() => new Promise(() => {}));
    const onClose = vi.fn();
    render(<AddInstructorDialog open onClose={onClose} />);
    const paper = document.querySelector(".MuiDrawer-paperAnchorBottom") as HTMLElement;
    expect(paper).toBeTruthy();
    fireEvent.change(within(paper).getByLabelText(/Full name/), { target: { value: "Asha" } });
    fireEvent.change(within(paper).getByLabelText(/Email/), { target: { value: "asha@x.com" } });
    fireEvent.click(within(paper).getByRole("button", { name: "Add instructor" }));
    expect(mocks.createInstructor).toHaveBeenCalled();
    await waitFor(() => expect(within(paper).getByRole("button", { name: "Cancel" })).toHaveProperty("disabled", true));
    fireEvent.click(document.querySelector(".MuiBackdrop-root")!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("is the original Dialog on a desktop", () => {
    render(<AddInstructorDialog open onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".MuiDialogTitle-root")?.textContent).toContain("Add an instructor");
    expect(document.querySelector(".MuiDrawer-paperAnchorBottom")).toBeNull();
  });
});

describe("phone sizes stay on the phone", () => {
  it("status tabs are 48px and their badges 12px on a phone only", async () => {
    render(<InstructorsPage />);
    await screen.findByText("Kishore Pedapenki");
    const tabs = screen.getByRole("tablist").closest(".MuiTabs-root")!;
    expectPhoneOnly(tabs, /MuiTab-root\{min-height:48px/);
    const badge = document.querySelector(".MuiBadge-root")!;
    expectPhoneOnly(badge, /font-size:0\.75rem/);
  });

  it("the search field is 48px tall on a phone only", async () => {
    render(<InstructorsPage />);
    await screen.findByText("Kishore Pedapenki");
    const field = screen.getByPlaceholderText("adminInstructors.searchPlaceholder").closest(".MuiTextField-root")!;
    expectPhoneOnly(field, /MuiInputBase-root\{min-height:48px/);
  });
});
