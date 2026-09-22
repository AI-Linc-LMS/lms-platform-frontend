import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { cssByMedia } from "@/components/community/cssByMedia.testutil";
import { AdaptiveInfoTip } from "./AdaptiveInfoTip";

/**
 * The (i) button draws 19px (a 15px glyph plus 2px padding). Its phone hit area was a 12px
 * overlay on every side: 43px, one short of the 44px floor. 13px makes it 45px. Desktop keeps
 * the bare 19px button, so the overlay lives in the phone block only.
 */
describe("AdaptiveInfoTip on a phone", () => {
  it("has a hit area of at least 44px, on a phone only", () => {
    render(<AdaptiveInfoTip title="Confidence target">Body</AdaptiveInfoTip>);
    const css = cssByMedia(screen.getByRole("button", { name: "About Confidence target" }));
    const inset = /::after\{[^}]*inset:-(\d+)px/.exec(css.phone);
    expect(inset, "no phone hit area").not.toBeNull();
    expect(19 + 2 * Number(inset![1])).toBeGreaterThanOrEqual(44);
    expect(css.unscoped).not.toMatch(/::after/);
  });
});
