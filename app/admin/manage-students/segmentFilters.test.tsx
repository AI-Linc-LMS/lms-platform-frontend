import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * Manage Students documented SIX engagement-health signals in its "How these signals are
 * calculated" popover and offered FOUR chips under it: "Never logged in" and "Never active" could
 * be read about but never listed. On ZSkillup that is 2,354 and 2,082 students.
 *
 * What is pinned here: every documented signal has a chip, each chip's NUMBER is the number of
 * rows selecting it yields (same population, same predicate), and exactly one segment applies at
 * a time - the signals overlap by design, so the chips are a single choice, not a set.
 */

const realMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = realMatchMedia;
  vi.restoreAllMocks();
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
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

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

/**
 * Five students chosen so that every signal has a different, non-empty answer - including the
 * overlaps ("at risk" is a compound; "inactive 30d" includes "never active").
 *
 *            login  activity   enrolled  completion   signals
 *   Asha     yes    1 day      yes       80%          high performers
 *   Omar     yes    100 days   yes       10%          at risk, inactive, low completion
 *   Ghost    never  never      yes       0%           at risk, inactive, low completion,
 *                                                     never logged in, never active
 *   Dia      never  2 days     no        50%          never logged in
 *   Eve      yes    never      no        50%          never active
 */
const roster = [
  { id: 7, user_id: 1007, name: "Asha Rao", last_login: ago(1), last_activity_date: ago(1), activities: 9, enrollment_count: 1, at_risk: false, pct: 80 },
  { id: 8, user_id: 1008, name: "Omar Khan", last_login: ago(2), last_activity_date: ago(100), activities: 3, enrollment_count: 1, at_risk: true, pct: 10 },
  { id: 9, user_id: 1009, name: "Ghost Patel", last_login: null, last_activity_date: null, activities: 0, enrollment_count: 1, at_risk: true, pct: 0 },
  { id: 10, user_id: 1010, name: "Dia Sen", last_login: null, last_activity_date: ago(2), activities: 2, enrollment_count: 0, at_risk: false, pct: 50 },
  { id: 11, user_id: 1011, name: "Eve Lin", last_login: ago(3), last_activity_date: null, activities: 0, enrollment_count: 0, at_risk: false, pct: 50 },
];

vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getManageStudents: () =>
      Promise.resolve({
        students: roster.map((s) => ({
          id: s.id,
          user_id: s.user_id,
          name: s.name,
          email: `${s.id}@example.com`,
          is_active: true,
          last_login: s.last_login,
          last_activity_date: s.last_activity_date,
          activity_summary: { total_activities: s.activities, by_type: {} },
          enrollment_count: s.enrollment_count,
          at_risk: s.at_risk,
          cohorts: [],
        })),
      }),
    // Keyed by UserProfile id, which is `Student.id` - the key the server sends.
    getCourseCompletionStats: () =>
      Promise.resolve(
        roster.map((s) => ({
          student_id: s.id,
          completion_percentage: s.pct,
          attendance_percentage: 0,
          total_attendance_activities: 0,
        })),
      ),
  },
}));

import ManageStudentsPage from "./page";
import { STUDENT_SIGNALS } from "@/lib/utils/student-risk";

const EXPECTED: Record<string, string[]> = {
  at_risk: ["Omar Khan", "Ghost Patel"],
  inactive: ["Omar Khan", "Ghost Patel"],
  low_completion: ["Omar Khan", "Ghost Patel"],
  high_performers: ["Asha Rao"],
  never_logged_in: ["Ghost Patel", "Dia Sen"],
  never_active: ["Ghost Patel", "Eve Lin"],
};

const chip = (key: string) => screen.getByTestId(`segment-chip-${key}`);
const countOn = (key: string) => Number(screen.getByTestId(`segment-count-${key}`).textContent);
const rowNames = () =>
  screen.queryAllByTestId("student-row").map((row) => {
    const text = row.textContent ?? "";
    return roster.find((s) => text.includes(s.name))?.name ?? text;
  });

async function renderPage() {
  render(<ManageStudentsPage />);
  await screen.findByText("Asha Rao");
  // The completion stats arrive after the students; the % chips depend on them.
  await waitFor(() => expect(screen.getByTestId("segment-count-high_performers").textContent).toBe("1"));
}

describe("the engagement-health segments", () => {
  it("offers a chip for every signal the popover documents", async () => {
    await renderPage();
    expect(STUDENT_SIGNALS).toHaveLength(6);

    // Before: four chips under a popover listing six signals.
    const chips = STUDENT_SIGNALS.map((s) => chip(s.key));
    expect(chips).toHaveLength(6);

    fireEvent.click(screen.getByRole("button", { name: "How segments are calculated" }));
    await screen.findByText("How these signals are calculated");
    const documented = Array.from(document.querySelectorAll("[data-signal]")).map((el) =>
      el.getAttribute("data-signal"),
    );
    expect(documented).toHaveLength(6);
    expect(new Set(documented)).toEqual(new Set(STUDENT_SIGNALS.map((s) => s.key)));
  });

  it("gives each chip a number that equals the rows it opens", async () => {
    await renderPage();
    for (const signal of STUDENT_SIGNALS) {
      const expected = EXPECTED[signal.key];
      expect(countOn(signal.key), signal.key).toBe(expected.length);

      fireEvent.click(chip(signal.key));
      await waitFor(() => expect(rowNames()).toHaveLength(expected.length));
      expect(rowNames().sort(), signal.key).toEqual([...expected].sort());

      // Clear it again: clicking the selected chip is how you get back to everyone.
      fireEvent.click(chip(signal.key));
      await waitFor(() => expect(rowNames()).toHaveLength(roster.length));
    }
  });

  it("applies exactly one segment at a time - picking another replaces it", async () => {
    await renderPage();
    fireEvent.click(chip("never_logged_in"));
    await waitFor(() => expect(rowNames().sort()).toEqual(["Dia Sen", "Ghost Patel"]));
    expect(chip("never_logged_in")).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(chip("never_active"));
    // Not the intersection (Ghost alone) and not the union: the second choice replaces the first.
    await waitFor(() => expect(rowNames().sort()).toEqual(["Eve Lin", "Ghost Patel"]));
    expect(chip("never_logged_in")).toHaveAttribute("aria-pressed", "false");
    expect(chip("never_active")).toHaveAttribute("aria-pressed", "true");
  });

  it("counts against the search and status filters, not against the whole tenant", async () => {
    await renderPage();
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "Ghost" } });
    await waitFor(() => expect(rowNames()).toEqual(["Ghost Patel"]));
    // A chip number that ignored the search would promise rows the chip cannot open.
    expect(countOn("never_logged_in")).toBe(1);

    fireEvent.click(chip("never_logged_in"));
    await waitFor(() => expect(rowNames()).toEqual(["Ghost Patel"]));
    expect(countOn("never_active")).toBe(1);
  });
});
