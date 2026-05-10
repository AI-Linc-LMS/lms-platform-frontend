"use client";

// Ordered list of preferred interviewer voices.
// William is the AI avatar's designated voice; the rest are device-specific fallbacks.
const PREFERRED_VOICE_PATTERNS: RegExp[] = [
  /Microsoft William Multilingual Online \(Natural\)/i,
  /Microsoft William/i,
  /Microsoft Guy Online \(Natural\)/i,
  /Microsoft Davis Online \(Natural\)/i,
  /Microsoft Tony Online \(Natural\)/i,
  /Microsoft Daniel Online \(Natural\)/i,
  /Microsoft Alex Online \(Natural\)/i,
  /Microsoft (Guy|Davis|Tony|Daniel|Alex)\b/i,
  /Microsoft (David|Mark) Desktop/i,
  /\bAlex\b/i,
  /\bTom\b/i,
  /\bFred\b/i,
  /Google UK English Male/i,
  /Google US English Male/i,
];

const PREFERRED_VOICE_STORAGE_KEY = "mockInterview.preferredInterviewerVoice";

function getStoredVoiceName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(PREFERRED_VOICE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function storeVoiceName(name: string): void {
  if (typeof window === "undefined" || !name) return;
  try {
    window.localStorage.setItem(PREFERRED_VOICE_STORAGE_KEY, name);
  } catch {}
}

function clearStoredVoiceName(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFERRED_VOICE_STORAGE_KEY);
  } catch {}
}

function isPreferredVoice(name: string): boolean {
  return PREFERRED_VOICE_PATTERNS.some((p) => p.test(name));
}

export function initializeVoicePreferences(): void {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(PREFERRED_VOICE_STORAGE_KEY);
    if (stored && !isPreferredVoice(stored)) {
      window.localStorage.removeItem(PREFERRED_VOICE_STORAGE_KEY);
    }
  } catch {}
}

let cachedReady: Promise<void> | null = null;

export function voicesReady(): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve();
  }
  if (cachedReady) return cachedReady;

  cachedReady = new Promise<void>((resolve) => {
    const synth = window.speechSynthesis;
    if (synth.getVoices().length > 0) {
      resolve();
      return;
    }
    let resolved = false;
    const handler = () => {
      if (resolved) return;
      resolved = true;
      synth.removeEventListener("voiceschanged", handler);
      resolve();
    };
    synth.addEventListener("voiceschanged", handler);
    // Safari may never fire voiceschanged but populates voices later.
    setTimeout(() => {
      if (resolved) return;
      resolved = true;
      synth.removeEventListener("voiceschanged", handler);
      resolve();
    }, 1500);
  });

  return cachedReady;
}

export interface PickedVoice {
  voice: SpeechSynthesisVoice;
  rank: number;
  network: boolean;
}

export function pickBestVoice(preferredLang = "en-US"): PickedVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const english = voices.filter((v) => /^en[-_]/i.test(v.lang) || v.lang === "en");
  if (!english.length) return null;

  // William is the designated voice — always pick it first if available,
  // bypassing any cached preference so devices that have it always use it.
  const william = english.find((v) => /Microsoft William/i.test(v.name));
  if (william) {
    storeVoiceName(william.name);
    return { voice: william, rank: 0, network: !william.localService };
  }

  // Use cached preference if it's still on this device and still preferred.
  const stored = getStoredVoiceName();
  if (stored) {
    const match = english.find((v) => v.name === stored);
    if (match && isPreferredVoice(match.name)) {
      return { voice: match, rank: -1, network: !match.localService };
    }
    clearStoredVoiceName();
  }

  // Walk the priority list — prefer exact lang match, fall back to any English.
  for (let i = 0; i < PREFERRED_VOICE_PATTERNS.length; i++) {
    const pattern = PREFERRED_VOICE_PATTERNS[i];
    const exact = english.find((v) => pattern.test(v.name) && v.lang.toLowerCase() === preferredLang.toLowerCase());
    if (exact) {
      storeVoiceName(exact.name);
      return { voice: exact, rank: i, network: !exact.localService };
    }
    const any = english.find((v) => pattern.test(v.name));
    if (any) {
      storeVoiceName(any.name);
      return { voice: any, rank: i, network: !any.localService };
    }
  }

  return null;
}

export function warmVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.getVoices();
  } catch {}
}
