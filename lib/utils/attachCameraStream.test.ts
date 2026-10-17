import { describe, it, expect, vi } from "vitest";
import { attachCameraStream } from "./attachCameraStream";

/**
 * The reported symptom: "camera access given, browser shows green, platform shows black" —
 * and only for some users, in Edge.
 *
 * The cause was ordering. The device-check page attached the stream inline behind a bare
 * `if (videoRef.current)` with no retry, while rendering a spinner until an async gate
 * resolved. When getUserMedia won that race the <video> was not mounted, srcObject was never
 * set, and nothing ever set it again. The tracks stayed live — hence the green indicator —
 * and the preview was black forever.
 *
 * So the contract under test is order-independence: attach must work whichever of the two
 * arrives second.
 */

function fakeVideo(opts: { ready?: number; w?: number; h?: number } = {}) {
  const el = {
    srcObject: null as MediaStream | null,
    readyState: opts.ready ?? 4,
    videoWidth: opts.w ?? 640,
    videoHeight: opts.h ?? 480,
    play: vi.fn(() => Promise.resolve()),
  };
  return el as unknown as HTMLVideoElement & { play: ReturnType<typeof vi.fn> };
}

const fakeStream = () => ({ id: "s1" }) as unknown as MediaStream;

describe("attachCameraStream", () => {
  it("attaches when the element mounts AFTER the stream arrives", async () => {
    // The losing race, reproduced: no element at stream time.
    const stream = fakeStream();
    expect(attachCameraStream({ el: null, stream })).toBe(false);

    // ...then the element mounts and the callback ref calls again.
    const el = fakeVideo();
    expect(attachCameraStream({ el, stream })).toBe(true);
    expect(el.srcObject).toBe(stream);
  });

  it("attaches when the stream arrives AFTER the element mounts", () => {
    const el = fakeVideo();
    expect(attachCameraStream({ el, stream: null })).toBe(false);
    expect(el.srcObject).toBeNull();

    const stream = fakeStream();
    expect(attachCameraStream({ el, stream })).toBe(true);
    expect(el.srcObject).toBe(stream);
  });

  it("is idempotent — re-attaching the same stream does not restart playback", () => {
    const el = fakeVideo();
    const stream = fakeStream();
    attachCameraStream({ el, stream });
    expect(el.play).toHaveBeenCalledTimes(1);

    attachCameraStream({ el, stream });
    attachCameraStream({ el, stream });
    expect(el.play).toHaveBeenCalledTimes(1);
  });

  it("signals ready only once frames actually exist", async () => {
    // Starting face detection against a 0x0 element is what made a working camera report
    // "no face detected".
    const el = fakeVideo({ ready: 0, w: 0, h: 0 });
    const onReady = vi.fn();
    const timers: (() => void)[] = [];
    const fakeTimeout = ((fn: () => void) => {
      timers.push(fn);
      return 0;
    }) as unknown as typeof setTimeout;

    attachCameraStream({ el, stream: fakeStream(), onReady, setTimeoutFn: fakeTimeout });
    await Promise.resolve();
    await Promise.resolve();
    expect(onReady).not.toHaveBeenCalled();

    // frames arrive
    (el as unknown as { readyState: number }).readyState = 4;
    (el as unknown as { videoWidth: number }).videoWidth = 640;
    (el as unknown as { videoHeight: number }).videoHeight = 480;
    timers.forEach((t) => t());
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("does not signal ready when the stream carries no live video track", async () => {
    const el = fakeVideo();
    const onReady = vi.fn();
    attachCameraStream({ el, stream: fakeStream(), onReady, hasVideo: false });
    await Promise.resolve();
    await Promise.resolve();
    expect(onReady).not.toHaveBeenCalled();
  });

  it("swallows AbortError and NotAllowedError without failing the attach", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const name of ["AbortError", "NotAllowedError"]) {
      const el = fakeVideo();
      el.play = vi.fn(() => Promise.reject(Object.assign(new Error(name), { name })));
      expect(attachCameraStream({ el, stream: fakeStream() })).toBe(true);
      await Promise.resolve();
      await Promise.resolve();
    }
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
