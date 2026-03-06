import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for server-side speech-to-text (e.g. Canary Qwen 2.5B).
 * Set STT_API_URL to your STT endpoint (e.g. NVIDIA NIM or NeMo Canary).
 * Expects: POST multipart "audio" → forwards to STT_API_URL → returns { text }.
 */
const STT_API_URL = process.env.STT_API_URL;

export async function POST(request: NextRequest) {
  if (!STT_API_URL) {
    return NextResponse.json(
      { error: "Speech-to-text not configured" },
      { status: 501 }
    );
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 }
      );
    }

    const proxyForm = new FormData();
    proxyForm.append("audio", audio, audio.name || "audio.webm");

    const res = await fetch(STT_API_URL, {
      method: "POST",
      body: proxyForm,
      headers: request.headers.get("Authorization")
        ? { Authorization: request.headers.get("Authorization")! }
        : {},
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        data?.error || data?.message || "STT request failed",
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "STT proxy error" },
      { status: 500 }
    );
  }
}
