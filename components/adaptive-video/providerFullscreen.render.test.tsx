/**
 * The full-screen control the companion draws, per provider.
 *
 * Reported as "the video's full-screen button is positioned outside the bottom control bar and
 * remains visible even when the control bar is hidden", with the button sitting across the
 * burned-in captions of a slide video. #1699 gave the control a bar of its own on the player's
 * band and tied it to the player's show/hide clock - and that clock is Vimeo's postMessage
 * protocol (useVimeoController), which is the ONLY play/pause signal this page has.
 *
 * On every other provider nothing ever arrives: `isPlaying` stays false for the whole video, the
 * bar's rule ("up whenever the video is not running") holds it up forever, and the learner sees
 * exactly what was reported - a full-screen button over the picture with no control bar in sight.
 * The same players also keep their own full-screen button, which we have no way to strip, so ours
 * was a second one.
 *
 * The rule, and it comes out the same from three directions: ours exists to keep a check-in inside
 * the fullscreen subtree, so it exists only where an overlay of ours can be painted (a catalog
 * video - check-ins are built from a transcript) AND where the provider's own control can be taken
 * away (a Vimeo player). Everywhere else the provider keeps its own, and we draw nothing.
 */
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/i18n";

const player = vi.hoisted(() => ({ isPlaying: false, currentTime: 0 }));
const start = vi.hoisted(() => vi.fn());

