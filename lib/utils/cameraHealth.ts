/**
 * Is the camera actually giving us a picture? Three small, injectable checks.
 *
 * The device-check page used to assess the camera ONCE, at the moment `getUserMedia` resolved:
 * if the video track's `readyState` was "live", the page said "Camera is working properly" and
 * never looked again. Every one of the ways a camera stops short of a picture leaves that check
 * true:
 *
 *   - another application takes the device (Zoom, Teams, Meet are open on most learners'
 *     laptops), and the browser MUTES the track rather than ending it;
 *   - a lens cover or privacy shutter, or an antivirus "webcam protection" feature, leaves the
 *     track live and every frame black;
 *   - a virtual camera (OBS, ManyCam, DroidCam, Snap Camera) is the default device and its source
 *     is not running: live track, no frames at all;
 *   - the device is unplugged mid-check and the track ENDS.
 *
 * Chrome draws its own "camera with a slash" inside the <video> for a muted or ended track, which
 * is exactly what the reported screenshot shows beneath a readiness row reading "Ready". The page
 * was describing the grant, not the picture.
 *
 * Nothing here is a gate. Hardware present and permitted stays the only precondition for a
 * proctored paper (see the long comment on `canProceed` in the device-check page, written after
 * 126 support tickets). These checks change what the page SAYS and whether it offers a retry.
 *
 * Every function takes its environment as arguments so it can be exercised without a browser.
 */

export interface Stoppable {
  stop(): void;
}

export interface TrackCallbacks {
  /** The track exists but the source stopped delivering (another app took it, shutter, etc). */
  onMuted?: () => void;
  /** The source resumed. */
  onUnmuted?: () => void;
  /** The track is gone for good (device unplugged, permission revoked). */
  onEnded?: () => void;
}

/**
 * Watch a video track for the three transitions that turn a working camera into a black box.
 *
 * Reports the CURRENT state synchronously as well: a track can already be muted by the time we
 * get it (the browser hands over a track for a device another app holds), and a watcher that only
 * reports changes would miss that.
 */
export function watchVideoTrack(track: MediaStreamTrack, on: TrackCallbacks): Stoppable {
  const onMute = () => on.onMuted?.();
  const onUnmute = () => on.onUnmuted?.();
  const onEnded = () => on.onEnded?.();
  track.addEventListener("mute", onMute);
  track.addEventListener("unmute", onUnmute);
  track.addEventListener("ended", onEnded);
  if (track.readyState === "ended") on.onEnded?.();
  else if (track.muted) on.onMuted?.();
  return {
    stop() {
      track.removeEventListener("mute", onMute);
      track.removeEventListener("unmute", onUnmute);
      track.removeEventListener("ended", onEnded);
    },
  };
}

/** Mean of (r+g+b)/3 over the sampled pixels, 0..255. Below this a frame is "black". */
export const BLACK_LUMINANCE = 10;

/** Sample size. 32x24 is 768 pixels: enough to tell a picture from a shutter, cheap enough to do once a second. */
export const SAMPLE_WIDTH = 32;
export const SAMPLE_HEIGHT = 24;

/**
 * Mean luminance of the frame currently showing in ``video``, or null when there is no frame to
 * read (no dimensions yet, no 2D context, a tainted canvas).
 *
 * Null is "cannot tell", never "black": a reading we could not take must not be counted as a
 * strike against the camera.
 */
export function meanLuminance(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  width = SAMPLE_WIDTH,
  height = SAMPLE_HEIGHT
): number | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  let data: Uint8ClampedArray;
  try {
    ctx.drawImage(video, 0, 0, width, height);
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return null;
  }
  const pixels = width * height;
  if (!pixels || data.length < pixels * 4) return null;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return sum / pixels;
}

export interface LivenessOptions {
  /** Fired once when `strikes` consecutive samples were black (or unreadable-after-a-picture). */
  onNoPicture: () => void;
  /** Fired once when a sample shows a real picture again. */
  onPicture: () => void;
  intervalMs?: number;
  /** Consecutive black samples before `onNoPicture`. One dark frame is a flicker; three seconds is a shutter. */
  strikes?: number;
  threshold?: number;
  canvas?: HTMLCanvasElement;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
}

/**
 * Keep sampling the preview and say whether a picture is reaching it.
 *
 * Deliberately a slow loop (1 Hz, 768 pixels). The face detector already runs its own sampling
 * for its own question; this answers a cheaper, prior one -- is there anything to look at -- and
 * it must cost nothing on the low-end laptops where the problem actually occurs.
 */
export function watchPictureLiveness(
  video: HTMLVideoElement,
  {
    onNoPicture,
    onPicture,
    intervalMs = 1000,
    strikes = 3,
    threshold = BLACK_LUMINANCE,
    canvas,
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
  }: LivenessOptions
): Stoppable {
  const target = canvas ?? document.createElement("canvas");
  let dark = 0;
  // Three-valued so each transition is reported exactly once.
  let state: "unknown" | "picture" | "none" = "unknown";

  const tick = () => {
    const lum = meanLuminance(video, target);
    if (lum === null) {
      // Unreadable. Before any picture it is simply "not yet"; after one it counts as a strike,
      // because a preview that WAS drawing and no longer can is the muted-track case.
      if (state === "picture") dark += 1;
    } else if (lum < threshold) {
      dark += 1;
    } else {
      dark = 0;
      if (state !== "picture") {
        state = "picture";
        onPicture();
      }
      return;
    }
    if (dark >= strikes && state !== "none") {
      state = "none";
      onNoPicture();
    }
  };

  const handle = setIntervalFn(tick, intervalMs);
  return {
    stop() {
      clearIntervalFn(handle);
    },
  };
}

type DeviceLister = () => Promise<Pick<MediaDeviceInfo, "deviceId" | "kind" | "label">[]>;

/**
 * Another camera to try, or null when this machine only has the one.
 *
 * Laptops with a virtual camera installed often default to it (OBS, DroidCam, ManyCam register
 * as the first device), and when its source is not running the result is a live, empty track.
 * Trying the next physical camera is the fix the student cannot discover on their own, because
 * the browser's prompt never showed them a choice.
 *
 * ``tried`` holds the ids already attempted this visit, so a retry cannot ping-pong between two
 * dead devices.
 */
export async function pickAlternateCamera(
  tried: Iterable<string>,
  list: DeviceLister = () => navigator.mediaDevices.enumerateDevices()
): Promise<string | null> {
  const seen = new Set(tried);
  let devices: Awaited<ReturnType<DeviceLister>>;
  try {
    devices = await list();
  } catch {
    return null;
  }
  for (const d of devices) {
    if (d.kind !== "videoinput") continue;
    if (!d.deviceId || seen.has(d.deviceId)) continue;
    return d.deviceId;
  }
  return null;
}
