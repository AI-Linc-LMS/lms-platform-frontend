// @vitest-environment jsdom
/**
 * Where the floating support button is NOT shown.
 *
 * It is a 56px circle fixed to the bottom-right corner, and on a surface the learner is in the
 * middle of it lands beside their own controls. In a live tutor lesson that is "End session",
 * which is the last button anybody wants to miss by a few pixels.
 *
 * The thing this file got wrong the first time: the lesson room's pathname is
 * `/ai-tutor/session/new` for the WHOLE lesson. The session id is never written into the URL,
 * because the global camera guard tears media down on a pathname change
 * (app/ai-tutor/session/[id]/page.tsx:38). `new` is therefore the ROOM, not a setup form, and
 * `/ai-tutor/session/<uuid>` is a path the app never visits. Asserting the button was shown on
 * `new` and hidden on a uuid asserted the exact opposite of the fix, and passed.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

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

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

describe("the support button's route rules", () => {
  afterEach(() => vi.clearAllMocks());

  it("is hidden in a live tutor lesson", () => {
    // `usePathname()` drops the query string, so the room is exactly this.
    expect(shownOn("/ai-tutor/session/new")).toBe(false);
  });

  it("hides the room path that /ai-tutor actually links to", () => {
    // Pins the two facts to each other: if the room's URL ever changes, this fails instead of
    // the button quietly coming back.
    const href = read("app/ai-tutor/page.tsx").match(
      /`(\/ai-tutor\/session\/[^`?]+)\?\$\{params/
    )?.[1];
    expect(href).toBe("/ai-tutor/session/new");
    expect(shownOn(href!)).toBe(false);
  });

  it("stays hidden if the room ever does carry the session id", () => {
    expect(shownOn("/ai-tutor/session/9f3a2b1c-0000-4aaa-8bbb-ccccdddd1111")).toBe(false);
  });

  it("is still there on the page where you START a lesson, which is /ai-tutor itself", () => {
    // Somebody who cannot get a lesson to begin is exactly who needs support, and there is no
    // separate setup route: /ai-tutor is the form and it links straight into the room.
    expect(shownOn("/ai-tutor")).toBe(true);
  });

  it("is still there on the recap, which is an ordinary page", () => {
    expect(shownOn("/ai-tutor/session/9f3a2b1c-0000-4aaa-8bbb-ccccdddd1111/recap")).toBe(true);
  });

  it("keeps the exclusions it already had", () => {
    expect(shownOn("/assessments/python-basics/take")).toBe(false);
    expect(shownOn("/mock-interview/42/take")).toBe(false);
  });

  it("is there on an ordinary page", () => {
    expect(shownOn("/dashboard")).toBe(true);
  });
});
