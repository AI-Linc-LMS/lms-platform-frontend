import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "tts-1";
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || "alloy";
const ALLOWED_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "onyx",
  "nova",
  "sage",
  "shimmer",
  "verse",
]);
const MAX_TEXT_LENGTH = 4000;
const CACHE_MAX_ENTRIES = 200;
const UPSTREAM_TIMEOUT_MS = 12000;
const UPSTREAM_RETRY_DELAYS_MS = [0, 300];

interface CacheEntry {
  buffer: Buffer;
  insertedAt: number;
}

// Simple in-memory FIFO cache. Keyed by sha256(model + voice + text).
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): Buffer | null {
  const hit = cache.get(key);
  return hit ? hit.buffer : null;
}

function cacheSet(key: string, buffer: Buffer) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { buffer, insertedAt: Date.now() });
}

function makeCacheKey(model: string, voice: string, text: string): string {
  return createHash("sha256").update(`${model}|${voice}|${text}`).digest("hex");
}

async function fetchOpenAiTts(model: string, voice: string, text: string): Promise<Response> {
  let lastErr: Error | null = null;

  for (let i = 0; i < UPSTREAM_RETRY_DELAYS_MS.length; i++) {
    const delay = UPSTREAM_RETRY_DELAYS_MS[i];
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      const upstream = await fetch(OPENAI_TTS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          voice,
          input: text,
          response_format: "mp3",
        }),
        signal: controller.signal,
      });

      if (upstream.ok) return upstream;

      // Don't retry auth/config errors.
      if (upstream.status === 400 || upstream.status === 401 || upstream.status === 403) {
        return upstream;
      }

      // Retry transient upstream errors (429/5xx) on the next loop.
      if (upstream.status !== 429 && upstream.status < 500) {
        return upstream;
      }
    } catch (err) {
      lastErr = err as Error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastErr || new Error("OpenAI TTS request failed");
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "tts-unavailable", detail: "Cloud TTS not configured (set OPENAI_API_KEY)" },
      { status: 503 }
    );
  }

  let payload: { text?: unknown; voice?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text exceeds ${MAX_TEXT_LENGTH} char limit` },
      { status: 413 }
    );
  }

  const requestedVoice = typeof payload.voice === "string" ? payload.voice : "";
  const voice = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : OPENAI_TTS_VOICE;

  const cacheKey = makeCacheKey(OPENAI_TTS_MODEL, voice, text);
  const cached = cacheGet(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "X-TTS-Cache": "hit",
      },
    });
  }

  let upstream: Response;
  try {
    upstream = await fetchOpenAiTts(OPENAI_TTS_MODEL, voice, text);
  } catch (err) {
    return NextResponse.json(
      { error: "tts-upstream-failed", detail: (err as Error).message },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const errText = await upstream.text();
    return NextResponse.json(
      {
        error: upstream.status === 401 ? "Invalid API key" : "tts-upstream-error",
        detail: errText || upstream.statusText,
      },
      { status: upstream.status === 401 ? 401 : 502 }
    );
  }

  const arrayBuffer = await upstream.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  cacheSet(cacheKey, buffer);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
      "X-TTS-Cache": "miss",
    },
  });
}
