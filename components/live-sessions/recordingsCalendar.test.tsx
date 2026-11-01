/**
 * One calendar on the Recordings page, driving all three tabs.
 *
 * The three things worth pinning, each of which is a plausible wrong implementation:
 *
 *  - the day filter goes to the SERVER, on every tab. Filtering the loaded rows in the browser
 *    would hide page-one rows and then show unfiltered page-two rows under the same day.
 *  - the dots come from the facets, not from the rows. The list pages twenty at a time over an
 *    archive that only grows, so rows-derived dots would cover the newest few weeks and every
 *    older day would look empty.
 *  - the day SURVIVES a tab switch. It is one calendar; moving from Recordings to Trainer Notes
 *    must not silently widen the list back to everything.
 */
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const getRecordings = vi.fn();
const mine = vi.fn();

vi.mock("@/lib/services/live-sessions", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/lib/services/live-sessions");
  return {
    ...actual,
    studentLiveSessionsService: { getRecordings: (...a: unknown[]) => getRecordings(...a) },
  };
});
vi.mock("@/lib/services/live-session-materials.service", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@/lib/services/live-session-materials.service"
  );
  return { ...actual, liveSessionMaterialsService: { mine: (...a: unknown[]) => mine(...a) } };
});
vi.mock("@/lib/hooks/useInstantNavigation", () => ({
  useInstantNavigation: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), isPending: false }),
}));
// The page chrome is mocked exactly as recordingsPage.test.tsx mocks it. ModulePageHeader pulls
// in PageGuide, which needs a ClientInfoProvider; this file is about the calendar, not the
// chrome, and standing up the provider would test neither.
vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  HeaderActionButton: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

import RecordingsPage from "@/app/recordings/page";

/**
 * A day in the CURRENT month, because the calendar opens on the current month and a date from
 * any other one simply is not on screen to click. Derived rather than hard-coded so the suite
 * does not start failing on the 1st of some future month.
 */
const TODAY = new Date();
const DAY_OF_MONTH = 15;
const DAY = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(
  DAY_OF_MONTH
).padStart(2, "0")}`;
const OTHER_DAY = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-02`;

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
  TODAY.getMonth()
];

/** Day cells are labelled "15 Nov, 1 session" (see ScheduleCalendar.dayLabel), so this matches
 *  the date part and ignores whatever follows. */
const dayCell = (n: number) =>
  screen.getByRole("button", { name: new RegExp(`^${n} ${MONTH_SHORT},`) });

/** The tab labels render twice: a segmented track for desktop and a chip row for phones. */
const tab = (label: string) => screen.getAllByText(label)[0];

function session(over: Record<string, unknown> = {}) {
  return {
    session_id: 1,
    occurrence_id: 11,
    title: "Recursion",
    occurrence_datetime: `${DAY}T18:00:00Z`,
    course_title: "DSA",
    batch_name: "8024-E",
    has_recording: true,
    has_notes: false,
    has_transcript: false,
    notes_preview: "",
    before_enrolment: false,
    attended: true,
    ...over,
  };
}

function payload(over: Record<string, unknown> = {}) {
  return {
    sessions: [session()],
    count: 1,
    limit: 20,
    offset: 0,
    has_more: false,
    facets: {
      courses: [],
      batches: [],
      totals: { all: 1, recordings: 1, notes: 0 },
      dates: [
        { date: DAY, recordings: 1, notes: 0 },
        { date: OTHER_DAY, recordings: 4, notes: 2 },
      ],
    },
    ...over,
  };
}

describe("the Recordings page calendar", () => {
  beforeEach(() => {
    getRecordings.mockReset();
    mine.mockReset();
    getRecordings.mockResolvedValue(payload());
    mine.mockResolvedValue({ hasMore: false, results: [], dates: [{ date: OTHER_DAY, count: 3 }] });
  });

  it("renders a calendar beside the list", async () => {
    render(<RecordingsPage />);

    await screen.findByTestId("recordings-list");
    // ScheduleCalendar renders a month grid; its day cells are buttons.
    await waitFor(() => expect(screen.getAllByRole("button").length).toBeGreaterThan(10));
  });

  it("offers a Trainer Notes tab", async () => {
    render(<RecordingsPage />);

    await screen.findByTestId("recordings-list");
    expect(screen.getAllByText("Trainer Notes").length).toBeGreaterThan(0);
  });

  it("asks the server for the day, rather than filtering what is already loaded", async () => {
    render(<RecordingsPage />);
    await screen.findByTestId("recordings-list");

    await userEvent.click(dayCell(DAY_OF_MONTH));

    await waitFor(() => {
      const last = getRecordings.mock.calls.at(-1)?.[0];
      expect(last?.since).toBe(DAY);
      expect(last?.until).toBe(DAY);
    });
  });

  it("keeps the chosen day when the learner switches tab", async () => {
    render(<RecordingsPage />);
    await screen.findByTestId("recordings-list");
    await userEvent.click(dayCell(DAY_OF_MONTH));
    await waitFor(() => expect(getRecordings.mock.calls.at(-1)?.[0]?.since).toBe(DAY));

    await userEvent.click(tab("Trainer Notes"));

    // The materials tab must receive the SAME day, or one calendar would mean two things.
    await waitFor(() => {
      const last = mine.mock.calls.at(-1)?.[0];
      expect(last?.since).toBe(DAY);
      expect(last?.until).toBe(DAY);
    });
  });

  it("does not fetch recordings while the Trainer Notes tab is open", async () => {
    render(<RecordingsPage />);
    await screen.findByTestId("recordings-list");
    const before = getRecordings.mock.calls.length;

    await userEvent.click(tab("Trainer Notes"));
    await waitFor(() => expect(mine).toHaveBeenCalled());

    expect(getRecordings.mock.calls.length).toBe(before);
  });

  it("asks the materials endpoint for its calendar days on the first page only", async () => {
    render(<RecordingsPage />);
    await screen.findByTestId("recordings-list");
    await userEvent.click(tab("Trainer Notes"));

    await waitFor(() => expect(mine.mock.calls.at(-1)?.[0]?.facets).toBe(true));
  });

  it("shows the chosen day as a clearable chip, because the calendar is off-screen on a phone", async () => {
    render(<RecordingsPage />);
    await screen.findByTestId("recordings-list");

    await userEvent.click(dayCell(DAY_OF_MONTH));

    // Built with the same formatter the page uses: the host locale decides whether that reads
    // "Sun, 15 Nov" or "Sun, Nov 15", and hard-coding either makes the suite locale-dependent.
    const expected = new Date(`${DAY}T12:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    await waitFor(() => expect(screen.getByText(expected)).toBeTruthy());
  });

  it("clearing the day widens the list again", async () => {
    render(<RecordingsPage />);
    await screen.findByTestId("recordings-list");
    await userEvent.click(dayCell(DAY_OF_MONTH));
    await waitFor(() => expect(getRecordings.mock.calls.at(-1)?.[0]?.since).toBe(DAY));

    // Clicking the same day again toggles it off (ScheduleCalendar's controlled contract).
    await userEvent.click(dayCell(DAY_OF_MONTH));

    await waitFor(() => {
      const last = getRecordings.mock.calls.at(-1)?.[0];
      expect(last?.since).toBeUndefined();
      expect(last?.until).toBeUndefined();
    });
  });
});
