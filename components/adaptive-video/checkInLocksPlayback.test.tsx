/**
 * "When a Quick Check appears and pauses the video, pressing the spacebar still plays the video
 *  in the background while the unanswered question remains on screen."
 *
 * Pausing once, at the moment the question appeared, was the whole of the guard. The player is an
 * iframe with its own keyboard shortcuts and it keeps focus, so space told VIMEO to play, not us,
 * and the lecture carried on underneath an unanswered question. Clicking the player did the same.
 * The learner then answered a question about something they were no longer watching, and the
 * answer was scored.
 *
 * What is pinned: while a check-in is up, playback that starts by ANY route is stopped again -
 * the lock reacts to the player's own `isPlaying`, so it does not need to know how playback
 * began. And once the question is answered, the video is free again, because a lock that never
 * lifts is a worse bug than the one being fixed.
 */

import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const player = vi.hoisted(() => ({
  currentTime: 0, duration: 120, endedTick: 0, isPlaying: false,
  seekTo: vi.fn(), play: vi.fn(), pause: vi.fn(),
}));
const start = vi.hoisted(() => vi.fn());
const answerCheckIn = vi.hoisted(() => vi.fn());

vi.mock("./useVimeoController", () => ({
  useVimeoController: () => ({
    setIframe: () => {}, currentTime: player.currentTime, duration: player.duration,
    isPlaying: player.isPlaying, playbackRate: 1, rewinds: [], endedTick: player.endedTick,
    play: player.play, pause: player.pause, seekTo: player.seekTo, setRate: vi.fn(),
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
    check_ins: [marker(1, 5)], transcript_segments: [],
    play_url: "https://vimeo.com/1164028722", source: "catalog", ...over,
  };
}
function session(over: Record<string, unknown> = {}) {
  return { id: "s1", status: "active", watch_mode: "normal", current_timestamp: 0, completeness_pct: 0,
    max_speed: 1, comprehension_state: {}, comprehension_score: 0, answered_check_in_ids: [],
    started_at: "", completed_at: null, ...over };
}

async function playTo(to: number, rerender: () => void) {
  for (let s = 1; s <= to; s++) { player.currentTime = s; rerender(); }
  await waitFor(() => {});
}

beforeEach(() => {
  player.currentTime = 0; player.isPlaying = false;
  player.play.mockClear(); player.pause.mockClear();
  answerCheckIn.mockReset().mockResolvedValue({
    is_correct: true, correct_option: "A", explanation: "Because.", rewind_to_seconds: null,
  });
  start.mockReset().mockResolvedValue({
    session_id: "s1",
    companion: companion({ check_ins: [marker(1, 3)] }),
    session: session(),
  });
});

const mount = () => {
  const { rerender } = render(<VideoCompanion configId={800} />);
  return () => rerender(<VideoCompanion configId={800} />);
};

describe("a quick check holds the video still", () => {
  it("stops playback that starts while the question is unanswered", async () => {
    const rerender = mount();
    await screen.findByText("0/1 checks");
    await playTo(4, rerender);
    await waitFor(() => expect(screen.getByText("Question 1?")).toBeInTheDocument());

    const pausesWhenAsked = player.pause.mock.calls.length;
    // The learner presses space. Vimeo hears it, not us: the player simply starts playing.
    player.isPlaying = true;
    rerender();

    await waitFor(() =>
      expect(player.pause.mock.calls.length).toBeGreaterThan(pausesWhenAsked));
    // And the question is still there - it was never dismissed by the video moving.
    expect(screen.getByText("Question 1?")).toBeInTheDocument();
  });

  it("keeps stopping it, however many times playback is started", async () => {
    const rerender = mount();
    await screen.findByText("0/1 checks");
    await playTo(4, rerender);
    await waitFor(() => expect(screen.getByText("Question 1?")).toBeInTheDocument());

    const before = player.pause.mock.calls.length;
    for (let i = 0; i < 3; i++) {
      player.isPlaying = true; rerender(); await waitFor(() => {});
      player.isPlaying = false; rerender(); await waitFor(() => {});
    }
    expect(player.pause.mock.calls.length).toBeGreaterThan(before + 1);
  });

  it("swallows the space bar so it cannot scroll the question off screen", async () => {
    const rerender = mount();
    await screen.findByText("0/1 checks");
    await playTo(4, rerender);
    await waitFor(() => expect(screen.getByText("Question 1?")).toBeInTheDocument());

    const evt = new KeyboardEvent("keydown", { key: " ", cancelable: true, bubbles: true });
    window.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(true);
  });

  it("does NOT swallow a space a learner types into a field", async () => {
    const rerender = mount();
    await screen.findByText("0/1 checks");
    await playTo(4, rerender);
    await waitFor(() => expect(screen.getByText("Question 1?")).toBeInTheDocument());

    const input = document.createElement("input");
    document.body.appendChild(input);
    const evt = new KeyboardEvent("keydown", { key: " ", cancelable: true, bubbles: true });
    input.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(false);
    input.remove();
  });

  it("lets the video go again when there is no question on screen", async () => {
    // A lock that never lifts would be a worse bug than the one being fixed.
    start.mockResolvedValue({
      session_id: "s1", companion: companion({ check_ins: [] }), session: session(),
    });
    const rerender = mount();
    await playTo(4, rerender);

    const before = player.pause.mock.calls.length;
    player.isPlaying = true;
    rerender();
    await waitFor(() => {});
    expect(player.pause.mock.calls.length).toBe(before);

    const evt = new KeyboardEvent("keydown", { key: " ", cancelable: true, bubbles: true });
    window.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(false);
  });
});
