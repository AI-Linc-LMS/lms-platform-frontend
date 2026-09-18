/**
 * The video page on a second visit.
 *
 * Reported as "the progress bar is not moving as per the video" and "once it is done it should
 * show complete even if they revisit": a half-watched video restarted at 0:00 with an empty bar,
 * and a finished one reopened looking untouched.
 */
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const player = vi.hoisted(() => ({
  currentTime: 0, duration: 358, endedTick: 0, seekTo: vi.fn(), play: vi.fn(), pause: vi.fn(),
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
    // Everything else the page calls in the background (sync, end, description...) just succeeds.
    get: (target, key: string) => target[key] ?? vi.fn().mockResolvedValue({}),
  }),
}));
vi.mock("@/components/scorecard/shared", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  Reveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// framer-motion's whileInView needs an observer jsdom does not have.
class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

import { VideoCompanion } from "./VideoCompanion";

function companion(over: Record<string, unknown> = {}) {
  return {
    id: 800, title: "AI into Business Capital", instructions: "", description: "", video: { title: "AI", vimeo_id: "1", duration_seconds: 358 },
    concept_map: { nodes: [
      { id: "root", label: "Root", timestamp_seconds: 0 },
      { id: "a", label: "Opportunity Recognition", timestamp_seconds: 5, parent: "root" },
      { id: "b", label: "Problem Identification", timestamp_seconds: 300, parent: "root" },
    ], edges: [] },
    chapters: [], takeaways: [], target_skills: [], check_ins: [], transcript_segments: [],
    play_url: "https://vimeo.com/1164028722", source: "catalog", ...over,
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
  start.mockReset();
});

const width = (id: string) => (screen.getByTestId(id) as HTMLElement).style.width || getComputedStyle(screen.getByTestId(id)).width;

describe("coming back to a video", () => {
  it("shows a finished video as finished", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: companion({ rewatch_available: true, my_best_completeness_pct: 96 }), session: session() });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByTestId("video-completed")).toBeInTheDocument();
    // Every concept counts as covered, even the one at 5:00 the playhead has not reached.
    expect(screen.getByText("3 concepts")).toBeInTheDocument();
    expect(player.seekTo).not.toHaveBeenCalled(); // a rewatch starts from the beginning
  });

  it("resumes a half-watched video where it stopped and keeps what was watched", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: companion({ my_best_completeness_pct: 41 }), session: session({ current_timestamp: 212.5, completeness_pct: 41 }) });
    render(<VideoCompanion configId={800} />);
    await waitFor(() => expect(player.seekTo).toHaveBeenCalledWith(212.5));
    expect(screen.getByTestId("resumed-note")).toHaveTextContent("Picked up at 3:32");
    expect(screen.getByText("41% watched")).toBeInTheDocument();
    expect(screen.queryByTestId("video-completed")).toBeNull();
  });

  it("starts a first visit from the beginning with nothing watched", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: companion(), session: session() });
    render(<VideoCompanion configId={800} />);
    await screen.findByText(/0:00 \/ 5:58/);
    expect(player.seekTo).not.toHaveBeenCalled();
    expect(screen.queryByTestId("resumed-note")).toBeNull();
    expect(screen.queryByText(/% watched/)).toBeNull();
  });
});