vi.mock("./useVimeoController", () => ({
  useVimeoController: () => ({
    setIframe: () => {}, currentTime: player.currentTime, duration: 149, isPlaying: player.isPlaying,
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

const session = { id: "s1", status: "active", watch_mode: "normal", current_timestamp: 0, completeness_pct: 0,
  max_speed: 1, comprehension_state: {}, comprehension_score: 0, started_at: "", completed_at: null };

/** A catalog video: a Vimeo record, a transcript, and therefore check-ins. */
function catalog() {
  return {
    id: 1, title: "Complexity", instructions: "", description: "",
    video: { title: "Complexity", vimeo_id: "76979871", duration_seconds: 149 },
    concept_map: { nodes: [], edges: [] }, chapters: [], takeaways: [], target_skills: [],
    check_ins: [], transcript_segments: [{ start_seconds: 0, end_seconds: 5, text: "Hello." }],
    play_url: "https://player.vimeo.com/video/76979871", source: "catalog",
  };
}

/** A pasted link: `video` is null, there is no transcript, and so nothing of ours is ever
 *  painted over the player. */
function external(playUrl: string) {
  return { ...catalog(), video: null, transcript_segments: [], play_url: playUrl, source: "external" };
}

/**
 * The providers `toEmbedUrl` knows how to reach. Every one of them keeps its own full-screen
 * button - none takes a `fullscreen=0` - and none speaks Vimeo's postMessage protocol, so none
 * ever tells this page the video is playing.
 */
const OTHER_PROVIDERS: [string, string][] = [
  // The real shape of an Impacteers link: a OneDrive for Business share from their SharePoint
  // tenant (lib/utils/video-embed.test.ts carries the same one).
  ["SharePoint / OneDrive", "https://tisteps-my.sharepoint.com/:v:/g/personal/someone_impacteers_com/IQD8kok0pWTsTJ3H?e=ooXP81"],
  ["YouTube", "https://www.youtube.com/watch?v=ApSbjuVHAR8"],
  ["Google Drive", "https://drive.google.com/file/d/ABC123/view?usp=sharing"],
  ["Dropbox", "https://www.dropbox.com/s/x/lesson.mp4?dl=0"],
  ["Loom", "https://www.loom.com/share/abc123"],
  ["a direct file", "https://cdn.example.com/lesson.mp4"],
];

beforeEach(() => {
  player.isPlaying = false;
  player.currentTime = 0;
  start.mockReset();
});

describe("who owns the full-screen button", () => {
  it("is the companion on a catalog video, whose check-ins the iframe would hide", async () => {
    start.mockResolvedValue({ session_id: "s1", companion: catalog(), session });
    const { container } = render(<VideoCompanion configId={1} />);
    await screen.findByTestId("companion-fullscreen");
    expect(screen.getByTestId("companion-control-bar")).toContainElement(screen.getByTestId("companion-fullscreen"));
    // And Vimeo's own is gone, so there is exactly one.
    expect(container.querySelector("iframe")!.getAttribute("src")).toContain("fullscreen=0");
  });

  it.each(OTHER_PROVIDERS)(
    "is the provider's own on %s, so the companion draws no bar over the picture",
    async (_name, url) => {
      start.mockResolvedValue({ session_id: "s1", companion: external(url), session });
      const { container } = render(<VideoCompanion configId={1} />);
      await screen.findByText("Watch mode");

      // THE REPORT. Our button used to be drawn here whatever the provider, and the bar it lives
      // in is held up by `isPlaying` - which one of these players never sends. Nothing arrives,
      // the bar never goes down, and the learner is left looking at a full-screen button with no
      // control bar under it, over the burned-in captions.
      expect(screen.queryByTestId("companion-control-bar")).toBeNull();
      expect(screen.queryByTestId("companion-fullscreen")).toBeNull();

      // The provider's own control is what fullscreens this video, so it must not be stripped and
      // the frame must still be allowed to use it.
      const iframe = container.querySelector("iframe")!;
      expect(iframe.getAttribute("src")).not.toContain("fullscreen=0");
      expect(iframe).toHaveAttribute("allowfullscreen");
      expect(iframe.getAttribute("allow")).toContain("fullscreen");
    },
  );

  it("is Vimeo's own on a PASTED vimeo link, which carries no check-ins to protect", async () => {
    // The one case where stripping the provider's button without replacing it would leave the
    // learner no way into full screen at all.
    start.mockResolvedValue({ session_id: "s1", companion: external("https://vimeo.com/76979871"), session });
    const { container } = render(<VideoCompanion configId={1} />);
    await screen.findByText("Watch mode");
    expect(screen.queryByTestId("companion-fullscreen")).toBeNull();
    expect(container.querySelector("iframe")!.getAttribute("src")).not.toContain("fullscreen=0");
  });
});

describe("the companion's bar follows the player even when `play` never arrives", () => {
  it("goes down while the playhead is moving, with isPlaying still false", async () => {
    // `isPlaying` flips on a `play` event, and that event can be missed - the subscription is made
    // from the iframe handshake, which a frame restored from the back/forward cache is already
    // past. The clock keeps ticking either way, and a bar pinned up for a whole playing video is
    // the reported defect by a second route.
    start.mockResolvedValue({ session_id: "s1", companion: catalog(), session });
    const { rerender } = render(<VideoCompanion configId={1} />);
    await screen.findByTestId("companion-fullscreen");
    expect(getComputedStyle(screen.getByTestId("companion-fullscreen")).opacity).toBe("1");

    // A playing video ticks; drive the clock the way the player does, in playback-sized steps.
    const tick = setInterval(() => {
      player.currentTime = Math.round((player.currentTime + 0.25) * 100) / 100;
      rerender(<VideoCompanion configId={1} />);
    }, 200);
    try {
      expect(player.isPlaying).toBe(false);
      await waitFor(
        () => expect(getComputedStyle(screen.getByTestId("companion-fullscreen")).opacity).toBe("0"),
        { timeout: 8000, interval: 100 },
      );
    } finally {
      clearInterval(tick);
    }
  });

  it("stays up when the playhead JUMPS, which is a seek and not playback", async () => {
    // Clicking a chapter on a paused video has not started it. Counting that as "running" would
    // take the learner's controls away 2.6s later - the same bug, turned round.
    start.mockResolvedValue({ session_id: "s1", companion: catalog(), session });
    const { rerender } = render(<VideoCompanion configId={1} />);
    await screen.findByTestId("companion-fullscreen");
    player.currentTime = 90;
    rerender(<VideoCompanion configId={1} />);
    await new Promise((r) => setTimeout(r, 3200));
    expect(getComputedStyle(screen.getByTestId("companion-fullscreen")).opacity).toBe("1");
  });
});
