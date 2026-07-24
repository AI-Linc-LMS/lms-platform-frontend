import { NextRequest, NextResponse } from "next/server";
import type { ResumeData } from "@/components/profile/resume/types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_RESUME_MODEL || process.env.OPENAI_ATS_MODEL || "gpt-4o-mini";

type Section = "summary" | "skills" | "experience" | "projects";

interface TailorSectionRequest {
  section: Section;
  resumeData: ResumeData;
  jobDescription: string;
}

interface BulletChange {
  position: string;
  company: string;
  index: number;
  before: string;
  after: string;
}

interface SkillSuggestion {
  name: string;
  reason: string;
}

interface ProjectChange {
  name: string;
  beforeDescription: string;
  afterDescription: string;
}

interface TailorSectionResponse {
  section: Section;
  rationale: string;
  // summary
  summaryBefore?: string;
  summaryAfter?: string;
  // skills
  reorderedSkillNames?: string[];
  missingSkillSuggestions?: SkillSuggestion[];
  // experience
  bulletChanges?: BulletChange[];
  // projects
  projectChanges?: ProjectChange[];
  error?: string;
}

const SYSTEM_PROMPT = `You are a senior resume coach helping a candidate tailor ONE specific section of their resume for a target job.

Rules:
- NEVER invent facts (no fake metrics, fabricated companies, or skills the candidate doesn't have).
- If the user has no quantified outcome for a bullet, you may insert a placeholder like "[X%]" so they know where to add their number.
- Keep changes within ±25% length of the original.
- No first-person pronouns ("I", "my").
- Use past tense for completed work, present tense ONLY for explicitly current roles.
- Match output JSON shape EXACTLY for the section requested. Return ONLY JSON, no markdown.`;

function buildPromptForSection(section: Section, resumeData: ResumeData, jd: string): string {
  switch (section) {
    case "summary":
      return `Section: summary. Job description:\n"""${jd}"""\n\nCandidate's current summary:\n"""${resumeData.basicInfo.summary || ""}"""\n\nCandidate's professional title: ${resumeData.basicInfo.professionalTitle || "(not specified)"}\nCandidate's top skills: ${resumeData.skills.slice(0, 12).map((s) => s.name).join(", ")}\n\nRewrite the summary to lead with the candidate's most JD-relevant strengths. 2-3 sentences max, no pronouns.\n\nReturn JSON:\n{ "summaryBefore": "<original>", "summaryAfter": "<rewrite>", "rationale": "<1 sentence>" }`;

    case "skills": {
      const skillNames = resumeData.skills.map((s) => s.name);
      return `Section: skills. Job description:\n"""${jd}"""\n\nCandidate's current skills (preserve names exactly):\n${JSON.stringify(skillNames)}\n\nCandidate's experience summary:\n${resumeData.workExperience.slice(0, 3).map((e) => `- ${e.position} @ ${e.company}: ${e.description.slice(0, 2).join("; ")}`).join("\n")}\n\nProduce: (1) reordered list of EXISTING skill names with JD-relevant ones first. Do NOT invent skills. (2) Up to 5 skill suggestions that appear in the JD but are missing - only suggest ones reasonable for this candidate given their experience.\n\nReturn JSON:\n{ "reorderedSkillNames": ["..."], "missingSkillSuggestions": [{"name": "...", "reason": "..."}], "rationale": "<1 sentence>" }`;
    }

    case "experience": {
      const exp = resumeData.workExperience.slice(0, 2).map((e, i) => ({
        index: i,
        position: e.position,
        company: e.company,
        current: e.current,
        bullets: e.description,
      }));
      return `Section: experience. Job description:\n"""${jd}"""\n\nCandidate's 2 most recent roles (rewrite up to 5 bullets across these):\n${JSON.stringify(exp, null, 2)}\n\nRewrite the bullets that would be strongest with JD-aligned framing. Identify each rewrite by exact "position" + "company" + the zero-based "index" of the description array entry. NEVER invent metrics; use [X%] placeholders if needed.\n\nReturn JSON:\n{ "bulletChanges": [{"position": "...", "company": "...", "index": 0, "before": "...", "after": "..."}], "rationale": "<1 sentence>" }`;
    }

    case "projects": {
      const projs = resumeData.projects.slice(0, 4).map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
      }));
      return `Section: projects. Job description:\n"""${jd}"""\n\nCandidate's projects:\n${JSON.stringify(projs, null, 2)}\n\nRewrite each project description to emphasize aspects relevant to the JD. Don't invent technologies the project didn't use.\n\nReturn JSON:\n{ "projectChanges": [{"name": "<exact project name>", "beforeDescription": "...", "afterDescription": "..."}], "rationale": "<1 sentence>" }`;
    }
  }
}

