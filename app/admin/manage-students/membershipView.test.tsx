import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import en from "@/locales/en/common.json";

/**
 * Manage Students' Members / Removed views.
 *
 * "Remove from organisation" is reversible and per tenant: the server stamps the person's
 * profile on THIS organisation and keeps every record, and the directory lists members only
 * unless asked for `status=removed`. What is pinned here is the contract between the page and
 * that listing (no status sent for members, "removed" for the other tab, badges from the
 * server's tenant-wide counts), what the Removed view hides (segments, the status and resume
 * filters, bulk selection), the confirm that stands between an admin and a removal, the
 * confirm-free way back, and that the permanent delete is reachable from the Removed view only.
 */

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  showToast: vi.fn(),
  getManageStudents: vi.fn(),
  remove: vi.fn(),
  restore: vi.fn(),
  deleteStudent: vi.fn(),
  /** The query string the page mounts with. */
  search: "",
  user: { role: "admin" },
  /** The tenant's login gate, as ClientInfoContext would report it. */
  gated: false,
  counts: { active: 2, removed: 1 } as { active: number; removed: number } | undefined,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mocks.replace, back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
// Real English copy, created once: the page's loader depends on `t`, and a fresh function per
// render would reload the list forever.
vi.mock("react-i18next", async () => {
  const json = (await import("@/locales/en/common.json")).default as Record<string, unknown>;
  const lookup = (key: string) =>
    key.split(".").reduce<unknown>(
      (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
      json,
    );
  const t = (key: string, opts?: string | Record<string, unknown>) => {
    const found = lookup(key);
    const template =
      typeof found === "string"
        ? found
        : typeof opts === "string"
          ? opts
          : ((opts?.defaultValue as string | undefined) ?? key);
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      opts && typeof opts === "object" && k in opts ? String(opts[k]) : "",
    );
  };
  return { useTranslation: () => ({ t }) };
});
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: mocks.user, loading: false }) }));
// The page reads no tenant flag (the confirm's sign-in sentence is tenant-independent, because
// the server refuses a removed member on every tenant). Mocked all the same, in both states, so
// a later conditional on the flag fails the ungated case below instead of passing unnoticed.
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { restrict_login_to_added_members: mocks.gated } }),
  useOptionalClientInfo: () => ({ restrict_login_to_added_members: mocks.gated }),
  useIsCourseEnabled: () => true,
}));
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
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { listCohorts: () => Promise.resolve([]) },
}));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: mocks.getManageStudents,
    getCourseCompletionStats: () => Promise.resolve([]),
    removeFromOrganisation: mocks.remove,
    restoreToOrganisation: mocks.restore,
    deleteStudent: mocks.deleteStudent,
    getStudentResumes: () => Promise.resolve({ has_saved_resume: false, resumes: [], documents: [] }),
    getStudentResumePdf: () => Promise.resolve(new Blob()),
  },
}));

import ManageStudentsPage from "./page";

// ---- fixtures -----------------------------------------------------------------------------------
const member = (id: number, name: string) => ({
  id,
  user_id: id + 1000,
  name,
  email: `${name.toLowerCase().replace(/\s/g, ".")}@example.com`,
  is_active: true,
  enrollment_count: 1,
  cohorts: [],
  total_marks: 0,
  current_streak: 0,
});
const MEMBERS = [member(7, "Asha Rao"), member(8, "Omar Khan")];
const REMOVED = [
  {
    ...member(9, "Riya Sen"),
    membership: "removed",
    removed_at: "2026-10-20T12:00:00Z",
    removed_by: { id: 3, name: "Priya Admin" },
  },
];

const copy = en.adminManageStudents.membership;
const EM_DASH = String.fromCodePoint(0x2014);
// A MUI Select's accessible name is its label followed by its displayed value.
const select = (label: string) => new RegExp("^" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const COURSE = select(en.adminManageStudents.filterByCourse);
const STATUS = select(en.adminManageStudents.status);
const RESUME = select(en.adminManageStudents.filterSavedResume);
const REMOVE = "Remove from organisation";
const ADD_BACK = "Add back";
const DELETE = "Delete permanently";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.search = "";
  mocks.user.role = "admin";
  mocks.gated = false;
  mocks.counts = { active: 2, removed: 1 };
  // The server's listing: members unless asked for the removed population.
  mocks.getManageStudents.mockImplementation((params?: { status?: string }) =>
    Promise.resolve({
      students: params?.status === "removed" ? REMOVED : MEMBERS,
      membership_counts: mocks.counts,
    }),
  );
  mocks.remove.mockResolvedValue({ membership: "removed", already_removed: false });
  mocks.restore.mockResolvedValue({ membership: "active", restored: true });
  mocks.deleteStudent.mockResolvedValue({});
});
afterEach(() => {
  vi.restoreAllMocks();
});

