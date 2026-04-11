import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  job_title?: string;
  company_name?: string;
  job_description?: string;
  apply_link?: string;
};

function clampText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 501 }
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = (body.job_title ?? "").trim();
  const company = (body.company_name ?? "").trim();
  const description = clampText(body.job_description ?? "", 8000);

  if (!title || !description) {
    return NextResponse.json(
      { error: "job_title and job_description are required" },
      { status: 400 }
    );
  }

  const system = `You help job seekers. Given a job posting snippet, respond with ONLY valid JSON (no markdown) in this exact shape:
{"summary":"2-4 clear sentences for a candidate","highlights":["4-6 short bullet strings"]}
Rules: Use only information implied by the text. Do not invent salary, benefits, or location. If the input is noisy, still produce helpful generic bullets about the role type.`;

  const user = `Title: ${title}\nCompany: ${company || "Unknown"}\nApply URL (context only): ${body.apply_link ?? ""}\n\nDescription:\n${description}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json(
      { error: "OpenAI request failed", detail: errText.slice(0, 500) },
      { status: 502 }
    );
  }

  const completion = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = completion.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    return NextResponse.json({ error: "Empty model response" }, { status: 502 });
  }

  let parsed: { summary?: string; highlights?: string[] };
  try {
    parsed = JSON.parse(raw) as { summary?: string; highlights?: string[] };
  } catch {
    return NextResponse.json({ error: "Model returned non-JSON" }, { status: 502 });
  }

  const summary =
    typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  const highlights = Array.isArray(parsed.highlights)
    ? parsed.highlights.map((h) => String(h).trim()).filter(Boolean).slice(0, 8)
    : [];

  return NextResponse.json({
    summary: summary || undefined,
    highlights: highlights.length > 0 ? highlights : undefined,
  });
}
