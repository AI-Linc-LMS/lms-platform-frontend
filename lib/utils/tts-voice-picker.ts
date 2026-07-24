"use client";

// Ordered list of preferred interviewer voices.
// William is the AI avatar's designated voice; the rest are device-specific fallbacks.
// Ordered preference. Good LOCAL desktop voices lead (Alex/Daniel/Samantha on macOS,
// David/Mark/Zira Desktop on Windows) because they don't depend on the network; the
// streamed "Online (Natural)" + Google voices come last (used only when online and no
// local voice is available - see pickBestVoice's local-first partition).
const PREFERRED_VOICE_PATTERNS: RegExp[] = [
  /\bAlex\b/i,
  /\b(Daniel|Samantha|Karen|Moira|Tom|Fred)\b/i,
  /Microsoft (David|Mark|Zira) Desktop/i,
  /Microsoft (Guy|Davis|Tony|Daniel|Aria|Jenny)\b/i,
  /Microsoft William/i,
  /Microsoft William Multilingual Online \(Natural\)/i,
  /Microsoft (Guy|Davis|Tony|Daniel|Alex) Online \(Natural\)/i,
  /Google UK English Male/i,
  /Google US English/i,
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

function bestByPattern(pool: SpeechSynthesisVoice[], preferredLang: string): PickedVoice | null {
  for (let i = 0; i < PREFERRED_VOICE_PATTERNS.length; i++) {
    const pattern = PREFERRED_VOICE_PATTERNS[i];
    const exact = pool.find((v) => pattern.test(v.name) && v.lang.toLowerCase() === preferredLang.toLowerCase());
    if (exact) return { voice: exact, rank: i, network: !exact.localService };
    const any = pool.find((v) => pattern.test(v.name));
    if (any) return { voice: any, rank: i, network: !any.localService };
  }
  return null;
}

export function pickBestVoice(preferredLang = "en-US"): PickedVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const english = voices.filter((v) => /^en[-_]/i.test(v.lang) || v.lang === "en");
  if (!english.length) return null;

  // LOCAL (offline-capable) voices are far more reliable. The streamed network
  // "Online (Natural)" voices garble/clip when the connection stutters - that's the
  // "gibberish like it's about to fall back" symptom. So we prefer local first, use
  // network only when actually online, and NEVER return null when any english voice
  // exists (returning null made the avatar speak with zero audio).
  const online = typeof navigator === "undefined" || navigator.onLine !== false;
  const localVoices = english.filter((v) => v.localService);
  const networkVoices = english.filter((v) => !v.localService);

  // Honour a cached preference only if it's a LOCAL voice still on this device.
  const stored = getStoredVoiceName();
  if (stored) {
    const match = localVoices.find((v) => v.name === stored);
    if (match) return { voice: match, rank: -1, network: false };
  }

  const picked =
    bestByPattern(localVoices, preferredLang) ||
    (online ? bestByPattern(networkVoices, preferredLang) : null) ||
    (localVoices[0] ? { voice: localVoices[0], rank: 98, network: false } : null) ||
    { voice: english[0], rank: 99, network: !english[0].localService };

  if (picked.voice) storeVoiceName(picked.voice.name);
  return picked;
}

export function warmVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.getVoices();
  } catch {}
}
