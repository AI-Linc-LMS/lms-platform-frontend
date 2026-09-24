/**
 * Normal pace asks its check-ins on a rewatch; Rewatch stays question-free.
 *
 * Reported as "when rewatching the video in Normal pace, the check-in questions no longer appear,
 * making Normal pace behave the same as Rewatch mode" - with a finished video reading "5/5 checks"
 * before a single one had been asked.
 *
 * The cause was which list seeded the player's "already answered" set. It was seeded from
 * `my_passed_check_in_ids`, the check-ins the learner has EVER got right, so a video whose checks
 * were all passed had nothing left for a questioning mode to ask. What to ASK is the watch's
 * business (`answered_check_in_ids`, per session); what to SHOW as passed, and what the server
 * scores only once, is the learner's history.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const player = vi.hoisted(() => ({
  currentTime: 0, duration: 120, endedTick: 0, seekTo: vi.fn(), play: vi.fn(), pause: vi.fn(),
}));
const start = vi.hoisted(() => vi.fn());
const answerCheckIn = vi.hoisted(() => vi.fn());

vi.mock("./useVimeoController", () => ({
  useVimeoController: () => ({
    setIframe: () => {}, currentTime: player.currentTime, duration: player.duration, isPlaying: false,
    playbackRate: 1, rewinds: [], endedTick: player.endedTick, play: player.play, pause: player.pause,
    seekTo: player.seekTo, setRate: vi.fn(),
  }),
}));
vi.mock("@/lib/services/adaptive-video.service", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  adaptiveVideoService: new Proxy({ startSession: start, answerCheckIn } as Record<string, unknown>, {
    get: (target, key: string) => target[key] ?? vi.fn().mockResolvedValue({}),
  }),
}));
vi.mock("@/components/scorecard/shared", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  Reveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

import { VideoCompanion } from "./VideoCompanion";

const marker = (id: number, at: number) => ({
  id, timestamp_seconds: at, concept: `Concept ${id}`, order: id,
  question_text: `Question ${id}?`, option_a: "A base case", option_b: "A loop",
  option_c: "A return", option_d: "A stack",
});

function companion(over: Record<string, unknown> = {}) {
  return {
    id: 800, title: "Recursion", instructions: "", description: "",
    video: { title: "Recursion", vimeo_id: "1", duration_seconds: 120 },
    concept_map: { nodes: [], edges: [] }, chapters: [], takeaways: [], target_skills: [],
    check_ins: [], transcript_segments: [],
    play_url: "https://vimeo.com/1164028722", source: "catalog", ...over,
  };
}
function session(over: Record<string, unknown> = {}) {
  return { id: "s1", status: "active", watch_mode: "normal", current_timestamp: 0, completeness_pct: 0,
    max_speed: 1, comprehension_state: {}, comprehension_score: 0, answered_check_in_ids: [],
    started_at: "", completed_at: null, ...over };
}

/** Play from 0 to `to` the way the controller reports it: one second at a time, so the seconds
 *  are recorded as PLAYED (a jump is not watching, and never arms a check-in). */
async function playTo(to: number, rerender: () => void) {
  for (let s = 1; s <= to; s++) {
    player.currentTime = s;
    rerender();
  }
  await waitFor(() => {});
}

beforeEach(() => {
  player.currentTime = 0;
  player.endedTick = 0;
  player.pause.mockReset();
  start.mockReset();
  answerCheckIn.mockReset();
  answerCheckIn.mockResolvedValue({ is_correct: true, correct_option: "A", explanation: "Because.", rewind_to_seconds: null, practice: true });
});

/** A learner who has already passed BOTH of this video's check-ins, back in Normal pace. */
const rewatchInNormal = () => ({
  session_id: "s2",
  companion: companion({
    check_ins: [marker(11, 3), marker(12, 8)],
    rewatch_available: true, my_completed: true, my_best_completeness_pct: 100,
    my_passed_check_in_ids: [11, 12],
  }),
  session: session({ id: "s2", watch_mode: "normal", answered_check_in_ids: [] }),
});

