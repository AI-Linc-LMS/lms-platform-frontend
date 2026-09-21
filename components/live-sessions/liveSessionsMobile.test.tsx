import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * The learner's Live Sessions list on a phone. jsdom has no layout, so what is pinned here is the
 * STRUCTURE each fix depends on: chip rows that are scroll rows rather than wrapping stacks, a
 * spoken date line on cards whose date badge is desktop-only, and a feedback form that comes up
 * as a bottom sheet instead of a centred dialog.
 */

vi.mock("@/lib/services/live-sessions/student-live-sessions.service", () => ({
  getMyLiveSessionFeedback: vi.fn().mockResolvedValue({ my_feedback: null }),
  submitLiveSessionFeedback: vi.fn().mockResolvedValue({}),
}));

import type { StudentLiveSession } from "@/lib/services/live-sessions";
import { HistoryRow, RecordingCard, UpcomingCard } from "./ui/StudentSessionCards";
import { SessionFilterChips } from "./ui/LiveSessionUI";
import { LiveSessionFeedbackDialog } from "./LiveSessionFeedbackDialog";

function session(over: Partial<StudentLiveSession> = {}): StudentLiveSession {
  return {
    id: 7,
    occurrence_id: 70,
    topic_name: "Binary search, from first principles",
    class_datetime: "2026-10-02T10:00:00Z",
    timezone: "UTC",
    duration_minutes: 60,
    is_zoom: true,
    instructor: "Asha Rao",
    cohort_detail: { id: 3, name: "Batch 12 - Weekend" },
    adaptive_course_detail: { id: 9, title: "Data Structures" },
    has_recording: true,
    ...over,
  } as unknown as StudentLiveSession;
}

function setPhone(isPhone: boolean) {
  window.matchMedia = ((query: string) => ({
    // MUI's down("sm") query is a max-width query; answer it as a 390px viewport would.
    matches: isPhone && query.includes("max-width"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("UpcomingCard", () => {
  it("puts its status/provider/batch chips in a scroll row, not a wrapping stack", () => {
    render(<UpcomingCard s={session()} isNext={false} reminderOn={false} onAddCalendar={vi.fn()} onRemind={vi.fn()} />);
    const row = screen.getByRole("group", { name: "Session details" });
    expect(within(row).getByText("Scheduled")).toBeTruthy();
    expect(within(row).getByText("Zoom")).toBeTruthy();
    expect(within(row).getByText("Batch 12 - Weekend")).toBeTruthy();
  });

  it("states the date in words, since the date badge is desktop-only", () => {
    render(<UpcomingCard s={session()} isNext={false} reminderOn={false} onAddCalendar={vi.fn()} onRemind={vi.fn()} />);
    const when = screen.getByTestId("session-when");
    expect(when.textContent).toMatch(/02/);
    expect(when.textContent).toMatch(/60m/);
  });

  it("keeps both actions in one block and wires them", () => {
    const onAddCalendar = vi.fn();
    const onRemind = vi.fn();
    render(<UpcomingCard s={session()} isNext={false} reminderOn={false} onAddCalendar={onAddCalendar} onRemind={onRemind} />);
    const actions = screen.getByTestId("upcoming-actions");
    fireEvent.click(within(actions).getByRole("button", { name: /Add to calendar/ }));
    fireEvent.click(within(actions).getByRole("button", { name: /Remind me/ }));
    expect(onAddCalendar).toHaveBeenCalled();
    expect(onRemind).toHaveBeenCalled();
  });

  it("offers no actions on a cancelled session", () => {
    render(<UpcomingCard s={session({ notice_type: "cancelled" } as Partial<StudentLiveSession>)} isNext reminderOn={false} onAddCalendar={vi.fn()} onRemind={vi.fn()} />);
    expect(screen.queryByTestId("upcoming-actions")).toBeNull();
    expect(screen.getByText("Session cancelled")).toBeTruthy();
  });
});

describe("RecordingCard", () => {
  it("has a spoken date line and a Watch action", () => {
    const onWatch = vi.fn();
    render(<RecordingCard s={session()} watching={false} onWatch={onWatch} onSummary={vi.fn()} />);
    expect(screen.getByTestId("session-when")).toBeTruthy();
    fireEvent.click(within(screen.getByTestId("recording-actions")).getByRole("button", { name: /Watch/ }));
    expect(onWatch).toHaveBeenCalled();
  });
});

describe("HistoryRow", () => {
  it("drops the chip, status and actions into their own row under the title", () => {
    render(
      <HistoryRow
        s={session({ my_attendance: { attended: true } } as Partial<StudentLiveSession>)}
        onWatch={vi.fn()}
        onGiveFeedback={vi.fn()}
      />,
    );
    const meta = screen.getByTestId("history-meta");
    expect(within(meta).getByText("Attended")).toBeTruthy();
    expect(within(meta).getByRole("button", { name: "Watch recording" })).toBeTruthy();
    expect(within(meta).getByRole("button", { name: /Rate/ })).toBeTruthy();
    // The title is not inside that row: it keeps a line of its own.
    expect(within(meta).queryByText("Binary search, from first principles")).toBeNull();
  });
});

describe("SessionFilterChips", () => {
  const options = [
    { key: "", label: "All batches & courses" },
    { key: "c:3", label: "Batch 12 - Weekend" },
  ];

  it("scrolls on a phone when opted in, and marks the active chip", () => {
    const onChange = vi.fn();
    render(<SessionFilterChips scrollOnPhone ariaLabel="Batch and course filter" options={options} value="" onChange={onChange} />);
    const row = screen.getByRole("group", { name: "Batch and course filter" });
    const chips = within(row).getAllByRole("button");
    expect(chips).toHaveLength(2);
    expect(chips[0].getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(chips[1]);
    expect(onChange).toHaveBeenCalledWith("c:3");
  });

  it("keeps the plain wrapping row for surfaces that have not opted in", () => {
    render(<SessionFilterChips options={options} value="" onChange={vi.fn()} />);
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});

describe("LiveSessionFeedbackDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("comes up as a bottom sheet on a phone", async () => {
    setPhone(true);
    render(<LiveSessionFeedbackDialog open liveClassId={7} sessionTitle="Binary search" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Send feedback/ })).toBeTruthy());
    expect(document.querySelector(".MuiDrawer-paper")).toBeTruthy();
    expect(document.querySelector(".MuiDialog-paper")).toBeNull();
  });

  it("stays a centred dialog on a desktop", async () => {
    setPhone(false);
    render(<LiveSessionFeedbackDialog open liveClassId={7} sessionTitle="Binary search" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Send feedback/ })).toBeTruthy());
    expect(document.querySelector(".MuiDialog-paper")).toBeTruthy();
    expect(document.querySelector(".MuiDrawer-paper")).toBeNull();
    // Desktop is the dialog it always was: no sheet-style close X, the session title on one line.
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    expect(screen.getByText("Binary search").className).toMatch(/noWrap/);
  });

  it("does not offer a dead close button while a save is in flight", async () => {
    setPhone(true);
    const svc = await import("@/lib/services/live-sessions/student-live-sessions.service");
    let release: () => void = () => undefined;
    vi.mocked(svc.submitLiveSessionFeedback).mockImplementationOnce(
      () => new Promise((resolve) => { release = () => resolve({} as never); }),
    );
    render(<LiveSessionFeedbackDialog open liveClassId={7} sessionTitle="Binary search" onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Send feedback/ })).toBeTruthy());
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Overall: 5 of 5" }));
    fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Sending/ })).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    release();
    await waitFor(() => expect(screen.queryByRole("button", { name: /Sending/ })).toBeNull());
  });
});
