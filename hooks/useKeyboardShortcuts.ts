"use client";

import { useEffect, useRef } from "react";

interface UseKeyboardShortcutsOptions {
  enabled: boolean;
  /** When true, do not intercept keys (e.g. MUI dialogs need Escape/Tab). */
  suspend?: boolean;
  onEscape?: () => void;
}

const CAPTURE_OPTS: AddEventListenerOptions = { capture: true, passive: false };

/**
 * Capture-phase shortcuts during proctoring. Uses passive:false so preventDefault
 * applies where the browser allows. OS-level combos (e.g. Alt+Tab) may still
 * reach the OS first — pair with fullscreen + navigator.keyboard.lock where supported.
 */
export function useKeyboardShortcuts({
  enabled,
  suspend = false,
  onEscape,
}: UseKeyboardShortcutsOptions) {
  const suspendRef = useRef(suspend);
  suspendRef.current = suspend;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (suspendRef.current) return;

      // Alt+Tab / Alt+Shift+Tab (when the browser delivers them)
      if (e.altKey && (e.key === "Tab" || e.code === "Tab")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      // Win+Tab / Cmd+Tab
      if (e.metaKey && (e.key === "Tab" || e.code === "Tab")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      // Ctrl+Tab — switch browser tabs
      if (e.ctrlKey && (e.key === "Tab" || e.code === "Tab")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      // Windows / Command / Super
      if (
        e.key === "Meta" ||
        e.code === "MetaLeft" ||
        e.code === "MetaRight" ||
        e.code === "OSLeft" ||
        e.code === "OSRight"
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Escape
      if (e.key === "Escape" || e.key === "Esc" || e.code === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onEscape?.();
        return;
      }

      // F11 (fullscreen toggle)
      if (e.key === "F11" || e.keyCode === 122) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Alt+Enter (fullscreen in some apps)
      if (e.altKey && (e.key === "Enter" || e.keyCode === 13)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Ctrl/Cmd + Shift + F
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "F" || e.keyCode === 70)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (suspendRef.current) return;
      if (
        e.key === "Meta" ||
        e.code === "MetaLeft" ||
        e.code === "MetaRight" ||
        e.code === "OSLeft" ||
        e.code === "OSRight"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (suspendRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    document.addEventListener("keydown", handleKeyDown, CAPTURE_OPTS);
    window.addEventListener("keydown", handleKeyDown, CAPTURE_OPTS);
    document.addEventListener("keyup", handleKeyUp, CAPTURE_OPTS);
    window.addEventListener("keyup", handleKeyUp, CAPTURE_OPTS);
    document.addEventListener("contextmenu", handleContextMenu, CAPTURE_OPTS);
    window.addEventListener("contextmenu", handleContextMenu, CAPTURE_OPTS);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, CAPTURE_OPTS);
      window.removeEventListener("keydown", handleKeyDown, CAPTURE_OPTS);
      document.removeEventListener("keyup", handleKeyUp, CAPTURE_OPTS);
      window.removeEventListener("keyup", handleKeyUp, CAPTURE_OPTS);
      document.removeEventListener("contextmenu", handleContextMenu, CAPTURE_OPTS);
      window.removeEventListener("contextmenu", handleContextMenu, CAPTURE_OPTS);
    };
  }, [enabled, onEscape]);
}