function parseAIJson(text: string): Record<string, unknown> | null {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<TailorSectionResponse>> {
  if (!OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { section: "summary", rationale: "", error: "AI tailoring is not configured (set OPENAI_API_KEY)." },
      { status: 503 }
    );
  }

  let body: TailorSectionRequest;
  try {
    body = (await req.json()) as TailorSectionRequest;
  } catch {
    return NextResponse.json(
      { section: "summary", rationale: "", error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validSections: Section[] = ["summary", "skills", "experience", "projects"];
  if (!validSections.includes(body.section)) {
    return NextResponse.json(
      { section: "summary", rationale: "", error: "Invalid section" },
      { status: 400 }
    );
  }

  if (!body.resumeData?.basicInfo) {
    return NextResponse.json(
      { section: body.section, rationale: "", error: "resumeData is required" },
      { status: 400 }
    );
  }

  // Accept anything from a role title ("Senior Backend Engineer") to a full JD. The 15-char
  // minimum is just to prevent empty/garbage submissions.
  const jd = (body.jobDescription || "").trim();
  if (jd.length < 15) {
    return NextResponse.json(
      { section: body.section, rationale: "", error: "Enter at least a role title or short job description." },
      { status: 400 }
    );
  }
  if (jd.length > 12000) {
    return NextResponse.json(
      { section: body.section, rationale: "", error: "Job description too long (max 12000 chars)." },
      { status: 400 }
    );
  }

  // Quick fail-fast if the section has nothing to work with.
  if (body.section === "experience" && body.resumeData.workExperience.length === 0) {
    return NextResponse.json(
      { section: body.section, rationale: "", error: "Add at least one work experience entry first." },
      { status: 400 }
    );
  }
  if (body.section === "projects" && body.resumeData.projects.length === 0) {
    return NextResponse.json(
      { section: body.section, rationale: "", error: "Add at least one project first." },
      { status: 400 }
    );
  }
  if (body.section === "skills" && body.resumeData.skills.length === 0) {
    return NextResponse.json(
      { section: body.section, rationale: "", error: "Add some skills first." },
      { status: 400 }
    );
  }

  const userPrompt = buildPromptForSection(body.section, body.resumeData, jd);

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || "OpenAI request failed";
      return NextResponse.json(
        { section: body.section, rationale: "", error: msg },
        { status: 502 }
      );
    }

    const text = data?.choices?.[0]?.message?.content ?? "";
    const parsed = parseAIJson(text);
    if (!parsed) {
      return NextResponse.json(
        { section: body.section, rationale: "", error: "AI returned an unparseable response" },
        { status: 502 }
      );
    }

    const rationale = typeof parsed.rationale === "string" ? parsed.rationale.trim() : "";
    const response: TailorSectionResponse = { section: body.section, rationale };

    if (body.section === "summary") {
      response.summaryBefore = typeof parsed.summaryBefore === "string"
        ? parsed.summaryBefore
        : body.resumeData.basicInfo.summary;
      response.summaryAfter = typeof parsed.summaryAfter === "string" ? parsed.summaryAfter.trim() : "";
    } else if (body.section === "skills") {
      response.reorderedSkillNames = Array.isArray(parsed.reorderedSkillNames)
        ? (parsed.reorderedSkillNames as unknown[]).filter((x): x is string => typeof x === "string")
        : [];
      response.missingSkillSuggestions = Array.isArray(parsed.missingSkillSuggestions)
        ? (parsed.missingSkillSuggestions as unknown[])
            .filter((x): x is { name: string; reason?: string } => typeof x === "object" && x !== null && typeof (x as { name?: unknown }).name === "string")
            .slice(0, 5)
            .map((s) => ({ name: s.name, reason: (s.reason ?? "").trim() }))
        : [];
    } else if (body.section === "experience") {
      response.bulletChanges = Array.isArray(parsed.bulletChanges)
        ? (parsed.bulletChanges as unknown[])
            .filter(
              (x): x is BulletChange =>
                typeof x === "object" &&
                x !== null &&
                typeof (x as Record<string, unknown>).after === "string" &&
                typeof (x as Record<string, unknown>).index === "number"
            )
            .slice(0, 8)
        : [];
    } else if (body.section === "projects") {
      response.projectChanges = Array.isArray(parsed.projectChanges)
        ? (parsed.projectChanges as unknown[])
            .filter(
              (x): x is ProjectChange =>
                typeof x === "object" &&
                x !== null &&
                typeof (x as Record<string, unknown>).name === "string" &&
                typeof (x as Record<string, unknown>).afterDescription === "string"
            )
            .slice(0, 6)
        : [];
    }

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { section: body.section, rationale: "", error: message },
      { status: 500 }
    );
  }
}
