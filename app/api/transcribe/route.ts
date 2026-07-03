import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = process.env.OPENAI_WHISPER_MODEL || "whisper-1";

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Speech-to-text not configured (set OPENAI_API_KEY)" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing or invalid audio file" },
      { status: 400 }
    );
  }

  const langRaw = formData.get("language");
  const lang = typeof langRaw === "string" ? langRaw : undefined;

  // OpenAI infers the decoder from the filename extension — it must track the REAL container
  // (Firefox records ogg/opus; Safari/iOS record mp4/AAC; a mislabel gets a 400).
  const ext = file.type.includes("wav")
    ? "wav"
    : file.type.includes("mp4") || file.type.includes("m4a")
      ? "m4a"
      : file.type.includes("ogg")
        ? "ogg"
        : "webm";
  const body = new FormData();
  body.append("file", file, `chunk.${ext}`);
  body.append("model", WHISPER_MODEL);
  body.append("response_format", "json");
  if (lang) body.append("language", lang);

  let res: Response;
  try {
    res = await fetch(WHISPER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body,
    });
  } catch (err) {
    // Network failure reaching OpenAI — transient. Return 502 so the client
    // counts this as a tolerable failure (it has retry-with-backoff logic).
    console.error("[/api/transcribe] upstream fetch failed:", err);
    return NextResponse.json(
      { error: "Upstream transcription service unreachable" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // Log so server logs show the actual OpenAI error (rate limit, bad audio, etc.)
    console.warn(
      `[/api/transcribe] OpenAI returned ${res.status}: ${errText.slice(0, 500)}`
    );

    // 401 / 403 → fatal config error (bad key, no access).
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { error: res.status === 401 ? "Invalid API key" : "Forbidden" },
        { status: res.status }
      );
    }
    // 400 → bad audio chunk (silence, bad codec). Surface as 400 so the
    // client's transient-failure counter ticks up but isn't fatal alone.
    if (res.status === 400) {
      return NextResponse.json(
        { error: errText || "Bad audio chunk" },
        { status: 400 }
      );
    }
    // 429 rate limit → preserve so client backs off; otherwise normalize to 502.
    const status = res.status === 429 ? 429 : 502;
    return NextResponse.json(
      { error: errText || res.statusText || "Upstream error" },
      { status }
    );
  }

  const data = (await res.json()) as { text?: string };
  const text = typeof data?.text === "string" ? data.text.trim() : "";
  return NextResponse.json({ text });
}
