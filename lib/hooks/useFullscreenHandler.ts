import { useEffect, useState, useCallback, useRef } from "react";
import {
  hasNavigatorKeyboardLock,
  isFullscreenExitKeyEvent,
} from "@/lib/fullscreen/fullscreenEscapePrompt";
import { lockProctoringKeysInFullscreen } from "@/lib/utils/proctoring-keyboard-lock";

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
  /**
   * Called when Escape is pressed while still in fullscreen (Chromium: with
   * Keyboard Lock active). Firefox may also deliver this if preventDefault sticks.
   */
  onEscapePressed?: () => void;
  /**
   * When true, do not intercept Escape (e.g. exit-confirm dialog is open so MUI
   * can handle Escape / user can choose a button).
   */
  suppressEscapeInterceptor?: boolean;
}

export function useFullscreenHandler({
  enabled,
  submitting,
  enterFullscreen,
  promptOnFullscreenExit = false,
  onLeftFullscreen,
  onEscapePressed,
  suppressEscapeInterceptor = false,
}: UseFullscreenHandlerOptions) {
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const onLeftFullscreenRef = useRef(onLeftFullscreen);
  const onEscapePressedRef = useRef(onEscapePressed);
  const unlockEscapeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onLeftFullscreenRef.current = onLeftFullscreen;
  }, [onLeftFullscreen]);

  useEffect(() => {
    onEscapePressedRef.current = onEscapePressed;
  }, [onEscapePressed]);

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

  // Fullscreen transitions: re-apply Escape lock in Chromium when entering FS;
  // if user leaves FS (F11, UI, long-press Escape, or no lock), show prompt.
  useEffect(() => {
    if (!enabled) {
      unlockEscapeRef.current?.();
      unlockEscapeRef.current = null;
      return;
    }

    const releaseEscapeLock = () => {
      unlockEscapeRef.current?.();
      unlockEscapeRef.current = null;
    };

    const applyEscapeLockIfNeeded = () => {
      if (
        !isDocumentFullscreen() ||
        submitting ||
        !promptOnFullscreenExit
      ) {
        return;
      }
      releaseEscapeLock();
      unlockEscapeRef.current = lockProctoringKeysInFullscreen();

      // Chromium: second lock on the next frame improves reliability across
      // Chrome / Edge / Brave / Opera after the fullscreen transition settles.
      if (!hasNavigatorKeyboardLock()) return;
      requestAnimationFrame(() => {
        if (
          !isDocumentFullscreen() ||
          submitting ||
          !promptOnFullscreenExit
        ) {
          return;
        }
        unlockEscapeRef.current?.();
        unlockEscapeRef.current = lockProctoringKeysInFullscreen();
      });
    };

    const handleFullscreenChange = () => {
      if (submitting) {
        setShowFullscreenWarning(false);
        releaseEscapeLock();
        return;
      }

      const isFS = isDocumentFullscreen();

      if (isFS) {
        setShowFullscreenWarning(false);
        applyEscapeLockIfNeeded();
      } else {
        releaseEscapeLock();
        if (
          promptOnFullscreenExit &&
          typeof onLeftFullscreenRef.current === "function"
        ) {
          onLeftFullscreenRef.current();
        } else {
          setShowFullscreenWarning(true);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // FS may already be active when the hook enables (e.g. race with start)
    applyEscapeLockIfNeeded();

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
      releaseEscapeLock();
    };
  }, [enabled, submitting, promptOnFullscreenExit]);

  // Escape → modal while still in fullscreen (pairs with Keyboard Lock on Chrome).
  useEffect(() => {
    if (!enabled || submitting || !promptOnFullscreenExit) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreenExitKeyEvent(e)) return;
      if (suppressEscapeInterceptor) return;
      if (!isDocumentFullscreen()) return;
      if (typeof onEscapePressedRef.current !== "function") return;

      e.preventDefault();
      e.stopPropagation();
      onEscapePressedRef.current();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [
    enabled,
    submitting,
    promptOnFullscreenExit,
    suppressEscapeInterceptor,
  ]);

  return {
    showFullscreenWarning,
    setShowFullscreenWarning,
    handleReEnterFullscreen,
    isDocumentFullscreen,
  };
}

