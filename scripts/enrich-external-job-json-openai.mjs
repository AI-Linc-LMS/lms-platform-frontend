/**
 * Offline: reads the committed static job feed (`public/jobs/external-jobs-feed.json`), calls OpenAI per job
 * (batched with delay), writes `public/jobs/external-jobs-feed.enriched.json` with ai_summary + ai_highlights.
 * Paths match `lib/jobs/external-job-json-feed.ts` (ENRICHED_PATH / BASE_PATH).
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/enrich-external-job-json-openai.mjs
 *
 * Optional: START_INDEX=0 BATCH=50 (defaults: 0 and all records)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "public", "jobs", "external-jobs-feed.json");
const out = path.join(root, "public", "jobs", "external-jobs-feed.enriched.json");

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Set OPENAI_API_KEY");
  process.exit(1);
}

const START = Number(process.env.START_INDEX ?? 0) || 0;
const BATCH = process.env.BATCH ? Number(process.env.BATCH) : Infinity;

function clamp(s, max) {
  const t = String(s ?? "").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

async function enrichOne(record) {
  const title = String(record.job_title ?? "").trim();
  const company = String(record.company_name ?? "").trim();
  const description = clamp(record.job_description ?? "", 8000);
  if (!title || !description) {
    return { ...record, ai_summary: "", ai_highlights: [] };
  }

  const system = `You help job seekers. Given a job posting snippet, respond with ONLY valid JSON (no markdown) in this exact shape:
{"summary":"2-4 clear sentences for a candidate","highlights":["4-6 short bullet strings"]}
Rules: Use only information implied by the text. Do not invent salary, benefits, or location.`;

  const user = `Title: ${title}\nCompany: ${company || "Unknown"}\n\nDescription:\n${description}`;

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
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t.slice(0, 200)}`);
  }

  const completion = await res.json();
  const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
  const parsed = JSON.parse(raw);
  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  const highlights = Array.isArray(parsed.highlights)
    ? parsed.highlights.map((h) => String(h).trim()).filter(Boolean).slice(0, 8)
    : [];

  return {
    ...record,
    ai_summary: summary,
    ai_highlights: highlights,
  };
}

const records = JSON.parse(fs.readFileSync(src, "utf8"));
if (!Array.isArray(records)) {
  console.error("Expected array in", src);
  process.exit(1);
}

const end = Math.min(records.length, START + (Number.isFinite(BATCH) ? BATCH : records.length));
const result = records.map((r) => ({ ...r }));

for (let i = START; i < end; i++) {
  process.stdout.write(`\rEnriching ${i + 1}/${end}…`);
  try {
    result[i] = await enrichOne(records[i]);
  } catch (e) {
    console.error(`\nFailed at index ${i}:`, e.message);
    result[i] = { ...records[i], ai_summary: "", ai_highlights: [] };
  }
  await new Promise((r) => setTimeout(r, 150));
}

fs.writeFileSync(out, JSON.stringify(result, null, 2), "utf8");
console.log(`\nWrote ${out} (processed indices ${START}..${end - 1}, total ${result.length} rows in file)`);
