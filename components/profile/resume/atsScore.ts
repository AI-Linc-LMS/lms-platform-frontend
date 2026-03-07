/**
 * ATS (Applicant Tracking System) Score Calculator
 *
 * Based on industry research (TalentTuner, Resumly, Maywise, ResumeAdapter):
 * - Critical qualifications / keywords: ~40%
 * - Skills & content depth: ~30%
 * - Profile completeness & format: ~15%
 * - Structure & ATS-friendly formatting: ~15%
 *
 * We compute a 0–100 score from structured ResumeData plus optional job description
 * for keyword matching. No external API required; can be extended with ScoreMyResume
 * or Affinda later via a backend proxy.
 */

import type { ResumeData } from "./types";

/** Weights aligned with common ATS scoring (skills + keywords dominant) */
const WEIGHTS = {
  format: 0.15,
  completeness: 0.2,
  contentDepth: 0.25,
  keywordMatch: 0.4,
} as const;

export interface ATSBreakdown {
  format: number;
  completeness: number;
  contentDepth: number;
  keywordMatch: number;
}

export interface ATSScoreResult {
  overall: number;
  breakdown: ATSBreakdown;
  suggestions: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

/** Build a single searchable text blob from resume data (for keyword matching) */
function getResumeText(data: ResumeData): string {
  const parts: string[] = [];
  const b = data.basicInfo;
  parts.push(
    b.firstName,
    b.lastName,
    b.professionalTitle,
    b.summary,
    b.location
  );
  data.workExperience.forEach((w) => {
    parts.push(w.position, w.company, w.location);
    w.description.forEach((d) => parts.push(d));
  });
  data.education.forEach((e) => {
    parts.push(e.degree, e.institution, e.description);
  });
  data.skills.forEach((s) => parts.push(s.name));
  data.projects.forEach((p) => {
    parts.push(p.name, p.description, ...(p.technologies || []));
  });
  data.certifications.forEach((c) => parts.push(c.name, c.issuer));
  return parts.join(" ").toLowerCase();
}

/** Extract significant words from job description (skip stop words, normalize) */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "as", "is", "was", "are", "were", "been", "be", "have",
  "has", "had", "do", "does", "did", "will", "would", "could", "should", "may",
  "might", "must", "shall", "can", "need", "dare", "ought", "used", "we", "our",
  "you", "your", "they", "their", "this", "that", "these", "those", "it", "its",
]);

function extractKeywords(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
  return [...new Set(normalized)];
}

/** Format & structure: standard sections present, required fields exist */
function scoreFormat(data: ResumeData): number {
  let score = 0;
  const hasWork = data.workExperience?.length > 0;
  const hasEducation = data.education?.length > 0;
  const hasSkills = data.skills?.length > 0;
  if (hasWork) score += 35;
  if (hasEducation) score += 35;
  if (hasSkills) score += 30;
  return Math.min(100, score);
}

/** Completeness: contact info, summary, minimum content */
function scoreCompleteness(data: ResumeData): number {
  let score = 0;
  const b = data.basicInfo;
  if (b?.email?.trim()) score += 25;
  if (b?.phone?.trim()) score += 15;
  if (b?.summary?.trim() && b.summary.length >= 50) score += 25;
  if (data.workExperience?.length >= 1) score += 20;
  if (data.education?.length >= 1) score += 15;
  return Math.min(100, score);
}

/** Content depth: bullets, skills count, projects, certs, summary length */
function scoreContentDepth(data: ResumeData): number {
  let score = 0;
  const totalBullets = (data.workExperience || []).reduce(
    (acc, w) => acc + (w.description?.length || 0),
    0
  );
  if (totalBullets >= 6) score += 30;
  else if (totalBullets >= 4) score += 22;
  else if (totalBullets >= 2) score += 12;

  const skillCount = data.skills?.length ?? 0;
  if (skillCount >= 8) score += 25;
  else if (skillCount >= 5) score += 18;
  else if (skillCount >= 3) score += 10;

  const summaryLen = data.basicInfo?.summary?.length ?? 0;
  if (summaryLen >= 150 && summaryLen <= 400) score += 20;
  else if (summaryLen >= 80) score += 12;

  if ((data.projects?.length ?? 0) >= 1) score += 15;
  if ((data.certifications?.length ?? 0) >= 1) score += 10;
  return Math.min(100, score);
}

