/**
 * "Re-explain this clip" is only offered on a video that has a transcript.
 *
 * The server answers 400 for a companion with no transcript, because re-explaining a clip
 * it cannot read would mean inventing one. Production carries companions in exactly that
 * state (an external_url video, or a catalog video whose Vimeo text track never arrived),
 * and those learners were being shown the rail's most prominent button - which then failed
 * every single time they pressed it.
 */
import { render, screen } from "@testing-library/react";
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

function companion(over: Record<string, unknown> = {}) {
  return {
    id: 800, title: "AI into Business Capital", instructions: "", description: "",
    video: { title: "AI", vimeo_id: "1", duration_seconds: 358 },
    concept_map: { nodes: [], edges: [] },
    chapters: [], takeaways: [], target_skills: [], check_ins: [], transcript_segments: [],
    play_url: "https://vimeo.com/1164028722", source: "catalog", ...over,
  };
}

const session = {
  id: "s1", status: "active", watch_mode: "normal", current_timestamp: 0, completeness_pct: 0,
  max_speed: 1, comprehension_state: {}, comprehension_score: 0, started_at: "", completed_at: null,
};

beforeEach(() => {
  player.currentTime = 0;
  start.mockReset();
});

describe("the re-explain rail panel", () => {
  it("is not offered on a video with no transcript", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: companion(), session });
    render(<VideoCompanion configId={800} />);
    await screen.findByText(/0:00 \/ 5:58/);
    expect(screen.queryByText("Feeling lost?")).toBeNull();
    expect(screen.queryByRole("button", { name: /Re-explain this clip/i })).toBeNull();
  });

  it("is offered as soon as there is a transcript to read", async () => {
    start.mockResolvedValue({
      session_id: "s1",
      companion: companion({
        transcript_segments: [{ start_seconds: 0, end_seconds: 6, text: "Hello everyone." }],
      }),
      session,
    });
    render(<VideoCompanion configId={800} />);
    expect(await screen.findByText("Feeling lost?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Re-explain this clip/i })).toBeInTheDocument();
  });
});
