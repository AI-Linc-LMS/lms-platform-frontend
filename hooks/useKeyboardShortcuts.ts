"use client";

import { useEffect } from "react";

interface UseKeyboardShortcutsOptions {
  enabled: boolean;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({
  enabled,
  onEscape,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent ESC key
      if (e.key === "Escape" || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onEscape?.();
        return false;
      }

      // Prevent F11 (common fullscreen toggle)
      if (e.key === "F11" || e.keyCode === 122) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Prevent Alt+Enter (fullscreen in some browsers)
      if (e.altKey && (e.key === "Enter" || e.keyCode === 13)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Prevent Ctrl/Cmd + Shift + F (fullscreen in some browsers)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "F" || e.keyCode === 70)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [enabled, onEscape]);
}

