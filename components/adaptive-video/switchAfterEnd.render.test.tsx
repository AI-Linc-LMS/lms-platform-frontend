/**
 * A mode picked after the video has ended starts a new watch in that mode, as reopening the page
 * would, instead of flipping silently back.
 *
 * The player ends (and scores) its watch the moment the video reaches the end, while the learner is
 * still on the page. The server keeps an ended watch in the mode it was scored in (#908), so a
 * switch sent to it came back refused and the rail went back to the old mode without a word.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const player = vi.hoisted(() => ({ endedTick: 0, rewinds: [] as { from: number; to: number }[], seekTo: vi.fn() }));
const api = vi.hoisted(() => ({ startSession: vi.fn(), sync: vi.fn(), endSession: vi.fn(), getCompanion: vi.fn() }));

vi.mock("./useVimeoController", () => ({
  useVimeoController: () => ({
    setIframe: () => {}, currentTime: 0, duration: 200, isPlaying: false, playbackRate: 1,
    rewinds: player.rewinds, endedTick: player.endedTick, play: vi.fn(), pause: vi.fn(),
    seekTo: player.seekTo, setRate: vi.fn(),
  }),
}));
vi.mock("@/lib/services/adaptive-video.service", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  adaptiveVideoService: new Proxy(api as Record<string, unknown>, {
    get: (target, key: string) => target[key] ?? vi.fn().mockResolvedValue({}),
  }),
}));

class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = NoopObserver;

import { VideoCompanion } from "./VideoCompanion";

const companion = {
  id: 800, title: "Recursion", instructions: "", description: "",
  video: { title: "Recursion", vimeo_id: "1", duration_seconds: 200 },
  concept_map: { nodes: [], edges: [] }, chapters: [], takeaways: [], target_skills: [], check_ins: [],
  transcript_segments: [], play_url: "https://player.vimeo.com/video/1", source: "catalog",
  rewatch_available: true, my_completed: false, my_passed_check_in_ids: [],
};
const session = (id: string, mode: string) => ({
  id, status: "active", watch_mode: mode, current_timestamp: 0, completeness_pct: 0, max_speed: 1,
  comprehension_state: {}, comprehension_score: 0, started_at: "", completed_at: null,
});
const modeOption = (name: RegExp) => screen.getByRole("radio", { name });

beforeEach(() => {
  player.endedTick = 0;
  player.rewinds = [];
  player.seekTo.mockReset();
  for (const f of Object.values(api)) f.mockReset();
  // The first watch opens in Normal; a watch started with a mode opens in that mode.
  api.startSession.mockImplementation((_config: number, mode?: string) =>
    Promise.resolve(mode
      ? { session_id: "s2", companion, session: session("s2", mode) }
      : { session_id: "s1", companion, session: session("s1", "normal") }));
  // An ended watch keeps its mode; the open one takes the switch.
  api.sync.mockImplementation((id: string, signals: { watch_mode?: string }) =>
    Promise.resolve(session(id, id === "s1" ? "normal" : signals.watch_mode || "pause_60s")));
  api.endSession.mockImplementation((id: string) => Promise.resolve({ ...session(id, "normal"), status: "completed" }));
});

describe("picking a mode after the video has ended", () => {
  it("starts a new watch in that mode instead of flipping back", async () => {
    player.rewinds = [{ from: 20, to: 5 }];
    const { rerender, unmount, container } = render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    const iframe = container.querySelector("iframe");

    player.endedTick = 1; // the video reaches its end: the page ends and scores the watch
    rerender(<VideoCompanion configId={800} />);
    await waitFor(() => expect(api.endSession).toHaveBeenCalledWith("s1"));

    fireEvent.click(screen.getByText("Pause & ask every 60s"));
    await waitFor(() => expect(api.startSession).toHaveBeenLastCalledWith(800, "pause_60s"));
    await waitFor(() => expect(modeOption(/Pause & ask/)).toHaveAttribute("aria-checked", "true"));
    expect(api.sync).not.toHaveBeenCalledWith("s1", { watch_mode: "pause_60s" });
    expect(container.querySelector("iframe")).toBe(iframe); // the player carries on untouched
    expect(player.seekTo).not.toHaveBeenCalled();

    // The new watch is the live one, and counts only what it plays: leaving ends IT, without the
    // rewind the ended watch already sent.
    unmount();
    await waitFor(() => expect(api.endSession).toHaveBeenCalledWith("s2"));
    const flushes = api.sync.mock.calls.filter(([, signals]) => signals.current_timestamp !== undefined);
    expect(flushes.map(([id, signals]) => [id, signals.rewinds])).toEqual([["s1", [{ from: 20, to: 5 }]], ["s2", undefined]]);
  });

  it("still switches the open watch while the video has not ended", async () => {
    render(<VideoCompanion configId={800} />);
    await screen.findByText(/^0:00 \//);
    fireEvent.click(screen.getByText("Pause & ask every 60s"));
    await waitFor(() => expect(api.sync).toHaveBeenCalledWith("s1", { watch_mode: "pause_60s" }));
    expect(api.startSession).toHaveBeenCalledTimes(1);
  });
});
