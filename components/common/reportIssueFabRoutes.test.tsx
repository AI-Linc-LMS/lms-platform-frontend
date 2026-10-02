// @vitest-environment jsdom
/**
 * Where the floating support button is NOT shown.
 *
 * It is a 56px circle fixed to the bottom-right corner, and on a surface the learner is in the
 * middle of it lands beside their own controls. In a live tutor lesson that is "End session",
 * which is the last button anybody wants to miss by a few pixels.
 */

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { usePathname, useParams } = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useParams: vi.fn(() => ({})),
}));
vi.mock("next/navigation", () => ({ usePathname, useParams }));
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { role: "student" } }),
}));
vi.mock("./ReportIssueDialog", () => ({ ReportIssueDialog: () => null }));

import { ReportIssueFAB } from "./ReportIssueFAB";

function shownOn(path: string): boolean {
  usePathname.mockReturnValue(path);
  const view = render(<ReportIssueFAB />);
  const present = screen.queryByLabelText("support and help") !== null;
  view.unmount();
  return present;
}

describe("the support button's route rules", () => {
  afterEach(() => vi.clearAllMocks());

  it("is hidden in a live tutor lesson", () => {
    expect(shownOn("/ai-tutor/session/9f3a2b1c-0000-4aaa-8bbb-ccccdddd1111")).toBe(false);
  });

  it("is still there on the page where you START a lesson", () => {
    // Somebody who cannot get a lesson to begin is exactly who needs support.
    expect(shownOn("/ai-tutor/session/new")).toBe(true);
  });

  it("is still there on the recap, which is an ordinary page", () => {
    expect(shownOn("/ai-tutor/session/9f3a2b1c-0000-4aaa-8bbb-ccccdddd1111/recap")).toBe(true);
  });

  it("is still there on the AI Tutor home", () => {
    expect(shownOn("/ai-tutor")).toBe(true);
  });

  it("keeps the exclusions it already had", () => {
    expect(shownOn("/assessments/python-basics/take")).toBe(false);
    expect(shownOn("/mock-interview/42/take")).toBe(false);
  });

  it("is there on an ordinary page", () => {
    expect(shownOn("/dashboard")).toBe(true);
  });
});
