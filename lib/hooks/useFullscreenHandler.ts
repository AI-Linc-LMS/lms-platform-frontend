import { useEffect, useState, useCallback, useRef } from "react";

interface UseFullscreenHandlerOptions {
  enabled: boolean;
  submitting: boolean;
  enterFullscreen: () => Promise<void>;
}

export function useFullscreenHandler({
  enabled,
  submitting,
  enterFullscreen,
}: UseFullscreenHandlerOptions) {
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);

  const handleReEnterFullscreen = useCallback(async () => {
    try {
      await enterFullscreen();
      const isFS =
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;
      if (isFS) {
        setShowFullscreenWarning(false);
      }
    } catch (error) {
      // Silently fail
    }
  }, [enterFullscreen]);

  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      // Don't show warning if submitting
      if (submitting) {
        setShowFullscreenWarning(false);
        return;
      }

      const isFS =
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;

      if (!isFS && enabled) {
        setShowFullscreenWarning(true);
      } else if (isFS) {
        setShowFullscreenWarning(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [enabled, submitting]);

  return {
    showFullscreenWarning,
    setShowFullscreenWarning,
    handleReEnterFullscreen,
  };
}

