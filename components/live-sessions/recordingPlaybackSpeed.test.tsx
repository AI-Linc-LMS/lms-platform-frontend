import { describe, expect, it, vi, beforeEach } from "vitest";
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

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: { token: "tok" } });
});

describe("the live-session recording player", () => {
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

  it("does NOT ask the browser to hide the native speed control", async () => {
    // The regression, in one assertion. `noplaybackrate` suppresses it in the native chrome
    // too, so leaving it in would make our button the only way to reach speed on desktop.
    open();
    await screen.findByLabelText("Playback speed");
    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("controlsList") || "").not.toContain("noplaybackrate");
  });

  it("still hides Download for a viewer who is not allowed one", async () => {
    // The restriction that `noplaybackrate` was wrongly riding along with has to survive.
    open();
    await screen.findByLabelText("Playback speed");
    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("controlsList") || "").toContain("nodownload");
  });

  it("drops both restrictions for a viewer who IS allowed a download", async () => {
    render(
      <RecordingPlayerDialog
        liveClassId={7}
        occurrenceId={3}
        title="Week 1"
        open
        onClose={vi.fn()}
        allowDownload
      />,
    );
    await screen.findByLabelText("Playback speed");
    const video = document.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("controlsList")).toBeNull();
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
