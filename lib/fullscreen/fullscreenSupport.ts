/**
 * One answer to "can this document actually enter fullscreen?", shared by every caller.
 *
 * Why this exists: **iOS Safari on iPhone ships no Fullscreen API for ordinary elements.**
 * `requestFullscreen`, `webkitRequestFullscreen`, `mozRequestFullScreen` and `msRequestFullscreen`
 * are all undefined on `document.documentElement` there (iPadOS Safari and Android Chrome do have
 * it). The old code called all four inside a try/catch, so on an iPhone *nothing ran, nothing
 * threw, and the promise resolved* - a success signal for a thing that never happened. The take
 * page read that as "fullscreen was requested", then saw `fullscreenElement` still empty and put
 * up a blocking "Fullscreen Mode Required" modal whose only button ran the same no-op. The learner
 * was trapped with the clock running.
 *
 * The fix is to ask the capability question once, by name, instead of inferring an answer from the
 * silence of a no-op. This is a CAPABILITY check (presence of the request method, plus the
 * `fullscreenEnabled` permission flag), not a device sniff: a desktop browser inside an iframe
 * without `allow="fullscreen"` is just as unable, and gets the same honest answer.
 */

import { getClientDeviceClass } from "@/lib/utils/assessment-device";

type FullscreenRequest = () => Promise<void> | void;

type FullscreenCapableElement = Element & {
  requestFullscreen?: FullscreenRequest;
  webkitRequestFullscreen?: FullscreenRequest;
  mozRequestFullScreen?: FullscreenRequest;
  msRequestFullscreen?: FullscreenRequest;
};

type FullscreenCapableDocument = Document & {
  fullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  fullscreenEnabled?: boolean;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
  exitFullscreen?: FullscreenRequest;
  webkitExitFullscreen?: FullscreenRequest;
  mozCancelFullScreen?: FullscreenRequest;
  msExitFullscreen?: FullscreenRequest;
};

/** Request method names paired with the permission flag that can veto them. */
const REQUEST_METHODS: Array<{
  request: keyof FullscreenCapableElement;
  enabled: keyof FullscreenCapableDocument;
}> = [
  { request: "requestFullscreen", enabled: "fullscreenEnabled" },
  { request: "webkitRequestFullscreen", enabled: "webkitFullscreenEnabled" },
  { request: "mozRequestFullScreen", enabled: "mozFullScreenEnabled" },
  { request: "msRequestFullscreen", enabled: "msFullscreenEnabled" },
];

function resolveDocument(doc?: Document): FullscreenCapableDocument | null {
  if (doc) return doc as FullscreenCapableDocument;
  if (typeof document === "undefined") return null;
  return document as FullscreenCapableDocument;
}

/**
 * The bound request method this document would actually use, or null when it has none.
 * Returns null when a `*fullscreenEnabled` flag is explicitly `false` - that is the iframe case
 * (no `allow="fullscreen"`), where the method exists and always rejects.
 */
export function getFullscreenRequestMethod(
  doc?: Document
): FullscreenRequest | null {
  const d = resolveDocument(doc);
  const element = d?.documentElement as FullscreenCapableElement | undefined;
  if (!d || !element) return null;

  for (const { request, enabled } of REQUEST_METHODS) {
    const fn = element[request];
    if (typeof fn !== "function") continue;
    // Only an explicit false blocks. Undefined means "this engine does not expose the flag",
    // which is not a denial.
    if (d[enabled] === false) return null;
    return (fn as FullscreenRequest).bind(element);
  }
  return null;
}

/**
 * True when this document can actually enter fullscreen. **The single source of truth** for every
 * caller that would otherwise demand fullscreen, so a learner is never shown a control that cannot
 * work. False on iPhone Safari, and false in an iframe that is not allowed fullscreen.
 */
export function canEnterFullscreen(doc?: Document): boolean {
  return getFullscreenRequestMethod(doc) !== null;
}

/** Cross-browser "are we in fullscreen right now". */
export function isDocumentFullscreen(doc?: Document): boolean {
  const d = resolveDocument(doc);
  if (!d) return false;
  return (
    !!d.fullscreenElement ||
    !!d.webkitFullscreenElement ||
    !!d.mozFullScreenElement ||
    !!d.msFullscreenElement
  );
}

/**
 * Ask for fullscreen and report **what actually happened**: resolves true only when fullscreen is
 * held afterwards. Never throws and never reports success for a no-op.
 */
export async function requestDocumentFullscreen(
  doc?: Document
): Promise<boolean> {
  const request = getFullscreenRequestMethod(doc);
  if (!request) return false;
  try {
    await request();
  } catch {
    // A rejected request (no user gesture, iframe policy) is a failure, not a crash.
    return isDocumentFullscreen(doc);
  }
  return isDocumentFullscreen(doc);
}

/** Leave fullscreen if we are in it. Never throws. */
export async function exitDocumentFullscreen(doc?: Document): Promise<void> {
  const d = resolveDocument(doc);
  if (!d) return;
  const exit =
    d.exitFullscreen ??
    d.webkitExitFullscreen ??
    d.mozCancelFullScreen ??
    d.msExitFullscreen;
  if (typeof exit !== "function") return;
  try {
    await exit.call(d);
  } catch {
    // Already out, or the browser refused. Nothing to recover.
  }
}

/**
 * Whether copy may mention the **F11** key. "Press F11" on a phone is noise at best and, next to a
 * button that cannot work, it reads as the learner's fault. There is no capability API for "this
 * device has function keys", so this reuses the device class the assessment rules already use
 * (`getClientDeviceClass`) rather than introducing a second heuristic - and it is only ever used to
 * choose words, never to decide access.
 */
export function canPressFullscreenHotkey(doc?: Document): boolean {
  if (!canEnterFullscreen(doc)) return false;
  return getClientDeviceClass() === "desktop";
}
