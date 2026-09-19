
import { describe, expect, it } from "vitest";
import { getPreset } from "./presets";

/** "The themes Grand Gold and Gold barely have any difference." */

function ground(bg: string): [number, number, number] {
  const stops = bg.match(/#[0-9a-fA-F]{6}/g)!;
  const h = stops[1].slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function hueDeg([r, g, b]: [number, number, number]): number {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

describe("Grand Gold against Gold", () => {
  it("sits on a ground of a different colour family", () => {
    const gap = Math.abs(hueDeg(ground(getPreset("gold").palette.bg)) - hueDeg(ground(getPreset("grand-gold").palette.bg)));
    expect(Math.min(gap, 360 - gap)).toBeGreaterThan(30);
  });

});
