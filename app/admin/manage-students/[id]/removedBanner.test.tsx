import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * A removed student's detail page.
 *
 * The Removed tab opens the same profile a member has, so the page has to say, before anything
 * else, that this person cannot sign in and who removed them when, and offer the way back. The
 * account-status switch is held while they are removed: it writes the shared login's is_active
 * across every tenant, and flipping it here would read as "let them back in" while doing nothing
 * of the kind.
 */

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  getStudent: vi.fn(),
  restore: vi.fn(),
  user: { role: "admin" },
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "7" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));
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
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ user: mocks.user, loading: false }) }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/scorecard/shared", () => ({
  SectionHero: ({ title, subtitle, rightSlot }: { title: string; subtitle?: string; rightSlot?: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div data-testid="hero-right">{rightSlot}</div>
    </header>
  ),
  KpiRail: () => null,
  SectionShell: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));
// The journey tabs and the two fetching cards inside the Manage tab are not what is under test.
vi.mock("@/components/admin/manage-students/detail/OverviewTab", () => ({ OverviewTab: () => null }));
vi.mock("@/components/admin/manage-students/detail/CoursesTab", () => ({ CoursesTab: () => null }));
vi.mock("@/components/admin/manage-students/detail/AssessmentsTab", () => ({ AssessmentsTab: () => null }));
vi.mock("@/components/admin/manage-students/detail/MockInterviewsTab", () => ({ MockInterviewsTab: () => null }));
vi.mock("@/components/admin/manage-students/detail/AdaptiveTab", () => ({ AdaptiveTab: () => null }));
vi.mock("@/components/admin/manage-students/detail/TimelineTab", () => ({ TimelineTab: () => null }));
vi.mock("@/components/admin/manage-students/CourseManagementCard", () => ({ CourseManagementCard: () => null }));
vi.mock("@/components/admin/manage-students/detail/ResetProgressCard", () => ({ ResetProgressCard: () => null }));
vi.mock("@/components/admin/manage-students/StudentResumeButton", () => ({ StudentResumeButton: () => null }));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: {
    getStudent: mocks.getStudent,
    getLearningJourney: () => Promise.reject(new Error("not under test")),
    restoreToOrganisation: mocks.restore,
    activateStudent: vi.fn(),
    deactivateStudent: vi.fn(),
    updateStudent: vi.fn(),
  },
}));

import StudentDetailsPage from "./page";

const REMOVED_AT = "2026-10-20T12:00:00Z";

const detail = (over: Record<string, unknown> = {}) => ({
  id: 7,
  user_id: 1007,
  personal_info: {
    first_name: "Asha",
    last_name: "Rao",
    email: "asha@example.com",
    username: "asha",
    date_joined: "2026-01-05T00:00:00Z",
    last_login: "2026-10-01T00:00:00Z",
    is_active: true,
  },
  academic_summary: {
    total_marks: 0,
    total_time_spent: { value: 0, unit: "hours" },
    enrolled_courses_count: 1,
    assessment_submissions_count: 0,
    current_streak: 0,
    total_activities: 0,
  },
  enrolled_courses: [],
  activity_pattern_30_days: [],
  assessments: [],
  activity_breakdown: {},
  ...over,
});
const removedDetail = (over: Record<string, unknown> = {}) =>
  detail({
    membership: "removed",
    removed_at: REMOVED_AT,
    removed_by: { id: 3, name: "Priya Admin" },
    ...over,
  });

const BANNER =
  "Removed from your organisation on Oct 20, 2026 by Priya Admin. They cannot sign in. Enrolments and progress are kept.";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.role = "admin";
});
afterEach(() => {
  mocks.getStudent.mockReset();
  mocks.restore.mockReset();
});

async function renderPage() {
  render(<StudentDetailsPage />);
  await screen.findByRole("heading", { name: "Asha Rao" });
}

const openManageTab = () => fireEvent.click(screen.getByRole("tab", { name: /Manage/ }));
// MUI v7 renders a Switch's input with role="switch".
const statusSwitch = () => screen.getByRole("switch", { name: "Account status" });

describe("a removed student's page", () => {
  it("says who removed them and when, before anything else, and offers Add back", async () => {
    mocks.getStudent.mockResolvedValueOnce(removedDetail()).mockResolvedValueOnce(detail());
    mocks.restore.mockResolvedValue({ membership: "active", restored: true });
    await renderPage();

    const banner = screen.getByTestId("removed-banner");
    expect(banner.textContent).toContain(BANNER);
    // The header chip reads Removed, not Active: is_active is still true, and it is not the
    // state that matters while they cannot sign in here.
    expect(within(screen.getByTestId("hero-right")).getByTestId("removed-chip").textContent).toBe("Removed");
    expect(screen.queryByText("Active")).toBeNull();

    fireEvent.click(within(banner).getByRole("button", { name: "Add back" }));
    await waitFor(() => expect(mocks.restore).toHaveBeenCalledWith(7));
    // The record is re-read rather than patched; the member the server returns closes the banner.
    await waitFor(() => expect(mocks.getStudent).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByTestId("removed-banner")).toBeNull());
    expect(mocks.showToast).toHaveBeenCalledWith("Asha Rao added back. They can sign in again.", "success");
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("holds the account-status switch, and says why", async () => {
    mocks.getStudent.mockResolvedValue(removedDetail());
    await renderPage();
    openManageTab();
    expect(statusSwitch()).toBeDisabled();
    expect(screen.getByTestId("account-status-removed-note").textContent).toBe(
      "Add this student back to change their account status.",
    );
  });

  it("names an administrator when the removing admin's profile is gone", async () => {
    mocks.getStudent.mockResolvedValue(removedDetail({ removed_by: null }));
    await renderPage();
    expect(screen.getByTestId("removed-banner").textContent).toContain(
      "Removed from your organisation on Oct 20, 2026 by an administrator.",
    );
  });

  it("shows the banner to a scoped role without the Add back it may not use", async () => {
    mocks.user.role = "instructor";
    mocks.getStudent.mockResolvedValue(removedDetail());
    await renderPage();
    const banner = screen.getByTestId("removed-banner");
    expect(banner.textContent).toContain(BANNER);
    expect(within(banner).queryByRole("button", { name: "Add back" })).toBeNull();
  });

  it("reports a failed add-back and keeps the banner", async () => {
    mocks.getStudent.mockResolvedValue(removedDetail());
    mocks.restore.mockRejectedValue({
      response: { data: { error: "Only an admin can add a student back to the organisation." } },
    });
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Add back" }));
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith(
        "Only an admin can add a student back to the organisation.",
        "error",
      ),
    );
    expect(screen.getByTestId("removed-banner")).toBeTruthy();
    expect(mocks.getStudent).toHaveBeenCalledTimes(1);
  });
});

describe("a member's page", () => {
  it("carries no banner, an Active chip and a live account-status switch", async () => {
    mocks.getStudent.mockResolvedValue(detail());
    await renderPage();
    expect(screen.queryByTestId("removed-banner")).toBeNull();
    expect(screen.queryByTestId("removed-chip")).toBeNull();
    expect(within(screen.getByTestId("hero-right")).getByText("Active")).toBeTruthy();
    openManageTab();
    expect(statusSwitch()).not.toBeDisabled();
    expect(screen.queryByTestId("account-status-removed-note")).toBeNull();
  });

  it("reads a record from an older server, with no membership field, as a member", async () => {
    mocks.getStudent.mockResolvedValue(detail({ membership: undefined }));
    await renderPage();
    expect(screen.queryByTestId("removed-banner")).toBeNull();
  });
});
