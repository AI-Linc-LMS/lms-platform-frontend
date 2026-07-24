"use client";

/**
 * Synthesized "points earned" accomplishment sound - a short, bright, major
 * level-up flourish built entirely from the Web Audio API (no audio asset to
 * bundle/host; CSP- and offline-safe). It layers:
 *
 *   1. a soft low impact/body at t=0 (weight + a satisfying "landing"),
 *   2. a bright ascending major arpeggio (C E G C) voiced as bell/marimba tones
 *      with 3 slightly-inharmonic partials each for a warm metallic shimmer,
 *   3. a fast high sparkle tail (maj-pentatonic dust) that twinkles off the top,
 *   4. a gently-blooming resolved major chord that rings out underneath.
 *
 * ~1.05s total, ~0.17 master gain, stereo-widened when the browser supports it.
 * Best effort throughout: guarded for SSR, autoplay-suspended contexts, and
 * unsupported browsers, and wrapped so it can never throw from a celebration.
 */

type Pannerish = AudioNode & { pan?: AudioParam };

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  } catch {
    return null;
  }
}

/** A stereo panner when available, else a pass-through gain (older Safari). */
function makePanner(ac: AudioContext, pan: number): Pannerish {
  const anyAc = ac as unknown as {
    createStereoPanner?: () => StereoPannerNode;
  };
  if (typeof anyAc.createStereoPanner === "function") {
    const p = anyAc.createStereoPanner();
    try {
      p.pan.value = Math.max(-1, Math.min(1, pan));
    } catch {
      /* ignore */
    }
    return p;
  }
  return ac.createGain();
}

/**
 * One bell/marimba voice: a fundamental plus two slightly-inharmonic partials,
 * each with its own decay (higher partials fade faster, as real struck metal
 * does). Percussive attack, exponential release.
 */
function playBell(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  peak: number,
  pan: number,
): number {
  const voice = ac.createGain();
  voice.gain.value = 1;
  const panner = makePanner(ac, pan);
  voice.connect(panner);
  panner.connect(dest);

  // ratio, relative gain, relative decay length
  const partials: Array<[number, number, number]> = [
    [1.0, 1.0, 1.0],
    [2.01, 0.42, 0.72],
    [3.02, 0.22, 0.5],
  ];

  for (const [ratio, rel, decayRel] of partials) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;
    osc.detune.value = (ratio - 1) * 4; // hair of shimmer on upper partials
    const p = Math.max(0.0002, peak * rel);
    const end = start + dur * decayRel;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(p, start + 0.008); // snappy attack
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g);
    g.connect(voice);
    osc.start(start);
    osc.stop(end + 0.02);
  }
  return start + dur;
}

/** A tiny bright sparkle - triangle blip with a very fast decay. */
function playSparkle(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  peak: number,
  pan: number,
): void {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const panner = makePanner(ac, pan);
  osc.type = "triangle";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
  osc.connect(g);
  g.connect(panner);
  panner.connect(dest);
  osc.start(start);
  osc.stop(start + 0.18);
}

/** A soft, warm sustained tone for the resolved final chord. */
function playPad(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  peak: number,
  pan: number,
): void {
  const osc = ac.createOscillator();
  const osc2 = ac.createOscillator();
  const g = ac.createGain();
  const panner = makePanner(ac, pan);
  osc.type = "triangle";
  osc2.type = "sine";
  osc.frequency.value = freq;
  osc2.frequency.value = freq;
  osc.detune.value = -6;
  osc2.detune.value = 6; // gentle chorus width
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.06);
  g.gain.setValueAtTime(Math.max(0.0002, peak), start + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  osc2.connect(g);
  g.connect(panner);
  panner.connect(dest);
  osc.start(start);
  osc2.start(start);
  osc.stop(start + dur + 0.02);
  osc2.stop(start + dur + 0.02);
}

/** Low impact/body - a short sine drop that gives the hit some weight. */
function playImpact(
  ac: AudioContext,
  dest: AudioNode,
  start: number,
): void {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, start);
  osc.frequency.exponentialRampToValueAtTime(52, start + 0.18);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(0.9, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + 0.28);
}

export function playXpSound(): void {
  const ac = getCtx();
  if (!ac) return;
  try {
    if (ac.state === "suspended") void ac.resume();
    const now = ac.currentTime + 0.001;

    // Master bus + a soft high-shelf-free gentle low-pass to tame harshness.
    const master = ac.createGain();
    master.gain.value = 0.17;
    let bus: AudioNode = master;
    try {
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 7200;
      lp.Q.value = 0.4;
      lp.connect(ac.destination);
      master.connect(lp);
    } catch {
      master.connect(ac.destination);
      bus = master;
    }

    // C major, bright register.
    const C5 = 523.25;
    const E5 = 659.25;
    const G5 = 783.99;
    const C6 = 1046.5;
    const E6 = 1318.51;
    const G6 = 1567.98;
    const A6 = 1760.0;
    const D7 = 2349.32;

    // 1) Low impact/body.
    playImpact(ac, bus, now);

    // 2) Ascending major arpeggio, bell/marimba voices, panned gently L->R.
    const arp: Array<[number, number, number, number]> = [
      // freq, offset(s), peak, pan
      [C5, 0.0, 0.5, -0.35],
      [E5, 0.085, 0.52, -0.12],
      [G5, 0.17, 0.55, 0.12],
      [C6, 0.255, 0.62, 0.35],
    ];
    for (const [f, off, peak, pan] of arp) {
      playBell(ac, bus, f, now + off, 0.6, peak, pan);
    }

    // 3) High maj-pentatonic sparkle tail after the arpeggio peaks.
    const sparkles: Array<[number, number, number, number]> = [
      [E6, 0.33, 0.16, -0.5],
      [G6, 0.4, 0.15, 0.5],
      [A6, 0.47, 0.13, -0.25],
      [D7, 0.55, 0.11, 0.3],
    ];
    for (const [f, off, peak, pan] of sparkles) {
      playSparkle(ac, bus, f, now + off, peak, pan);
    }

    // 4) Resolved major chord blooming underneath, ringing out.
    const chord: Array<[number, number]> = [
      [C5, -0.4],
      [E5, 0.0],
      [G5, 0.25],
      [C6, 0.4],
    ];
    for (const [f, pan] of chord) {
      playPad(ac, bus, f, now + 0.28, 0.72, 0.22, pan);
    }
  } catch {
    /* best-effort - never throw from a celebration */
  }
}
