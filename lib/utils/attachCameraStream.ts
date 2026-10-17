/**
 * Attach a camera stream to a <video>, in whichever order the two become available.
 *
 * The bug this exists to prevent: a device-check page acquired the stream and attached it
 * inline, behind a bare `if (videoRef.current)`, with no retry. A page that renders a spinner
 * while some async gate resolves does not have its <video> in the DOM yet, so when
 * getUserMedia won that race `srcObject` was never set — and never set afterwards. The camera
 * stayed live, the browser's recording indicator stayed green because the tracks were still
 * held, and the preview rendered black permanently. Face detection never started either,
 * because its trigger sat inside the same block, so the learner could not pass the check.
 *
 * Which side of the race you land on depends on how fast getUserMedia resolves against a
 * network call, which is why it only affected some people. A first-time user waits on the
 * permission prompt and the element mounts first; a returning user whose browser already
 * remembers the grant resolves in milliseconds and loses. Edge persists permissions per site,
 * so repeat takers there were the most likely to hit it.
 *
 * Call it from both sides — the moment the stream arrives, and from a callback ref when the
 * element mounts. Whichever happens second does the work.
 */

export interface AttachCameraStreamArgs {
  /** The <video>. Null is expected and handled: it means the element has not mounted yet. */
  el: HTMLVideoElement | null;
  /** The stream. Null is expected and handled: it means getUserMedia has not resolved yet. */
  stream: MediaStream | null;
  /**
   * Called once the element is actually rendering frames (readyState and dimensions both
   * real). This is where face detection belongs — starting it earlier hands the detector a
   * 0x0 frame and it reports "no face" for a camera that is working.
   */
  onReady?: () => void;
  /** Skip onReady when the stream carries no live video track. */
  hasVideo?: boolean;
  /** Test seam. */
  setTimeoutFn?: typeof setTimeout;
}

/** Returns true when this call performed the attach (false = nothing to do, or already done). */
export function attachCameraStream({
  el,
  stream,
  onReady,
  hasVideo = true,
  setTimeoutFn = setTimeout,
}: AttachCameraStreamArgs): boolean {
  if (!el || !stream) return false;
  // Re-attaching the same stream restarts playback in some browsers, so make it a no-op.
  if (el.srcObject === stream) return false;

  el.srcObject = stream;

  const waitForFrames = () => {
    if (el.readyState >= 2 && el.videoWidth > 0 && el.videoHeight > 0) {
      onReady?.();
    } else {
      setTimeoutFn(waitForFrames, 200);
    }
  };

  const play = el.play?.();
  if (play && typeof play.then === "function") {
    play
      .then(() => {
        if (hasVideo) waitForFrames();
      })
      .catch((err: unknown) => {
        const name = (err as { name?: string })?.name;
        // AbortError fires when the element leaves the DOM mid-play (the user navigated away);
        // NotAllowedError fires when autoplay is blocked. Neither is worth surfacing, and
        // neither means the camera failed.
        if (name === "AbortError" || name === "NotAllowedError") return;
        console.error("Failed to play camera preview:", err);
      });
  } else if (hasVideo) {
    waitForFrames();
  }

  return true;
}
