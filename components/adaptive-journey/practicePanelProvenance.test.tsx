// @vitest-environment jsdom
/**
 * The badge has to be WIRED IN, not merely correct in isolation.
 *
 * practiceSourceBadge.test.tsx proves the component says the right thing. It would keep passing
 * if the panel never rendered it, which is the failure that actually ships. This renders the
 * real AdditionalPractice panel against a mocked service and asserts the learner sees where
 * each set came from.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSubmodulePractice = vi.fn();
const generatePractice = vi.fn();

vi.mock("@/lib/services/adaptive-course.service", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/lib/services/adaptive-course.service",
  );
  return {
    ...actual,
    adaptiveCourseService: { getSubmodulePractice, generatePractice },
  };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const usage = { used: 8, limit: 20, left: 12, by_kind: { quiz: 5, coding: 3, article: 0 } };

function state(items: unknown[]) {
  return { usage, items };
}

describe("the practice panel tells the learner where each set came from", () => {
  beforeEach(() => {
    getSubmodulePractice.mockReset();
    generatePractice.mockReset();
  });

  async function renderPanel(items: unknown[]) {
    getSubmodulePractice.mockResolvedValue(state(items));
    const { AdditionalPractice } = await import(
      "@/components/adaptive-journey/AdditionalPractice"
    );
    const view = render(<AdditionalPractice courseId={33} submoduleId={1443} />);
    await waitFor(() => expect(getSubmodulePractice).toHaveBeenCalled());
    // The panel ships collapsed; the items list (and so the badges) only exist once it is
    // opened, which is exactly how a learner reaches them.
    const toggle = view.container.querySelector('[data-icon="mdi:chevron-down"]');
    expect(toggle).not.toBeNull();
    fireEvent.click(toggle!.closest("button") ?? toggle!);
    return view;
  }

  it("marks a bank-drawn set as coming from the question bank", async () => {
    await renderPanel([{
      id: "quiz-1", kind: "quiz", title: "The event loop", item_count: 5,
      created_at: new Date(0).toISOString(), config_id: 1,
      source: "bank", from_bank: 5, from_ai: 0,
    }]);
    expect(await screen.findByText("From the question bank")).toBeInTheDocument();
  });

  it("shows the split on a mixed set", async () => {
    await renderPanel([{
      id: "quiz-2", kind: "quiz", title: "Streams", item_count: 10,
      created_at: new Date(0).toISOString(), config_id: 2,
      source: "mixed", from_bank: 7, from_ai: 3,
    }]);
    expect(
      await screen.findByText("7 questions from the bank · 3 newly written"),
    ).toBeInTheDocument();
  });

  it("says nothing about provenance for an item from an older server", async () => {
    await renderPanel([{
      id: "quiz-3", kind: "quiz", title: "Buffers", item_count: 5,
      created_at: new Date(0).toISOString(), config_id: 3,
    }]);
    await screen.findByText("Buffers");
    // Assert the BADGE strings exactly. A loose /question bank/i also matches the panel's own
    // subtitle, which explains where practice comes from in general and is true regardless of
    // any one item - a first draft of this test failed on exactly that.
    expect(screen.queryByText("From the question bank")).not.toBeInTheDocument();
    expect(screen.queryByText("Written for you")).not.toBeInTheDocument();
    expect(screen.queryByText(/from the bank ·/)).not.toBeInTheDocument();
  });

  it("no longer tells the learner everything here was generated", async () => {
    // The panel used to say "generate" in the pill, the subtitle, the quota meter, the step
    // label, the CTA, the footnote and the results heading. Most of that is now untrue for a
    // bank-backed set, and the heading above the list is the most visible of them.
    await renderPanel([{
      id: "quiz-4", kind: "quiz", title: "Routing", item_count: 5,
      created_at: new Date(0).toISOString(), config_id: 4,
      source: "bank", from_bank: 5, from_ai: 0,
    }]);
    await screen.findByText("Routing");
    expect(screen.queryByText(/YOUR GENERATED PRACTICE/i)).not.toBeInTheDocument();
    expect(screen.getByText(/YOUR PRACTICE/i)).toBeInTheDocument();
  });
});
