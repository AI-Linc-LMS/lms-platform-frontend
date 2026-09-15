import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * The "Action URL" presets an admin can attach to an announcement.
 *
 * Every learner who taps the notification is sent to that URL. The course presets used to be one
 * static list: "Courses" -> /adaptive-courses and "Classic courses" -> /courses, for every tenant.
 * On a classic-only tenant (Kuwomens, 21: `course`, no `adaptive_quiz`) the admin's usual
 * "Courses" chip therefore sent every learner to "Courses aren't enabled for this organisation".
 */

const state = vi.hoisted(() => ({ features: [] as string[] }));

// The feature hooks read the same list, and are the same strict checks the two course pages gate
// on: /adaptive-courses refuses a tenant without `adaptive_quiz`, /courses one without `course`.
vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({
    clientInfo: { id: 21, features: state.features.map((name, id) => ({ id, name })) },
    loading: false,
  }),
  useIsAdaptiveQuizEnabled: () => state.features.includes("adaptive_quiz"),
  useIsCourseEnabled: () => state.features.includes("course"),
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({ ModulePageHeader: () => null }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/admin/admin-notification.service", () => ({
  adminNotificationService: { sendCustomNotification: vi.fn() },
}));
// The page loads the student picker on mount. Left pending, so the load settles nothing after the
// assertions and the render stays synchronous.
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: { getManageStudents: () => new Promise(() => {}) },
}));
vi.mock("@/lib/services/admin/admin-courses.service", () => ({
  adminCoursesService: { getCourses: () => Promise.resolve([]) },
}));

import AdminNotificationsPage from "./page";

/** Preset chip labels, in render order. */
function presets(): string[] {
  const field = screen.getByLabelText(/Action URL/);
  const row = field.closest(".MuiFormControl-root")?.nextElementSibling;
  if (!row) throw new Error("preset row did not render after the Action URL field");
  return Array.from(row.querySelectorAll(".MuiChip-label")).map((c) => c.textContent ?? "");
}

beforeEach(() => {
  cleanup();
  state.features = [];
});

describe("notification action URL presets: courses", () => {
  it("a classic-only tenant gets the classic preset and no dead-end Courses preset", () => {
    state.features = ["course", "assessment", "jobs_v2"];
    render(<AdminNotificationsPage />);

    expect(presets()).toContain("Classic courses");
    expect(presets()).not.toContain("Courses");

    fireEvent.click(screen.getByText("Classic courses"));
    expect((screen.getByLabelText(/Action URL/) as HTMLInputElement).value).toBe("/courses");
  });

  it("an adaptive-only tenant gets Courses to /adaptive-courses and no classic preset", () => {
    state.features = ["adaptive_quiz", "assessment"];
    render(<AdminNotificationsPage />);

    expect(presets()).toContain("Courses");
    expect(presets()).not.toContain("Classic courses");

    fireEvent.click(screen.getByText("Courses"));
    expect((screen.getByLabelText(/Action URL/) as HTMLInputElement).value).toBe(
      "/adaptive-courses",
    );
  });

  it("a tenant with both keys gets both presets, and the other presets are unchanged", () => {
    state.features = ["course", "adaptive_quiz"];
    render(<AdminNotificationsPage />);

    expect(presets()).toEqual([
      "Dashboard",
      "Courses",
      "Classic courses",
      "Jobs",
      "Assessments",
      "Community",
      "Profile",
    ]);
  });

  it("a tenant with no features gets no course preset, because neither course page opens for it", () => {
    render(<AdminNotificationsPage />);

    expect(presets()).toEqual(["Dashboard", "Jobs", "Assessments", "Community", "Profile"]);
  });
});
