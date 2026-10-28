import { describe, expect, it, vi } from "vitest";
import {
  meanLuminance,
  pickAlternateCamera,
  watchPictureLiveness,
  watchVideoTrack,
} from "./cameraHealth";

/**
 * A camera is only "working" while it is giving us a picture.
 *
 * The device check assessed the track once, at grant time, and said "Camera is working properly"
 * for as long as the page lived. Every way a camera stops short of a picture -- another app
 * taking the device, a shutter, antivirus webcam protection, a virtual camera with no source --
 * leaves that one-time check true. The reported screenshot is that state: "Ready", a black
 * preview, Chrome's own muted-track icon, "No face detected".
 */

// ---------------------------------------------------------------- track transitions

function fakeTrack(init: { muted?: boolean; readyState?: "live" | "ended" } = {}) {
  const listeners: Record<string, (() => void)[]> = {};
  const track = {
    muted: init.muted ?? false,
    readyState: init.readyState ?? "live",
    addEventListener: (name: string, fn: () => void) => {
      (listeners[name] ??= []).push(fn);
    },
    removeEventListener: (name: string, fn: () => void) => {
      listeners[name] = (listeners[name] ?? []).filter((f) => f !== fn);
    },
    fire: (name: string) => (listeners[name] ?? []).forEach((f) => f()),
    listenerCount: () => Object.values(listeners).reduce((n, l) => n + l.length, 0),
  };
  return track as unknown as MediaStreamTrack & { fire(n: string): void; listenerCount(): number };
}

describe("watching a granted video track", () => {
  it("reports the source going away, and coming back", () => {
    const track = fakeTrack();
    const onMuted = vi.fn();
    const onUnmuted = vi.fn();
    watchVideoTrack(track, { onMuted, onUnmuted });

    track.fire("mute");
    expect(onMuted).toHaveBeenCalledTimes(1);
    track.fire("unmute");
    expect(onUnmuted).toHaveBeenCalledTimes(1);
  });

  it("reports a track that is ALREADY muted when handed over", () => {
    // The browser gives us a track for a device another application holds; it arrives muted and
    // never fires a transition. A watcher that only listened would call that camera healthy.
    const track = fakeTrack({ muted: true });
    const onMuted = vi.fn();
    watchVideoTrack(track, { onMuted });
    expect(onMuted).toHaveBeenCalledTimes(1);
  });

  it("reports a track that has ended", () => {
    const track = fakeTrack();
    const onEnded = vi.fn();
    watchVideoTrack(track, { onEnded });
    track.fire("ended");
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  it("stop() removes every listener", () => {
    const track = fakeTrack();
    const watch = watchVideoTrack(track, { onMuted: vi.fn() });
    expect(track.listenerCount()).toBe(3);
    watch.stop();
    expect(track.listenerCount()).toBe(0);
  });
});

// ---------------------------------------------------------------- reading a frame

function fakeVideo(w: number, h: number) {
  return { videoWidth: w, videoHeight: h } as unknown as HTMLVideoElement;
}

/** A canvas whose 2D context returns the given uniform pixel value. */
function fakeCanvas(pixel: number | "throw" | "noctx") {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => {
      if (pixel === "noctx") return null;
      return {
        drawImage: () => {
          if (pixel === "throw") throw new Error("tainted");
        },
        getImageData: (_x: number, _y: number, w: number, h: number) => {
          const data = new Uint8ClampedArray(w * h * 4);
          for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i + 1] = data[i + 2] = pixel as number;
            data[i + 3] = 255;
          }
          return { data };
        },
      };
    },
  };
  return canvas as unknown as HTMLCanvasElement;
}

describe("reading the preview's luminance", () => {
  it("a dark frame reads dark and a lit frame reads lit", () => {
    expect(meanLuminance(fakeVideo(640, 480), fakeCanvas(3))).toBeCloseTo(3);
    expect(meanLuminance(fakeVideo(640, 480), fakeCanvas(120))).toBeCloseTo(120);
  });

  it("a frame we cannot read is null, never black", () => {
    // "Could not tell" must not count against the camera.
    expect(meanLuminance(fakeVideo(0, 0), fakeCanvas(120))).toBeNull();
    expect(meanLuminance(fakeVideo(640, 480), fakeCanvas("noctx"))).toBeNull();
    expect(meanLuminance(fakeVideo(640, 480), fakeCanvas("throw"))).toBeNull();
  });
});

