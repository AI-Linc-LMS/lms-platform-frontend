/**
 * Cross-browser notes for “Escape shows confirm modal instead of leaving fullscreen”:
 *
 * | Engine   | Browsers (examples)     | Escape before exit? |
 * |----------|-------------------------|---------------------|
 * | Chromium | Chrome, Edge, Brave, Opera, Arc, Vivaldi, Samsung Internet (recent) | Yes, when `navigator.keyboard.lock(['Escape'])` succeeds in fullscreen (secure context). |
 * | Gecko    | Firefox                 | No reliable web API; Escape usually exits fullscreen first; use `fullscreenchange` → same modal. |
 * | WebKit   | Safari (desktop/iOS)    | No Keyboard Lock in shipping builds; same as Firefox — modal after exit. |
 *
 * Always pair Keyboard Lock with a capture-phase key listener + `fullscreenchange` fallback.
 */

/** True when the Keyboard Lock API exists (Chromium-based desktop/Android Chrome). */
export function hasNavigatorKeyboardLock(): boolean {
  if (typeof navigator === "undefined") return false;
  const kbd = (navigator as Navigator & { keyboard?: { lock?: unknown } })
    .keyboard;
  return typeof kbd?.lock === "function";
}

/** Escape across layouts / older implementations. */
export function isFullscreenExitKeyEvent(e: KeyboardEvent): boolean {
  return e.key === "Escape" || e.key === "Esc" || e.code === "Escape";
}
