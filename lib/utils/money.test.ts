import { describe, expect, it } from "vitest";
import { currencySymbol, formatMoney } from "@/lib/utils/money";

/**
 * Money the learner is about to be charged.
 *
 * The platform sells in ten currencies. A SAR price rendered with a rupee sign is a ~23× lie
 * about what is about to leave someone's account, and an unknown ISO code must not be able to
 * throw inside a card and take the page down with it.
 */

describe("formatMoney", () => {
  it("drops the noise decimals on a whole amount", () => {
    expect(formatMoney("2499.00", "INR")).toBe("₹2,499");
  });

  it("keeps decimals when they are real", () => {
    // Showing someone a price they will not actually be charged is worse than an untidy number.
    expect(formatMoney("49.50", "INR")).toBe("₹49.50");
  });

  it("uses the currency it was given, never a default", () => {
    const sar = formatMoney("100", "SAR");
    expect(sar).not.toContain("₹");
    expect(sar).toMatch(/SAR|﷼/);
  });

  it("survives an unknown ISO code instead of crashing the card", () => {
    const out = formatMoney("1499", "XYZ");
    expect(out).toContain("1,499");
    expect(out).toContain("XYZ");
  });

  it("renders nothing for an absent price rather than a zero", () => {
    // A card that says "₹0" on a course with no price set is worse than one that says nothing.
    expect(formatMoney(null, "INR")).toBe("");
    expect(formatMoney(undefined, "INR")).toBe("");
    expect(formatMoney("", "INR")).toBe("");
  });

  it("renders nothing for a non-numeric amount", () => {
    expect(formatMoney("not a price", "INR")).toBe("");
  });
});

describe("currencySymbol", () => {
  it("defaults to rupees only when nothing was specified", () => {
    expect(currencySymbol(undefined)).toBe("₹");
  });

  it("returns the code itself when there is no symbol for it", () => {
    expect(currencySymbol("XYZ")).toBe("XYZ");
  });
});