describe("rewatching in Normal pace", () => {
  it("asks a check-in the learner has already passed", async () => {
    start.mockResolvedValue(rewatchInNormal());
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByTestId("video-completed");
    await playTo(4, () => rerender(<VideoCompanion configId={800} />));
    // The bug: nothing was ever due, so the video played straight through in silence.
    expect(await screen.findByText("Question 11?")).toBeInTheDocument();
    expect(player.pause).toHaveBeenCalled();
  });

  it("counts this watch, not the learner's history", async () => {
    start.mockResolvedValue(rewatchInNormal());
    render(<VideoCompanion configId={800} />);
    // It read "2/2 checks" (the screenshot's "5/5") on a watch that had asked nothing.
    expect(await screen.findByText("0/2 checks")).toBeInTheDocument();
  });

  it("says a re-asked check-in is practice, so answering it again is not lost marks", async () => {
    start.mockResolvedValue(rewatchInNormal());
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByTestId("video-completed");
    await playTo(4, () => rerender(<VideoCompanion configId={800} />));
    await screen.findByText("Question 11?");
    expect(screen.getByText("Practice")).toBeInTheDocument();
    expect(screen.getByText("already passed · not scored again")).toBeInTheDocument();
  });

  it("marks it off once answered, and moves on to the next one", async () => {
    start.mockResolvedValue(rewatchInNormal());
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByTestId("video-completed");
    await playTo(4, () => rerender(<VideoCompanion configId={800} />));
    fireEvent.click(await screen.findByRole("button", { name: /A base case/ }));
    await screen.findByText("1/2 checks");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await playTo(9, () => rerender(<VideoCompanion configId={800} />));
    expect(await screen.findByText("Question 12?")).toBeInTheDocument();
  });
});

describe("what a watch has already spent", () => {
  it("does not ask again what THIS watch answered before a reload", async () => {
    start.mockResolvedValue({
      session_id: "s2",
      companion: companion({ check_ins: [marker(11, 3), marker(12, 8)], my_passed_check_in_ids: [] }),
      // A resumed session: check-in 11 was answered before the page was reloaded.
      session: session({ id: "s2", answered_check_in_ids: [11] }),
    });
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText("1/2 checks");
    await playTo(4, () => rerender(<VideoCompanion configId={800} />));
    expect(screen.queryByText("Question 11?")).toBeNull();
    await playTo(9, () => rerender(<VideoCompanion configId={800} />));
    expect(await screen.findByText("Question 12?")).toBeInTheDocument();
  });
});

describe("rewatch mode", () => {
  it("stays question-free, and still says what the learner has passed", async () => {
    start.mockResolvedValue({
      session_id: "s3",
      // A rewatch session is sent no check-ins at all - the server withholds them.
      companion: companion({
        check_ins: [], rewatch_available: true, my_completed: true,
        my_passed_check_in_ids: [11, 12], my_best_completeness_pct: 100,
      }),
      session: session({ id: "s3", watch_mode: "rewatch", answered_check_in_ids: [] }),
    });
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByTestId("video-completed");
    await playTo(10, () => rerender(<VideoCompanion configId={800} />));
    expect(screen.queryByText(/^Question /)).toBeNull();
    expect(player.pause).not.toHaveBeenCalled();
    // The passes are still reported here, where there is no check-in list to count against.
    expect(screen.getByText("2 checks passed")).toBeInTheDocument();
  });
});

describe("pause & ask every 60s", () => {
  it("still stops at the minute on a video whose check-ins are all passed", async () => {
    start.mockResolvedValue({
      session_id: "s4",
      companion: companion({
        check_ins: [marker(11, 3)], rewatch_available: true, my_completed: true,
        my_passed_check_in_ids: [11], my_best_completeness_pct: 100,
      }),
      session: session({ id: "s4", watch_mode: "pause_60s", answered_check_in_ids: [11] }),
    });
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByTestId("video-completed");
    await playTo(61, () => rerender(<VideoCompanion configId={800} />));
    expect(await screen.findByText(/Checkpoint/i)).toBeInTheDocument();
  });
});
