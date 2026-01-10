"use client";

import { useEffect } from "react";
import { stopAllMediaTracks } from "@/lib/utils/cameraUtils";

/**
 * Hook to stop any active camera/microphone streams when component mounts.
 * Use this on pages that should NOT have camera access.
 */
export function useStopCameraOnMount() {
  useEffect(() => {
    // Stop immediately on mount
    stopAllMediaTracks();

    // Also stop on visibility change (when user switches tabs/windows)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllMediaTracks();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAllMediaTracks();
    };
  }, []);
}
