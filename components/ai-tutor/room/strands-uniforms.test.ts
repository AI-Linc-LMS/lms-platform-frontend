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

  /**
   * The geometry invariants below moved when the room switched to the glass-orb preset.
   *
   * `fitSingleRibbon` is no longer passed, so `RIBBON_FILL` and `MAX_VERTICAL_SCALE` are inert for
   * this app: `uScale` is the fixed `scale` prop and the sphere's own radius bounds the visual.
   * Those constants stay in the vendored component because `fitSingleRibbon` is still a supported
   * prop, but asserting them here would be guarding a code path the product does not take, which
   * is worse than no test - it reads as coverage while protecting nothing.
   *
   * So these assert the configuration the room actually renders, read out of TutorVoice.
   */
  const VOICE = readFileSync(path.resolve(__dirname, "TutorVoice.tsx"), "utf8");

  it("renders the orb, not the full-width ribbon", () => {
    expect(VOICE).toMatch(/\n\s*glass\n/);
    // The PROP, not the word: the comment above the element explains why the fit is absent, and
    // that explanation is worth keeping.
    expect(VOICE).not.toMatch(/^\s*fitSingleRibbon(\s*=|\s*$)/m);
    // The sphere's radius is 0.46 * glassSize, and `p` spans +/-0.5 vertically, so anything at or
    // above ~1.08 would push the orb past the top and bottom of its container.
    const size = Number(VOICE.match(/glassSize=\{([\d.]+)\}/)![1]);
    expect(size).toBeGreaterThan(0);
    expect(0.46 * size).toBeLessThan(0.5);
  });

  it("keeps the wave inside the sphere at the loudest amplitude", () => {
    /**
     * Same invariant as before, re-derived for the preset. The visible half-height is
     * `0.5 / scale` because `uScaleY` is the plain `scale` prop without the fit, and the shader's
     * excursion is `(0.1 + 0.02 * e) * env * uAmplitude`.
     */
    const scale = Number(VOICE.match(/scale=\{([\d.]+)\}/)![1]);
    const amp = VOICE.match(/amplitude:\s*([\d.]+)\s*\+\s*amp\s*\*\s*([\d.]+)/);
    expect(amp).not.toBeNull();
    const maxAmplitude = Number(amp![1]) + Number(amp![2]);
    const maxExcursion = (0.1 + 0.02) * maxAmplitude;
    expect(0.5 / scale / maxExcursion).toBeGreaterThan(1.5);
  });

  it("drives the orb with speed, which is what carries the voice here", () => {
    // The explicit product requirement: it turns over faster when someone is talking. A ceiling
    // too, because past a point the bands strobe rather than flow.
    const speed = VOICE.match(/speed:\s*look\.speed\s*\+\s*amp\s*\*\s*([\d.]+)/);
    expect(speed).not.toBeNull();
    expect(Number(speed![1])).toBeGreaterThan(0.5);
    expect(Number(speed![1])).toBeLessThanOrEqual(2.5);
  });

  it("keeps glow below the value that saturates the sphere to flat white", () => {
    const glow = VOICE.match(/glow:\s*([\d.]+)\s*\+\s*amp\s*\*\s*([\d.]+)/);
    expect(glow).not.toBeNull();
    expect(Number(glow![1]) + Number(glow![2])).toBeLessThanOrEqual(3.6);
  });
});
