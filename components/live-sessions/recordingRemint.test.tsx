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

/**
 * A recording that breaks mid-way re-mints once and resumes where it was.
 *
 * The stream URL now 302s to Zoom's pre-signed CDN URL (backend #1026). Chromium re-targets every
 * later Range request at that destination and never returns to our origin, so an expired CDN URL
 * fires `error` on the <video> with no way back. One re-mint fixes that; a second failure inside
 * the cooldown must surface the error rather than loop.
 */
function renderOpen() {
  return render(
    <RecordingPlayerDialog liveClassId={7} occurrenceId={70} title="Week 1" open onClose={() => undefined} />,
  );
}

describe("re-mint on playback error", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValueOnce({ data: { token: "first" } })
       .mockResolvedValueOnce({ data: { token: "second" } })
       .mockResolvedValue({ data: { token: "third" } });
  });
  afterEach(() => vi.restoreAllMocks());

  it("mints a fresh URL once when the video errors, and resumes at the same second", async () => {
    renderOpen();
    const video = (await waitFor(() => {
      const v = document.querySelector("video") as HTMLVideoElement | null;
      if (!v || !v.getAttribute("src")?.includes("t=first")) throw new Error("not yet");
      return v;
    })) as HTMLVideoElement;
    expect(get).toHaveBeenCalledTimes(1);
    // jsdom's HTMLMediaElement.currentTime is a plain settable number.
    video.currentTime = 42;
    fireEvent.error(video);
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    const [url] = get.mock.calls[1] as [string];
    expect(url).toContain("/recording/playback/?occurrence_id=70");
    await waitFor(() => expect(document.querySelector("video")?.getAttribute("src")).toContain("t=second"));
    const fresh = document.querySelector("video") as HTMLVideoElement;
    fireEvent.loadedMetadata(fresh);
    expect(fresh.currentTime).toBe(42);
  });

  it("does not loop: a second error inside the cooldown shows the error instead of re-minting", async () => {
    renderOpen();
    const video = (await waitFor(() => {
      const v = document.querySelector("video") as HTMLVideoElement | null;
      if (!v) throw new Error("not yet");
      return v;
    })) as HTMLVideoElement;
    fireEvent.error(video);
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    const fresh = (await waitFor(() => {
      const v = document.querySelector("video") as HTMLVideoElement | null;
      if (!v || !v.getAttribute("src")?.includes("t=second")) throw new Error("not yet");
      return v;
    })) as HTMLVideoElement;
    fireEvent.error(fresh);
    await waitFor(() => expect(screen.getByText(/could not load the recording/i)).toBeTruthy());
    expect(get).toHaveBeenCalledTimes(2);
  });
});
