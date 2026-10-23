import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import en from "@/locales/en/common.json";

/**
 * "Remove from organisation" in the directory's actions column, on a desktop and on a phone.
 *
 * Two destructive actions used to share one column: the trash was a permanent, cascading delete
 * (55 foreign keys behind it) and its own toast said "removed from your organization". Now a
 * member can only be REMOVED (reversible, per tenant), and the permanent delete is offered from
 * the Removed view alone, beside "Add back". What is pinned here is which actions each view
 * offers, that a removed row is marked amber (not the red of Inactive, a different state), and
 * that a row from an older server, with no membership field at all, is a member.
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
const PHONE = 390;
const DESKTOP = 1440;

// ---- app seams --------------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));
// Real English copy, so the assertions read what an admin reads.
vi.mock("react-i18next", async () => {
  const en = (await import("@/locales/en/common.json")).default as Record<string, unknown>;
  const lookup = (key: string) =>
    key.split(".").reduce<unknown>(
      (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
      en,
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
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getStudentResumes: () => Promise.resolve({ has_saved_resume: false, resumes: [], documents: [] }),
    getStudentResumePdf: () => Promise.resolve(new Blob()),
  },
}));

import { useTranslation } from "react-i18next";
import { StudentsTable } from "./StudentsTable";
import { studentStatusLabel } from "./membership";

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  window.matchMedia = realMatchMedia;
});

/** The CSS emotion emitted for one element, so a colour can be asserted rather than trusted. */
function cssOf(el: Element): string {
  const sheets = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-") || c.startsWith("mui-"));
  return classes
    .flatMap((c) => sheets.split(/(?=\.(?:css|mui)-)/).filter((chunk) => chunk.startsWith(`.${c}`)))
    .join("\n");
}

// ---- fixtures -----------------------------------------------------------------------------------
const student = (id: number, name: string, extra: Record<string, unknown> = {}) =>
  ({
    id,
    user_id: id + 1000,
    name,
    email: `${name.toLowerCase().replace(/\s/g, ".")}@example.com`,
    is_active: true,
    enrollment_count: 1,
    most_active_course: "Python Basics",
    has_saved_resume: false,
    cohorts: [],
    total_marks: 0,
    current_streak: 0,
    ...extra,
  }) as never;

const REMOVED_AT = "2026-10-20T12:00:00Z"; // noon UTC: the same calendar day in every timezone
const members = [student(7, "Asha Rao"), student(8, "Omar Khan")];
const removed = [
  student(9, "Riya Sen", {
    membership: "removed",
    // Inactive as well, to prove the amber chip outranks the red one.
    is_active: false,
    removed_at: REMOVED_AT,
    removed_by: { id: 3, name: "Priya Admin" },
  }),
];

function renderTable(over: Record<string, unknown> = {}) {
  const props = {
    students: members,
    completionStats: {},
    loading: false,
    loadingStats: false,
    sortBy: "name" as const,
    sortOrder: "asc" as const,
    onSort: vi.fn(),
    onRemove: vi.fn(),
    onRestore: vi.fn(),
    onDelete: vi.fn(),
    ...over,
  };
  render(<StudentsTable {...props} />);
  return props;
}

const REMOVE = "Remove from organisation";
const ADD_BACK = "Add back";
const DELETE = "Delete permanently";

// ================================================================================================

describe("the actions column in the members view", () => {
  beforeEach(() => viewport(DESKTOP));

  it("offers Remove from organisation, and no trash", () => {
    const props = renderTable();
    expect(screen.getAllByRole("button", { name: REMOVE })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: DELETE })).toBeNull();
    expect(screen.queryByRole("button", { name: ADD_BACK })).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: REMOVE })[1]);
    expect(props.onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 8, name: "Omar Khan" }));
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it("offers no membership action at all when onRemove is not given (a scoped role)", () => {
    renderTable({ onRemove: undefined });
    expect(screen.queryByRole("button", { name: REMOVE })).toBeNull();
    expect(screen.queryByRole("button", { name: DELETE })).toBeNull();
    expect(screen.queryByRole("button", { name: ADD_BACK })).toBeNull();
    // The two navigation actions are untouched.
    expect(screen.getAllByRole("button", { name: en.profile.tabProfile })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: en.manageStudents.courseManagement })).toHaveLength(2);
  });

  it("treats a row with no membership field as a member", () => {
    // An older server never sends the field; reading its absence as "removed" would mark the
    // whole directory amber the day the frontend shipped ahead of the backend.
    renderTable({ students: [student(7, "Asha Rao")] });
    expect(screen.queryByTestId("removed-chip")).toBeNull();
    expect(screen.getByRole("button", { name: REMOVE })).toBeTruthy();
  });

  it("still marks a deactivated member Inactive, in red", () => {
    renderTable({ students: [student(8, "Omar Khan", { is_active: false })] });
    const chip = screen.getByText("Inactive").closest(".MuiChip-root") as Element;
    expect(cssOf(chip)).toMatch(/background-color:#fee2e2/);
    expect(screen.queryByTestId("removed-chip")).toBeNull();
  });
});

