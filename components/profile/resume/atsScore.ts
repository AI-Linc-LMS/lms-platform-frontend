import type { ResumeData } from "./types";

const TECHNICAL_WEIGHT = 0.8;
const PRESENTATION_WEIGHT = 0.2;
const POOR_TECHNICAL_THRESHOLD = 40;
const POOR_TECHNICAL_CAP = 30;
/** Ceiling applied once any placeholder marker is detected. */
const PLACEHOLDER_CAP = 45;
/** Further deduction per additional distinct placeholder marker. */
const PLACEHOLDER_STEP = 5;

export interface ATSBreakdown {
  format: number;
  completeness: number;
  contentDepth: number;
  /** null when no job description was supplied - the category is Not Applicable,
   *  NOT a free 100. Renderers must show a dash, never a score, when null. */
  keywordMatch: number | null;
  experienceLevel?: number;
  educationCerts?: number;
  presentation?: number;
}

export interface ATSScoreResult {
  overall: number;
  breakdown: ATSBreakdown;
  suggestions: string[];
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

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

/* ------------------------------------------------------------------ *
 * Content-quality helpers.
 *
 * Every scorer below grades CONTENT, not mere presence. The previous
 * implementation awarded full marks for a non-empty array, so a resume
 * of placeholder rows scored 100 on Format, Completeness and Education.
 * ------------------------------------------------------------------ */

/** Unmistakable filler text. Deliberately conservative: these must never
 *  match a real resume. Includes the strings shipped in sampleResumeData.ts,
 *  because the builder boots with that sample already loaded. */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /\bjohn\s+doe\b/i,
  /\bjane\s+doe\b/i,
  /\byour\s+name\b/i,
  /@example\.(com|org|net)\b/i,
  /\blorem\s+ipsum\b/i,
  /\bdolor\s+sit\s+amet\b/i,
  /\(?555\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
  /\btech\s+solutions\s+inc\b/i,
  /\bdigital\s+innovations\b/i,
  /\bacme\s+(corp|inc|ltd)/i,
  /\b(company|university|institution|school)\s+name\b/i,
  /\byour\s+(company|role|title|university|degree)\b/i,
  /\b(xxx+|tbd|todo|placeholder)\b/i,
];

/** Number of distinct placeholder markers present. Used as a penalty, so a
 *  resume that is still the untouched sample cannot score as a real one. */
export function countPlaceholderHits(data: ResumeData): number {
  const text = getResumeText(data);
  return PLACEHOLDER_PATTERNS.reduce((n, re) => (re.test(text) ? n + 1 : n), 0);
}

/** Work entries that actually describe the work (>=1 bullet of real length). */
function substantiveRoles(data: ResumeData): number {
  return (data.workExperience || []).filter((w) =>
    (w.description || []).some((d) => (d || "").trim().length >= 30)
  ).length;
}

/** Education entries carrying both a degree and an institution. */
function completeEducation(data: ResumeData): number {
  return (data.education || []).filter(
    (e) => (e.degree || "").trim().length >= 3 && (e.institution || "").trim().length >= 3
  ).length;
}

/** Named skills, ignoring blank rows the form leaves behind. */
function namedSkills(data: ResumeData): number {
  return (data.skills || []).filter((s) => (s.name || "").trim().length >= 2).length;
}

/** All non-empty work bullets, trimmed. */
function allBullets(data: ResumeData): string[] {
  return (data.workExperience || [])
    .flatMap((w) => w.description || [])
    .map((d) => (d || "").trim())
    .filter((d) => d.length > 0);
}

function scoreFormat(data: ResumeData): number {
  // ATS parseability: can a parser find populated, standard sections?
  let score = 0;
  const roles = substantiveRoles(data);
  const edu = completeEducation(data);
  const skills = namedSkills(data);

  if (roles >= 2) score += 35;
  else if (roles === 1) score += 22;
  else if ((data.workExperience?.length ?? 0) > 0) score += 8; // present but hollow

  if (edu >= 1) score += 30;
  else if ((data.education?.length ?? 0) > 0) score += 8;

  if (skills >= 6) score += 25;
  else if (skills >= 3) score += 16;
  else if (skills >= 1) score += 8;

  if ((data.basicInfo?.email || "").includes("@")) score += 10;

  return Math.min(100, score);
}

function scoreCompleteness(data: ResumeData): number {
  let score = 0;
  const b = data.basicInfo;
  if (b?.email?.trim()) score += 18;
  if (b?.phone?.trim()) score += 12;

  // A summary earns credit by saying something, not by clearing 50 characters.
  const summary = (b?.summary || "").trim();
  if (summary.length >= 200) score += 25;
  else if (summary.length >= 120) score += 18;
  else if (summary.length >= 60) score += 10;

  const roles = substantiveRoles(data);
  if (roles >= 2) score += 25;
  else if (roles === 1) score += 15;

  if (completeEducation(data) >= 1) score += 12;
  if (b?.location?.trim()) score += 4;
  if (b?.linkedin?.trim() || b?.github?.trim()) score += 4;

  return Math.min(100, score);
}

function scoreContentDepth(data: ResumeData): number {
  let score = 0;
  const bullets = allBullets(data);
  const substantial = bullets.filter((b) => b.length >= 40);
  // Quantified impact is the single strongest signal real reviewers reward.
  const quantified = bullets.filter((b) => /\d/.test(b));

  if (substantial.length >= 6) score += 26;
  else if (substantial.length >= 4) score += 18;
  else if (substantial.length >= 2) score += 10;
  else if (bullets.length >= 1) score += 4;

  const qRatio = bullets.length ? quantified.length / bullets.length : 0;
  if (qRatio >= 0.5) score += 22;
  else if (qRatio >= 0.3) score += 15;
  else if (qRatio > 0) score += 8;

  const skills = namedSkills(data);
  if (skills >= 10) score += 18;
  else if (skills >= 6) score += 13;
  else if (skills >= 3) score += 7;

  const summaryLen = (data.basicInfo?.summary || "").trim().length;
  if (summaryLen >= 150 && summaryLen <= 500) score += 14;
  else if (summaryLen >= 80) score += 8;

  const detailedProjects = (data.projects || []).filter(
    (p) => (p.description || "").trim().length >= 60
  ).length;
  if (detailedProjects >= 2) score += 12;
  else if (detailedProjects >= 1) score += 8;
  else if ((data.projects?.length ?? 0) > 0) score += 3;

  if ((data.certifications || []).some((c) => (c.name || "").trim().length >= 3)) score += 8;

  return Math.min(100, score);
}

function scoreExperienceLevel(data: ResumeData): number {
  const work = data.workExperience || [];
  if (work.length === 0) return 0;

  // Only roles that describe themselves count toward seniority.
  const roles = substantiveRoles(data);
  if (roles === 0) return 8;

  let score = Math.min(35, roles * 14);
  const currentYear = new Date().getFullYear();
  let totalYears = 0;
  let hasRecent = false;
  for (const w of work) {
    const start = w.startDate ? parseInt(w.startDate.slice(0, 4), 10) : NaN;
    const end = w.endDate
      ? parseInt(w.endDate.slice(0, 4), 10)
      : w.current
      ? currentYear
      : NaN;
    if (!isNaN(start)) {
      const years = isNaN(end) ? 0 : Math.max(0, end - start);
      totalYears += years;
      if (currentYear - start <= 2) hasRecent = true;
    }
  }
  if (totalYears >= 5) score += 35;
  else if (totalYears >= 3) score += 28;
  else if (totalYears >= 1) score += 20;
  else score += 6;

  if (hasRecent) score += 25;

  return Math.min(100, score);
}

function scoreEducationCerts(data: ResumeData): number {
  let score = 0;
  const edu = data.education || [];
  const complete = completeEducation(data);
  const certs = (data.certifications || []).filter((c) => (c.name || "").trim().length >= 3);

  // A single education row used to be worth 50 outright. It is now worth 45,
  // and only when it actually carries a degree and an institution.
  if (complete >= 1) score += 45;
  else if (edu.length >= 1) score += 12;
  if (complete >= 2) score += 10;
  if (edu.some((e) => (e.startDate || "").trim() || (e.endDate || "").trim())) score += 10;
  if (edu.some((e) => (e.description || "").trim().length >= 30)) score += 5;
  if (certs.length >= 1) score += 20;
  if (certs.length >= 3) score += 10;

  return Math.min(100, score);
}

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

export function computeATSScore(
  data: ResumeData,
  jobDescription: string = ""
): ATSScoreResult {
  const format = scoreFormat(data);
  const completeness = scoreCompleteness(data);
  const contentDepth = scoreContentDepth(data);
  const resumeText = getResumeText(data);

  // No job description means keyword match is UNMEASURABLE, not perfect. It stays
  // null so it is excluded from both the maths and the category list.
  let keywordScore: number | null = null;
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  const hasJobDesc = jobDescription.trim().length > 0;

  if (hasJobDesc) {
    const result = scoreKeywordMatch(resumeText, jobDescription);
    keywordScore = result.score;
    matchedKeywords = result.matched;
    missingKeywords = result.missing;
  }

  const experienceLevel = scoreExperienceLevel(data);
  const educationCerts = scoreEducationCerts(data);

  const presentationScore = (format + completeness) / 2;
  let technicalScore: number;
  if (hasJobDesc && keywordScore !== null) {
    technicalScore = (keywordScore * 0.4 + experienceLevel * 0.25 + contentDepth * 0.2 + educationCerts * 0.15);
  } else {
    technicalScore = (experienceLevel * 0.35 + contentDepth * 0.35 + educationCerts * 0.3);
  }

  const breakdown: ATSBreakdown = {
    format,
    completeness,
    contentDepth,
    keywordMatch: keywordScore,
    experienceLevel,
    educationCerts,
    presentation: Math.round(presentationScore),
  };

  let overall = technicalScore * TECHNICAL_WEIGHT + presentationScore * PRESENTATION_WEIGHT;
  if (technicalScore < POOR_TECHNICAL_THRESHOLD) {
    overall = Math.min(overall, POOR_TECHNICAL_CAP);
  }

  // Untouched sample/placeholder content must not read as a real resume.
  const placeholderHits = countPlaceholderHits(data);
  if (placeholderHits > 0) {
    overall = Math.min(overall, PLACEHOLDER_CAP) - (placeholderHits - 1) * PLACEHOLDER_STEP;
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
