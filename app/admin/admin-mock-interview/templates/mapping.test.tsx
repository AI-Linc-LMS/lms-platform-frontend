import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * What "map this interview to a course" means, now that a legacy course tag means nothing.
 *
 * Since BE-A3c an interview reaches a candidate through an adaptive course or a batch; the legacy
 * `courses` M2M admits nobody. The form still offered it as a picker, sent it on every save, and
 * the list still drew a chip for it — so an interview mapped only to a retired tag read as mapped
 * and reached nobody, and the button said "Publish interview" for an audience of zero.
 */

const created = vi.hoisted(() => ({ payloads: [] as Array<Record<string, unknown>> }));

const TEMPLATE = {
  id: 1,
  title: "SQL Interview",
  topic: "SQL",
  subtopic: "SQL",
  difficulty: "Medium",
  duration_minutes: 7,
  description: "",
  is_active: true,
  // The shape production has: a retired tag still on the row, and the adaptive mapping that
  // actually decides who sees it.
  course_ids: [77],
  courses: [{ id: 77, title: "Retired SQL" }],
  adaptive_course_ids: [5],
  adaptive_courses: [{ id: 5, title: "Data Science" }],
  attempt_count: 0,
  num_coding_questions: 2,
  num_mcq_questions: 1,
  result_release_mode: "manual",
  result_release_at: null,
  resume_enabled: true,
  resume_window_minutes: null,
  status: "published",
  attempts_allowed: 1,
  opens_at: null,
  closes_at: null,
  window_state: "open",
  is_open_now: true,
};

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));
vi.mock("@/components/layout/MainLayout", () => ({
  MainLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/lib/services/interview.service", () => ({
  default: { getParticipants: () => new Promise(() => {}) },
}));
vi.mock("@/lib/services/admin/admin-adaptive-course.service", () => ({
  adminAdaptiveCourseService: {
    listCourses: () =>
      Promise.resolve([
        { id: 5, title: "Data Science", is_published: true },
        { id: 6, title: "Product Development", is_published: true },
      ]),
  },
}));
vi.mock("@/lib/services/admin/admin-mock-interview.service", () => ({
  default: {
    listTemplates: () => Promise.resolve([TEMPLATE]),
    createTemplate: (payload: Record<string, unknown>) => {
      created.payloads.push(payload);
      return Promise.resolve({ ...TEMPLATE, id: 2 });
    },
    updateTemplate: (_id: number, payload: Record<string, unknown>) => {
      created.payloads.push(payload);
      return Promise.resolve(TEMPLATE);
    },
    listTemplateAttempts: () => Promise.resolve([]),
  },
}));

import TemplatesPage from "./page";

describe("mapping an interview to a course", () => {
  beforeEach(() => {
    created.payloads = [];
    cleanup();
  });

  it("names the adaptive mapping on the card, not the retired tag", async () => {
    render(<TemplatesPage />);
    await waitFor(() => expect(screen.getAllByText(/Data Science/).length).toBeGreaterThan(0), {
      timeout: 15000,
    });
    // The retired tag is not presented as this interview's mapping: it maps nobody to it.
    expect(screen.queryByText("Retired SQL")).toBeNull();
  });

  it("does not send course_ids when the admin saves", async () => {
    render(<TemplatesPage />);
    await waitFor(() => expect(screen.getAllByText(/Data Science/).length).toBeGreaterThan(0), {
      timeout: 15000,
    });

    // Editing the existing template is the path that matters: it loads the row into the form and
    // saves it back, which is where a legacy tag would be carried in and sent again.
    const edit = screen
      .getAllByRole("button")
      .find((b) => /^Edit$/.test((b.textContent ?? "").trim()));
    expect(edit).toBeTruthy();
    fireEvent.click(edit as HTMLElement);

    const save = await waitFor(
      () => {
        const button = screen
          .getAllByRole("button")
          .find((b) => /Save changes/.test(b.textContent ?? ""));
        expect(button).toBeTruthy();
        return button as HTMLElement;
      },
      { timeout: 15000 },
    );
    fireEvent.click(save);

    await waitFor(() => expect(created.payloads.length).toBeGreaterThan(0), { timeout: 15000 });
    for (const payload of created.payloads) {
      expect("course_ids" in payload).toBe(false);
      expect("adaptive_course_ids" in payload).toBe(true);
    }
  });
});
