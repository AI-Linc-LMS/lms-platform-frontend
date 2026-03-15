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

  const ext = file.type.includes("wav")
    ? "wav"
    : file.type.includes("mp4") || file.type.includes("m4a")
      ? "m4a"
      : "webm";
  const body = new FormData();
  body.append("file", file, `chunk.${ext}`);
  body.append("model", WHISPER_MODEL);
  body.append("response_format", "json");
  if (lang) body.append("language", lang);

  const res = await fetch(WHISPER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json(
      { error: res.status === 401 ? "Invalid API key" : errText || res.statusText },
      { status: res.status === 401 ? 401 : 502 }
    );
  }

  const data = (await res.json()) as { text?: string };
  const text = typeof data?.text === "string" ? data.text.trim() : "";
  return NextResponse.json({ text });
}
