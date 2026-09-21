import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * The bulk toolbar is pinned over the bottom of the page on a phone while students are selected.
 * It is ~104px tall and the layout keeps only 96px free above the dock, so without a spacer the
 * last job card and the pagination stayed under it even at full scroll. The page adds a spacer
 * as tall as the toolbar's MEASURED height plus 8px - on a phone, with a selection, and never
 * anywhere else.
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
  vi.restoreAllMocks();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
// Stable identities, as the real hooks return: the page's loader depends on `t` and `showToast`,
// and a fresh function per render would reload the list forever.
const stable = vi.hoisted(() => ({
  t: (k: string, o?: unknown) => (typeof o === "string" ? o : k),
  showToast: () => undefined,
  user: { role: "admin" },
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: stable.t }) }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: stable.showToast }) }));
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: stable.user, loading: false }) }));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  HeaderActionButton: ({ children }: { children: ReactNode }) => <button>{children}</button>,
}));
vi.mock("@/components/admin/manage-students/EnrollmentJobHistory", () => ({ EnrollmentJobHistory: () => null }));
vi.mock("@/components/admin/manage-students/BulkEnrollmentDialog", () => ({ BulkEnrollmentDialog: () => null }));
vi.mock("@/components/admin/manage-students/QuickEnrollStudentDialog", () => ({ QuickEnrollStudentDialog: () => null }));
vi.mock("@/lib/services/admin/admin-courses.service", () => ({
  adminCoursesService: { getCourses: () => Promise.resolve([]) },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: () => Promise.resolve([]) },
  PAID_COURSE_NEEDS_COMP: "paid_course_requires_comp",
}));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: () =>
      Promise.resolve({
        students: [
          { id: 7, user_id: 1007, name: "Asha Rao", email: "asha@example.com", is_active: true, enrollment_count: 1, cohorts: [] },
          { id: 8, user_id: 1008, name: "Omar Khan", email: "omar@example.com", is_active: true, enrollment_count: 1, cohorts: [] },
        ],
      }),
    getCourseCompletionStats: () => Promise.resolve([]),
  },
}));

import ManageStudentsPage from "./page";

const spacer = () => screen.queryByTestId("phone-bulk-bar-spacer");

async function renderPage() {
  render(<ManageStudentsPage />);
  await screen.findAllByText("Asha Rao");
}

describe("the bulk toolbar spacer", () => {
  it("is added on a phone once a student is selected, as tall as the measured toolbar + 8px", async () => {
    phone = true;
    // jsdom has no layout: report the toolbar at the height the iPhone measured.
    const real = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.dataset.testid === "phone-bulk-toolbar") return { height: 104 } as DOMRect;
      return real.call(this);
    });
    await renderPage();
    expect(spacer()).toBeNull();

    fireEvent.click(screen.getByRole("checkbox", { name: "Select Asha Rao" }));
    await waitFor(() => expect(spacer()).toBeTruthy());
    expect(spacer()).toHaveAttribute("aria-hidden");
    await waitFor(() => expect(getComputedStyle(spacer() as Element).height).toBe("112px"));

    // Clearing the selection removes the toolbar and the spacer with it.
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Asha Rao" }));
    await waitFor(() => expect(spacer()).toBeNull());
  });

  it("is never added on a desktop, where the toolbar is not pinned", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Asha Rao" }));
    await screen.findByText("1 selected");
    expect(spacer()).toBeNull();
  });
});
