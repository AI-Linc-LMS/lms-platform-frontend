import { describe, expect, it } from "vitest";
import { alignPatch } from "./TemplateEditorDialog";
import { CERTIFICATE_CANVAS_WIDTH as W } from "@/lib/certificates/types";

/**
 * Reported: "selecting Left alignment places the text on the right side of the certificate."
 *
 * "Across (%)" is the ANCHOR and `align` chooses which edge of the text pins to it. With the
 * default x of 0.5 that means "Left" pins the text's LEFT edge to the middle, so it runs off
 * to the right. The unreported mirror image is worse: "Right" pushes text into the LEFT half.
 *
 * These tests assert the visible outcome - where the text actually lands on the canvas - not
 * merely the object returned, because the object was never the thing that was wrong.
 */

/** The renderer's own maths, from CertificateArtwork UploadLayout. */
function renderedSpan(align: "left" | "center" | "right", x: number, textWidth: number) {
  const left = x * W;
  const start = align === "center" ? left - textWidth / 2 : align === "right" ? left - textWidth : left;
  return { start, end: start + textWidth, center: start + textWidth / 2 };
}

/** Apply what the editor would now store, then render it. */
function place(align: "left" | "center" | "right", startingX: number, textWidth: number) {
  const patch = alignPatch(align, startingX);
  return renderedSpan(align, patch.x ?? startingX, textWidth);
}

const TEXT = 300; // a typical heading width in canvas units

describe("alignment puts text where the label says", () => {
  it("Left lands the text in the left half", () => {
    // Before the fix this produced a span of [500, 800] - the right half.
    const { center, start } = place("left", 0.5, TEXT);
    expect(center).toBeLessThan(W / 2);
    expect(start).toBeLessThan(W / 2);
  });

  it("Right lands the text in the right half", () => {
    const { center, end } = place("right", 0.5, TEXT);
    expect(center).toBeGreaterThan(W / 2);
    expect(end).toBeGreaterThan(W / 2);
  });

  it("Center stays centred", () => {
    const { center } = place("center", 0.5, TEXT);
    expect(center).toBeCloseTo(W / 2, 5);
  });

  it("orders left < center < right on the canvas", () => {
    const l = place("left", 0.5, TEXT).center;
    const c = place("center", 0.5, TEXT).center;
    const r = place("right", 0.5, TEXT).center;
    expect(l).toBeLessThan(c);
    expect(c).toBeLessThan(r);
  });

  it("keeps the text inside the canvas on every alignment", () => {
    for (const a of ["left", "center", "right"] as const) {
      const { start, end } = place(a, 0.5, TEXT);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeLessThanOrEqual(W);
    }
  });
});

describe("a deliberately positioned field is not moved", () => {
  it("respects a custom Across value", () => {
    // 0.31 is not one of the natural anchors, so the admin meant it.
    expect(alignPatch("left", 0.31)).toEqual({ align: "left" });
    expect(alignPatch("right", 0.31)).toEqual({ align: "right" });
  });

  it("snaps only from the three natural anchors", () => {
    expect(alignPatch("left", 0.5)).toEqual({ align: "left", x: 0.08 });
    expect(alignPatch("right", 0.5)).toEqual({ align: "right", x: 0.92 });
    expect(alignPatch("center", 0.08)).toEqual({ align: "center", x: 0.5 });
    expect(alignPatch("center", 0.92)).toEqual({ align: "center", x: 0.5 });
  });
});