async function renderPage() {
  render(<ManageStudentsPage />);
  await screen.findByTestId("membership-tabs");
}
const membersTab = () => screen.getByTestId("membership-tab-members");
const removedTab = () => screen.getByTestId("membership-tab-removed");
const badge = (tab: HTMLElement) => within(tab).queryByText(/^\d+$/)?.textContent ?? null;

// ================================================================================================

describe("the Members and Removed tabs", () => {
  it("list members by default, send no status, and carry the server's tenant-wide counts", async () => {
    await renderPage();
    await screen.findByText("Asha Rao");
    expect(mocks.getManageStudents).toHaveBeenCalledTimes(1);
    // Exactly the request the page sent before this feature: every other consumer of the
    // listing depends on "no status" meaning members.
    expect(mocks.getManageStudents.mock.calls[0][0]).not.toHaveProperty("status");
    expect(screen.queryByText("Riya Sen")).toBeNull();

    expect(membersTab()).toHaveAttribute("aria-selected", "true");
    expect(membersTab().textContent).toContain(copy.tabMembers);
    expect(badge(membersTab())).toBe("2");
    expect(removedTab().textContent).toContain(copy.tabRemoved);
    expect(badge(removedTab())).toBe("1");
  });

  it("render without badges when the server sends no membership_counts", async () => {
    mocks.counts = undefined;
    await renderPage();
    await screen.findByText("Asha Rao");
    expect(badge(membersTab())).toBeNull();
    expect(badge(removedTab())).toBeNull();
  });

  it("open the Removed view: status=removed, no segments, no account filters, no bulk selection", async () => {
    await renderPage();
    await screen.findByText("Asha Rao");
    // The members view's controls, to be sure the next assertions are about their absence.
    expect(screen.getByTestId("segment-chip-at_risk")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: COURSE })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: STATUS })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: RESUME })).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Select Asha Rao" })).toBeTruthy();
    expect(screen.getByText(en.adminManageStudents.studentDirectoryHint)).toBeTruthy();

    fireEvent.click(removedTab());
    await screen.findByText("Riya Sen");
    expect(mocks.getManageStudents).toHaveBeenLastCalledWith(expect.objectContaining({ status: "removed" }));
    expect(screen.queryByText("Asha Rao")).toBeNull();
    expect(removedTab()).toHaveAttribute("aria-selected", "true");

    expect(screen.queryByTestId("segment-chip-at_risk")).toBeNull();
    // The course filter and search stay; the status and saved-resume selects go, because the
    // page does not apply them here and a hidden filter must not narrow a list.
    expect(screen.getByRole("combobox", { name: COURSE })).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: STATUS })).toBeNull();
    expect(screen.queryByRole("combobox", { name: RESUME })).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /^Select / })).toBeNull();
    expect(screen.getByText(copy.removedHint)).toBeTruthy();
    expect(screen.queryByText(en.adminManageStudents.studentDirectoryHint)).toBeNull();
    // Survives navigation and refresh, as every other directory control does.
    expect(mocks.replace).toHaveBeenCalledWith("?view=removed", { scroll: false });
  });

  it("open the Removed view from a ?view=removed link", async () => {
    mocks.search = "view=removed";
    await renderPage();
    await screen.findByText("Riya Sen");
    expect(mocks.getManageStudents.mock.calls[0][0]).toMatchObject({ status: "removed" });
    expect(removedTab()).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("Asha Rao")).toBeNull();
  });

  it("are not offered to a scoped role, nor is any membership action", async () => {
    mocks.user.role = "course_manager";
    render(<ManageStudentsPage />);
    await screen.findByText("Asha Rao");
    expect(screen.queryByTestId("membership-tabs")).toBeNull();
    expect(screen.queryByRole("button", { name: REMOVE })).toBeNull();
    expect(screen.queryByRole("button", { name: DELETE })).toBeNull();
    expect(mocks.getManageStudents.mock.calls[0][0]).not.toHaveProperty("status");
  });
});

