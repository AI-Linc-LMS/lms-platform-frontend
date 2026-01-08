"use client";

import { getProctoringService } from "@/lib/services/proctoring.service";

/**
 * Comprehensive function to stop all active camera and microphone streams.
 * This handles:
 * - Streams attached to DOM video/audio elements
 * - Streams stored in ProctoringService
 * - Global window stream references
 * - All active MediaStreamTracks
 */
export function stopAllMediaTracks(): void {
  try {
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

    // 3. Stop ProctoringService stream if active
    try {
      const proctoringService = getProctoringService();
      if (proctoringService) {
        proctoringService.stopProctoring();
      }
    } catch (error) {
      // ProctoringService might not be initialized, ignore
    }

    // 4. Clean up global window stream references
    if (typeof window !== "undefined") {
      if ((window as any).__mockInterviewStream) {
        const globalStream = (window as any).__mockInterviewStream;
        if (globalStream instanceof MediaStream) {
          globalStream.getTracks().forEach((track) => {
            // Stop tracks that are live or ended
            if (track.readyState === "live" || track.readyState === "ended") {
              track.stop();
            }
          });
        }
        delete (window as any).__mockInterviewStream;
      }
    }

    // 5. Additional cleanup: Try to find and stop any tracks that might be active
    // but not attached to DOM elements. This is a best-effort approach.
    // Note: We can't directly enumerate all active MediaStreamTracks, but the above
    // steps should cover most cases (DOM elements, ProctoringService, global refs)
  } catch (error) {
    // Silently handle any errors during cleanup
  }
}
