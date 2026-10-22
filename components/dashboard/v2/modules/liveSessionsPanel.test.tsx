import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

/**
 * The dashboard's live-sessions card reads `upcoming/`, not the rich list.
 *
 * The rich list carries every occurrence of every series the learner may see, and the dashboard
 * is the most visited page on the platform, so this card was the heaviest live-session call on
 * every tenant by sheer volume - to show three rows. What is pinned here is that it asks the lean
 * endpoint for one small page (the service mock has NO `getSessions`, so reaching for the list
 * would hide the card), and that the time-dependent part of the ranking still happens on the
 * client: live first, soonest next, an ended sitting gone, a cancelled one never shown.
 */

const getUpcoming = vi.fn();
const push = vi.fn();

vi.mock("@/lib/services/live-sessions", () => ({
  studentLiveSessionsService: {
    getUpcoming: (...a: unknown[]) => getUpcoming(...a),
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));

import { FETCH_LIMIT, LiveSessionsPanel, selectSessions } from "./LiveSessionsPanel";
import type { UpcomingSession } from "@/lib/services/live-sessions";

const NOW = new Date("2026-10-22T14:30:00.000Z").getTime();
const at = (minutesFromNow: number) => new Date(NOW + minutesFromNow * 60_000).toISOString();

const row = (over: Partial<UpcomingSession> & { occurrence_id: number; title: string }): UpcomingSession => ({
  session_id: over.occurrence_id * 10,
  course: null,
  starts_at: at(60),
  duration_minutes: 60,
  status: "scheduled",
  join_url: null,
  started: false,
  ended: false,
  starts_in_seconds: 3600,
  batch: null,
  instructor: null,
  timezone: "Asia/Kolkata",
  is_zoom: true,
  is_google_meet: false,
  notice_type: null,
  notice_reason: "",
  agenda: [],
  prep_items: [],
  reminder_enabled: false,
  my_prep: false,
  ...over,
});

const page = (sessions: UpcomingSession[]) => ({
  now: new Date(NOW).toISOString(),
  sessions,
  count: sessions.length,
  limit: FETCH_LIMIT,
  offset: 0,
  has_more: false,
});

describe("selectSessions", () => {
  it("ranks live first, then soonest, and shows three", () => {
    const rows = selectSessions(
      [
        row({ occurrence_id: 1, title: "Later today", starts_at: at(120) }),
        row({ occurrence_id: 2, title: "Running", starts_at: at(-10) }),
        row({ occurrence_id: 3, title: "Tomorrow", starts_at: at(24 * 60) }),
        row({ occurrence_id: 4, title: "Soon", starts_at: at(30) }),
      ],
      NOW,
    );
    expect(rows.map((r) => r.session.title)).toEqual(["Running", "Soon", "Later today"]);
    expect(rows[0].live).toBe(true);
    expect(rows[1].live).toBe(false);
  });

  it("drops a sitting that has ended since the fetch, and one cancelled by notice", () => {
    const rows = selectSessions(
      [
        row({ occurrence_id: 1, title: "Over", starts_at: at(-120), duration_minutes: 60 }),
        row({ occurrence_id: 2, title: "Called off", starts_at: at(30), notice_type: "cancelled" }),
        row({ occurrence_id: 3, title: "Still on", starts_at: at(45) }),
      ],
      NOW,
    );
    expect(rows.map((r) => r.session.title)).toEqual(["Still on"]);
  });

  it("trusts the server when the host has opened the room early", () => {
    const rows = selectSessions(
      [row({ occurrence_id: 1, title: "Early host", starts_at: at(5), started: true })],
      NOW,
    );
    expect(rows[0].live).toBe(true);
  });
});

describe("LiveSessionsPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  });
  afterEach(() => {
    vi.useRealTimers();
    getUpcoming.mockReset();
    push.mockReset();
  });

  it("asks the lean endpoint for one small page, never the rich list", async () => {
    getUpcoming.mockResolvedValue(page([row({ occurrence_id: 1, title: "Intro to SQL" })]));
    render(<LiveSessionsPanel />);
    expect(await screen.findByText("Intro to SQL")).toBeInTheDocument();
    expect(getUpcoming).toHaveBeenCalledTimes(1);
    expect(getUpcoming).toHaveBeenCalledWith({ limit: FETCH_LIMIT });
  });

  it("offers Join on a live row with the server's join url, without leaving the page", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    getUpcoming.mockResolvedValue(
      page([
        row({ occurrence_id: 1, title: "Running", starts_at: at(-10), join_url: "https://zoom.us/j/1" }),
        row({ occurrence_id: 2, title: "Soon", starts_at: at(30), join_url: "https://zoom.us/j/2" }),
      ]),
    );
    render(<LiveSessionsPanel />);
    expect(await screen.findByText("LIVE NOW")).toBeInTheDocument();
    expect(screen.getAllByText("Join")).toHaveLength(1);
    fireEvent.click(screen.getByText("Join"));
    expect(open).toHaveBeenCalledWith("https://zoom.us/j/1", "_blank", "noopener,noreferrer");
    expect(push).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("shows the course beside the time, from the row itself", async () => {
    getUpcoming.mockResolvedValue(
      page([row({ occurrence_id: 1, title: "Week 3", course: "Data Analytics", starts_at: at(30) })]),
    );
    render(<LiveSessionsPanel />);
    expect(await screen.findByText("Data Analytics")).toBeInTheDocument();
    expect(screen.getByText("in 30m")).toBeInTheDocument();
  });

  it("hides itself when the endpoint fails, rather than showing a broken card", async () => {
    getUpcoming.mockRejectedValue(new Error("502"));
    const { container } = render(<LiveSessionsPanel />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
