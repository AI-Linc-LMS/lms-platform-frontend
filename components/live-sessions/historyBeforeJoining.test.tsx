import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

/**
 * A learner added to a batch after it started used to find an empty History tab: every class the
 * batch held before they were added was dropped from the list (to keep it from being stamped
 * "Missed"), and with it that class's recording and study material. On Agileology that was 113
 * learners and 2,876 class-dates, sixteen of them classes the learner had actually attended. Those
 * classes are listed now and labelled instead.
 */

vi.mock("@/lib/services/live-sessions/student-live-sessions.service", () => ({
  getMyLiveSessionFeedback: vi.fn().mockResolvedValue({ my_feedback: null }),
  submitLiveSessionFeedback: vi.fn().mockResolvedValue({}),
}));

import type { StudentLiveSession } from "@/lib/services/live-sessions";
import { selectHistory } from "@/lib/live-sessions/history";
import { HistoryRow } from "./ui/StudentSessionCards";

function sitting(over: Partial<StudentLiveSession> = {}): StudentLiveSession {
  return {
    id: 7,
    occurrence_id: 70,
    topic_name: "Binary search, from first principles",
    class_datetime: "2026-10-02T10:00:00Z",
    timezone: "UTC",
    duration_minutes: 60,
    is_zoom: true,
    instructor: "Asha Rao",
    cohort_detail: { id: 3, name: "8026-M" },
    has_recording: true,
    meeting_status: "ended",
    occurrence_ran: true,
    my_attendance: null,
    ...over,
  } as unknown as StudentLiveSession;
}

const everyDay = () => true;

describe("selectHistory", () => {
  it("keeps a class held before the learner joined the batch", () => {
    const before = sitting({ occurrence_id: 1, class_datetime: "2026-09-17T10:00:00Z", before_enrolment: true });
    const after = sitting({ occurrence_id: 2, class_datetime: "2026-10-23T10:00:00Z", before_enrolment: false });
    expect(selectHistory([before, after], everyDay).map((s) => s.occurrence_id)).toEqual([2, 1]);
  });

  it("is not empty for a learner whose every past class predates them", () => {
    const all = [1, 2, 3].map((i) =>
      sitting({ occurrence_id: i, class_datetime: `2026-09-1${i}T10:00:00Z`, before_enrolment: true }),
    );
    expect(selectHistory(all, everyDay)).toHaveLength(3);
  });

  it("still lists past sittings only, newest first, and honours the day filter", () => {
    const upcoming = sitting({ occurrence_id: 9, meeting_status: "scheduled" });
    const expired = sitting({ occurrence_id: 8, meeting_status: "expired", class_datetime: "2026-10-01T10:00:00Z" });
    const ended = sitting({ occurrence_id: 7, meeting_status: "ended", class_datetime: "2026-10-05T10:00:00Z" });
    expect(selectHistory([upcoming, expired, ended], everyDay).map((s) => s.occurrence_id)).toEqual([7, 8]);
    expect(selectHistory([expired, ended], (s) => s.occurrence_id === 8).map((s) => s.occurrence_id)).toEqual([8]);
  });
});

describe("a History row for a class held before the learner joined", () => {
  it("says Before you joined, never Missed, and keeps the recording and the study material", () => {
    render(<HistoryRow s={sitting({ before_enrolment: true })} onWatch={vi.fn()} onGiveFeedback={vi.fn()} />);
    const meta = screen.getByTestId("history-meta");
    expect(within(meta).getByText("Before you joined")).toBeTruthy();
    expect(within(meta).queryByText("Missed")).toBeNull();
    expect(within(meta).getByRole("button", { name: "Watch recording" })).toBeTruthy();
    expect(screen.getByText("Study material")).toBeTruthy();
  });

  it("offers no Rate button: they were not in that class", () => {
    render(<HistoryRow s={sitting({ before_enrolment: true })} onWatch={vi.fn()} onGiveFeedback={vi.fn()} />);
    expect(within(screen.getByTestId("history-meta")).queryByRole("button", { name: /Rate/ })).toBeNull();
  });

  it("says Attended when there is an attendance record, whatever the membership date says", () => {
    render(
      <HistoryRow
        s={sitting({ before_enrolment: true, my_attendance: { attended: true } } as Partial<StudentLiveSession>)}
        onWatch={vi.fn()}
        onGiveFeedback={vi.fn()}
      />,
    );
    const meta = screen.getByTestId("history-meta");
    expect(within(meta).getByText("Attended")).toBeTruthy();
    expect(within(meta).queryByText("Before you joined")).toBeNull();
    expect(within(meta).getByRole("button", { name: /Rate/ })).toBeTruthy();
  });

  it("still says Didn't run for a class that never took place", () => {
    render(<HistoryRow s={sitting({ before_enrolment: true, occurrence_ran: false })} onGiveFeedback={vi.fn()} />);
    expect(within(screen.getByTestId("history-meta")).getByText("Didn't run")).toBeTruthy();
  });
});

describe("a History row for a class after the learner joined (control)", () => {
  it("still says Missed when they did not attend", () => {
    render(<HistoryRow s={sitting({ before_enrolment: false })} onWatch={vi.fn()} onGiveFeedback={vi.fn()} />);
    const meta = screen.getByTestId("history-meta");
    expect(within(meta).getByText("Missed")).toBeTruthy();
    expect(within(meta).getByRole("button", { name: /Rate/ })).toBeTruthy();
  });
});
