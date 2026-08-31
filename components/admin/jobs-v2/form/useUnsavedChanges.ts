"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The guard the create/edit form never had.
 *
 * Roughly 35 fields with no autosave, no draft and no review step is the module's largest
 * data-loss surface (spec 5.11). This hook covers the *navigation* half of it: Back, Cancel,
 * the breadcrumb and a browser reload all have to ask before they discard typed input.
 *
 * It deliberately owns no UI. The caller renders a `JConfirm` bound to `promptOpen` /
 * `confirmLeave` / `cancelLeave`, so the whole module keeps one dialog language.
 */
export interface UnsavedChangesApi {
  /** True while a discard confirmation is on screen. */
  promptOpen: boolean;
  /**
   * Run `action` now when the form is clean; otherwise park it and raise the prompt.
   * The parked action runs on `confirmLeave`.
   */
  requestLeave: (action: () => void) => void;
  confirmLeave: () => void;
  cancelLeave: () => void;
}

export function useUnsavedChanges(dirty: boolean): UnsavedChangesApi {
  const [promptOpen, setPromptOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  // The browser-level half. `beforeunload` is the only guard that survives a reload or a
  // typed URL, and it must be removed the moment the form goes clean or a save completes.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Required by Chrome; the string itself is never shown by any current browser.
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const requestLeave = useCallback(
    (action: () => void) => {
      if (!dirty) {
        action();
        return;
      }
      pending.current = action;
      setPromptOpen(true);
    },
    [dirty],
  );

  const confirmLeave = useCallback(() => {
    setPromptOpen(false);
    const action = pending.current;
    pending.current = null;
    action?.();
  }, []);

  const cancelLeave = useCallback(() => {
    setPromptOpen(false);
    pending.current = null;
  }, []);

  return { promptOpen, requestLeave, confirmLeave, cancelLeave };
}
