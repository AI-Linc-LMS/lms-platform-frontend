import { useEffect, useState, useCallback, useRef } from "react";

function isDocumentFullscreen(): boolean {
  return (
    !!document.fullscreenElement ||
    !!(document as any).webkitFullscreenElement ||
    !!(document as any).mozFullScreenElement ||
    !!(document as any).msFullscreenElement
  );
}

interface UseFullscreenHandlerOptions {
  enabled: boolean;
  submitting: boolean;
  enterFullscreen: () => Promise<void>;
  /**
   * When true, leaving fullscreen shows a prompt (via `onLeftFullscreen`)
   * instead of the generic "re-enter fullscreen" dialog.
   */
  promptOnFullscreenExit?: boolean;
  /** Called when the user exits fullscreen while `promptOnFullscreenExit` is enabled. */
  onLeftFullscreen?: () => void;
}

export function useFullscreenHandler({
  enabled,
  submitting,
  enterFullscreen,
  promptOnFullscreenExit = false,
  onLeftFullscreen,
}: UseFullscreenHandlerOptions) {
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const onLeftFullscreenRef = useRef(onLeftFullscreen);

  useEffect(() => {
    onLeftFullscreenRef.current = onLeftFullscreen;
  }, [onLeftFullscreen]);

  const handleReEnterFullscreen = useCallback(async () => {
    try {
      await enterFullscreen();
      if (isDocumentFullscreen()) {
        setShowFullscreenWarning(false);
      }
    } catch {
      // Silently fail
    }
  }, [enterFullscreen]);

  // Detect fullscreen exit (Escape, F11, browser UI, etc.) and show the prompt.
  // We intentionally do NOT lock Escape or prevent default — browsers require
  // Escape to always be able to exit fullscreen (security feature).
  // Instead we catch the exit, show a dialog, and "Continue test" re-enters
  // fullscreen via a button click (valid user gesture).
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      if (submitting) {
        setShowFullscreenWarning(false);
        return;
      }

      const isFS = isDocumentFullscreen();

      if (!isFS && enabled) {
        if (
          promptOnFullscreenExit &&
          typeof onLeftFullscreenRef.current === "function"
        ) {
          onLeftFullscreenRef.current();
        } else {
          setShowFullscreenWarning(true);
        }
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
  }, [enabled, submitting, promptOnFullscreenExit]);

  return {
    showFullscreenWarning,
    setShowFullscreenWarning,
    handleReEnterFullscreen,
    isDocumentFullscreen,
  };
}

