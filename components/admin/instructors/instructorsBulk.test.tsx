import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * Filters and bulk actions on /admin/instructors.
 *
 * The two properties worth pinning are both about what a bulk action is allowed to touch:
 * selection is intersected with the rows ON SCREEN, and course assignment uses `add`/`remove`
 * rather than `set`. Each one, if it broke, would change rows the admin never looked at.
 */

const realMatchMedia = window.matchMedia;
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
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
  vi.clearAllMocks();
});

// `t` returns the key and IGNORES defaultValue, matching the sibling suite, so assertions
// read against keys and test ids rather than copy.
vi.mock("react-i18next", () => {
  const t = (key: string) => key;
  const value = { t, i18n: { language: "en" } };
  return { useTranslation: () => value };
});

const mocks = vi.hoisted(() => ({
  showToast: vi.fn<(message: string, severity?: string) => void>(),
  approve: vi.fn(async (_profileId: number) => ({ detail: "ok" })),
  assign: vi.fn(
    async (
      _profileId: number,
      _courseIds: number[],
      _mode: "set" | "add" | "remove",
      _adaptiveCourseIds: number[]
    ) => ({ detail: "ok" })
  ),
  remove: vi.fn(async (_profileId: number) => ({ detail: "ok" })),
  listInstructors: vi.fn<(status: string) => Promise<unknown[]>>(),
  getDirectory: vi.fn(async () => [] as Array<{ profile_id: number; instructor_code: string }>),
}));

vi.mock("@/components/common/Toast", () => ({
  useToast: () => ({ showToast: mocks.showToast }),
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
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useIsCourseEnabled: () => false }));
vi.mock("@/lib/services/instructor.service", () => ({
  instructorService: {
    getInstructorDirectory: mocks.getDirectory,
    setInstructorCode: vi.fn(),
  },
}));
vi.mock("@/lib/services/admin/admin-course-builder.service", () => ({
  adminCourseBuilderService: {
    getCourses: vi.fn(async () => [{ id: 7, title: "Python" }]),
  },
}));
vi.mock("@/lib/services/admin/admin-courses.service", () => ({
  adminCoursesService: { getCourses: vi.fn(async () => []) },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: vi.fn(async () => []) },
}));
vi.mock("@/lib/services/admin/admin-instructors.service", () => ({
  adminInstructorsService: {
    listInstructors: mocks.listInstructors,
    approveInstructor: mocks.approve,
    rejectInstructor: vi.fn(async () => ({ detail: "ok" })),
    reopenInstructor: vi.fn(async () => ({ detail: "ok" })),
    assignCoursesToInstructor: mocks.assign,
    removeInstructor: mocks.remove,
    promoteInstructor: vi.fn(),
    createInstructor: vi.fn(),
    getAssignableAdaptiveCourses: vi.fn(async () => []),
  },
}));

import InstructorsPage from "@/app/admin/instructors/page";

const PENDING = [
  {
    id: 1,
    full_name: "Asha Rao",
    email: "asha@x.com",
    phone_number: "+91 1",
    created_at: "2026-11-04T00:00:00Z",
    pending_status: "pending",
    instructor_cv_url: "https://s3/asha.pdf",
  },
  {
    id: 2,
    full_name: "Bala Iyer",
    email: "bala@x.com",
    phone_number: "+91 2",
    created_at: "2026-11-04T00:00:00Z",
    pending_status: "pending",
    instructor_cv_url: null,
  },
  {
    id: 3,
    full_name: "Chandra Das",
    email: "chandra@x.com",
    phone_number: "+91 3",
    created_at: "2026-11-04T00:00:00Z",
    pending_status: "pending",
    instructor_cv_url: "https://s3/chandra.pdf",
  },
];

