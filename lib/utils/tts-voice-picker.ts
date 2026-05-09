"use client";

const QUALITY_PATTERNS: RegExp[] = [
  // Microsoft Online Natural voices (highest quality) - male
  /Microsoft Guy Online \(Natural\)/i,
  /Microsoft Davis Online \(Natural\)/i,
  /Microsoft Tony Online \(Natural\)/i,
  /Microsoft Daniel Online \(Natural\)/i,
  /Microsoft Alex Online \(Natural\)/i,
  // Microsoft Online Standard voices - male
  /Microsoft (Guy|Davis|Tony|Daniel|Alex)/i,
  // Google voices - male
  /Google US English/i,
  /Google UK English/i,
  // Chrome built-in male voices
  /\bGoogle UK English Male\b/i,
  /\bGoogle US English Male\b/i,
  /\bGoogle Mandarin Chinese\b/i,
  /\bChrome\b.*\b(Male|David|John|Mark|Peter|Sam|William)\b/i,
  // Generic male name patterns (cross-browser)
  /\b(Daniel|David|John|Mark|Peter|Sam|William|Robert|James|Michael|Joseph|Thomas|Charles|Christopher|Richard|Matthew|Anthony|Mark|Donald|Andrew|Joshua|Kenneth|George|Edward|Brian|Ronald|Kevin|Jason|Mathew|Gary|Nicholas|Eric|Jonathan|Stephen|Larry|Justin|Scott|Brandon|Benjamin|Samuel|Patrick|Alexander|Raymond|Jack|Dennis|Jerry|Tyler|Aaron|Jose|Adam|Henry|Douglas|Peter|Zachary|Kyle|Walter|Harold|Keith|Christian|Roger|Noah|Gerald|Carl|Arthur|Ryan|Roger|Juan|Elijah|Wayne|Billy|Vincent|Ralph|Roy|Russell|Louis|Philip|Johnny|Ernest|Martin|Randall|Vincent|Ralph|Eugene|Claude|Edwin|Bernie|Ellis|Marvin|Olin|Leigh)\b/i,
  // Female voices (lower priority - should be last)
  /Microsoft Aria Online \(Natural\)/i,
  /Microsoft Jenny Online \(Natural\)/i,
  /Microsoft (Aria|Jenny|Sara|Emma)/i,
  /Samantha/i,
  /Karen/i,
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

/** Clean up and validate stored voice preferences on app init */
export function initializeVoicePreferences(): void {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(PREFERRED_VOICE_STORAGE_KEY);
    // If stored voice is feminine or suspicious, clear it
    if (stored && !/\b(Guy|Davis|Tony|Daniel|Alex|David|John|Mark|Peter|Sam|William|Google US|Google UK|Male)\b/i.test(stored)) {
      window.localStorage.removeItem(PREFERRED_VOICE_STORAGE_KEY);
    }
  } catch {}
}

function isManlyVoiceName(name: string): boolean {
  // Microsoft male voices
  if (/Microsoft (Guy|Davis|Tony|Daniel|Alex)/i.test(name)) return true;
  // Generic male names
  if (/\b(Daniel|David|John|Mark|Peter|Sam|William|Robert|James|Michael|Joseph|Thomas|Charles|Christopher|Richard|Matthew|Anthony|Mark|Donald|Andrew|Joshua|Kenneth|George|Edward|Brian|Ronald|Kevin|Jason|Mathew|Gary|Nicholas|Eric|Jonathan|Stephen|Larry|Justin|Scott|Brandon|Benjamin|Samuel|Patrick|Alexander|Raymond|Jack|Dennis|Jerry|Tyler|Aaron|Jose|Adam|Henry|Douglas|Peter|Zachary|Kyle|Walter|Harold|Keith|Christian|Roger|Noah|Gerald|Carl|Arthur|Ryan|Roger|Juan|Elijah|Wayne|Billy|Vincent|Ralph|Roy|Russell|Louis|Philip|Johnny|Ernest|Martin|Randall|Vincent|Ralph|Eugene|Claude|Edwin|Bernie|Ellis|Marvin|Olin|Leigh)\b/i.test(name)) return true;
  // Google male voices
  if (/Google (US|UK) English/i.test(name)) return true;
  // Chrome built-in
  if (/Chrome.*Male/i.test(name)) return true;
  return false;
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
    // Some browsers (Safari) never fire voiceschanged but populate later.
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
  /** Lower = better. 0 = top quality match, larger = fallback. */
  rank: number;
  /** True if voice is network-backed (typically higher quality than local). */
  network: boolean;
}

export function pickBestVoice(
  preferredLang = "en-US"
): PickedVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const englishVoices = voices.filter((v) => /^en[-_]/i.test(v.lang) || v.lang === "en");
  if (!englishVoices.length) return null;

  // Check stored voice: validate it exists AND is male
  const storedName = getStoredVoiceName();
  if (storedName) {
    const storedVoice = englishVoices.find((voice) => voice.name === storedName);
    
    // If stored voice no longer exists or is feminine, clear it
    if (!storedVoice) {
      clearStoredVoiceName();
    } else if (isManlyVoiceName(storedVoice.name)) {
      // Stored voice is valid and male - use it
      return { voice: storedVoice, rank: -1, network: !storedVoice.localService };
    } else {
      // Stored voice exists but is feminine - clear it
      clearStoredVoiceName();
    }
  }

  // Find best matching male voice from QUALITY_PATTERNS
  for (let i = 0; i < QUALITY_PATTERNS.length; i++) {
    const pattern = QUALITY_PATTERNS[i];
    
    // Prioritize exact language match
    const exactLang = englishVoices.find(
      (v) => pattern.test(v.name) && v.lang.toLowerCase() === preferredLang.toLowerCase()
    );
    if (exactLang && isManlyVoiceName(exactLang.name)) {
      storeVoiceName(exactLang.name);
      return { voice: exactLang, rank: i, network: !exactLang.localService };
    }
    
    // Fallback to any English voice matching pattern
    const anyLang = englishVoices.find((v) => pattern.test(v.name) && isManlyVoiceName(v.name));
    if (anyLang) {
      storeVoiceName(anyLang.name);
      return { voice: anyLang, rank: i, network: !anyLang.localService };
    }
  }

  // Fallback: any network-backed English voice (usually higher quality)
  const networkVoice = englishVoices.find(
    (v) => v.localService === false && v.lang.toLowerCase() === preferredLang.toLowerCase()
  );
  if (networkVoice && isManlyVoiceName(networkVoice.name)) {
    storeVoiceName(networkVoice.name);
    return { voice: networkVoice, rank: QUALITY_PATTERNS.length, network: true };
  }

  // Last resort: pick any English voice that's male
  const maleVoice = englishVoices.find((v) => isManlyVoiceName(v.name));
  if (maleVoice) {
    storeVoiceName(maleVoice.name);
    return { voice: maleVoice, rank: QUALITY_PATTERNS.length + 1, network: !maleVoice.localService };
  }

  // If no male voice found, use first available English voice
  const firstVoice = englishVoices.find((voice) => voice.lang.toLowerCase() === preferredLang.toLowerCase()) || englishVoices[0];
  if (firstVoice) {
    storeVoiceName(firstVoice.name);
    return { voice: firstVoice, rank: QUALITY_PATTERNS.length + 2, network: !firstVoice.localService };
  }

  // Nothing available — signal caller to use cloud fallback.
  return null;
}

/** Force-load the voices list. Some browsers populate lazily. */
export function warmVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.getVoices();
  } catch {}
}
