import { NextRequest, NextResponse } from "next/server";
import type { ResumeData } from "@/components/profile/resume/types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_ATS_MODEL || "gpt-4o-mini";

function useOpenAI(): boolean {
  return Boolean(OPENAI_API_KEY?.trim());
}

function collectUrls(data: ResumeData): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  const b = data.basicInfo;
  const add = (label: string, value: string | undefined, baseUrl: string) => {
    if (!value?.trim()) return;
    const v = value.trim();
    if (/^https?:\/\//i.test(v)) {
      out.push({ label, url: v });
    } else if (v.length > 0 && v.length < 120) {
      out.push({ label, url: baseUrl + encodeURIComponent(v) });
    }
  };
  add("Portfolio", b?.portfolio, "https://");
  add("GitHub", b?.github, "https://github.com/");
  add("LinkedIn", b?.linkedin, "https://linkedin.com/in/");
  add("LeetCode", b?.leetcode, "https://leetcode.com/");
  add("HackerRank", b?.hackerrank, "https://www.hackerrank.com/");
  add("Kaggle", b?.kaggle, "https://www.kaggle.com/");
  add("Medium", b?.medium, "https://medium.com/@");
  (data.projects || []).forEach((p, i) => {
    if (p.link?.trim() && /^https?:\/\//i.test(p.link.trim())) {
      out.push({ label: `Project: ${p.name || i + 1}`, url: p.link.trim() });
    }
  });
  (data.certifications || []).forEach((c, i) => {
    if (c.link?.trim() && /^https?:\/\//i.test(c.link.trim())) {
      out.push({ label: `Cert: ${c.name || i + 1}`, url: c.link.trim() });
    }
  });
  return out;
}

async function checkUrl(url: string): Promise<{ url: string; ok: boolean; status?: number; errorPage?: boolean }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 4000);
  const opts = {
    redirect: "follow" as RequestRedirect,
    signal: controller.signal,
    headers: { "User-Agent": "ATS-Resume-Checker/1.0" },
  };
  try {
    let res = await fetch(url, { ...opts, method: "HEAD" }).catch(() => null);
    if (!res) res = await fetch(url, { ...opts, method: "GET" }).catch(() => null);
    clearTimeout(t);
    if (!res) return { url, ok: false };
    const status = res.status;
    const ok = res.ok && status !== 404 && status !== 410 && status < 500;
    let errorPage = false;
    if (ok && status === 200 && res.headers.get("content-type")?.includes("text/html")) {
      const text = await res.text().catch(() => "").then((s) => s.slice(0, 2000).toLowerCase());
      if (/\b(404|page not found|this page (doesn't|does not) exist|not found|error 404|invalid link)\b/.test(text)) {
        errorPage = true;
      }
    }
    return { url: res.url || url, ok: ok && !errorPage, status, errorPage: errorPage ? true : undefined };
  } catch {
    clearTimeout(t);
    return { url, ok: false };
  }
}

function buildResumeSummary(data: ResumeData): string {
  const b = data.basicInfo;
  const lines: string[] = [
    `Professional title: ${b?.professionalTitle ?? "Not specified"}`,
    `Summary: ${b?.summary ?? "None"}`,
    `Location: ${b?.location ?? "Not specified"}`,
  ];
  if (data.workExperience?.length) {
    lines.push("\nWork experience:");
    data.workExperience.forEach((w) => {
      lines.push(`- ${w.position} at ${w.company} (${w.location || "N/A"})`);
      (w.description || []).forEach((d) => lines.push(`  • ${d}`));
    });
  }
  if (data.education?.length) {
    lines.push("\nEducation:");
    data.education.forEach((e) => {
      lines.push(`- ${e.degree} at ${e.institution}`);
      if (e.description) lines.push(`  ${e.description}`);
    });
  }
  if (data.skills?.length) {
    lines.push("\nSkills: " + data.skills.map((s) => s.name).join(", "));
  }
  if (data.projects?.length) {
    lines.push("\nProjects:");
    data.projects.forEach((p) => {
      lines.push(`- ${p.name}: ${p.description}`);
      if (p.technologies?.length) lines.push(`  Technologies: ${p.technologies.join(", ")}`);
    });
  }
  if (data.certifications?.length) {
    lines.push("\nCertifications: " + data.certifications.map((c) => c.name).join("; "));
  }
  return lines.join("\n");
}

async function callAI(prompt: string, maxTokens: number): Promise<{ text: string; error?: string }> {
  if (!useOpenAI()) {
    return { text: "", error: "ATS AI not configured (set OPENAI_API_KEY)" };
  }
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || "OpenAI request failed";
    return { text: "", error: msg };
  }
  const text = data?.choices?.[0]?.message?.content;
  return { text: text ?? "", error: text ? undefined : "No response from OpenAI" };
}

