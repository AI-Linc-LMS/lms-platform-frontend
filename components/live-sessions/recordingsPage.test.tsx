import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

/**
 * The recordings page as a module page: a view switch, a toolbar and a server-filtered list.
 *
 * What is pinned here is the SHAPE of the data flow, because each part of it is one convenient
 * edit away from undoing the cost decision the page exists for:
 *
 *  - the filters travel to the server. The page never pulls the archive down to sift it here.
 *  - facets ride with the first page only. Sending them on Load more is three extra queries per
 *    scroll for a list that cannot change under the reader's thumb.
 *  - the search box is debounced BEFORE the request, and a slow early response cannot overwrite
 *    a fast later one.
 *  - the notes reader is the shared per-occurrence dialog, so the list never carries a summary
 *    or a transcript, and nothing on the page ever carries a Zoom url.
 */

const getRecordings = vi.fn();
const push = vi.fn();

vi.mock("@/lib/services/live-sessions", () => ({
  studentLiveSessionsService: {
    getRecordings: (...a: unknown[]) => getRecordings(...a),
    getRecording: vi.fn().mockResolvedValue({}),
    getTranscript: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: ({ title, action }: { title: string; action?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {action}
    </div>
  ),
  HeaderActionButton: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
// The reader is shared with Live Sessions and tested there; here only WHICH occurrence it is
// handed matters.
vi.mock("@/components/live-sessions/StudentSessionSummaryDialog", () => ({
  StudentSessionSummaryDialog: (props: {
    activityId: number;
    occurrenceId?: number | null;
    topicName: string;
    open?: boolean;
  }) =>
    props.open ? (
      <div
        data-testid="notes-reader"
        data-activity={props.activityId}
        data-occurrence={props.occurrenceId ?? ""}
        data-topic={props.topicName}
      />
    ) : null,
}));
vi.mock("@/components/live-sessions/RecordingPlayerDialog", () => ({
  RecordingPlayerDialog: () => null,
}));

import RecordingsPage from "@/app/recordings/page";

const recRow = (over: Record<string, unknown> = {}) => ({
  occurrence_id: 70,
  session_id: 7,
  title: "Sorting, in practice",
  course: "Data Structures",
  batch: "Batch 12",
  course_id: 9,
  batch_id: 3,
  instructor: "Asha Rao",
  held_at: new Date(Date.now() - 86_400_000).toISOString(),
  duration_minutes: 60,
  timezone: "UTC",
  is_zoom: true,
  is_google_meet: false,
  has_recording: true,
  has_transcript: false,
  has_summary: false,
  has_materials: false,
  notes_preview: null,
  attended: true,
  my_attendance: null,
  ...over,
});

const page = (sessions: Record<string, unknown>[], over: Record<string, unknown> = {}) => ({
  sessions,
  count: sessions.length,
  limit: 20,
  offset: 0,
  has_more: false,
  ...over,
});

const facets = (over: Record<string, unknown> = {}) => ({
  courses: [
    { id: 9, title: "Data Structures", count: 4 },
    { id: 10, title: "Algorithms", count: 2 },
  ],
  batches: [
    { id: 3, name: "Batch 12", count: 5 },
    { id: 4, name: "Batch 13", count: 1 },
  ],
  totals: { all: 6, recordings: 5, notes: 3 },
  ...over,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const lastCall = () => getRecordings.mock.calls.at(-1)?.[0] as Record<string, unknown>;
const flush = () => act(async () => {});
/** The phone chip row of the view switch: both branches are in the DOM, this one is the buttons. */
const viewChip = (name: RegExp) =>
  within(screen.getByRole("group", { name: "Recordings or notes" })).getByRole("button", { name });

/** Opens one of the toolbar's MUI selects and picks an option from its popover. */
async function choose(select: RegExp, option: RegExp) {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: select }));
  const item = await screen.findByRole("option", { name: option });
  await act(async () => {
    fireEvent.click(item);
  });
}

beforeEach(() => {
  vi.useRealTimers();
  getRecordings.mockReset();
  push.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the recordings module page", () => {
  it("asks for facets on the first page and not on Load more", async () => {
    getRecordings.mockResolvedValueOnce({
      ...page([recRow({ occurrence_id: 1, title: "First" })], { count: 2, has_more: true }),
      facets: facets(),
    });
    render(<RecordingsPage />);
    const more = await screen.findByTestId("load-more-recordings");
    expect(getRecordings).toHaveBeenCalledTimes(1);
    expect(lastCall()).toMatchObject({ offset: 0, facets: true });

    getRecordings.mockResolvedValueOnce(
      page([recRow({ occurrence_id: 2, title: "Second" })], { count: 2, offset: 1 }),
    );
    await act(async () => {
      fireEvent.click(more);
    });
    await screen.findByText("Second");
    expect(getRecordings).toHaveBeenCalledTimes(2);
    expect(lastCall().offset).toBe(1);
    expect(lastCall().facets).toBeFalsy();
    // Appended, not replaced.
    expect(screen.getByText("First")).toBeTruthy();
  });

  it("defaults to the Recordings view and sends has_recording", async () => {
    getRecordings.mockResolvedValue(page([recRow()]));
    render(<RecordingsPage />);
    await screen.findByTestId("recording-row");
    expect(lastCall().has_recording).toBe(true);
    expect(lastCall().has_notes).toBeFalsy();
    expect(viewChip(/recordings/i).getAttribute("aria-pressed")).toBe("true");
    expect(viewChip(/notes/i).getAttribute("aria-pressed")).toBe("false");
  });

  it("switches to the Notes view and sends has_notes instead", async () => {
    getRecordings.mockResolvedValue(page([recRow({ has_summary: true, notes_preview: "A preview." })]));
    render(<RecordingsPage />);
    await screen.findByTestId("recording-row");

    await act(async () => {
      fireEvent.click(viewChip(/notes/i));
    });
    expect(getRecordings).toHaveBeenCalledTimes(2);
    expect(lastCall()).toMatchObject({ has_notes: true, offset: 0, facets: true });
    expect(lastCall().has_recording).toBeFalsy();
    expect(viewChip(/notes/i).getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the view counts from the facets, so the badges agree with the list", async () => {
    getRecordings.mockResolvedValue({ ...page([recRow()]), facets: facets() });
    render(<RecordingsPage />);
    await screen.findByTestId("recording-row");
    expect(viewChip(/recordings/i).textContent).toBe("Recordings5");
    expect(viewChip(/notes/i).textContent).toBe("Notes3");
  });

  it("debounces the search box and sends q after 300ms from the first page", async () => {
    // Installed BEFORE render: a fake clock installed after mount leaves the hook's real timer
    // running and proves nothing.
    vi.useFakeTimers();
    getRecordings.mockResolvedValue({ ...page([recRow()]), facets: facets() });
    render(<RecordingsPage />);
    await flush();
    expect(getRecordings).toHaveBeenCalledTimes(1);

    const search = screen.getByPlaceholderText(/search by class, course or batch/i);
    fireEvent.change(search, { target: { value: "py" } });
    fireEvent.change(search, { target: { value: "pyt" } });
    // The box is instant; the request waits.
    expect((search as HTMLInputElement).value).toBe("pyt");
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(getRecordings).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(getRecordings).toHaveBeenCalledTimes(2);
    // One request for the settled text, from the first page, with facets; not one per keystroke.
    expect(lastCall()).toMatchObject({ q: "pyt", offset: 0, facets: true });
    // Let that response land inside act, so the test does not end on a pending state update.
    await flush();
  });

  it("replaces the list and resets to the first page when a filter changes", async () => {
    getRecordings.mockResolvedValueOnce({
      ...page([recRow({ occurrence_id: 1, title: "First" })], { count: 2, has_more: true }),
      facets: facets(),
    });
    render(<RecordingsPage />);
    const more = await screen.findByTestId("load-more-recordings");
    getRecordings.mockResolvedValueOnce(
      page([recRow({ occurrence_id: 2, title: "Second" })], { count: 2, offset: 1 }),
    );
    await act(async () => {
      fireEvent.click(more);
    });
    await screen.findByText("Second");

    getRecordings.mockResolvedValueOnce({
      ...page([recRow({ occurrence_id: 3, title: "Third", course: "Algorithms", course_id: 10 })]),
      facets: facets(),
    });
    await choose(/^course/i, /Algorithms/);
    await screen.findByText("Third");

    expect(lastCall()).toMatchObject({ course: 10, offset: 0, facets: true });
    expect(screen.queryByText("First")).toBeNull();
    expect(screen.queryByText("Second")).toBeNull();
    // The count line says it is a filtered view, and the chip row names the filter. The select
    // now shows the bare course title too (the archive-wide count was dropped from the option
    // label because it overstated a filtered view), so the chip has to be found as a chip.
    expect(screen.getByTestId("recordings-count").textContent).toMatch(/1 of 1 matching/);
    const chipLabels = [...document.querySelectorAll(".MuiChip-label")].map((el) => el.textContent ?? "");
    expect(chipLabels.some((t) => /Algorithms/.test(t))).toBe(true);
  });

  it("carries the same filters on Load more", async () => {
    getRecordings.mockResolvedValueOnce({ ...page([recRow()]), facets: facets() });
    render(<RecordingsPage />);
    await screen.findByTestId("recording-row");

    getRecordings.mockResolvedValueOnce({
      ...page([recRow({ occurrence_id: 1, title: "First" })], { count: 2, has_more: true }),
      facets: facets(),
    });
    await choose(/^batch/i, /Batch 13/);
    const more = await screen.findByTestId("load-more-recordings");

    getRecordings.mockResolvedValueOnce(
      page([recRow({ occurrence_id: 2, title: "Second" })], { count: 2, offset: 1 }),
    );
    await act(async () => {
      fireEvent.click(more);
    });
    await screen.findByText("Second");
    expect(lastCall()).toMatchObject({ batch: 4, offset: 1, has_recording: true });
    expect(lastCall().facets).toBeFalsy();
    expect(screen.getByText("First")).toBeTruthy();
  });

  it("ignores a stale response that arrives after a newer request", async () => {
    const older = deferred<Record<string, unknown>>();
    const newer = deferred<Record<string, unknown>>();
    getRecordings.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    render(<RecordingsPage />);
    await flush();

    await act(async () => {
      fireEvent.click(viewChip(/notes/i));
    });
    expect(getRecordings).toHaveBeenCalledTimes(2);

    // The second request answers first; then the first one limps in.
    await act(async () => {
      newer.resolve(page([recRow({ occurrence_id: 2, title: "Newer", has_summary: true, notes_preview: "x" })]));
    });
    await act(async () => {
      older.resolve(page([recRow({ occurrence_id: 1, title: "Older" })]));
    });
    expect(screen.getByText("Newer")).toBeTruthy();
    expect(screen.queryByText("Older")).toBeNull();
  });

  it("keeps the rows on screen, dimmed, while a filter change is in flight", async () => {
    getRecordings.mockResolvedValueOnce({ ...page([recRow({ title: "Still here" })]), facets: facets() });
    render(<RecordingsPage />);
    await screen.findByTestId("recording-row");

    const pending = deferred<Record<string, unknown>>();
    getRecordings.mockReturnValueOnce(pending.promise);
    await choose(/^course/i, /Algorithms/);
    const list = screen.getByTestId("recordings-list");
    expect(list.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Still here")).toBeTruthy();

    await act(async () => {
      pending.resolve(page([recRow({ title: "Replaced" })]));
    });
    expect(screen.getByTestId("recordings-list").getAttribute("aria-busy")).toBeNull();
    expect(screen.getByText("Replaced")).toBeTruthy();
    expect(screen.queryByText("Still here")).toBeNull();
  });

  it("shows the course and batch selects only when the viewer spans at least two", async () => {
    getRecordings.mockResolvedValue({
      ...page([recRow()]),
      facets: facets({ courses: [{ id: 9, title: "Data Structures", count: 6 }] }),
    });
    render(<RecordingsPage />);
    await screen.findByTestId("recording-row");
    // One course is not a choice; two batches are.
    expect(screen.queryByRole("combobox", { name: /^course/i })).toBeNull();
    expect(screen.getByRole("combobox", { name: /^batch/i })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: /^held/i })).toBeTruthy();
  });

  it("mounts the search box before the facets arrive", async () => {
    getRecordings.mockReturnValueOnce(deferred<Record<string, unknown>>().promise);
    render(<RecordingsPage />);
    expect(screen.getByPlaceholderText(/search by class, course or batch/i)).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: /^course/i })).toBeNull();
  });

  it("offers Clear filters when nothing matches and a filter is active", async () => {
    getRecordings.mockResolvedValueOnce({ ...page([recRow()]), facets: facets() });
    render(<RecordingsPage />);
    await screen.findByTestId("recording-row");

    getRecordings.mockResolvedValueOnce({ ...page([]), facets: facets() });
    await choose(/^course/i, /Algorithms/);
    await screen.findByText(/no recordings match these filters/i);
    expect(screen.queryByText(/no recordings yet/i)).toBeNull();

    getRecordings.mockResolvedValueOnce({ ...page([recRow()]), facets: facets() });
    await act(async () => {
      fireEvent.click(screen.getByText("Clear filters"));
    });
    await screen.findByTestId("recording-row");
    expect(lastCall().course).toBeUndefined();
    expect(lastCall().offset).toBe(0);
  });

  it("says there is nothing yet, in the view's own words, when no filter is active", async () => {
    getRecordings.mockResolvedValue(page([]));
    render(<RecordingsPage />);
    await screen.findByText(/no recordings yet/i);
    await act(async () => {
      fireEvent.click(viewChip(/notes/i));
    });
    await screen.findByText(/no notes yet/i);
    expect(screen.queryByText("Clear filters")).toBeNull();
  });

  it("opens the notes reader for the clicked occurrence", async () => {
    getRecordings.mockResolvedValue(
      page([recRow({ occurrence_id: 71, session_id: 7, title: "Hash tables", has_transcript: true })]),
    );
    render(<RecordingsPage />);
    const row = await screen.findByTestId("recording-row");
    await act(async () => {
      fireEvent.click(within(row).getByRole("button", { name: /notes/i }));
    });
    const reader = await screen.findByTestId("notes-reader");
    // The SERIES id and the one date that was clicked, not whichever date the series played last.
    expect(reader.getAttribute("data-activity")).toBe("7");
    expect(reader.getAttribute("data-occurrence")).toBe("71");
    expect(reader.getAttribute("data-topic")).toBe("Hash tables");
  });

  it("renders the notes preview in the Notes view and never a Zoom url", async () => {
    getRecordings.mockResolvedValue(
      page([
        recRow({
          has_recording: false,
          has_summary: true,
          notes_preview: "Binary search halves the range each step, so n items need log n probes.",
        }),
      ]),
    );
    const { container } = render(<RecordingsPage />);
    await screen.findByTestId("recording-row");
    expect(screen.queryByTestId("notes-preview")).toBeNull();

    await act(async () => {
      fireEvent.click(viewChip(/notes/i));
    });
    const preview = await screen.findByTestId("notes-preview");
    expect(preview.textContent).toMatch(/halves the range/);
    const row = screen.getByTestId("recording-row");
    expect(within(row).getByRole("button", { name: /read notes/i })).toBeTruthy();
    expect(within(row).queryByRole("button", { name: /watch/i })).toBeNull();
    expect(within(row).getByText("AI summary")).toBeTruthy();
    expect(container.innerHTML).not.toMatch(/zoom\.us|zoom\.test/);
  });

  it("marks a transcript-only class as such under Notes", async () => {
    getRecordings.mockResolvedValue(page([recRow({ has_transcript: true })]));
    render(<RecordingsPage />);
    await screen.findByTestId("recording-row");
    await act(async () => {
      fireEvent.click(viewChip(/notes/i));
    });
    await screen.findByTestId("transcript-only");
    expect(screen.queryByTestId("notes-preview")).toBeNull();
  });

  it("sends the student to the schedule from the header", async () => {
    getRecordings.mockResolvedValue(page([recRow()]));
    render(<RecordingsPage />);
    await screen.findByTestId("recording-row");
    fireEvent.click(screen.getByRole("button", { name: /all sessions/i }));
    expect(push).toHaveBeenCalledWith("/live-sessions");
  });

  it("offers Try again when the first page fails, and asks for facets again", async () => {
    getRecordings.mockRejectedValueOnce(new Error("504"));
    render(<RecordingsPage />);
    await screen.findByText(/could not load recordings/i);

    getRecordings.mockResolvedValueOnce({ ...page([recRow()]), facets: facets() });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    });
    await screen.findByTestId("recording-row");
    expect(lastCall()).toMatchObject({ offset: 0, facets: true });
  });
});
