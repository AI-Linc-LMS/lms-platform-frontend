"use client";

import { useEffect } from "react";
import { stopAllMediaTracks } from "@/lib/utils/cameraUtils";

export function useStopCameraOnMount() {
  useEffect(() => {
    stopAllMediaTracks();

    const t = setTimeout(() => {
      stopAllMediaTracks();
    }, 100);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllMediaTracks();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAllMediaTracks();
    };
  }, []);
}
