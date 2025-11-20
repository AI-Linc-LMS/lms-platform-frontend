import { useEffect, useCallback } from "react";

export const useStrictProctoringLock = (enabled: boolean = true) => {
  // Lock keyboard and prevent shortcuts - STRICT MODE
  const lockKeyboard = useCallback(() => {
    const preventKeys = (e: KeyboardEvent) => {
      const blockedKeys = [
        "Escape",
        "F11",
        "F5",
        "F1",
        "F2",
        "F3",
        "F4",
        "F6",
        "F7",
        "F8",
        "F9",
        "F10",
        "F12",
        "Alt",
        "Tab",
        "Control",
        "Meta",
        "Shift",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ];

      // If any blocked key or modifier is pressed
      if (
        blockedKeys.includes(e.key) ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.key === "Dead"
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Try native keyboard lock API (only supported in Chrome)
    try {
      if ("keyboard" in navigator && "lock" in (navigator as any).keyboard) {
        (navigator as any).keyboard.lock([
          "Escape",
          "F11",
          "F5",
          "F1",
          "F2",
          "F3",
          "F4",
          "F6",
          "F7",
          "F8",
          "F9",
          "F10",
          "F12",
        ]);
      }
    } catch {
      // fallback handled below
    }

    document.addEventListener("keydown", preventKeys, { capture: true, passive: false });
    document.addEventListener("keyup", preventKeys, { capture: true, passive: false });

    return () => {
      document.removeEventListener("keydown", preventKeys, true);
      document.removeEventListener("keyup", preventKeys, true);

      if ("keyboard" in navigator && "unlock" in (navigator as any).keyboard) {
        (navigator as any).keyboard.unlock();
      }
    };
  }, []);

  // Disable context menus, right-click, copy/paste, drag, etc.
  const disableInteractions = useCallback(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("dragstart", prevent);
    document.addEventListener("selectstart", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);

    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("selectstart", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
    };
  }, []);

  // Prevent swipe / back navigation (touch gestures) - ENHANCED TRACKPAD LOCK
  const disableGestures = useCallback(() => {
    const preventTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    const preventScroll = (e: WheelEvent) => {
      // Block all wheel events with modifiers (pinch zoom)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const preventGestureEvents = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Touch events
    document.addEventListener("touchmove", preventTouch, { passive: false, capture: true });
    document.addEventListener("touchstart", preventTouch, { passive: false, capture: true });
    
    // Wheel/scroll with modifiers
    document.addEventListener("wheel", preventScroll, { passive: false, capture: true });
    
    // Gesture events (Safari)
    document.addEventListener("gesturestart", preventGestureEvents, { passive: false, capture: true });
    document.addEventListener("gesturechange", preventGestureEvents, { passive: false, capture: true });
    document.addEventListener("gestureend", preventGestureEvents, { passive: false, capture: true });

    return () => {
      document.removeEventListener("touchmove", preventTouch);
      document.removeEventListener("touchstart", preventTouch);
      document.removeEventListener("wheel", preventScroll);
      document.removeEventListener("gesturestart", preventGestureEvents);
      document.removeEventListener("gesturechange", preventGestureEvents);
      document.removeEventListener("gestureend", preventGestureEvents);
    };
  }, []);

  // Fullscreen monitoring is now handled in InterviewRoom component with MUI Dialog
  const monitorFullscreen = useCallback(() => {
    // No-op - monitoring moved to InterviewRoom
    return () => {};
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const cleanups = [
      lockKeyboard(),
      disableInteractions(),
      disableGestures(),
      monitorFullscreen(),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup && cleanup());
    };
  }, [enabled, lockKeyboard, disableInteractions, disableGestures, monitorFullscreen]);
};

