"use client";

// NOTE: deliberately imports the tiny tfjs-free registry, NOT proctoring.service. The root layout
// renders CameraRouteGuard -> useCameraRouteGuard -> this module, so importing the service here put
// TensorFlow (~178 kB gzip) into EVERY route's bundle, and made teardown CONSTRUCT a proctoring
// engine on pages that have nothing to do with proctoring.
import { getActiveProctoringInstance } from "@/lib/services/proctoring-instance";
import {
  registerMediaStream,
  stopAndClearRegisteredStreams,
} from "@/lib/utils/media-stream-registry";

declare global {
  interface Window {
    __mockInterviewStream?: MediaStream;
  }
}

export { registerMediaStream };

export function stopAllMediaTracks(): void {
  try {
    stopAndClearRegisteredStreams();

    // 1. Stop all video elements' streams
    const videoElements = document.querySelectorAll("video");
    videoElements.forEach((video) => {
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          // Stop tracks that are live or ended (ended tracks might still hold resources)
          if (track.readyState === "live" || track.readyState === "ended") {
            track.stop();
          }
        });
        video.srcObject = null;
      }
    });

    // 2. Stop all audio elements' streams
    const audioElements = document.querySelectorAll("audio");
    audioElements.forEach((audio) => {
      if (audio.srcObject) {
        const stream = audio.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          // Stop tracks that are live or ended (ended tracks might still hold resources)
          if (track.readyState === "live" || track.readyState === "ended") {
            track.stop();
          }
        });
        audio.srcObject = null;
      }
    });

    // 3. Stop the ProctoringService stream ONLY if one is actually running. Previously this called
    // getProctoringService(), which lazily CONSTRUCTS the singleton — so teardown could spin up a
    // proctoring engine on a page that never used one. Reading the registry can only ever return an
    // instance that was genuinely started.
    try {
      getActiveProctoringInstance()?.stopProctoring();
    } catch {
      // Never let proctoring cleanup break the rest of the camera teardown.
    }

    if (typeof window !== "undefined" && window.__mockInterviewStream) {
      const globalStream = window.__mockInterviewStream;
      if (globalStream instanceof MediaStream) {
        globalStream.getTracks().forEach((track) => {
          if (track.readyState === "live" || track.readyState === "ended") {
            track.stop();
          }
        });
      }
      delete window.__mockInterviewStream;
    }

    // 5. Additional cleanup: Try to find and stop any tracks that might be active
    // but not attached to DOM elements. This is a best-effort approach.
    // Note: We can't directly enumerate all active MediaStreamTracks, but the above
    // steps should cover most cases (DOM elements, ProctoringService, global refs)
  } catch (error) {
    // Silently handle any errors during cleanup
  }
}
