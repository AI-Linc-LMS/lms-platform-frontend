import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * The Courses area on a phone.
 *
 * jsdom has no layout, so what is pinned here is structure: which controls a phone gets instead
 * of the desktop toolbar, that the sort options are one-tap pills in a ScrollRow rather than a
 * desktop select, and that a desktop-width screen still gets exactly the old toolbar.
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
const push = vi.fn();
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/contexts/ClientInfoContext", () => ({ useIsAdaptiveQuizEnabled: () => true }));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
vi.mock("@/components/scorecard/shared", () => ({
  Reveal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/hooks/usePayment", () => ({ usePayment: () => ({ handlePayment: vi.fn() }) }));
vi.mock("@/lib/hooks/useB2CAllowance", () => ({
  useB2CAllowance: () => ({ isB2C: false, freeCoursesLeft: 0, refresh: vi.fn() }),
}));

const course = (id: number, title: string) => ({
  id,
  title,
  slug: `c-${id}`,
  description: `About ${title}`,
  target_audience: "",
  duration_weeks: 4,
  difficulty_levels: [],
  module_count: 3,
  submodule_count: 9,
  quiz_count: 6,
  article_count: 9,
  updated_at: `2026-09-0${id}T00:00:00Z`,
});
const courses = [course(1, "Python Basics"), course(2, "Data Structures")];

vi.mock("@/lib/services/adaptive-course.service", () => ({
  adaptiveCourseService: {
    listCourses: () => Promise.resolve(courses),
    getCatalog: () => Promise.resolve(courses),
    selfEnroll: vi.fn(),
  },
}));

import AdaptiveCourseListPage from "@/app/adaptive-courses/page";
import AdaptiveCourseCatalogPage from "@/app/adaptive-courses/catalog/page";
import { PhoneCourseControls } from "./PhoneCourseControls";

// ---- tests ------------------------------------------------------------------------------------

describe("PhoneCourseControls", () => {
  it("puts the sort options in a scrolling row of one-tap pills", () => {
    const onSortChange = vi.fn();
    render(
      <PhoneCourseControls
        search=""
        onSearchChange={vi.fn()}
        placeholder="Search your courses"
        sort="recent"
        sortOptions={[
          { value: "recent", label: "Recently updated" },
          { value: "title", label: "Title (A–Z)" },
        ]}
        onSortChange={onSortChange}
      />,
    );
    const row = screen.getByRole("group", { name: "Sort courses" });
    const pills = within(row).getAllByRole("button");
    expect(pills).toHaveLength(2);
    expect(pills[0]).toHaveAttribute("aria-pressed", "true");
    expect(pills[1]).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(pills[1]);
    expect(onSortChange).toHaveBeenCalledWith("title");
  });

  it("offers a clear button only once there is something to clear", () => {
    const onSearchChange = vi.fn();
    const { rerender } = render(
      <PhoneCourseControls search="" onSearchChange={onSearchChange} placeholder="Search" />,
    );
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
    rerender(<PhoneCourseControls search="pyth" onSearchChange={onSearchChange} placeholder="Search" />);
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("switches between card and list layouts with labelled toggle buttons", () => {
    const onViewChange = vi.fn();
    render(
      <PhoneCourseControls search="" onSearchChange={vi.fn()} placeholder="Search" view="cards" onViewChange={onViewChange} />,
    );
    const layout = screen.getByRole("group", { name: "Layout" });
    expect(within(layout).getByRole("button", { name: "Card view" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(layout).getByRole("button", { name: "List view" }));
    expect(onViewChange).toHaveBeenCalledWith("list");
  });
});

describe("My courses (/adaptive-courses)", () => {
  it("gives a phone the thumb controls instead of the desktop toolbar", async () => {
    phone = true;
    render(<AdaptiveCourseListPage />);
    await screen.findByText("Python Basics");

    expect(screen.getByTestId("phone-course-controls")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Sort courses" })).toBeTruthy();
    // The desktop Sort select is gone on a phone.
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("sorts from the pill row on a phone", async () => {
    phone = true;
    render(<AdaptiveCourseListPage />);
    await screen.findByText("Python Basics");

    // Recently updated first: course 2 was updated later.
    const titles = () => screen.getAllByText(/^(Python Basics|Data Structures)$/).map((n) => n.textContent);
    expect(titles()).toEqual(["Data Structures", "Python Basics"]);

    fireEvent.click(within(screen.getByRole("group", { name: "Sort courses" })).getByRole("button", { name: "Title (A–Z)" }));
    await waitFor(() => expect(titles()).toEqual(["Data Structures", "Python Basics"].sort()));
  });

  it("keeps the desktop toolbar, with its Sort select, above the phone breakpoint", async () => {
    phone = false;
    render(<AdaptiveCourseListPage />);
    await screen.findByText("Python Basics");

    expect(screen.queryByTestId("phone-course-controls")).toBeNull();
    expect(screen.queryByRole("group", { name: "Sort courses" })).toBeNull();
    expect(screen.getByRole("combobox")).toBeTruthy();
  });
});

describe("Browse courses (/adaptive-courses/catalog)", () => {
  it("gives a phone the full-width search", async () => {
    phone = true;
    render(<AdaptiveCourseCatalogPage />);
    await screen.findByText("Python Basics");
    const controls = screen.getByTestId("phone-course-controls");
    expect(within(controls).getByRole("searchbox", { name: "Search available courses" })).toBeTruthy();
    // Nothing to sort in the catalog, so no empty pill row.
    expect(screen.queryByRole("group", { name: "Sort courses" })).toBeNull();
  });

  it("keeps the desktop search bar above the phone breakpoint", async () => {
    render(<AdaptiveCourseCatalogPage />);
    await screen.findByText("Python Basics");
    expect(screen.queryByTestId("phone-course-controls")).toBeNull();
    expect(screen.getByPlaceholderText("Search available courses…")).toBeTruthy();
  });

  it("keeps a full-width Enroll action on every card", async () => {
    phone = true;
    render(<AdaptiveCourseCatalogPage />);
    await screen.findByText("Python Basics");
    expect(screen.getAllByRole("button", { name: /Enroll/ })).toHaveLength(2);
  });
});
