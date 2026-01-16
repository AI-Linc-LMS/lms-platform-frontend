import { useEffect, useRef } from "react";
import { useToast } from "@/components/common/Toast";

interface UseAssessmentSecurityOptions {
  enabled: boolean;
}

export function useAssessmentSecurity({ enabled }: UseAssessmentSecurityOptions) {
  const { showToast } = useToast();
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Prevent refresh
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        "Are you sure you want to leave? Your progress may be lost.";
      return event.returnValue;
    };

    // Prevent keyboard shortcuts for refresh
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent F5, Ctrl+R, Ctrl+Shift+R
      if (
        event.key === "F5" ||
        (event.ctrlKey && event.key === "r") ||
        (event.ctrlKey && event.shiftKey && event.key === "R")
      ) {
        event.preventDefault();
        if (!hasWarnedRef.current) {
          showToast("Refresh is disabled during the assessment", "warning");
          hasWarnedRef.current = true;
          setTimeout(() => {
            hasWarnedRef.current = false;
          }, 3000);
        }
        return false;
      }

      // Prevent Ctrl+S (save page)
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        return false;
      }

      // Prevent Ctrl+P (print)
      if (event.ctrlKey && event.key === "p") {
        event.preventDefault();
        return false;
      }

      // Prevent F12 (dev tools)
      if (event.key === "F12") {
        event.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+I (dev tools)
      if (event.ctrlKey && event.shiftKey && event.key === "I") {
        event.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+J (console)
      if (event.ctrlKey && event.shiftKey && event.key === "J") {
        event.preventDefault();
        return false;
      }
    };

    // Prevent back navigation
    const handlePopState = (event: PopStateEvent) => {
      window.history.pushState(null, "", window.location.href);
      if (!hasWarnedRef.current) {
        showToast("Navigation is disabled during the assessment", "warning");
        hasWarnedRef.current = true;
        setTimeout(() => {
          hasWarnedRef.current = false;
        }, 3000);
      }
    };

    // Push state to prevent back navigation
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    // Prevent right-click context menu
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      return false;
    };

    // Prevent text selection
    const handleSelectStart = (event: Event) => {
      event.preventDefault();
      return false;
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);

    // Prevent drag and drop
    const handleDragStart = (event: DragEvent) => {
      event.preventDefault();
      return false;
    };

    document.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [enabled, showToast]);
}