const APPROVED = [
  {
    id: 10,
    full_name: "Deepa Nair",
    email: "deepa@x.com",
    phone_number: "+91 10",
    created_at: "2026-11-04T00:00:00Z",
    pending_status: "approved",
    assigned_courses: [{ id: 7, title: "Python" }],
  },
  {
    id: 11,
    full_name: "Esha Jain",
    email: "esha@x.com",
    phone_number: "+91 11",
    created_at: "2026-11-04T00:00:00Z",
    pending_status: "approved",
    assigned_courses: [],
  },
];

function stubList(pending = PENDING, approved = APPROVED) {
  mocks.listInstructors.mockImplementation(async (status: string) =>
    status === "pending" ? pending : status === "approved" ? approved : []
  );
}

/** The row checkboxes, in table order. The first checkbox on the page is select-all. */
async function rowBoxes(): Promise<HTMLInputElement[]> {
  await screen.findByText("Asha Rao");
  const all = screen.getAllByRole("checkbox") as HTMLInputElement[];
  return all.slice(1);
}

describe("selection", () => {
  it("shows no bulk bar until something is selected", async () => {
    stubList();
    render(<InstructorsPage />);
    await screen.findByText("Asha Rao");
    expect(screen.queryByTestId("bulk-bar")).toBeNull();

    fireEvent.click((await rowBoxes())[0]);
    expect(screen.getByTestId("bulk-bar")).toBeTruthy();
    expect(screen.getByTestId("bulk-count").textContent).toMatch(/selected/);
  });

  it("select-all takes the rows on screen, not the whole tab", async () => {
    stubList();
    render(<InstructorsPage />);
    await screen.findByText("Asha Rao");

    // Narrow to the two instructors who uploaded a CV, then select all.
    fireEvent.change(screen.getByTestId("filter-cv"), { target: { value: "yes" } });
    await waitFor(() => expect(screen.queryByText("Bala Iyer")).toBeNull());

    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect((await rowBoxes()).every((b) => b.checked)).toBe(true);

    fireEvent.click(screen.getByTestId("bulk-approve"));
    fireEvent.click(await screen.findByRole("button", { name: /adminInstructors\.bulk\.approve/ }));

    await waitFor(() => expect(mocks.approve).toHaveBeenCalledTimes(2));
    // Bala, hidden by the filter, was never touched even though "select all" was pressed.
    expect(mocks.approve.mock.calls.map((c) => c[0]).sort()).toEqual([1, 3]);
  });

  it("drops a selected row that a filter change hides", async () => {
    stubList();
    render(<InstructorsPage />);
    const boxes = await rowBoxes();

    fireEvent.click(boxes[1]); // Bala, who has no CV
    expect(screen.getByTestId("bulk-bar")).toBeTruthy();

    fireEvent.change(screen.getByTestId("filter-cv"), { target: { value: "yes" } });

    // Selection is pruned to the visible set, so the bar goes away rather than keeping a
    // row the admin can no longer see queued up for the next bulk action.
    await waitFor(() => expect(screen.queryByTestId("bulk-bar")).toBeNull());
  });

  it("never sends a hidden row to an endpoint, even after select-all", async () => {
    stubList();
    render(<InstructorsPage />);
    await screen.findByText("Asha Rao");

    // Select everything FIRST, then narrow. This is the order that leaves a stale id in
    // state, and it is the one that matters: the pruning effect - not the select-all
    // handler - is what keeps Bala out of the request.
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getByTestId("bulk-count").textContent).toMatch(/selected/);

    fireEvent.change(screen.getByTestId("filter-cv"), { target: { value: "yes" } });
    await waitFor(() => expect(screen.queryByText("Bala Iyer")).toBeNull());

    fireEvent.click(screen.getByTestId("bulk-approve"));
    fireEvent.click(await screen.findByRole("button", { name: /adminInstructors\.bulk\.approve/ }));

    await waitFor(() => expect(mocks.approve).toHaveBeenCalledTimes(2));
    expect(mocks.approve.mock.calls.map((c) => c[0]).sort()).toEqual([1, 3]);
    expect(mocks.approve.mock.calls.map((c) => c[0])).not.toContain(2);
  });

  it("drops the selection when the tab changes", async () => {
    stubList();
    render(<InstructorsPage />);
    fireEvent.click((await rowBoxes())[0]);
    expect(screen.getByTestId("bulk-bar")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: /approved/i }));
    await waitFor(() => expect(screen.queryByTestId("bulk-bar")).toBeNull());
  });
});

