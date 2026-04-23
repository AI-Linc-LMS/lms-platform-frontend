import { useEffect, useRef } from "react";
import { useToast } from "@/components/common/Toast";

function isInsideFloatingToolUi(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target instanceof Element ? target : (target as Node).parentElement;
  return !!el?.closest?.("[data-floating-tool], [data-assessment-tool]");
}

function isAssessmentAnswerField(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target instanceof Element ? target : (target as Node).parentElement;
  return !!el?.closest?.("[data-assessment-answer-field]");
}

interface UseAssessmentSecurityOptions {
  enabled: boolean;
  submitting?: boolean; // Disable beforeunload during submission
}

export function useAssessmentSecurity({ enabled, submitting = false }: UseAssessmentSecurityOptions) {
  const { showToast } = useToast();
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Prevent refresh - but NOT during submission
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Don't show prompt during submission
      if (submitting) {
        // Remove the handler when submitting
        window.removeEventListener("beforeunload", handleBeforeUnload);
        return;
      }
      event.preventDefault();
      event.returnValue =
        "Are you sure you want to leave? Your progress may be lost.";
      return event.returnValue;
    };

    const captureOpts: AddEventListenerOptions = { capture: true, passive: false };

    // Prevent keyboard shortcuts for refresh and system-style combos (where the browser allows)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && (event.key === "Tab" || event.code === "Tab")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.metaKey && (event.key === "Tab" || event.code === "Tab")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.ctrlKey && (event.key === "Tab" || event.code === "Tab")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (
        event.key === "Meta" ||
        event.code === "MetaLeft" ||
        event.code === "MetaRight" ||
        event.code === "OSLeft" ||
        event.code === "OSRight"
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

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

      // Close tab / window shortcuts
      if (event.ctrlKey && (event.key === "w" || event.key === "W")) {
        event.preventDefault();
        return false;
      }
      if (event.ctrlKey && event.shiftKey && (event.key === "t" || event.key === "T")) {
        event.preventDefault();
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

      // Prevent F11 / F12 (fullscreen / devtools)
      if (event.key === "F11" || event.key === "F12") {
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

      // Prevent Ctrl+Shift+C (inspect element)
      if (event.ctrlKey && event.shiftKey && (event.key === "C" || event.key === "c")) {
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
    
    // Only add beforeunload listener if not submitting
    if (!submitting) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
    
    window.addEventListener("keydown", handleKeyDown, captureOpts);
    window.addEventListener("popstate", handlePopState);

    // Prevent right-click context menu
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      return false;
    };

    const handleSelectStart = (event: Event) => {
      if (isInsideFloatingToolUi(event.target) || isAssessmentAnswerField(event.target))
        return;
      event.preventDefault();
      return false;
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("selectstart", handleSelectStart);

    const handleDragStart = (event: DragEvent) => {
      if (isInsideFloatingToolUi(event.target) || isAssessmentAnswerField(event.target))
        return;
      event.preventDefault();
      return false;
    };

    document.addEventListener("dragstart", handleDragStart);

    return () => {
      // Always try to remove, even if it wasn't added
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.onbeforeunload = null; // Also clear the property
      window.removeEventListener("keydown", handleKeyDown, captureOpts);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [enabled, submitting, showToast]);
}