export interface FeedbackCategory {
  score: number;
  message: string;
  positivePoints?: string[];
  improvementPoints?: string[];
}

export interface ATSAnalysisResponse {
  overallScore: number;
  atsScore: number;
  tips: string[];
  detailedReport: {
    goodThings: string[];
    scopeForImprovement: string[];
    suggestions: string[];
    executiveSummary?: string;
  };
  linkValidation?: { label: string; url: string; ok: boolean; status?: number; errorPage?: boolean }[];
  /** Industry-standard ATS-relevant checks only. Pseudo-metrics like tone/grammar
   *  removed — those are recruiter-feel, not what real ATS scanners check. */
  qualityChecks?: {
    keywordMatch?: { score: number; note?: string };
    sectionPresence?: { score: number; note?: string };
    contactCompleteness?: { score: number; note?: string };
    bulletQuality?: { score: number; note?: string };
    dateConsistency?: { score: number; note?: string };
    length?: { score: number; note?: string };
  };
  feedback: {
    content: FeedbackCategory;
    structure: FeedbackCategory;
    skills: FeedbackCategory;
  };
}

function repairTruncatedJson(str: string): string | null {
  let repaired = str.trim();
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;
  let quote = "";
  for (let i = 0; i < repaired.length; i++) {
    const c = repaired[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === quote) inString = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      continue;
    }
    if (c === "{") openBraces++;
    else if (c === "}") openBraces--;
    else if (c === "[") openBrackets++;
    else if (c === "]") openBrackets--;
  }
  if (inString) repaired += quote;
  while (openBrackets > 0) {
    repaired += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += "}";
    openBraces--;
  }
  return repaired;
}

function extractJsonFromResponse(text: string): ATSAnalysisResponse | null {
  let raw = text.trim();
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
  if (codeBlockMatch) raw = codeBlockMatch[1].trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  let parsed: Record<string, unknown>;
  let jsonStr = jsonMatch[0];
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    try {
      const repaired = jsonStr.replace(/,(\s*[}\]])/g, "$1");
      parsed = JSON.parse(repaired) as Record<string, unknown>;
    } catch {
      const repaired = repairTruncatedJson(jsonStr);
      if (repaired) {
        try {
          parsed = JSON.parse(repaired) as Record<string, unknown>;
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }
  }

  const overallScore = typeof parsed.overallScore === "number"
    ? parsed.overallScore
    : typeof parsed.overall_score === "number"
      ? parsed.overall_score
      : null;
  if (overallScore === null) return null;

  const atsScore = typeof parsed.atsScore === "number"
    ? parsed.atsScore
    : typeof parsed.ats_score === "number"
      ? parsed.ats_score
      : overallScore;

  const tips = Array.isArray(parsed.tips)
    ? (parsed.tips as string[]).filter((t) => typeof t === "string")
    : Array.isArray(parsed.improvements)
      ? (parsed.improvements as string[]).filter((t) => typeof t === "string")
      : [];

  const dr = parsed.detailedReport as Record<string, unknown> | undefined;
  const executiveSummary =
    typeof dr?.executiveSummary === "string" ? dr.executiveSummary
    : typeof parsed.executiveSummary === "string" ? parsed.executiveSummary
    : typeof parsed.briefInsight === "string" ? parsed.briefInsight
    : "";
  const detailedReport = {
    goodThings: Array.isArray(dr?.goodThings) ? (dr.goodThings as string[]) : Array.isArray(parsed.strengths) ? (parsed.strengths as string[]) : [],
    scopeForImprovement: Array.isArray(dr?.scopeForImprovement) ? (dr.scopeForImprovement as string[]) : [],
    suggestions: Array.isArray(dr?.suggestions) ? (dr.suggestions as string[]) : Array.isArray(parsed.improvements) ? (parsed.improvements as string[]) : tips,
    executiveSummary,
  };

  const ensureCategory = (feedback: Record<string, unknown>, key: string): FeedbackCategory => {
    const c = feedback[key] as Record<string, unknown> | undefined;
    const score = typeof c?.score === "number" ? c.score : 70;
    return {
      score,
      message: typeof c?.message === "string" ? c.message : "",
      positivePoints: Array.isArray(c?.positivePoints) ? (c.positivePoints as string[]) : [],
      improvementPoints: Array.isArray(c?.improvementPoints) ? (c.improvementPoints as string[]) : [],
    };
  };

  const feedback = (parsed.feedback as Record<string, unknown>) || {};
  const defaultCategory = (key: string): FeedbackCategory => {
    const c = feedback[key];
    if (c && typeof c === "object") return ensureCategory(feedback, key);
    return { score: 70, message: "", positivePoints: [], improvementPoints: [] };
  };

  const qc = parsed.qualityChecks as Record<string, { score?: number; note?: string }> | undefined;
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
  const pickCheck = (
    item: { score?: number; note?: string } | undefined
  ): { score: number; note?: string } | undefined => {
    if (!item || typeof item.score !== "number") return undefined;
    return {
      score: clamp(item.score),
      note: typeof item.note === "string" ? item.note : undefined,
    };
  };
  const qualityChecks =
    qc && typeof qc === "object"
      ? {
          keywordMatch: pickCheck(qc.keywordMatch),
          sectionPresence: pickCheck(qc.sectionPresence),
          contactCompleteness: pickCheck(qc.contactCompleteness),
          bulletQuality: pickCheck(qc.bulletQuality),
          dateConsistency: pickCheck(qc.dateConsistency),
          length: pickCheck(qc.length),
        }
      : undefined;

  return {
    overallScore: Math.min(100, Math.max(0, Math.round(overallScore))),
    atsScore: Math.min(100, Math.max(0, Math.round(atsScore))),
    tips,
    detailedReport,
    qualityChecks,
    feedback: {
      content: defaultCategory("content"),
      structure: defaultCategory("structure"),
      skills: defaultCategory("skills"),
    },
  };
}

