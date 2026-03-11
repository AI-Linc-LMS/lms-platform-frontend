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
    authenticityScore?: number;
    authenticityConcerns?: string[];
    resumeGoodFor?: string[];
  };
  linkValidation?: { label: string; url: string; ok: boolean; status?: number; errorPage?: boolean }[];
  qualityChecks?: {
    spacingAlignment?: { score: number; note?: string };
    tone?: { score: number; note?: string };
    languageFluency?: { score: number; note?: string };
    grammar?: { score: number; note?: string };
    consistency?: { score: number; note?: string };
    evidenceAuthentication?: { score: number; note?: string };
  };
  feedback: {
    toneAndStyle: FeedbackCategory;
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
  const authenticityScore = typeof dr?.authenticityScore === "number" ? dr.authenticityScore : undefined;
  const authenticityConcerns = Array.isArray(dr?.authenticityConcerns) ? (dr.authenticityConcerns as string[]) : [];
  const resumeGoodFor = Array.isArray(dr?.resumeGoodFor) ? (dr.resumeGoodFor as string[]) : undefined;
  const detailedReport = {
    goodThings: Array.isArray(dr?.goodThings) ? (dr.goodThings as string[]) : Array.isArray(parsed.strengths) ? (parsed.strengths as string[]) : [],
    scopeForImprovement: Array.isArray(dr?.scopeForImprovement) ? (dr.scopeForImprovement as string[]) : [],
    suggestions: Array.isArray(dr?.suggestions) ? (dr.suggestions as string[]) : Array.isArray(parsed.improvements) ? (parsed.improvements as string[]) : tips,
    executiveSummary,
    authenticityScore,
    authenticityConcerns,
    resumeGoodFor,
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
  const qualityChecks =
    qc && typeof qc === "object"
      ? {
          spacingAlignment: qc.spacingAlignment && typeof qc.spacingAlignment.score === "number" ? { score: clamp(qc.spacingAlignment.score), note: typeof qc.spacingAlignment.note === "string" ? qc.spacingAlignment.note : undefined } : undefined,
          tone: qc.tone && typeof qc.tone.score === "number" ? { score: clamp(qc.tone.score), note: typeof qc.tone.note === "string" ? qc.tone.note : undefined } : undefined,
          languageFluency: qc.languageFluency && typeof qc.languageFluency.score === "number" ? { score: clamp(qc.languageFluency.score), note: typeof qc.languageFluency.note === "string" ? qc.languageFluency.note : undefined } : undefined,
          grammar: qc.grammar && typeof qc.grammar.score === "number" ? { score: clamp(qc.grammar.score), note: typeof qc.grammar.note === "string" ? qc.grammar.note : undefined } : undefined,
          consistency: qc.consistency && typeof qc.consistency.score === "number" ? { score: clamp(qc.consistency.score), note: typeof qc.consistency.note === "string" ? qc.consistency.note : undefined } : undefined,
          evidenceAuthentication: qc.evidenceAuthentication && typeof qc.evidenceAuthentication.score === "number" ? { score: clamp(qc.evidenceAuthentication.score), note: typeof qc.evidenceAuthentication.note === "string" ? qc.evidenceAuthentication.note : undefined } : undefined,
        }
      : undefined;

  return {
    overallScore: Math.min(100, Math.max(0, Math.round(overallScore))),
    atsScore: Math.min(100, Math.max(0, Math.round(atsScore))),
    tips,
    detailedReport,
    qualityChecks,
    feedback: {
      toneAndStyle: defaultCategory("toneAndStyle"),
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

  const atsWeightsPreamble = `You are a rigorous technical evaluator. Apply this weighting logic strictly:

1. TECHNICAL CONTENT & EVIDENCE (80% weight): Depth and accuracy of technical proficiency; evidence of skill (specific examples, data, quantifiable results); correctness of claims. Include: keyword/skills match to role, experience level and recency, education and certifications, content depth (bullet quality, metrics), and evidence/authenticity (real names, working links—use LINK VALIDATION). If technical evidence is poor or shallow (e.g. weak skills, thin experience, placeholder data, broken links), the maximum total score the user can receive is 30, regardless of how well-written the document is.

2. PRESENTATION & PROFESSIONALISM (20% weight): Consolidate ALL non-technical criteria into this single dimension—formatting, grammar, spacing, alignment, tone, syntax. This is polish only. It must NOT carry a failing technical performance to a passing grade.

Your goal: Ensure the final score reflects lag in technical aspects. Be critical. If skills or evidence are missing or poor, the score must stay low (at most 30 when technical is poor).`;

  const promptWithJob =
    "You are an expert ATS and HR analyst. Analyze this resume against the job description. " +
    atsWeightsPreamble +
    "\n\nEvaluate: (1) Keyword match—hard skills, tools, job title alignment, context. (2) Experience—years, recency. (3) Education and certifications. (4) Content depth—quantifiable bullets, evidence. (5) Authenticity and link validation (use LINK VALIDATION below). Then one combined presentation score (formatting, grammar, spacing, tone). Return ONLY a valid JSON object—no markdown, no code fences, no extra text.\n\nRESUME:\n" +
    resumeSummary +
    "\n\nJOB DESCRIPTION:\n" +
    jobText +
    "\n\nLINK VALIDATION (server-checked; failed = unreachable, 404/5xx, or redirects to error page): " +
    linkSummary +
    "\n\nReturn JSON with these exact keys. Keep each string under 150 chars.\n- overallScore, atsScore: numbers 0-100 (80% technical, 20% presentation; if technical is poor, atsScore at most 30)\n- executiveSummary: one paragraph\n- detailedReport: { goodThings: [4 items], scopeForImprovement: [4 items], suggestions: [5 items], authenticityScore: number 0-100 (use LINK VALIDATION), authenticityConcerns: [specific concerns if any] }\n- qualityChecks: { spacingAlignment: { score, note }, tone: { score, note }, languageFluency: { score, note }, grammar: { score, note }, consistency: { score, note }, evidenceAuthentication: { score, note } }\n- tips: [3 items]\n- feedback: { toneAndStyle, content, structure, skills } — each has score, message, positivePoints[], improvementPoints[]\n\nGuidelines: Apply the 30 cap when technical/evidence is poor. Use LINK VALIDATION. Be strict on skills and experience.";

  const promptNoJob =
    "You are an expert ATS and HR analyst. Analyze this resume WITHOUT a specific job description. " +
    atsWeightsPreamble +
    "\n\nEvaluate: (1) Keyword density and hard skills. (2) Experience level and recency. (3) Education and certifications. (4) Content depth and evidence. (5) Authenticity and link validation (use LINK VALIDATION below). Then one combined presentation score. Infer what roles/levels this resume fits. Return ONLY a valid JSON object—no markdown, no code fences, no extra text.\n\nRESUME:\n" +
    resumeSummary +
    "\n\nLINK VALIDATION (server-checked; failed = unreachable, 404/5xx, or redirects to error page): " +
    linkSummary +
    "\n\nReturn JSON with these exact keys. Keep each string under 150 chars.\n- overallScore, atsScore: numbers 0-100 (80% technical, 20% presentation; if technical is poor, atsScore at most 30)\n- executiveSummary: one paragraph; include what roles/levels this resume fits best\n- detailedReport: { goodThings: [4 items], scopeForImprovement: [4 items], suggestions: [5 items], resumeGoodFor: [3-5 short strings], authenticityScore: number 0-100, authenticityConcerns: [specific concerns if any] }\n- qualityChecks: { spacingAlignment: { score, note }, tone: { score, note }, languageFluency: { score, note }, grammar: { score, note }, consistency: { score, note }, evidenceAuthentication: { score, note } }\n- tips: [3 items]\n- feedback: { toneAndStyle, content, structure, skills } — each has score, message, positivePoints[], improvementPoints[]\n\nGuidelines: Apply the 30 cap when technical/evidence is poor. Use LINK VALIDATION. Be strict.";

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

    const evidenceScore = parsed.qualityChecks?.evidenceAuthentication?.score ?? 100;
    const skillsScore = parsed.feedback?.skills?.score ?? 100;
    const contentScore = parsed.feedback?.content?.score ?? 100;
    const technicalLow = evidenceScore < 50 || skillsScore < 50 || contentScore < 50;
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