/** Keyword match when job description is provided */
function scoreKeywordMatch(
  resumeText: string,
  jobDescription: string
): { score: number; matched: string[]; missing: string[] } {
  const keywords = extractKeywords(jobDescription);
  if (keywords.length === 0) {
    return { score: 100, matched: [], missing: [] };
  }
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of keywords) {
    if (resumeText.includes(kw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }
  const score = Math.round((matched.length / keywords.length) * 100);
  return { score: Math.min(100, score), matched, missing };
}

/** Generate improvement suggestions from breakdown and missing keywords */
function getSuggestions(
  data: ResumeData,
  breakdown: ATSBreakdown,
  missingKeywords: string[]
): string[] {
  const suggestions: string[] = [];
  if (breakdown.format < 80) {
    if (!data.workExperience?.length) suggestions.push("Add at least one work experience.");
    if (!data.education?.length) suggestions.push("Add your education section.");
    if (!data.skills?.length) suggestions.push("Add a skills section with relevant skills.");
  }
  if (breakdown.completeness < 80) {
    if (!data.basicInfo?.email?.trim()) suggestions.push("Add your email address.");
    if (!data.basicInfo?.phone?.trim()) suggestions.push("Add your phone number.");
    if (!data.basicInfo?.summary?.trim() || (data.basicInfo.summary?.length ?? 0) < 50) {
      suggestions.push("Write a professional summary (50+ characters).");
    }
  }
  if (breakdown.contentDepth < 70) {
    const bullets = (data.workExperience || []).reduce((a, w) => a + (w.description?.length || 0), 0);
    if (bullets < 4) suggestions.push("Add more bullet points under each role (aim for 3–5 per job).");
    if ((data.skills?.length ?? 0) < 5) suggestions.push("List more relevant skills (5+ recommended).");
    if (!data.projects?.length) suggestions.push("Add at least one project to show hands-on experience.");
  }
  if (missingKeywords.length > 0) {
    const sample = missingKeywords.slice(0, 5).join(", ");
    suggestions.push(`Consider adding these job-related terms to your resume: ${sample}`);
  }
  return suggestions;
}

/**
 * Compute ATS score from resume data and optional job description.
 * When jobDescription is empty, keywordMatch is set to 100 and weight redistributed
 * so overall score still reflects format, completeness, and content.
 */
export function computeATSScore(
  data: ResumeData,
  jobDescription: string = ""
): ATSScoreResult {
  const format = scoreFormat(data);
  const completeness = scoreCompleteness(data);
  const contentDepth = scoreContentDepth(data);
  const resumeText = getResumeText(data);

  let keywordScore = 100;
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  const hasJobDesc = jobDescription.trim().length > 0;

  if (hasJobDesc) {
    const result = scoreKeywordMatch(resumeText, jobDescription);
    keywordScore = result.score;
    matchedKeywords = result.matched;
    missingKeywords = result.missing;
  }

  const breakdown: ATSBreakdown = {
    format,
    completeness,
    contentDepth,
    keywordMatch: keywordScore,
  };

  let overall: number;
  if (hasJobDesc) {
    overall =
      format * WEIGHTS.format +
      completeness * WEIGHTS.completeness +
      contentDepth * WEIGHTS.contentDepth +
      keywordScore * WEIGHTS.keywordMatch;
  } else {
    const totalWeight = WEIGHTS.format + WEIGHTS.completeness + WEIGHTS.contentDepth;
    overall =
      (format * WEIGHTS.format + completeness * WEIGHTS.completeness + contentDepth * WEIGHTS.contentDepth) /
      totalWeight;
  }
  overall = Math.round(Math.min(100, Math.max(0, overall)));

  const suggestions = getSuggestions(data, breakdown, missingKeywords);

  return {
    overall,
    breakdown,
    suggestions,
    ...(hasJobDesc ? { matchedKeywords, missingKeywords } : {}),
  };
}
