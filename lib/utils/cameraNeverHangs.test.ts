import { describe, expect, it, vi } from "vitest";
import { attachCameraStream } from "./attachCameraStream";

/**
 * A camera that produces no picture must stop being waited on.
 *
 * `waitForFrames` polled every 200ms for as long as the page lived whenever frames never came —
 * a lens cover, a privacy shutter, a virtual camera with no source, or another application
 * holding the device. All of those leave `track.readyState === "live"`, so the device check went
 * on announcing "Camera is working properly" over a black rectangle while `onReady` never fired,
 * which also meant face detection never started. That is the state in the reported screenshot:
 * Camera "Ready", preview black, "No face detected".
 */

function videoEl(opts: { readyState?: number; w?: number; h?: number } = {}) {
  return {
    srcObject: null as unknown,
    readyState: opts.readyState ?? 0,
    videoWidth: opts.w ?? 0,
    videoHeight: opts.h ?? 0,
    play: () => Promise.resolve(),
  } as unknown as HTMLVideoElement;
}

const stream = { getTracks: () => [] } as unknown as MediaStream;

/** Runs the queued polls synchronously so the test does not wait in real time. */
function immediateTimeouts() {
  const queue: (() => void)[] = [];
  const fn = ((cb: () => void) => {
    queue.push(cb);
    return 0 as unknown as ReturnType<typeof setTimeout>;
  }) as unknown as typeof setTimeout;
  const drain = (max = 200) => {
    let n = 0;
    while (queue.length && n++ < max) queue.shift()!();
  };
  return { fn, drain, size: () => queue.length };
}

describe("waiting for the first frame", () => {
  it("gives up and says so when no frame ever arrives", async () => {
    const onReady = vi.fn();
    const onNoFrames = vi.fn();
    const t = immediateTimeouts();

    attachCameraStream({
      el: videoEl(),
      stream,
      onReady,
      onNoFrames,
      framesTimeoutMs: 1000,
      setTimeoutFn: t.fn,
    });
    await Promise.resolve();
    t.drain();

    expect(onNoFrames).toHaveBeenCalledTimes(1);
    expect(onReady).not.toHaveBeenCalled();
    // The poll is finished, not merely quiet: an unbounded one leaves work queued for ever.
    expect(t.size()).toBe(0);
  });

  it("still reports ready the moment a real frame arrives", async () => {
    // The control. Without it, "gives up" would also pass on a component that never waits at all.
    const onReady = vi.fn();
    const onNoFrames = vi.fn();
    const t = immediateTimeouts();
    const el = videoEl({ readyState: 2, w: 640, h: 480 });

    attachCameraStream({ el, stream, onReady, onNoFrames, setTimeoutFn: t.fn });
    await Promise.resolve();
    t.drain();

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onNoFrames).not.toHaveBeenCalled();
  });

  it("reports ready if frames start late, rather than giving up early", async () => {
    const onReady = vi.fn();
    const onNoFrames = vi.fn();
    const t = immediateTimeouts();
    const el = videoEl();

    attachCameraStream({
      el,
      stream,
      onReady,
      onNoFrames,
      framesTimeoutMs: 2000,
      setTimeoutFn: t.fn,
    });
    await Promise.resolve();
    // Two polls of nothing, then the camera wakes up.
    t.drain(2);
    Object.assign(el, { readyState: 2, videoWidth: 640, videoHeight: 480 });
    t.drain();

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onNoFrames).not.toHaveBeenCalled();
  });
});
