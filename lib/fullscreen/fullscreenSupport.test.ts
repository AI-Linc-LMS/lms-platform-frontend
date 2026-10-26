import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canEnterFullscreen,
  canPressFullscreenHotkey,
  getFullscreenRequestMethod,
  isDocumentFullscreen,
  requestDocumentFullscreen,
} from "./fullscreenSupport";
import {
  expectNoFullscreenApi,
  installFullscreenApi,
} from "./fullscreenTestDouble";

/**
 * The capability question, asked once and honestly.
 *
 * Two learners on Agileology could not sit their assessment on an iPhone: the take page demanded
 * fullscreen, iOS Safari has no Fullscreen API for ordinary elements, and the old code read the
 * SILENCE of four missing methods as success. Everything in this fix rests on being able to tell
 * "fullscreen is not held" from "fullscreen cannot be held", so that distinction is tested first.
 */

let installed: { uninstall: () => void } | null = null;

afterEach(() => {
  installed?.uninstall();
  installed = null;
  vi.unstubAllGlobals();
});

describe("canEnterFullscreen", () => {
  it("is false on a document with no fullscreen methods (iPhone Safari)", () => {
    expect(expectNoFullscreenApi()).toBe(true); // the shape under test really is the phone's
    expect(canEnterFullscreen()).toBe(false);
    expect(getFullscreenRequestMethod()).toBeNull();
  });

  it("is true on a standard desktop document", () => {
    installed = installFullscreenApi();
    expect(canEnterFullscreen()).toBe(true);
  });

  it("is true with only the legacy WebKit method (older desktop Safari)", () => {
    installed = installFullscreenApi({ prefixed: true });
    expect(canEnterFullscreen()).toBe(true);
  });

  it("is false when the method exists but fullscreenEnabled is false (iframe)", () => {
    // A desktop browser inside an iframe without allow="fullscreen". The method is there and
    // always rejects, so a caller that only checked for the method would demand the impossible.
    installed = installFullscreenApi({ enabled: false });
    expect(canEnterFullscreen()).toBe(false);
  });
});

describe("requestDocumentFullscreen reports what actually happened", () => {
  it("resolves false, without throwing, when there is nothing to call", async () => {
    // This is the whole bug: the old code awaited four `undefined`s inside a try/catch, so the
    // promise resolved and the caller believed fullscreen had been requested.
    await expect(requestDocumentFullscreen()).resolves.toBe(false);
    expect(isDocumentFullscreen()).toBe(false);
  });

  it("resolves true when fullscreen is actually entered", async () => {
    installed = installFullscreenApi();
    await expect(requestDocumentFullscreen()).resolves.toBe(true);
    expect(isDocumentFullscreen()).toBe(true);
  });

  it("resolves false, without throwing, when the browser rejects the request", async () => {
    installed = installFullscreenApi({ reject: true });
    await expect(requestDocumentFullscreen()).resolves.toBe(false);
  });
});

describe("canPressFullscreenHotkey", () => {
  it("is false where there is no fullscreen to enter", () => {
    // "Press F11" was printed under the button on the iPhone in the bug report.
    expect(canPressFullscreenHotkey()).toBe(false);
  });

  it("is false on a touch phone even if fullscreen exists (Android Chrome has no F11)", () => {
    installed = installFullscreenApi();
    vi.stubGlobal("navigator", {
      ...window.navigator,
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36",
      maxTouchPoints: 5,
      platform: "Linux armv8l",
    });
    expect(canEnterFullscreen()).toBe(true);
    expect(canPressFullscreenHotkey()).toBe(false);
  });

  it("is true on a desktop that can enter fullscreen", () => {
    installed = installFullscreenApi();
    vi.stubGlobal("navigator", {
      ...window.navigator,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
      maxTouchPoints: 0,
      platform: "MacIntel",
    });
    expect(canPressFullscreenHotkey()).toBe(true);
  });
});
