/**
 * Shared persistence for "which speech-to-text engine actually works in THIS browser",
 * decided during the device-check mic test and honored verbatim inside the interview.
 *
 * Why: the device-check page and the interview page each set up STT independently and could
 * resolve to different engines — so a mic test could pass (e.g. Edge falling back to Whisper)
 * while the interview picked the broken native path and failed. By recording the winning
 * engine on the test page and forcing it in the interview, the interview always uses exactly
 * what passed.
 */
export const STT_ENGINE_STORAGE_KEY = "mockInterviewSttEngine";

export type ForcedSttEngine = "browser" | "whisper";

/** Record (from the device-check page) which engine successfully transcribed the test. */
export function persistSttEngine(engine: ForcedSttEngine): void {
  try {
    sessionStorage.setItem(STT_ENGINE_STORAGE_KEY, engine);
  } catch {
    // sessionStorage unavailable (private mode etc.) — interview just auto-decides.
  }
}

/** Read the decided engine (from the interview page). Undefined → auto-decide as before. */
export function readSttEngine(): ForcedSttEngine | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const v = sessionStorage.getItem(STT_ENGINE_STORAGE_KEY);
    return v === "browser" || v === "whisper" ? v : undefined;
  } catch {
    return undefined;
  }
}
