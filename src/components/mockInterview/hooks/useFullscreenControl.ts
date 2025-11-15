import { useCallback, useEffect, useRef, useState } from "react";

interface UseFullscreenControlReturn {
  isFullscreen: boolean;
  isInteractionDisabled: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  enableInteractionBlock: () => void;
  disableInteractionBlock: () => void;
  error: string | null;
}

const useFullscreenControl = (
  elementRef?: React.RefObject<HTMLElement | null>
): UseFullscreenControlReturn => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInteractionDisabled, setIsInteractionDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const eventListenersRef = useRef<
    Array<{ element: any; event: string; handler: any }>
  >([]);

  // Check if fullscreen is supported
  const isFullscreenSupported = useCallback(() => {
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
  }, []);

  // Get the target element for fullscreen
  const getTargetElement = useCallback(() => {
    return elementRef?.current || document.documentElement;
  }, [elementRef]);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async () => {
    if (!isFullscreenSupported()) {
      setError("Fullscreen is not supported in this browser");
      return;
    }

    try {
      const el = getTargetElement();

      // Modern API with navigationUI: "hide" - preferred method
      if (el.requestFullscreen) {
        try {
          await el.requestFullscreen({ navigationUI: "hide" });
        } catch (err: any) {
          // If navigationUI option fails, try without it
          if (
            err.name === "TypeError" ||
            err.message?.includes("navigationUI")
          ) {
            await el.requestFullscreen();
          } else {
            throw err;
          }
        }
      }
      // WebKit (Safari, Chrome < 69)
      else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      }
      // Mozilla (Firefox)
      else if ((el as any).mozRequestFullScreen) {
        await (el as any).mozRequestFullScreen();
      }
      // Microsoft (IE/Edge)
      else if ((el as any).msRequestFullscreen) {
        await (el as any).msRequestFullscreen();
      }

      setError(null);
    } catch (err) {
      setError("Failed to enter fullscreen mode");
    }
  }, [isFullscreenSupported, getTargetElement]);

  // Exit fullscreen mode
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }

      setError(null);
    } catch (err) {
      setError("Failed to exit fullscreen mode");
    }
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Create invisible overlay to capture interactions
  const createInteractionOverlay = useCallback(() => {
    if (overlayRef.current) {
      return overlayRef.current;
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
      background: transparent;
      pointer-events: all;
      cursor: none;
    `;

    overlay.id = "interview-interaction-overlay";
    overlayRef.current = overlay;

    return overlay;
  }, []);

  // Prevent default behavior for events
  const preventDefaultHandler = useCallback((event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }, []);

  // Disable all interactions
  const enableInteractionBlock = useCallback(() => {
    if (isInteractionDisabled) return;

    try {
      const overlay = createInteractionOverlay();
      document.body.appendChild(overlay);

      // Events to block
      const eventsToBlock = [
        // Keyboard events
        "keydown",
        "keyup",
        "keypress",

        // Mouse events
        "click",
        "dblclick",
        "mousedown",
        "mouseup",
        "mousemove",
        "mouseenter",
        "mouseleave",
        "mouseover",
        "mouseout",
        "contextmenu",

        // Touch events (for trackpad gestures)
        "touchstart",
        "touchend",
        "touchmove",
        "touchcancel",

        // Wheel events (trackpad scrolling)
        "wheel",
        "scroll",

        // Selection events
        "selectstart",
        "select",

        // Drag events
        "dragstart",
        "drag",
        "dragend",
        "dragenter",
        "dragover",
        "dragleave",
        "drop",

        // Copy/paste events
        "copy",
        "cut",
        "paste",
      ];

      // Add event listeners to document and overlay
      const targets = [document, overlay];

      targets.forEach((target) => {
        eventsToBlock.forEach((eventName) => {
          const handler = preventDefaultHandler;
          target.addEventListener(eventName, handler, true);
          eventListenersRef.current.push({
            element: target,
            event: eventName,
            handler,
          });
        });
      });

      // Disable right-click context menu
      document.addEventListener("contextmenu", preventDefaultHandler, true);

      // Disable F11, F12, Ctrl+Shift+I, and other developer shortcuts
      const keyboardHandler = (event: KeyboardEvent) => {
        // Block function keys
        if (event.key.startsWith("F") && /F\d{1,2}/.test(event.key)) {
          event.preventDefault();
          return false;
        }

        // Block developer shortcuts
        if (
          (event.ctrlKey &&
            event.shiftKey &&
            (event.key === "I" || event.key === "J" || event.key === "C")) ||
          (event.ctrlKey && event.key === "u") ||
          event.key === "F12"
        ) {
          event.preventDefault();
          return false;
        }

        // Block Alt+Tab (window switching)
        if (event.altKey && event.key === "Tab") {
          event.preventDefault();
          return false;
        }

        // Block Ctrl+Alt+Del, Ctrl+Shift+Esc
        if (
          (event.ctrlKey && event.altKey && event.key === "Delete") ||
          (event.ctrlKey && event.shiftKey && event.key === "Escape")
        ) {
          event.preventDefault();
          return false;
        }

        event.preventDefault();
        return false;
      };

      document.addEventListener("keydown", keyboardHandler, true);
      eventListenersRef.current.push({
        element: document,
        event: "keydown",
        handler: keyboardHandler,
      });

      // Hide cursor
      document.body.style.cursor = "none";

      // Disable text selection
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";

      setIsInteractionDisabled(true);
    } catch (err) {
      setError("Failed to disable interactions");
    }
  }, [isInteractionDisabled, createInteractionOverlay, preventDefaultHandler]);

  // Re-enable all interactions
  const disableInteractionBlock = useCallback(() => {
    if (!isInteractionDisabled) return;

    try {
      // Remove all event listeners
      eventListenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler, true);
      });
      eventListenersRef.current = [];

      // Remove overlay
      if (overlayRef.current && overlayRef.current.parentNode) {
        overlayRef.current.parentNode.removeChild(overlayRef.current);
        overlayRef.current = null;
      }

      // Restore cursor
      document.body.style.cursor = "auto";

      // Re-enable text selection
      document.body.style.userSelect = "auto";
      document.body.style.webkitUserSelect = "auto";

      setIsInteractionDisabled(false);
    } catch (err) {
      setError("Failed to re-enable interactions");
    }
  }, [isInteractionDisabled]);

  // Listen for fullscreen changes - no auto re-entry
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);
    };

    // Listen for fullscreen changes
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
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disableInteractionBlock();
      if (isFullscreen) {
        exitFullscreen();
      }
    };
  }, [disableInteractionBlock, isFullscreen, exitFullscreen]);

  // Block browser zoom
  useEffect(() => {
    const preventZoom = (event: KeyboardEvent) => {
      if (
        isInteractionDisabled &&
        event.ctrlKey &&
        (event.key === "+" || event.key === "-" || event.key === "0")
      ) {
        event.preventDefault();
      }
    };

    const preventWheelZoom = (event: WheelEvent) => {
      if (isInteractionDisabled && event.ctrlKey) {
        event.preventDefault();
      }
    };

    if (isInteractionDisabled) {
      document.addEventListener("keydown", preventZoom, true);
      document.addEventListener("wheel", preventWheelZoom, {
        passive: false,
        capture: true,
      });
    }

    return () => {
      document.removeEventListener("keydown", preventZoom, true);
      document.removeEventListener("wheel", preventWheelZoom, true);
    };
  }, [isInteractionDisabled]);

  return {
    isFullscreen,
    isInteractionDisabled,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    enableInteractionBlock,
    disableInteractionBlock,
    error,
  };
};

export default useFullscreenControl;
