import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

/**
 * A two-hour recording with no way to speed it up.
 *
 * Reported from a phone and a laptop both: "Apart from pause and audio I don't see speed
 * option". The cause was one word - `controlsList="nodownload noplaybackrate"` - where
 * `noplaybackrate` had been bundled in with the download restriction. Speed has nothing to do
 * with downloading, and the restricted player is the DEFAULT, so this removed the control for
 * essentially every learner.
 *
 * Dropping the flag is necessary and not sufficient, which is the part worth testing. The
 * native control set differs per platform: Chrome on desktop hides speed behind an overflow
 * menu, Safari on iOS behind "...", and Android Chrome does not offer it at all. So the control
 * is drawn by us and asserted here, rather than left to whatever the browser feels like
 * showing.
 */

// `t` must be STABLE. The component's fetch effect lists it in its deps (as the real
// `useTranslation` guarantees it can), so a mock that returns a fresh function each render
// re-runs the effect on every render, which re-enters loading forever. The first draft of this
// file did exactly that and produced "Maximum update depth exceeded" - a failure of the mock,
// not of the component.
const t = (_k: string, d?: string) => d ?? _k;
const translation = { t };
vi.mock("react-i18next", () => ({ useTranslation: () => translation }));

const get = vi.fn();
vi.mock("@/lib/services/api", () => ({ default: { get: (...a: unknown[]) => get(...a) } }));
vi.mock("@/lib/config", () => ({
  config: { clientId: 1, apiBaseUrl: "https://api.test" },
  getPublicAppOrigin: () => "https://app.test",
}));

import { RecordingPlayerDialog } from "./RecordingPlayerDialog";

const open = () =>
  render(
    <RecordingPlayerDialog liveClassId={7} occurrenceId={3} title="Week 1" open onClose={vi.fn()} />,
  );

afterEach(() => {
  // fullscreenElement is defined per-test; leave it clean for the next one.
  Object.defineProperty(document, "fullscreenElement", { value: null, configurable: true });
});

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: { token: "tok" } });
});

