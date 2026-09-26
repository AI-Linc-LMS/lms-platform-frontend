/**
 * The full-screen control belongs to the control bar, not to the picture.
 *
 * Reported as "the video's full-screen button is positioned outside the bottom control bar and
 * remains visible even when the control bar is hidden" - a round button floating over the video,
 * still there once the player's controls had gone, sitting across the burned-in captions.
 *
 * The control itself has to stay ours: Vimeo's own button fullscreens the IFRAME, and a check-in
 * painted over the player is that iframe's sibling, so the browser draws the iframe alone and the
 * question is nowhere (see fullscreenCheckIn.test.tsx). What was wrong was where ours lived and
 * when. It now sits in a bar of the companion's own, laid on the band the player's bar occupies,
 * and it goes down with the player's controls instead of outliving them.
 */
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const player = vi.hoisted(() => ({ isPlaying: false }));
const start = vi.hoisted(() => vi.fn());

vi.mock("./useVimeoController", () => ({
  useVimeoController: () => ({
    setIframe: () => {}, currentTime: 0, duration: 149, isPlaying: player.isPlaying,
    playbackRate: 1, rewinds: [], endedTick: 0, play: vi.fn(), pause: vi.fn(),
    seekTo: vi.fn(), setRate: vi.fn(),
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

const companion = {
  id: 1, title: "Why complexity is a real world survival skill", instructions: "", description: "",
  video: { title: "Complexity", vimeo_id: "76979871", duration_seconds: 149 },
  concept_map: { nodes: [], edges: [] }, chapters: [], takeaways: [], target_skills: [],
  check_ins: [], transcript_segments: [],
  play_url: "https://vimeo.com/76979871", source: "catalog",
};
const session = {
  id: "s1", status: "active", watch_mode: "normal", current_timestamp: 0, completeness_pct: 0,
  max_speed: 1, comprehension_state: {}, comprehension_score: 0, started_at: "", completed_at: null,
};

beforeEach(() => {
  player.isPlaying = false;
  start.mockReset();
  start.mockResolvedValue({ session_id: "s1", companion, session });
});

const control = () => screen.getByTestId("companion-fullscreen");
const bar = () => screen.getByTestId("companion-control-bar");

describe("the video's full-screen control", () => {
  it("sits inside the bottom control bar rather than loose over the picture", async () => {
    render(<VideoCompanion configId={1} />);
    await screen.findByTestId("companion-fullscreen");

    // Not "near" the bar, not styled like it: IN it.
    expect(bar()).toContainElement(control());

    // And that bar is the bottom band of the player, the full width of it - the run of controls,
    // not a badge pinned somewhere over the video.
    //
    // `bottom` is ZERO: our band sits ON the player's own control row, not one bar-height above
    // it. It used to be 40px - clear of the player's bar - because removing Vimeo's fullscreen
    // button left no gap in its right-hand cluster to sit in. The embed now asks for `pip=0` as
    // well, which frees the last slot in that run, so ours stands in the row itself where a
    // player's fullscreen control belongs. Reported twice as a button outside the bar; this
    // assertion is what let it stay that way while reading as though it had not.
    const barStyle = getComputedStyle(bar());
    expect(barStyle.position).toBe("absolute");
    expect(barStyle.left).toBe("0px");
    expect(barStyle.right).toBe("0px");
    expect(barStyle.bottom).toBe("0px");
    expect(barStyle.height).toBe("40px");

    // The control is no longer positioned in its own right - the bar places it.
    expect(getComputedStyle(control()).position).not.toBe("absolute");
  });

  it("goes down with the player's controls once the video is running, and comes back when it stops", async () => {
    const { rerender } = render(<VideoCompanion configId={1} />);
    await screen.findByTestId("companion-fullscreen");
    // Nothing playing: the player keeps its bar up and so do we.
    expect(getComputedStyle(control()).opacity).toBe("1");

    // The player reports itself running, as a `play` from the embed does.
    player.isPlaying = true;
    rerender(<VideoCompanion configId={1} />);

    // While it runs and nothing is touched, the control fades out and stops taking a click. This
    // is the reported defect: before the fix it stayed at full opacity for the whole video.
    await waitFor(
      () => {
        expect(getComputedStyle(control()).opacity).toBe("0");
        expect(getComputedStyle(control()).pointerEvents).toBe("none");
      },
      { timeout: 8000, interval: 100 },
    );

    // Paused - a check-in, the end of the video, or the learner - and it is back with the bar.
    player.isPlaying = false;
    rerender(<VideoCompanion configId={1} />);
    await waitFor(() => {
      expect(getComputedStyle(control()).opacity).toBe("1");
      expect(getComputedStyle(control()).pointerEvents).toBe("auto");
    });
  });

  it("keeps its name and its place in the tab order", async () => {
    render(<VideoCompanion configId={1} />);
    await screen.findByTestId("companion-fullscreen");
    expect(control()).toHaveAttribute("aria-label", "Full screen");
    // Hidden with opacity rather than `visibility: hidden` on purpose: a keyboard user can still
    // tab onto it, and the focus brings the bar back (onFocusCapture on the player box).
    expect(control().tabIndex).toBeGreaterThanOrEqual(0);
    expect(control()).not.toBeDisabled();
  });
});
