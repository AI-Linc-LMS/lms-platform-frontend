/**
 * Chromium Keyboard Lock while in fullscreen: reduces OS/browser shortcuts
 * the page can legally capture (Escape, F11, Meta/Win, Tab in some builds).
 *
 * Alt+Tab and similar combos are handled by the OS first; they cannot be
 * fully disabled from a normal web page — combine with visibility/tab-switch
 * detection and kiosk policy for strict environments.
 */

const KEY_GROUPS: string[][] = [
  [
    "Escape",
    "F1",
    "F3",
    "F5",
    "F7",
    "F11",
    "F12",
    "MetaLeft",
    "MetaRight",
    "OSLeft",
    "OSRight",
    "Tab",
  ],
  ["Escape", "F11", "F12", "MetaLeft", "MetaRight", "OSLeft", "OSRight"],
  ["Escape", "F11", "F12"],
  ["Escape"],
];

type NavWithKeyboard = Navigator & {
  keyboard?: {
    lock?: (keys: string[]) => Promise<void>;
    unlock?: () => void;
  };
};

/**
 * Requests the strongest supported key lock. Call only from a secure context
 * while fullscreen is active. Returns a synchronous disposer that unlocks.
 */
export function lockProctoringKeysInFullscreen(): (() => void) | null {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as NavWithKeyboard;
  if (typeof nav.keyboard?.lock !== "function") return null;

  let cancelled = false;

  const run = async () => {
    for (const keys of KEY_GROUPS) {
      if (cancelled) return;
      try {
        await nav.keyboard!.lock(keys);
        return;
      } catch {
        // try smaller group
      }
    }
  };

  void run();

  return () => {
    cancelled = true;
    try {
      nav.keyboard?.unlock?.();
    } catch {
      /* ignore */
    }
  };
}