describe("removing a member", () => {
  it.each([
    ["an open tenant", false],
    ["a tenant that restricts sign-in to added members", true],
  ])("on %s, happens only after a confirm that says they cannot sign in again", async (_label, gated) => {
    mocks.gated = gated;
    await renderPage();
    await screen.findByText("Asha Rao");
    expect(screen.queryByRole("dialog")).toBeNull();

    // Rows are sorted by name: Asha first.
    fireEvent.click(screen.getAllByRole("button", { name: REMOVE })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Remove Asha Rao from your organisation\?/)).toBeTruthy();
    expect(dialog.textContent).toContain("They will not be able to sign in again until you add them back.");
    expect(dialog.textContent).toContain("you can add them back at any time from the Removed tab");
    expect(mocks.remove).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: REMOVE }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(7));
    expect(mocks.showToast).toHaveBeenCalledWith(
      "Asha Rao removed from your organisation. Find them under Removed.",
      "success",
    );
    // The list is re-read, not patched: the server decides who is a member.
    await waitFor(() => expect(mocks.getManageStudents).toHaveBeenCalledTimes(2));
    expect(mocks.getManageStudents.mock.calls[1][0]).not.toHaveProperty("status");
  });

  it("does not happen when the confirm is cancelled", async () => {
    await renderPage();
    await screen.findByText("Asha Rao");
    fireEvent.click(screen.getAllByRole("button", { name: REMOVE })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.getManageStudents).toHaveBeenCalledTimes(1);
  });

  it("reports the server's refusal in its own words", async () => {
    mocks.remove.mockRejectedValue({
      response: { data: { error: "Only an admin can remove a student from the organisation.", code: "admin_only" } },
    });
    await renderPage();
    await screen.findByText("Asha Rao");
    fireEvent.click(screen.getAllByRole("button", { name: REMOVE })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: REMOVE }));
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith(
        "Only an admin can remove a student from the organisation.",
        "error",
      ),
    );
    expect(mocks.getManageStudents).toHaveBeenCalledTimes(1);
  });
});

describe("the Removed view", () => {
  it("adds a person back without a confirm, and re-reads the list", async () => {
    mocks.search = "view=removed";
    await renderPage();
    await screen.findByText("Riya Sen");
    expect(screen.queryByRole("button", { name: REMOVE })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: ADD_BACK }));
    await waitFor(() => expect(mocks.restore).toHaveBeenCalledWith(9));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mocks.showToast).toHaveBeenCalledWith("Riya Sen added back. They can sign in again.", "success");
    await waitFor(() => expect(mocks.getManageStudents).toHaveBeenCalledTimes(2));
    expect(mocks.getManageStudents).toHaveBeenLastCalledWith(expect.objectContaining({ status: "removed" }));
  });

  it("is the only place Delete permanently is offered, and confirms it in plain words", async () => {
    await renderPage();
    await screen.findByText("Asha Rao");
    expect(screen.queryByRole("button", { name: DELETE })).toBeNull();

    fireEvent.click(removedTab());
    await screen.findByText("Riya Sen");
    fireEvent.click(screen.getByRole("button", { name: DELETE }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Delete Riya Sen permanently\?/)).toBeTruthy();
    expect(dialog.textContent).toContain("It cannot be undone.");
    expect(dialog.textContent).not.toContain(EM_DASH);
    expect(mocks.deleteStudent).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: DELETE }));
    await waitFor(() => expect(mocks.deleteStudent).toHaveBeenCalledWith(9));
    expect(mocks.showToast).toHaveBeenCalledWith("Riya Sen deleted permanently.", "success");
  });

  it("says nobody has been removed when it is empty", async () => {
    mocks.getManageStudents.mockImplementation((params?: { status?: string }) =>
      Promise.resolve({
        students: params?.status === "removed" ? [] : MEMBERS,
        membership_counts: { active: 2, removed: 0 },
      }),
    );
    mocks.search = "view=removed";
    await renderPage();
    await screen.findByText(copy.emptyRemoved);
    expect(screen.getByText(copy.emptyRemovedHint)).toBeTruthy();
    expect(badge(removedTab())).toBe("0");
  });
});
