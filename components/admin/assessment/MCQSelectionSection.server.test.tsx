// @vitest-environment jsdom
/**
 * The question picker asked the browser to hold the whole bank.
 *
 * It derived its topic/skill/tag dropdowns from the full array and searched, faceted and paged
 * over it in memory, so the assessment builder pulled every question in the tenant before it
 * rendered anything. Measured in prod: 167,752 MCQs platform-wide, 28,086 in the largest single
 * tenant.
 *
 * Server mode is opt-in, and these tests guard the two ways it could go quietly wrong: the
 * count it shows must be how many questions MATCH rather than how many are on screen, and the
 * old in-memory behaviour must survive untouched for the callers that still rely on it.
 */

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MCQSelectionSection } from "./MCQSelectionSection";

const ROWS = [
  {
    id: 1, question_text: "What is a closure?", option_a: "a", option_b: "b",
    option_c: "c", option_d: "d", correct_option: "A", difficulty_level: "easy",
    topic: "Functions", skills: "javascript", tags: "core",
  },
  {
    id: 2, question_text: "What is a promise?", option_a: "a", option_b: "b",
    option_c: "c", option_d: "d", correct_option: "B", difficulty_level: "hard",
    topic: "Async", skills: "javascript", tags: "core",
  },
];

const FACETS = { topics: ["Async", "Functions"], skills: ["javascript"], tags: ["core"] };

function renderPicker(overrides: Record<string, unknown> = {}) {
  const onSelectionChange = vi.fn();
  const utils = render(
    <MCQSelectionSection
      selectedIds={[]}
      onSelectionChange={onSelectionChange}
      mcqs={ROWS}
      loading={false}
      {...overrides}
    />,
  );
  return { ...utils, onSelectionChange };
}

describe("MCQSelectionSection - server mode", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("reports how many questions MATCH, not how many are on screen", async () => {
    // Two rows rendered, 11,257 in the bank. Showing "2 results" would tell an admin their
    // question bank is nearly empty.
    renderPicker({
      server: { facetOptions: FACETS, totalCount: 11257, onQueryChange: vi.fn() },
    });

    expect(await screen.findByText(/11257 results/i)).toBeTruthy();
  });

  it("asks the server for the typed search rather than filtering in the browser", async () => {
    const onQueryChange = vi.fn();
    renderPicker({ server: { facetOptions: FACETS, totalCount: 2, onQueryChange } });
    onQueryChange.mockClear();

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByLabelText(/search questions/i), "promise");
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(onQueryChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: "promise", page: 1 }),
      );
    });
  });

  it("debounces, so a typed word is one request and not seven", async () => {
    const onQueryChange = vi.fn();
    renderPicker({ server: { facetOptions: FACETS, totalCount: 2, onQueryChange } });
    onQueryChange.mockClear();

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.type(screen.getByLabelText(/search questions/i), "promise");
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    const searched = onQueryChange.mock.calls
      .map(([q]) => q.search)
      .filter((term: string) => term !== "");
    expect(new Set(searched)).toEqual(new Set(["promise"]));
  });

  it("shows the rows the server returned without re-filtering them", async () => {
    // The server matched on a rule the browser does not implement; dropping rows here would
    // silently lose real matches.
    render(
      <MCQSelectionSection
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        mcqs={ROWS}
        loading={false}
        server={{ facetOptions: FACETS, totalCount: 2, onQueryChange: vi.fn() }}
      />,
    );

    expect(await screen.findByText(/What is a closure\?/)).toBeTruthy();
    expect(screen.getByText(/What is a promise\?/)).toBeTruthy();
  });
});

describe("MCQSelectionSection - the in-memory behaviour it must not break", () => {
  it("still filters in the browser when no server mode is given", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.type(screen.getByLabelText(/search questions/i), "closure");

    await waitFor(() => {
      expect(screen.queryByText(/What is a promise\?/)).toBeNull();
    });
    expect(screen.getByText(/What is a closure\?/)).toBeTruthy();
  });

  it("still counts its own filtered rows when no server mode is given", async () => {
    renderPicker();
    expect(await screen.findByText(/2 results/i)).toBeTruthy();
  });
});