export async function POST(request: NextRequest) {
  if (!useOpenAI()) {
    return NextResponse.json(
      { error: "ATS AI analysis is not configured (set OPENAI_API_KEY)" },
      { status: 501 }
    );
  }

  let body: { resumeData: ResumeData; jobDescription?: string; light?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { resumeData, jobDescription, light } = body;
  if (!resumeData) {
    return NextResponse.json({ error: "Missing resumeData" }, { status: 400 });
  }

  const resumeSummary = buildResumeSummary(resumeData);
  const jobText = (jobDescription && typeof jobDescription === "string") ? jobDescription.trim() : "";

  if (light === true) {
    const lightPrompt = `Rate this resume for ATS. Return ONLY valid JSON: {"overallScore":NN,"atsScore":NN} where NN is 0-100. Weight: 80% technical (skills, experience, education, content depth, evidence) and 20% presentation (format, grammar, tone). If technical/evidence is poor, return at most 30 for both scores.

RESUME:
${resumeSummary}`;
    try {
      const { text, error } = await callAI(lightPrompt, 64);
      if (error) return NextResponse.json({ error }, { status: 502 });
      const raw = text.trim().replace(/```(?:json)?\s*([\s\S]*?)(?:```|$)/, "$1").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return NextResponse.json({ error: "Invalid format", raw: text.slice(0, 200) }, { status: 502 });
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const overallScore = typeof parsed.overallScore === "number" ? parsed.overallScore : typeof parsed.atsScore === "number" ? parsed.atsScore : 70;
      const atsScore = typeof parsed.atsScore === "number" ? parsed.atsScore : overallScore;
      return NextResponse.json({
        overallScore: Math.min(100, Math.max(0, Math.round(overallScore))),
        atsScore: Math.min(100, Math.max(0, Math.round(atsScore))),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Light scan failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const urlList = collectUrls(resumeData);
  const linkResults = await Promise.all(
    urlList.map(async ({ label, url }) => {
      const r = await checkUrl(url);
      return { label, url: r.url, ok: r.ok, status: r.status, errorPage: r.errorPage };
    })
  );
  const failedLinks = linkResults.filter((r) => !r.ok);
  const linkSummary =
    linkResults.length === 0
      ? "No links provided in the resume."
      : failedLinks.length === 0
        ? "All provided links were reachable and did not redirect to error pages."
        : `The following links failed (unreachable, redirect to error/failed page, or returned 404/5xx): ${failedLinks.map((r) => `${r.label}: ${r.url}${r.errorPage ? " (error page)" : ""}`).join("; ")}.`;

  const hasJob = jobText.length > 0;

  const atsWeightsPreamble = `You are a rigorous evaluator emulating real industry ATS scanners (Workday, Greenhouse, Lever, iCIMS, Taleo).

Score the resume on what those systems actually measure — NOT on subjective writing-feel. Apply this weighting:

1. TECHNICAL FIT (80% weight): keyword/skills match to role (or general technical depth if no JD), years/recency of relevant experience, education/certifications, content depth (specific tools, concrete outcomes, quantified bullets). If skills are thin, experience shallow, or bullets unspecific, the maximum score is 30.

2. PARSEABILITY (20% weight): the resume can be parsed by an ATS — standard section headings present (Experience/Education/Skills/Contact), contact info complete (name + email + phone + location), dates parseable, length appropriate (1-2 pages). This is binary-ish: either the ATS can extract structured data or it can't.

Do NOT score: tone, voice, grammar style, language fluency, "spacing/alignment", or "authenticity" — these are recruiter-feel categories that real ATS scanners do not evaluate. Focus on what gets a candidate to the next stage.`;

  const sharedTail =
    "\n\nReturn ONLY a valid JSON object — no markdown, no code fences, no extra text.\n\n" +
    "Return JSON with these exact keys. Keep each string under 150 chars.\n" +
    "- overallScore, atsScore: numbers 0-100 (80% technical fit, 20% parseability; cap atsScore at 30 if technical fit is poor)\n" +
    "- executiveSummary: one paragraph\n" +
    "- detailedReport: { goodThings: [4 items], scopeForImprovement: [4 items], suggestions: [5 actionable items] }\n" +
    "- qualityChecks: { keywordMatch: { score, note }, sectionPresence: { score, note }, contactCompleteness: { score, note }, bulletQuality: { score, note }, dateConsistency: { score, note }, length: { score, note } }\n" +
    "  - keywordMatch: how well the resume's hard skills/tools align (vs JD if provided; vs general role-relevant terms otherwise)\n" +
    "  - sectionPresence: are standard ATS-parseable sections present (Experience, Education, Skills, Contact)\n" +
    "  - contactCompleteness: is contact info parseable (name, email, phone, location)\n" +
    "  - bulletQuality: % of bullets with strong action verbs + quantified outcomes\n" +
    "  - dateConsistency: are all dates present and chronologically consistent\n" +
    "  - length: is the resume an appropriate 1-2 pages worth of content (penalize too short OR padded)\n" +
    "- tips: [3 short actionable items]\n" +
    "- feedback: { content, structure, skills } — each has score 0-100, message, positivePoints[], improvementPoints[]\n" +
    "  - content: bullet quality, quantification, evidence\n" +
    "  - structure: section presence, date hygiene, length, ATS-parseability\n" +
    "  - skills: density, specificity, alignment to target role\n\n" +
    "Be strict on skills, experience, and bullet quality. Use LINK VALIDATION when judging contactCompleteness.";

  const promptWithJob =
    "You are an expert ATS analyst. Analyze this resume against the job description as a real ATS scanner would. " +
    atsWeightsPreamble +
    "\n\nRESUME:\n" +
    resumeSummary +
    "\n\nJOB DESCRIPTION:\n" +
    jobText +
    "\n\nLINK VALIDATION (server-checked; failed = unreachable, 404/5xx, or redirects to error page): " +
    linkSummary +
    sharedTail;

  const promptNoJob =
    "You are an expert ATS analyst. Analyze this resume WITHOUT a specific job description (use general role-relevant terms inferred from the candidate's title/experience). " +
    atsWeightsPreamble +
    "\n\nRESUME:\n" +
    resumeSummary +
    "\n\nLINK VALIDATION (server-checked; failed = unreachable, 404/5xx, or redirects to error page): " +
    linkSummary +
    sharedTail;

  const prompt = hasJob ? promptWithJob : promptNoJob;

  try {
    const { text, error } = await callAI(prompt, 8192);
    if (error) return NextResponse.json({ error }, { status: 502 });
    if (!text) return NextResponse.json({ error: "No analysis in response" }, { status: 502 });

    const parsed = extractJsonFromResponse(text);
    if (!parsed) {
      return NextResponse.json(
        { error: "AI returned invalid format", raw: text.slice(0, 800) },
        { status: 502 }
      );
    }

    // Cap score when technical fit is poor (skills/content weak OR keyword match very low).
    const keywordScore = parsed.qualityChecks?.keywordMatch?.score ?? 100;
    const skillsScore = parsed.feedback?.skills?.score ?? 100;
    const contentScore = parsed.feedback?.content?.score ?? 100;
    const technicalLow = keywordScore < 40 || skillsScore < 50 || contentScore < 50;
    if (technicalLow && parsed.atsScore > 30) {
      parsed.overallScore = Math.min(parsed.overallScore, 30);
      parsed.atsScore = Math.min(parsed.atsScore, 30);
    }

    return NextResponse.json({
      ...parsed,
      linkValidation: linkResults.length > 0 ? linkResults : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ATS analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
