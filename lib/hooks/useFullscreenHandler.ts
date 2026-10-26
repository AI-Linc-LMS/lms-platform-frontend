import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type MutableRefObject,
} from "react";
import {
  hasNavigatorKeyboardLock,
  isFullscreenExitKeyEvent,
} from "@/lib/fullscreen/fullscreenEscapePrompt";
import {
  canEnterFullscreen,
  isDocumentFullscreen,
} from "@/lib/fullscreen/fullscreenSupport";
import { lockProctoringKeysInFullscreen } from "@/lib/utils/proctoring-keyboard-lock";

interface UseFullscreenHandlerOptions {
  enabled: boolean;
  submitting: boolean;
  /** Resolves to whether fullscreen is actually held afterwards. */
  enterFullscreen: () => Promise<boolean | void>;
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
  /**
   * Set to true synchronously before opening a native file picker (e.g. subjective
   * image upload). The next fullscreen exit will not call `onLeftFullscreen`; the
   * ref is cleared and `onBenignFullscreenLoss` runs instead (recovery / soft warning).
   */
  skipNextFullscreenExitPromptRef?: MutableRefObject<boolean>;
  /** Invoked when a fullscreen exit was treated as benign (file picker path). */
  onBenignFullscreenLoss?: () => void;
}

export function useFullscreenHandler({
  enabled,
  submitting,
  enterFullscreen,
  promptOnFullscreenExit = false,
  onLeftFullscreen,
  onEscapePressed,
  suppressEscapeInterceptor = false,
  skipNextFullscreenExitPromptRef,
  onBenignFullscreenLoss,
}: UseFullscreenHandlerOptions) {
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  /**
   * Can this browser enter fullscreen at all? Read once (it cannot change for the life of the
   * page) and kept in state so the first client render matches the server's.
   *
   * Everything below is gated on it. On iPhone Safari there is no Fullscreen API, so demanding
   * fullscreen cannot be satisfied: the warning must never be raised, the exit prompt must never
   * fire, and Escape must not be intercepted. A requirement a device cannot meet is not a
   * requirement, it is a trap.
   */
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const onLeftFullscreenRef = useRef(onLeftFullscreen);
  const onEscapePressedRef = useRef(onEscapePressed);
  const onBenignFullscreenLossRef = useRef(onBenignFullscreenLoss);
  const unlockEscapeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onLeftFullscreenRef.current = onLeftFullscreen;
  }, [onLeftFullscreen]);

  useEffect(() => {
    onEscapePressedRef.current = onEscapePressed;
  }, [onEscapePressed]);

  useEffect(() => {
    onBenignFullscreenLossRef.current = onBenignFullscreenLoss;
  }, [onBenignFullscreenLoss]);

  useEffect(() => {
    setFullscreenSupported(canEnterFullscreen());
  }, []);

  const handleReEnterFullscreen = useCallback(async () => {
    // No Fullscreen API: the button in the warning dialog cannot do anything, so the dialog must
    // not survive pressing it. This is the exact loop an iPhone learner was stuck in - tap, no-op,
    // modal still there, clock still running.
    if (!canEnterFullscreen()) {
      setShowFullscreenWarning(false);
      return;
    }
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
    if (!enabled || !fullscreenSupported) {
      unlockEscapeRef.current?.();
      unlockEscapeRef.current = null;
      // A device that cannot enter fullscreen must not be left holding a stale warning either.
      if (!fullscreenSupported) setShowFullscreenWarning(false);
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
          if (skipNextFullscreenExitPromptRef?.current) {
            skipNextFullscreenExitPromptRef.current = false;
            onBenignFullscreenLossRef.current?.();
          } else {
            onLeftFullscreenRef.current();
          }
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
  }, [
    enabled,
    fullscreenSupported,
    submitting,
    promptOnFullscreenExit,
    skipNextFullscreenExitPromptRef,
  ]);

  // Escape → modal while still in fullscreen (pairs with Keyboard Lock on Chrome).
  useEffect(() => {
    if (!enabled || !fullscreenSupported || submitting || !promptOnFullscreenExit)
      return;

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
    fullscreenSupported,
    submitting,
    promptOnFullscreenExit,
    suppressEscapeInterceptor,
  ]);

  return {
    showFullscreenWarning,
    setShowFullscreenWarning,
    handleReEnterFullscreen,
    isDocumentFullscreen,
    /** False where the browser has no Fullscreen API; callers must not demand it. */
    fullscreenSupported,
  };
}