describe("the live-session recording player", () => {
  /**
   * There is ONE control bar, and it is ours.
   *
   * Reported after the first two attempts: "the speed changing option is added in the top
   * right corner rather than in the bottom bar where other options are also present. A new
   * full screen button has also added at the top disabling the one already existed."
   *
   * Both fair. The native bar is browser shadow DOM - a custom control cannot be put inside
   * it - so speed had to float, and fullscreen had to be duplicated because the native one
   * promotes the <video> element alone and strands anything hovering over it. Two floating
   * controls above a bar that already had its own was the wrong shape.
   */
  it("renders no native control bar at all", async () => {
    open();
    await screen.findByTestId("recording-controls");
    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video.hasAttribute("controls")).toBe(false);
    // And therefore no controlsList: there is no native menu left to restrict.
    expect(video.getAttribute("controlsList")).toBeNull();
  });

  it("has exactly ONE fullscreen control", async () => {
    open();
    await screen.findByTestId("recording-controls");
    expect(screen.getAllByLabelText(/full screen/i)).toHaveLength(1);
  });

  it("puts speed in the bar beside the other controls, not floating over the picture", async () => {
    open();
    const bar = await screen.findByTestId("recording-controls");
    for (const name of [/playback speed/i, /^full screen$/i, /^mute$/i, /^(play|pause)$/i]) {
      expect(within(bar).getByLabelText(name)).toBeTruthy();
    }
  });

  it("keeps Download structurally unavailable", async () => {
    // What `controlsList="nodownload"` asked for is now a consequence of there being no
    // native menu. Right-click stays blocked, since "Save video as…" lives there.
    open();
    await screen.findByTestId("recording-controls");
    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("controls")).toBeNull();
    expect(video.hasAttribute("disablepictureinpicture")).toBe(true);
  });
  /**
   * Reported after the first fix shipped: "in full screen - speed save mode disappears".
   *
   * The speed pill is an overlay on the container. The NATIVE fullscreen button promotes the
   * <video> ELEMENT, and an element in the fullscreen layer renders alone - so the pill was
   * left behind. There is nowhere to portal it either: a <video> is a replaced element and
   * cannot take children.
   *
   * So the native button is turned off and fullscreen is taken on the CONTAINER, which carries
   * the controls into the fullscreen layer with it.
   */

  it("offers its own fullscreen control beside the speed one", async () => {
    open();
    await screen.findByLabelText("Playback speed");
    expect(screen.getByLabelText("Full screen")).toBeTruthy();
  });

  it("fullscreens the CONTAINER, not the video", async () => {
    // The whole point: the container carries the speed pill with it.
    open();
    await screen.findByLabelText("Playback speed");
    const req = vi.fn();
    const video = document.querySelector("video") as HTMLVideoElement;
    const shell = video.parentElement as HTMLElement;
    shell.requestFullscreen = req;
    (video as unknown as { requestFullscreen?: () => void }).requestFullscreen = vi.fn();
    fireEvent.click(screen.getByLabelText("Full screen"));
    expect(req).toHaveBeenCalled();
    expect((video as unknown as { requestFullscreen: ReturnType<typeof vi.fn> })
      .requestFullscreen).not.toHaveBeenCalled();
  });

  it("keeps the speed control reachable while fullscreen", async () => {
    open();
    await screen.findByLabelText("Playback speed");
    const video = document.querySelector("video") as HTMLVideoElement;
    const shell = video.parentElement as HTMLElement;
    shell.requestFullscreen = vi.fn();
    fireEvent.click(screen.getByLabelText("Full screen"));
    // The browser tells us it happened via the event, not the call.
    Object.defineProperty(document, "fullscreenElement", { value: shell, configurable: true });
    fireEvent(document, new Event("fullscreenchange"));
    await waitFor(() => expect(screen.getByLabelText("Exit full screen")).toBeTruthy());
    expect(screen.getByLabelText("Playback speed")).toBeTruthy();
  });

  it("still changes the rate while fullscreen", async () => {
    open();
    await screen.findByLabelText("Playback speed");
    const video = document.querySelector("video") as HTMLVideoElement;
    const shell = video.parentElement as HTMLElement;
    Object.defineProperty(document, "fullscreenElement", { value: shell, configurable: true });
    fireEvent(document, new Event("fullscreenchange"));
    fireEvent.click(screen.getByLabelText("Playback speed"));
    const menu = await screen.findByRole("menu");
    fireEvent.click(within(menu).getByText("1.5x"));
    await waitFor(() => expect(video.playbackRate).toBe(1.5));
  });

  it("exits fullscreen rather than re-requesting it", async () => {
    open();
    await screen.findByLabelText("Playback speed");
    const video = document.querySelector("video") as HTMLVideoElement;
    const shell = video.parentElement as HTMLElement;
    Object.defineProperty(document, "fullscreenElement", { value: shell, configurable: true });
    fireEvent(document, new Event("fullscreenchange"));
    const exit = vi.fn();
    document.exitFullscreen = exit;
    fireEvent.click(await screen.findByLabelText("Exit full screen"));
    expect(exit).toHaveBeenCalled();
  });

  it("does not throw when the browser refuses fullscreen", async () => {
    // A refused request must still leave a working player and a working speed control.
    open();
    await screen.findByLabelText("Playback speed");
    const video = document.querySelector("video") as HTMLVideoElement;
    const shell = video.parentElement as HTMLElement;
    shell.requestFullscreen = vi.fn(() => { throw new Error("denied"); });
    expect(() => fireEvent.click(screen.getByLabelText("Full screen"))).not.toThrow();
    expect(screen.getByLabelText("Playback speed")).toBeTruthy();
  });

  it("offers a playback speed control", async () => {
    open();
    const btn = await screen.findByLabelText("Playback speed");
    expect(btn).toBeTruthy();
    expect(btn.textContent).toContain("1x");
  });

  it("actually changes the video's rate, not just the label", async () => {
    open();
    await screen.findByLabelText("Playback speed");
    fireEvent.click(screen.getByLabelText("Playback speed"));
    const menu = await screen.findByRole("menu");
    fireEvent.click(within(menu).getByText("1.5x"));
    const video = document.querySelector("video") as HTMLVideoElement;
    await waitFor(() => expect(video.playbackRate).toBe(1.5));
    expect(screen.getByLabelText("Playback speed").textContent).toContain("1.5x");
  });




  it("keeps the chosen speed when the element reloads", async () => {
    // A new signed URL remounts the <video>, which comes back at 1x. The rate is re-applied on
    // loadedmetadata rather than set once and forgotten.
    open();
    await screen.findByLabelText("Playback speed");
    fireEvent.click(screen.getByLabelText("Playback speed"));
    const menu = await screen.findByRole("menu");
    fireEvent.click(within(menu).getByText("2x"));
    const video = document.querySelector("video") as HTMLVideoElement;
    video.playbackRate = 1; // what a remount leaves behind
    fireEvent.loadedMetadata(video);
    await waitFor(() => expect(video.playbackRate).toBe(2));
  });

  it("offers the usual ladder, slow and fast", async () => {
    open();
    await screen.findByLabelText("Playback speed");
    fireEvent.click(screen.getByLabelText("Playback speed"));
    const menu = await screen.findByRole("menu");
    for (const label of ["0.5x", "0.75x", "1x", "1.25x", "1.5x", "1.75x", "2x"]) {
      expect(within(menu).getByText(label)).toBeTruthy();
    }
  });
});
