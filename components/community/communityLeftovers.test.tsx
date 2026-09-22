import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@/lib/i18n";
import { MilestoneWidget } from "./MilestoneWidget";
import { QuickCommentBar } from "./QuickCommentBar";
import { cssByMedia } from "./cssByMedia.testutil";

/**
 * Community leftovers from the 360px audit: the progress card's labels were 9.9-11.5px, and the
 * "Write a comment…" field under every post was 36px tall. Phone-only fixes, so every phone
 * value must sit inside the max-width:599.95px block and nowhere a desktop can see.
 */

const XP = { balance: 120, tier: "bronze" as const, tier_display: "Bronze • Learner", next_tier_threshold: 500, progress_pct: 24 };

describe("the progress card on a phone", () => {
  it("raises YOUR PROGRESS, the tier role, Next and IP to 12px on a phone only", () => {
    render(<MilestoneWidget xp={XP} />);
    for (const text of [/your progress/i, "Learner", /Next: Silver/, "IP"]) {
      const el = screen.getAllByText(text)[0];
      const css = cssByMedia(el);
      expect(css.phone, String(text)).toContain("font-size:0.75rem");
      expect(css.unscoped, String(text)).not.toContain("font-size:0.75rem");
      expect(css.unscoped, String(text)).toMatch(/font-size:0\.(62|7|72)rem/);
    }
  });
});

describe("the quick comment field on a phone", () => {
  it("is a 44px field on a phone, and the row gives the room back", () => {
    render(<QuickCommentBar threadId={1} onComment={vi.fn()} />);
    const field = cssByMedia(screen.getByTestId("quick-comment-field"));
    expect(field.phone).toContain("min-height:44px");
    expect(field.unscoped).not.toContain("min-height:44px");
  });
});
