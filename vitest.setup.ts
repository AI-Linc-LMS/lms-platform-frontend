import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Unmount between tests. Without this a component from one test is still mounted during the
// next, and an assertion can pass against the previous test's DOM.
afterEach(() => {
  cleanup();
});

// jsdom implements neither, and both are used by layout code all over this app. Absent, a
// component that merely *measures* itself throws and the test fails for a reason unrelated to
// what it is checking.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