describe("bulk approve", () => {
  it("calls the endpoint once per row and reloads the affected tabs once", async () => {
    stubList();
    render(<InstructorsPage />);
    const boxes = await rowBoxes();
    fireEvent.click(boxes[0]);
    fireEvent.click(boxes[2]);

    mocks.listInstructors.mockClear();
    fireEvent.click(screen.getByTestId("bulk-approve"));
    fireEvent.click(await screen.findByRole("button", { name: /adminInstructors\.bulk\.approve/ }));

    await waitFor(() => expect(mocks.approve).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(mocks.showToast.mock.calls.some((c) => c[1] === "success")).toBe(true)
    );

    // One refetch per affected status, after the loop - not one per approved row.
    const statuses = mocks.listInstructors.mock.calls.map((c) => c[0]);
    expect(statuses.filter((s) => s === "pending")).toHaveLength(1);
    expect(statuses.filter((s) => s === "approved")).toHaveLength(1);
  });

  it("finishes the list after one row fails, and says which", async () => {
    stubList();
    mocks.approve.mockImplementation(async (id: number) => {
      if (id === 2) {
        throw { response: { data: { detail: "Already an instructor." } } };
      }
      return { detail: "ok" };
    });

    render(<InstructorsPage />);
    await screen.findByText("Asha Rao");
    fireEvent.click(screen.getAllByRole("checkbox")[0]); // select all three
    fireEvent.click(screen.getByTestId("bulk-approve"));
    fireEvent.click(await screen.findByRole("button", { name: /adminInstructors\.bulk\.approve/ }));

    // The failure does not abort the run: rows 1 and 3 still go through.
    await waitFor(() => expect(mocks.approve).toHaveBeenCalledTimes(3));

    await waitFor(() => {
      const warn = mocks.showToast.mock.calls.find((c) => c[1] === "warning");
      expect(warn).toBeTruthy();
      // A partial run must NOT report success, and must name the row and the reason.
      expect(String(warn?.[0])).toMatch(/Bala Iyer/);
      expect(String(warn?.[0])).toMatch(/Already an instructor/);
    });
    expect(mocks.showToast.mock.calls.some((c) => c[1] === "success")).toBe(false);
  });
});

describe("bulk course assignment", () => {
  it("sends add, never set, so existing assignments survive", async () => {
    stubList();
    render(<InstructorsPage />);
    await screen.findByText("Asha Rao");

    fireEvent.click(screen.getByRole("tab", { name: /approved/i }));
    await screen.findByText("Deepa Nair");

    const boxes = (screen.getAllByRole("checkbox") as HTMLInputElement[]).slice(1);
    fireEvent.click(boxes[0]);
    fireEvent.click(boxes[1]);

    fireEvent.click(screen.getByTestId("bulk-assign"));

    // Tick the one course the catalogue offers, then apply.
    await screen.findByText("Python");
    const dialog = screen.getByRole("dialog");
    const courseBox = within(dialog)
      .getAllByRole("checkbox")
      .at(-1) as HTMLInputElement;
    fireEvent.click(courseBox);
    await waitFor(() => expect(courseBox.checked).toBe(true));

    const apply = screen.getByTestId("bulk-assign-confirm") as HTMLButtonElement;
    expect(apply.disabled).toBe(false);
    fireEvent.click(apply);

    await waitFor(() => expect(mocks.assign).toHaveBeenCalledTimes(2));
    mocks.assign.mock.calls.forEach((call) => {
      // signature: (profileId, courseIds, mode, adaptiveCourseIds)
      expect(call[2]).toBe("add");
      expect(call[1]).toEqual([7]);
    });
  });
});
