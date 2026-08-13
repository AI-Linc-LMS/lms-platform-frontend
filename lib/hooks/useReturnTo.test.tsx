import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReturnTo } from "./useReturnTo";

const mockParams = vi.hoisted(() => ({ value: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => mockParams.value }));

const FALLBACK = { href: "/adaptive-courses/1", label: "Back to course" };
const render = (from?: string) => {
  mockParams.value = new URLSearchParams(from ? { from } : {});
  return renderHook(() => useReturnTo(FALLBACK)).result.current;
};

describe("useReturnTo", () => {
  it("returns the module default when no from is given", () => {
    expect(render()).toEqual(FALLBACK);
  });

  it("sends a learner who came from a roadmap back to the roadmap", () => {
    expect(render("/roadmaps/tcs/step/12")).toEqual({
      href: "/roadmaps/tcs/step/12",
      label: "Back to roadmap",
    });
  });

  it.each([
    ["https://evil.example/phish", "absolute URL"],
    ["//evil.example/phish", "protocol-relative URL"],
    ["javascript:alert(1)", "javascript scheme"],
    ["evil.example", "bare host"],
  ])("ignores %s (%s) rather than redirecting to it", (from) => {
    // `from` comes off the URL bar, so an unvalidated redirect target here is an open
    // redirect: a link into our own domain that bounces the learner somewhere else.
    expect(render(from)).toEqual(FALLBACK);
  });
});
