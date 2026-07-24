"use client";

/**
 * Tiny synthesized "points earned" chime - a short bright ascending arpeggio,
 * played via the Web Audio API so there's no audio asset to bundle/host. Best
 * effort: guarded for SSR, autoplay policy, and unsupported browsers.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  } catch {
    return null;
  }
}

export function playXpSound() {
  const ac = getCtx();
  if (!ac) return;
  try {
    if (ac.state === "suspended") void ac.resume();
    const now = ac.currentTime;
    // A5 -> D6 -> G6, quick and bright (Duolingo-ish "ding").
    const notes = [
      { f: 880, t: 0 },
      { f: 1174.66, t: 0.08 },
      { f: 1567.98, t: 0.16 },
    ];
    const master = ac.createGain();
    master.gain.value = 0.13;
    master.connect(ac.destination);
    for (const n of notes) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "triangle";
      osc.frequency.value = n.f;
      const start = now + n.t;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(1, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      osc.connect(g);
      g.connect(master);
      osc.start(start);
      osc.stop(start + 0.26);
    }
  } catch {
    /* best-effort - never throw from a celebration */
  }
}
