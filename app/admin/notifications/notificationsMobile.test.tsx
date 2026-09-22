import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";

/**
 * The notification composer on a phone.
 *
 * Four icon+label audience buttons in one row are ~470px wide, wider than a 390px screen. On a
 * phone they become a 2x2 grid of 44px buttons; a desktop keeps the joined button group.
 */

vi.mock("@/lib/contexts/ClientInfoContext", () => ({
  useClientInfo: () => ({ clientInfo: { id: 34, features: [] }, loading: false }),
  useIsAdaptiveQuizEnabled: () => true,
  useIsCourseEnabled: () => false,
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({ ModulePageHeader: () => null }));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/admin/admin-notification.service", () => ({
  adminNotificationService: { sendCustomNotification: vi.fn() },
}));
vi.mock("@/lib/services/admin/admin-student.service", () => ({
  adminStudentService: { getManageStudents: () => new Promise(() => {}) },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: { listCourses: () => Promise.resolve([]) },
}));
vi.mock("@/lib/services/admin/admin-cohorts.service", () => ({
  adminCohortsService: { listCohorts: () => Promise.resolve([]) },
}));

import AdminNotificationsPage from "./page";

afterEach(() => cleanup());

function expectPhoneOnly(el: Element, decl: RegExp) {
  const css = cssByMedia(el);
  expect(css.phone).toMatch(decl);
  expect(css.unscoped).not.toMatch(decl);
}

describe("notification composer on a phone", () => {
  it("the audience buttons are a 2x2 grid of 44px buttons on a phone only", () => {
    render(<AdminNotificationsPage />);
    const group = screen.getByRole("group");
    expectPhoneOnly(group, /display:grid;grid-template-columns:repeat\(2, minmax\(0, 1fr\)\)/);
    expectPhoneOnly(group, /min-height:44px/);
  });

  it("the action URL presets are 44px chips on a phone only", () => {
    render(<AdminNotificationsPage />);
    const chip = screen.getByText("Dashboard").closest(".MuiChip-root")!;
    expectPhoneOnly(chip, /height:44px/);
  });

  it("Send is full width and 48px on a phone only", () => {
    render(<AdminNotificationsPage />);
    const send = screen.getByRole("button", { name: /Send Notification/ });
    expectPhoneOnly(send, /width:100%;min-height:48px/);
  });
});
