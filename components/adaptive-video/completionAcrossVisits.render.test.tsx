/**
 * A finished video concept is still finished the next time the learner opens it.
 *
 * Reported as "once the concept is done, pass and check - it should mark complete even if they
 * revisit". The watched bar already survived a revisit; what did not was the other half of "done".
 * A check-in response belongs to a session and a revisit opens a new one, so the page came back
 * with an empty answered set: the green markers went purple, the counter reset to 0, and playing
 * past a concept the learner had already passed re-armed its probe and asked the question again.
 * On an externally-hosted video - the one kind where the learner declares completion themselves -
 * the button went back to "I've finished watching" on every visit.
 */
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const player = vi.hoisted(() => ({
  currentTime: 0, duration: 60, endedTick: 0, seekTo: vi.fn(), play: vi.fn(), pause: vi.fn(),
}));
const start = vi.hoisted(() => vi.fn());

vi.mock("./useVimeoController", () => ({
  useVimeoController: () => ({
    setIframe: () => {}, currentTime: player.currentTime, duration: player.duration, isPlaying: false,
    playbackRate: 1, rewinds: [], endedTick: player.endedTick, play: player.play, pause: player.pause,
    seekTo: player.seekTo, setRate: vi.fn(),
  }),
}));
vi.mock("@/lib/services/adaptive-video.service", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  adaptiveVideoService: new Proxy({ startSession: start } as Record<string, unknown>, {
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

const CHECK_IN = {
  id: 10, timestamp_seconds: 3, concept: "Base case", order: 0,
  question_text: "What stops a recursion?",
  option_a: "A base case", option_b: "A loop", option_c: "A return", option_d: "A stack",
};

function companion(over: Record<string, unknown> = {}) {
  return {
    id: 800, title: "Recursion", instructions: "", description: "",
    video: { title: "Recursion", vimeo_id: "1", duration_seconds: 60 },
    concept_map: { nodes: [], edges: [] }, chapters: [], takeaways: [], target_skills: [],
    check_ins: [CHECK_IN], transcript_segments: [],
    play_url: "https://player.vimeo.com/video/1", source: "catalog", ...over,
  };
}

function session(over: Record<string, unknown> = {}) {
  return { id: "s1", status: "active", watch_mode: "normal", current_timestamp: 0, completeness_pct: 0,
    max_speed: 1, comprehension_state: {}, comprehension_score: 0, started_at: "", completed_at: null, ...over };
}

beforeEach(() => {
  player.currentTime = 0;
  player.endedTick = 0;
  player.seekTo.mockReset();
  player.pause.mockReset();
  start.mockReset();
});

/** Play the video second by second, the way the coverage tracker expects to see it. */
async function playTo(seconds: number, rerender: (ui: ReactNode) => void) {
  for (let s = 1; s <= seconds; s++) {
    player.currentTime = s;
    rerender(<VideoCompanion configId={800} />);
    await waitFor(() => expect(screen.getByText(new RegExp(`0:0${s} /`))).toBeInTheDocument());
  }
}

describe("a check-in the learner has already passed", () => {
  it("is not asked again on the next visit", async () => {
    start.mockResolvedValue({
      session_id: "s1",
      companion: companion({ my_completed: true, rewatch_available: true, my_passed_check_in_ids: [10] }),
      session: session(),
    });
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByTestId("video-completed");
    await playTo(5, rerender);
    expect(screen.queryByText("What stops a recursion?")).toBeNull();
    expect(player.pause).not.toHaveBeenCalled();
  });

  it("comes back marked, so the counter does not reset to zero", async () => {
    start.mockResolvedValue({
      session_id: "s1",
      companion: companion({ my_completed: true, my_passed_check_in_ids: [10] }),
      session: session(),
    });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByText("1/1 checks")).toBeInTheDocument();
  });

  it("is still asked when this learner has not passed it", async () => {
    start.mockResolvedValue({
      session_id: "s1", companion: companion({ my_passed_check_in_ids: [] }), session: session(),
    });
    const { rerender } = render(<VideoCompanion configId={800} />);
    await screen.findByText("0/1 checks");
    await playTo(5, rerender);
    expect(await screen.findByText("What stops a recursion?")).toBeInTheDocument();
  });
});

describe("the completed badge", () => {
  it("follows the completion record, not the rewatch rule", async () => {
    // A learner who ended a watch but did not get through the video: completed (the topic page
    // ticks it), and NOT eligible for a question-free rewatch. The badge follows the tick.
    start.mockResolvedValue({
      session_id: "s1",
      companion: companion({ my_completed: true, rewatch_available: false }),
      session: session(),
    });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByTestId("video-completed")).toBeInTheDocument();
  });

  it("stays off for a video this learner has never finished", async () => {
    start.mockResolvedValue({
      session_id: "s1", companion: companion({ my_completed: false, rewatch_available: false }), session: session(),
    });
    render(<VideoCompanion configId={800} />);
    await screen.findByText("0/1 checks");
    expect(screen.queryByTestId("video-completed")).toBeNull();
  });

  it("falls back to the rewatch flag against a backend that has not shipped the field", async () => {
    start.mockResolvedValue({
      session_id: "s1", companion: companion({ rewatch_available: true }), session: session(),
    });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByTestId("video-completed")).toBeInTheDocument();
  });
});

