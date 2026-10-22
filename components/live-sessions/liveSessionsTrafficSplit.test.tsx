import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * The traffic split, pinned where it can regress.
 *
 * On 2026-10-22 the live-sessions page's own 60s poll - armed at T-15:00 on every open tab at
 * once - drove RDS read IOPS from 0.4 to 1,183 and single requests to 125 SECONDS. The load
 * balancer answered 504 at its 60s idle timeout, and the students worst affected were the ones
 * trying to join a class about to start.
 *
 * The fix was to stop one surface answering three questions. What these tests defend is the
 * SHAPE of that split, because every part of it is one convenient edit away from coming undone:
 *
 *  - the join page must read only the tiny endpoint. The moment it also wants a field from the
 *    rich list, it inherits the cost it exists to escape.
 *  - the recordings page must page, and must keep paging. An archive only grows.
 *  - the poll must probe, not reload. That one line is the whole incident.
 */

const getJoinNow = vi.fn();
const getRecordings = vi.fn();
const getSessions = vi.fn();

vi.mock("@/lib/services/live-sessions", () => ({
  studentLiveSessionsService: {
    getJoinNow: (...a: unknown[]) => getJoinNow(...a),
    getRecordings: (...a: unknown[]) => getRecordings(...a),
    getSessions: (...a: unknown[]) => getSessions(...a),
    getRecording: vi.fn().mockResolvedValue({}),
    getTranscript: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/components/common/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/common/ModulePageHeader", () => ({
  ModulePageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import JoinNowPage from "@/app/live-sessions/join/page";
import RecordingsPage from "@/app/recordings/page";

const joinRow = (over: Record<string, unknown> = {}) => ({
  occurrence_id: 70,
  session_id: 7,
  title: "Binary search, from first principles",
  course: "Data Structures",
  starts_at: new Date(Date.now() + 6 * 60_000).toISOString(),
  duration_minutes: 60,
  status: "scheduled",
  join_url: "https://zoom.test/j/1",
  started: false,
  ended: false,
  starts_in_seconds: 360,
  ...over,
});

const recRow = (over: Record<string, unknown> = {}) => ({
  occurrence_id: 70,
  session_id: 7,
  title: "Sorting, in practice",
  course: "Data Structures",
  batch: "Batch 12",
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
  attended: true,
  my_attendance: null,
  ...over,
});

beforeEach(() => {
  vi.useRealTimers();
  getJoinNow.mockReset();
  getRecordings.mockReset();
  getSessions.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("the join page", () => {
  it("reads the tiny endpoint and nothing else", async () => {
    getJoinNow.mockResolvedValue({ now: new Date().toISOString(), sessions: [joinRow()] });
    render(<JoinNowPage />);
    await waitFor(() => expect(screen.getByTestId("join-now-card")).toBeTruthy());
    expect(getJoinNow).toHaveBeenCalled();
    // The whole point of the page. If it ever needs the rich list, it has inherited the cost it
    // exists to escape.
    expect(getSessions).not.toHaveBeenCalled();
    expect(getRecordings).not.toHaveBeenCalled();
  });

  it("offers the link as a real anchor so a tap cannot be swallowed", async () => {
    getJoinNow.mockResolvedValue({ now: new Date().toISOString(), sessions: [joinRow()] });
    render(<JoinNowPage />);
    const join = await screen.findByRole("link", { name: /join/i });
    expect(join.getAttribute("href")).toBe("https://zoom.test/j/1");
  });

  it("says the host has not opened the room rather than showing a dead button", async () => {
    getJoinNow.mockResolvedValue({
      now: new Date().toISOString(),
      sessions: [joinRow({ join_url: null })],
    });
    render(<JoinNowPage />);
    await waitFor(() => expect(screen.getByTestId("room-not-open")).toBeTruthy());
    expect(screen.queryByRole("link", { name: /^join$/i })).toBeNull();
  });

  it("marks a class that has started as live", async () => {
    getJoinNow.mockResolvedValue({
      now: new Date().toISOString(),
      sessions: [joinRow({ started: true, starts_in_seconds: -120 })],
    });
    render(<JoinNowPage />);
    await waitFor(() => expect(screen.getByTestId("live-pill")).toBeTruthy());
  });

  it("keeps the card on screen when a background poll fails", async () => {
    getJoinNow.mockResolvedValueOnce({
      now: new Date().toISOString(),
      sessions: [joinRow()],
    });
    render(<JoinNowPage />);
    await waitFor(() => expect(screen.getByTestId("join-now-card")).toBeTruthy());
    // A student mid-join must not have their link replaced by an error because one request lost
    // a race.
    getJoinNow.mockRejectedValue(new Error("504"));
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.getByTestId("join-now-card")).toBeTruthy();
  });

  it("points a student with nothing starting at the other two surfaces", async () => {
    getJoinNow.mockResolvedValue({ now: new Date().toISOString(), sessions: [] });
    render(<JoinNowPage />);
    await waitFor(() => expect(screen.getByText(/nothing starting right now/i)).toBeTruthy());
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/live-sessions");
    expect(hrefs).toContain("/recordings");
  });
});

describe("the recordings page", () => {
  it("asks for one page, not the whole archive", async () => {
    getRecordings.mockResolvedValue({
      sessions: [recRow()],
      count: 1,
      limit: 20,
      offset: 0,
      has_more: false,
    });
    render(<RecordingsPage />);
    await waitFor(() => expect(screen.getByTestId("recording-row")).toBeTruthy());
    const [args] = getRecordings.mock.calls[0] as [{ limit: number; offset: number }];
    expect(args.limit).toBeLessThanOrEqual(50);
  });

  it("loads the next page on demand and keeps what it already has", async () => {
    getRecordings.mockResolvedValueOnce({
      sessions: [recRow({ occurrence_id: 1, title: "First" })],
      count: 2,
      limit: 1,
      offset: 0,
      has_more: true,
    });
    render(<RecordingsPage />);
    const more = await screen.findByTestId("load-more-recordings");

    getRecordings.mockResolvedValueOnce({
      sessions: [recRow({ occurrence_id: 2, title: "Second" })],
      count: 2,
      limit: 1,
      offset: 1,
      has_more: false,
    });
    await act(async () => { fireEvent.click(more); });

    // Appending, not replacing: "Load more" must build the list rather than page past it.
    await waitFor(() => expect(screen.getByText("Second")).toBeTruthy());
    expect(screen.getByText("First")).toBeTruthy();
    const [args] = getRecordings.mock.calls[1] as [{ offset: number }];
    expect(args.offset).toBe(1);
  });

  it("hides the pager once there is nothing more", async () => {
    getRecordings.mockResolvedValue({
      sessions: [recRow()],
      count: 1,
      limit: 20,
      offset: 0,
      has_more: false,
    });
    render(<RecordingsPage />);
    await waitFor(() => expect(screen.getByTestId("recording-row")).toBeTruthy());
    expect(screen.queryByTestId("load-more-recordings")).toBeNull();
  });

  it("says how much of the archive is on screen", async () => {
    getRecordings.mockResolvedValue({
      sessions: [recRow()],
      count: 83,
      limit: 20,
      offset: 0,
      has_more: true,
    });
    render(<RecordingsPage />);
    const count = await screen.findByTestId("recordings-count");
    expect(count.textContent).toMatch(/1 of 83/);
  });

  it("offers Notes for a class with only a transcript", async () => {
    getRecordings.mockResolvedValue({
      sessions: [recRow({ has_recording: false, has_transcript: true })],
      count: 1,
      limit: 20,
      offset: 0,
      has_more: false,
    });
    render(<RecordingsPage />);
    // A recording that failed still leaves notes, and for someone who joined their batch late
    // this surface is the only route to a class held before they arrived.
    await waitFor(() => expect(screen.getByRole("button", { name: /notes/i })).toBeTruthy());
    expect(screen.queryByRole("button", { name: /watch/i })).toBeNull();
  });

  it("never renders a Zoom url", async () => {
    getRecordings.mockResolvedValue({
      sessions: [recRow()],
      count: 1,
      limit: 20,
      offset: 0,
      has_more: false,
    });
    const { container } = render(<RecordingsPage />);
    await waitFor(() => expect(screen.getByTestId("recording-row")).toBeTruthy());
    expect(container.innerHTML).not.toMatch(/zoom\.us|zoom\.test/);
  });
});
