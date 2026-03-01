import { config } from "../config";

/**
 * Server-side speech-to-text (e.g. Canary Qwen 2.5B via NVIDIA NeMo).
 * When NEXT_PUBLIC_STT_API_URL is set, we POST audio to that endpoint.
 * Otherwise we POST to same-origin /api/speech-to-text (Next.js proxy).
 * Backend must accept POST multipart "audio" (webm/wav) and return JSON { text: string }.
 */

export interface TranscribeResult {
  text: string;
  processing_time_seconds?: number;
  audio_duration_seconds?: number;
}

export async function transcribeAudioBlob(
  blob: Blob
): Promise<TranscribeResult> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = config.sttApiUrl ? config.sttApiUrl : `${base}/api/speech-to-text`;
  const formData = new FormData();
  formData.append(
    "audio",
    blob,
    blob.type === "audio/webm" ? "audio.webm" : "audio.wav"
  );

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 501) {
      throw new Error("STT_NOT_CONFIGURED");
    }
    const err = await res.text();
    throw new Error(err || `STT failed: ${res.status}`);
  }

  const data = await res.json();
  const text =
    typeof data?.text === "string"
      ? data.text
      : typeof data?.transcript === "string"
      ? data.transcript
      : "";
  return {
    text: text.trim(),
    processing_time_seconds: data?.processing_time_seconds,
    audio_duration_seconds: data?.audio_duration_seconds,
  };
}

export function isServerSttEnabled(): boolean {
  return Boolean(config.sttApiUrl);
}