describe("an externally-hosted video", () => {
  const external = (over: Record<string, unknown> = {}) =>
    companion({ video: null, source: "external", check_ins: [], play_url: "https://www.youtube.com/watch?v=x", ...over });

  it("remembers that the learner already pressed the button", async () => {
    // The press is what drove coverage to exactly 100; nothing else on an external video can.
    start.mockResolvedValue({
      session_id: "s1",
      companion: external({ my_completed: true, my_best_completeness_pct: 100 }),
      session: session(),
    });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByTestId("mark-watched")).toHaveTextContent("Marked as watched");
  });

  it("stays live for a learner who only ever opened it", async () => {
    // `end_session` fires on unmount, so merely opening an external video records a completed
    // session at 0% coverage. Disabling the button on that would leave the learner looking at a
    // declaration they never made, unable to make it, and their award pegged at zero coverage.
    start.mockResolvedValue({
      session_id: "s1",
      companion: external({ my_completed: true, my_best_completeness_pct: 0 }),
      session: session(),
    });
    render(<VideoCompanion configId={800} />);
    const button = await screen.findByTestId("mark-watched");
    expect(button).toHaveTextContent("I've finished watching");
    expect(button).not.toBeDisabled();
  });

  it("still asks on a first visit", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: external({ my_completed: false }), session: session() });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByTestId("mark-watched")).toHaveTextContent("I've finished watching");
  });
});

describe("completed, but this visit is still being asked the checks", () => {
  it("says so, instead of a flat Completed over a video about to stop and ask", async () => {
    // The 132 learner-videos the backend stops exempting: completed (they keep the tick), no
    // longer eligible for a question-free rewatch, so the check-ins are served again.
    start.mockResolvedValue({
      session_id: "s1",
      companion: companion({ my_completed: true, rewatch_available: false, my_passed_check_in_ids: [] }),
      session: session(),
    });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByTestId("video-completed")).toHaveTextContent("Completed · checks pending");
  });

  it("goes back to a plain Completed once every check is passed", async () => {
    start.mockResolvedValue({
      session_id: "s1",
      companion: companion({ my_completed: true, rewatch_available: false, my_passed_check_in_ids: [10] }),
      session: session(),
    });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByTestId("video-completed")).toHaveTextContent(/^Completed$/);
  });

  it("is plain Completed in rewatch mode, where nothing is asked at all", async () => {
    start.mockResolvedValue({
      session_id: "s1",
      companion: companion({ my_completed: true, rewatch_available: true, check_ins: [], my_passed_check_in_ids: [10] }),
      session: session({ watch_mode: "rewatch" }),
    });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByTestId("video-completed")).toHaveTextContent(/^Completed$/);
  });
});
