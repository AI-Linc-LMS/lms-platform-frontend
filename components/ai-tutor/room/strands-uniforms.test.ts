import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The ribbon shipped to production **completely invisible**, twice-reviewed and twice-built.
 *
 * Making `uScale` anisotropic meant adding `uniform float uScaleY` to the fragment shader and a
 * per-frame write to `program.uniforms.uScaleY.value`. The edit that was supposed to DECLARE that
 * uniform in the `uniforms` object did not match the source and silently did nothing. So the first
 * animation frame threw reading `.value` of `undefined`, the requestAnimationFrame loop died, and
 * the ribbon never drew at all.
 *
 * Nothing in the toolchain can catch that. `uniforms` is an untyped object literal, so `tsc` sees
 * no error; the write is inside a callback, so `next build` never executes it. It is only
 * observable by looking at the running page, which is exactly the check that is easiest to skip.
 *
 * So it is asserted here instead, by parsing the file. Three invariants, each of which was
 * violated by the bug:
 *
 *  1. every uniform written per-frame is declared in a `uniforms` object,
 *  2. every uniform the GLSL declares is supplied from JS, and
 *  3. the specific uniform whose absence caused this is present.
 *
 * A parse-based test is unusual and worth it here: the alternative is a WebGL context in jsdom,
 * which does not exist, and the failure mode is total.
 */

const SOURCE = readFileSync(
  path.resolve(__dirname, "Strands.tsx"),
  "utf8"
);

/** Uniform names declared in any `uniforms: { ... }` object literal. */
function declaredInJs(source: string): Set<string> {
  const names = new Set<string>();
  const blocks = source.match(/uniforms:\s*\{[\s\S]*?\n {6}\},/g) ?? [];
  for (const block of blocks) {
    for (const match of block.matchAll(/(\bu[A-Z]\w*)\s*:/g)) names.add(match[1]);
  }
  return names;
}

/** Uniform names written per-frame, e.g. `program.uniforms.uScale.value = x`. */
function writtenPerFrame(source: string): Set<string> {
  const names = new Set<string>();
  for (const match of source.matchAll(/\.uniforms\.(u\w+)\.value/g)) names.add(match[1]);
  return names;
}

/** Uniform names the GLSL itself declares. */
function declaredInGlsl(source: string): Set<string> {
  const names = new Set<string>();
  for (const match of source.matchAll(/^\s*uniform\s+\w+\s+(u\w+)/gm)) names.add(match[1]);
  return names;
}

describe("Strands uniform wiring", () => {
  it("declares every uniform it writes per-frame", () => {
    const declared = declaredInJs(SOURCE);
    const written = writtenPerFrame(SOURCE);

    expect(declared.size).toBeGreaterThan(10);
    expect(written.size).toBeGreaterThan(10);

    const undeclared = [...written].filter((name) => !declared.has(name)).sort();
    // Each of these would throw on the first frame and kill the animation loop.
    expect(undeclared).toEqual([]);
  });

  it("supplies every uniform the shader declares", () => {
    const declared = declaredInJs(SOURCE);
    const glsl = declaredInGlsl(SOURCE);

    expect(glsl.size).toBeGreaterThan(10);
    const unsupplied = [...glsl].filter((name) => !declared.has(name)).sort();
    expect(unsupplied).toEqual([]);
  });

  it("still has the uScaleY uniform whose absence made the ribbon invisible", () => {
    // Named explicitly, so deleting it fails a test that says why rather than a generic one.
    expect(declaredInGlsl(SOURCE).has("uScaleY")).toBe(true);
    expect(declaredInJs(SOURCE).has("uScaleY")).toBe(true);
    expect(writtenPerFrame(SOURCE).has("uScaleY")).toBe(true);
  });

  it("keeps room for the wave at the LOUDEST amplitude TutorVoice actually sends", () => {
    /**
     * The invariant that was violated in production, and it spans two files.
     *
     * `Strands` caps the vertical scale; `TutorVoice` drives `amplitude` from the audio level. The
     * cap was chosen against the RESTING wave while TutorVoice sent up to 3.7 on loud speech, so
     * the ribbon swung 1.4x past the visible edge on normal speech and 2.2x on loud - it left the
     * screen precisely when it was doing its job. Asserting the two together is the only way to
     * keep them honest, because either file looks perfectly reasonable on its own.
     */
    const cap = Number(SOURCE.match(/MAX_VERTICAL_SCALE\s*=\s*([\d.]+)/)![1]);
    const voice = readFileSync(path.resolve(__dirname, "TutorVoice.tsx"), "utf8");
    const amp = voice.match(/amplitude:\s*([\d.]+)\s*\+\s*amp\s*\*\s*([\d.]+)/);
    expect(amp).not.toBeNull();
    const maxAmplitude = Number(amp![1]) + Number(amp![2]);

    // Excursion is (0.1 + 0.02 * e) * env * uAmplitude, with e and env at most 1 in the centre.
    const maxExcursion = (0.1 + 0.02 * 1) * maxAmplitude;
    const halfHeight = 0.5 / cap;
    // 1.5x, so thickness and glow have somewhere to spread rather than clipping at the edge.
    expect(halfHeight / maxExcursion).toBeGreaterThan(1.5);
  });

  it("keeps thickness and glow below the values that saturated to flat white", () => {
    // From a headless thickness/glow sweep: past these the bright core fills most of the container
    // and the ribbon reads as a blown-out smear with no visible strand structure.
    const voice = readFileSync(path.resolve(__dirname, "TutorVoice.tsx"), "utf8");
    const th = voice.match(/thickness:\s*([\d.]+)\s*\+\s*amp\s*\*\s*([\d.]+)/);
    const gl = voice.match(/glow:\s*([\d.]+)\s*\+\s*amp\s*\*\s*([\d.]+)/);
    expect(th).not.toBeNull();
    expect(gl).not.toBeNull();
    expect(Number(th![1]) + Number(th![2])).toBeLessThanOrEqual(0.55);
    expect(Number(gl![1]) + Number(gl![2])).toBeLessThanOrEqual(2.0);
  });

  it("fits the ribbon inside the frame rather than cropping it", () => {
    // RIBBON_FILL < 1 is what lets the taper reach zero before the container edge. At 1.0 the
    // ribbon carries luminance right up to the edge and reads as cut off, which is how it shipped.
    const fill = SOURCE.match(/RIBBON_FILL\s*=\s*([\d.]+)/);
    expect(fill).not.toBeNull();
    expect(Number(fill![1])).toBeLessThan(1);
    expect(Number(fill![1])).toBeGreaterThan(0.5);
  });
});