// ---------------------------------------------------------------- liveness over time

function manualInterval() {
  let cb: (() => void) | null = null;
  let cleared = false;
  const setIntervalFn = ((fn: () => void) => {
    cb = fn;
    return 1 as unknown as ReturnType<typeof setInterval>;
  }) as unknown as typeof setInterval;
  const clearIntervalFn = (() => {
    cleared = true;
  }) as unknown as typeof clearInterval;
  return { setIntervalFn, clearIntervalFn, tick: () => cb?.(), wasCleared: () => cleared };
}

describe("deciding whether a picture is reaching the preview", () => {
  it("three black samples in a row mean no picture; one is just a flicker", () => {
    const t = manualInterval();
    const onNoPicture = vi.fn();
    const onPicture = vi.fn();
    let pixel = 2;
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        drawImage: () => {},
        getImageData: (_x: number, _y: number, w: number, h: number) => {
          const data = new Uint8ClampedArray(w * h * 4).fill(pixel);
          return { data };
        },
      }),
    } as unknown as HTMLCanvasElement;

    watchPictureLiveness(fakeVideo(640, 480), {
      onNoPicture,
      onPicture,
      canvas,
      strikes: 3,
      setIntervalFn: t.setIntervalFn,
      clearIntervalFn: t.clearIntervalFn,
    });

    t.tick();
    t.tick();
    expect(onNoPicture).not.toHaveBeenCalled();
    t.tick();
    expect(onNoPicture).toHaveBeenCalledTimes(1);
    // Still black: reported once, not every second.
    t.tick();
    expect(onNoPicture).toHaveBeenCalledTimes(1);

    // The shutter opens.
    pixel = 140;
    t.tick();
    expect(onPicture).toHaveBeenCalledTimes(1);

    // Goes dark again: a fresh strike count, a fresh report.
    pixel = 2;
    t.tick();
    t.tick();
    t.tick();
    expect(onNoPicture).toHaveBeenCalledTimes(2);
  });

  it("an unreadable frame before any picture is 'not yet', not a strike", () => {
    const t = manualInterval();
    const onNoPicture = vi.fn();
    watchPictureLiveness(fakeVideo(0, 0), {
      onNoPicture,
      onPicture: vi.fn(),
      canvas: fakeCanvas(120),
      strikes: 2,
      setIntervalFn: t.setIntervalFn,
      clearIntervalFn: t.clearIntervalFn,
    });
    t.tick();
    t.tick();
    t.tick();
    expect(onNoPicture).not.toHaveBeenCalled();
  });

  it("stop() clears the loop", () => {
    const t = manualInterval();
    const watch = watchPictureLiveness(fakeVideo(640, 480), {
      onNoPicture: vi.fn(),
      onPicture: vi.fn(),
      canvas: fakeCanvas(120),
      setIntervalFn: t.setIntervalFn,
      clearIntervalFn: t.clearIntervalFn,
    });
    watch.stop();
    expect(t.wasCleared()).toBe(true);
  });
});

// ---------------------------------------------------------------- another camera

describe("choosing another camera to try", () => {
  const devices = (ids: string[]) => async () =>
    ids.map((deviceId) => ({ deviceId, kind: "videoinput" as const, label: "" }));

  it("returns a camera not yet tried", async () => {
    expect(await pickAlternateCamera(["virtual-obs"], devices(["virtual-obs", "built-in"]))).toBe(
      "built-in"
    );
  });

  it("returns null when every camera has been tried, so a retry cannot ping-pong", async () => {
    expect(await pickAlternateCamera(["a", "b"], devices(["a", "b"]))).toBeNull();
  });

  it("ignores microphones and blank ids, and survives enumerate failing", async () => {
    const mixed = async () => [
      { deviceId: "", kind: "videoinput" as const, label: "" },
      { deviceId: "mic", kind: "audioinput" as const, label: "" },
    ];
    expect(await pickAlternateCamera([], mixed)).toBeNull();
    expect(await pickAlternateCamera([], async () => { throw new Error("no"); })).toBeNull();
  });
});
