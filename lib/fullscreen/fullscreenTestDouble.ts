/**
 * A fake Fullscreen API for tests.
 *
 * jsdom implements NO Fullscreen API at all - `document.fullscreenElement`, `fullscreenEnabled`,
 * `exitFullscreen` and `documentElement.requestFullscreen` are all absent. That makes the default
 * test document an accurate stand-in for **iPhone Safari**, the browser in the bug report, and it
 * means the DESKTOP case is the one that has to be installed deliberately. Without this helper a
 * test cannot tell "we fixed the phone" from "jsdom has no fullscreen", and the desktop control
 * cannot be written at all.
 */

type Installed = {
  /** Leave fullscreen the way a browser does: clear the element, then fire the event. */
  leave: () => void;
  /** Enter fullscreen without going through requestFullscreen. */
  enter: () => void;
  uninstall: () => void;
};

export interface InstallFullscreenApiOptions {
  /** Use the legacy WebKit names instead of the standard ones (old desktop Safari). */
  prefixed?: boolean;
  /** `document.fullscreenEnabled`. False is an iframe without `allow="fullscreen"`. */
  enabled?: boolean;
  /** Make requestFullscreen reject, as a browser does without a user gesture. */
  reject?: boolean;
}

export function installFullscreenApi(
  options: InstallFullscreenApiOptions = {}
): Installed {
  const { prefixed = false, enabled = true, reject = false } = options;
  const elementKey = prefixed ? "webkitRequestFullscreen" : "requestFullscreen";
  const docElementKey = prefixed
    ? "webkitFullscreenElement"
    : "fullscreenElement";
  const docEnabledKey = prefixed
    ? "webkitFullscreenEnabled"
    : "fullscreenEnabled";
  const exitKey = prefixed ? "webkitExitFullscreen" : "exitFullscreen";
  const eventName = prefixed ? "webkitfullscreenchange" : "fullscreenchange";

  let current: Element | null = null;
  const fire = () => document.dispatchEvent(new Event(eventName));

  Object.defineProperty(document, docElementKey, {
    configurable: true,
    get: () => current,
  });
  Object.defineProperty(document, docEnabledKey, {
    configurable: true,
    get: () => enabled,
  });

  const root = document.documentElement as unknown as Record<string, unknown>;
  root[elementKey] = async () => {
    if (reject) throw new Error("fullscreen request denied");
    current = document.documentElement;
    fire();
  };
  (document as unknown as Record<string, unknown>)[exitKey] = async () => {
    current = null;
    fire();
  };

  return {
    enter() {
      current = document.documentElement;
      fire();
    },
    leave() {
      current = null;
      fire();
    },
    uninstall() {
      current = null;
      delete root[elementKey];
      delete (document as unknown as Record<string, unknown>)[exitKey];
      // Back to a document with no Fullscreen API whatsoever: the iPhone shape.
      Reflect.deleteProperty(document, docElementKey);
      Reflect.deleteProperty(document, docEnabledKey);
    },
  };
}

/** The iPhone Safari shape, and jsdom's default: assert it rather than assume it. */
export function expectNoFullscreenApi(): boolean {
  const root = document.documentElement as unknown as Record<string, unknown>;
  return (
    typeof root.requestFullscreen !== "function" &&
    typeof root.webkitRequestFullscreen !== "function" &&
    typeof root.mozRequestFullScreen !== "function" &&
    typeof root.msRequestFullscreen !== "function"
  );
}
