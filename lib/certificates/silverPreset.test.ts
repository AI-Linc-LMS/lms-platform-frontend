import { describe, expect, it } from "vitest";

import { CERTIFICATE_PRESET_ORDER, getPreset } from "./presets";

/**
 * Silver, and why it is drawn light.
 *
 * Reported as "the themes Grand Gold and Gold barely have any difference. We can have a silver
 * theme." Platinum is already a cool silver on dark navy, so a silver that was also dark would have
 * been one more variation nobody can tell apart. These pin that it exists, sits in the ladder
 * between bronze and platinum, and does not look like the dark metals beside it.
 */

/** Relative luminance of a #rrggbb colour, 0 (black) to 1 (white). */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The first colour in a gradient string: the ground the certificate is drawn on. */
const ground = (bg: string) => bg.match(/#[0-9a-f]{6}/i)![0];

describe("the Silver theme", () => {
  it("is offered in the picker, between Bronze and Platinum", () => {
    const at = CERTIFICATE_PRESET_ORDER.indexOf("silver");
    expect(at).toBeGreaterThan(-1);
    expect(CERTIFICATE_PRESET_ORDER[at - 1]).toBe("bronze");
    expect(CERTIFICATE_PRESET_ORDER[at + 1]).toBe("platinum");
  });

  it("resolves to itself, not to the fallback", () => {
    expect(getPreset("silver").slug).toBe("silver");
  });

  it("is drawn light, unlike every other metal", () => {
    const silver = getPreset("silver");
    expect(silver.dark).toBe(false);
    for (const metal of ["bronze", "platinum", "gold", "grand-gold"] as const) {
      expect(getPreset(metal).dark).toBe(true);
    }
    expect(luminance(ground(silver.palette.bg))).toBeGreaterThan(0.8);
  });

  it("keeps its text readable on its own ground", () => {
    // Dark ink on a light ground - the contrast a light theme lives or dies by.
    const silver = getPreset("silver").palette;
    const bg = luminance(ground(silver.bg));
    const ink = luminance(silver.ink);
    expect((bg + 0.05) / (ink + 0.05)).toBeGreaterThan(7);
  });
});