describe("the actions column in the Removed view", () => {
  beforeEach(() => viewport(DESKTOP));

  it("offers Add back and Delete permanently, and marks the row with an amber Removed chip", () => {
    const props = renderTable({ view: "removed", students: removed });
    expect(screen.queryByRole("button", { name: REMOVE })).toBeNull();

    const chip = screen.getByTestId("removed-chip");
    expect(chip.textContent).toBe("Removed");
    // Amber, not the Inactive red: the two are different states and must not read as one.
    expect(cssOf(chip)).toMatch(/background-color:#fef3c7/);
    expect(screen.queryByText("Inactive")).toBeNull();
    // The stamp is the chip's tooltip (MUI exposes a string title as the child's label).
    expect(screen.getByLabelText("Removed on Oct 20, 2026 by Priya Admin")).toBe(chip);

    fireEvent.click(screen.getByRole("button", { name: ADD_BACK }));
    expect(props.onRestore).toHaveBeenCalledWith(expect.objectContaining({ id: 9 }));
    fireEvent.click(screen.getByRole("button", { name: DELETE }));
    expect(props.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 9 }));
    expect(props.onRemove).not.toHaveBeenCalled();
  });

  it("names an administrator when the removing admin's profile is gone", () => {
    renderTable({
      view: "removed",
      students: [student(9, "Riya Sen", { membership: "removed", removed_at: REMOVED_AT, removed_by: null })],
    });
    expect(screen.getByLabelText("Removed on Oct 20, 2026 by an administrator")).toBeTruthy();
  });

  it("holds the Add back button while that row's add-back is in flight", () => {
    renderTable({ view: "removed", students: removed, restoringId: 9 });
    expect(screen.getByRole("button", { name: ADD_BACK })).toBeDisabled();
  });

  it("says nobody has been removed when the view is empty, unless a filter narrowed it", () => {
    const { unmount } = render(
      <StudentsTable
        students={[]}
        completionStats={{}}
        loading={false}
        loadingStats={false}
        sortBy="name"
        sortOrder="asc"
        onSort={vi.fn()}
        view="removed"
      />,
    );
    expect(screen.getByText("Nobody has been removed")).toBeTruthy();
    expect(screen.getByText("Students you remove from your organisation will appear here.")).toBeTruthy();
    unmount();

    // With a search on, an empty list means "no match", and saying nobody was removed would be
    // false the moment somebody was.
    render(
      <StudentsTable
        students={[]}
        completionStats={{}}
        loading={false}
        loadingStats={false}
        sortBy="name"
        sortOrder="asc"
        onSort={vi.fn()}
        view="removed"
        filtered
      />,
    );
    expect(screen.queryByText("Nobody has been removed")).toBeNull();
    expect(screen.getByText("No students found")).toBeTruthy();
  });
});

describe("the phone kebab menu", () => {
  beforeEach(() => viewport(PHONE));

  const openMenuFor = (name: string) => {
    fireEvent.click(screen.getByRole("button", { name: `Actions for ${name}` }));
    return screen.getByRole("menu");
  };

  it("offers Remove from organisation to a member, and neither Add back nor a delete", () => {
    const props = renderTable();
    const menu = openMenuFor("Asha Rao");
    expect(within(menu).queryByRole("menuitem", { name: ADD_BACK })).toBeNull();
    expect(within(menu).queryByRole("menuitem", { name: DELETE })).toBeNull();
    fireEvent.click(within(menu).getByRole("menuitem", { name: REMOVE }));
    expect(props.onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });

  it("offers Add back and Delete permanently in the Removed view, under an amber chip", () => {
    const props = renderTable({ view: "removed", students: removed });
    const card = screen.getByTestId("student-card");
    expect(within(card).getByTestId("removed-chip").textContent).toBe("Removed");
    expect(within(card).queryByText("Inactive")).toBeNull();

    let menu = openMenuFor("Riya Sen");
    expect(within(menu).queryByRole("menuitem", { name: REMOVE })).toBeNull();
    fireEvent.click(within(menu).getByRole("menuitem", { name: ADD_BACK }));
    expect(props.onRestore).toHaveBeenCalledWith(expect.objectContaining({ id: 9 }));

    menu = openMenuFor("Riya Sen");
    fireEvent.click(within(menu).getByRole("menuitem", { name: DELETE }));
    expect(props.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 9 }));
  });

  it("offers no membership item to a scoped role", () => {
    renderTable({ onRemove: undefined, onRestore: undefined, onDelete: undefined });
    const menu = openMenuFor("Asha Rao");
    expect(within(menu).queryByRole("menuitem", { name: REMOVE })).toBeNull();
    expect(within(menu).queryByRole("menuitem", { name: DELETE })).toBeNull();
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(2);
  });
});

describe("the CSV export's Status column", () => {
  // The page's export builds its rows from this one rule; the mocked `useTranslation` above
  // hands back the same English copy the page would.
  const { t } = useTranslation("common");

  it("says Removed for a removed row, and Active or Inactive otherwise", () => {
    expect(studentStatusLabel(t, { membership: "removed", is_active: true })).toBe("Removed");
    expect(studentStatusLabel(t, { membership: "active", is_active: true })).toBe("Active");
    expect(studentStatusLabel(t, { is_active: false })).toBe("Inactive");
    // A deactivated login that was also removed exports as Removed: one state per row.
    expect(studentStatusLabel(t, { membership: "removed", is_active: false })).toBe("Removed");
  });
});
