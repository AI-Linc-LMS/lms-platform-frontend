import type { ResumeData } from "./types";
import { computeATSScore } from "./atsScore";

export interface StandardReportFeedbackCategory {
  score: number;
  message: string;
  positivePoints: string[];
  improvementPoints: string[];
}

export interface OfflineCriteriaBreakdown {
  format: number;
  completeness: number;
  contentDepth: number;
  sectionBalance: number;
  contactCompleteness: number;
  bulletQuality: number;
  dateConsistency: number;
  experienceLevel?: number;
  educationCerts?: number;
  presentation?: number;
}

const TECHNICAL_WEIGHT = 0.8;
const PRESENTATION_WEIGHT = 0.2;
const POOR_TECHNICAL_THRESHOLD = 40;
const POOR_TECHNICAL_CAP = 30;

export interface StandardATSScoreReport {
  overallScore: number;
  atsScore: number;
  tips: string[];
  breakdown?: OfflineCriteriaBreakdown;
  detailedReport: {
    goodThings: string[];
    scopeForImprovement: string[];
    suggestions: string[];
    executiveSummary: string;
  };
  /** Industry-standard ATS-relevant checks. Pseudo-metrics like tone/grammar
   *  removed - those are recruiter-feel, not what real ATS scanners check. */
  qualityChecks: {
    sectionPresence: { score: number; note?: string };
    contactCompleteness: { score: number; note?: string };
    bulletQuality: { score: number; note?: string };
    dateConsistency: { score: number; note?: string };
    length: { score: number; note?: string };
  };
  feedback: {
    content: StandardReportFeedbackCategory;
    structure: StandardReportFeedbackCategory;
    skills: StandardReportFeedbackCategory;
  };
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function detectPlaceholders(data: ResumeData): { score: number; concerns: string[] } {
  const concerns: string[] = [];
  let penalty = 0;

  const b = data.basicInfo;
  if (b?.professionalTitle && b.professionalTitle.trim().length <= 2) {
    concerns.push("Professional title looks like a placeholder or is too short.");
    penalty += 15;
  }

  (data.workExperience || []).forEach((w, i) => {
    if (w.company && w.company.trim().length <= 2) {
      concerns.push(`Work experience ${i + 1}: Company name "${w.company}" looks placeholder or fake.`);
      penalty += 12;
    }
    if (w.position && w.position.trim().length <= 2) {
      concerns.push(`Work experience ${i + 1}: Job title is too short or generic.`);
      penalty += 8;
    }
  });

  (data.education || []).forEach((e, i) => {
    if (e.degree && /^\d+$/.test(e.degree.trim())) {
      concerns.push(`Education ${i + 1}: Degree "${e.degree}" appears invalid (numbers only).`);
      penalty += 15;
    }
    if (e.institution && e.institution.trim().length <= 2) {
      concerns.push(`Education ${i + 1}: Institution name looks placeholder.`);
      penalty += 12;
    }
  });

  (data.certifications || []).forEach((c) => {
    if (c.issuer && c.issuer.trim().length <= 3) {
      concerns.push(`Certification "${c.name}": Issuer looks generic or placeholder.`);
      penalty += 10;
    }
  });

  const score = clamp(100 - penalty);
  return { score, concerns };
}

function scoreSpacingAlignment(data: ResumeData): { score: number; note?: string } {
  let score = 60;
  const sections = [
    data.basicInfo?.summary?.trim(),
    data.workExperience?.length,
    data.education?.length,
    data.skills?.length,
    data.projects?.length,
    data.certifications?.length,
  ].filter(Boolean).length;
  score += Math.min(30, sections * 5);
  if (data.workExperience?.length && data.workExperience.every((w) => (w.description?.length ?? 0) > 0)) score += 10;
  const note = score >= 85 ? "Clear section structure and consistent layout." : score >= 70 ? "Consider consistent spacing between sections." : "Add missing sections and align formatting.";
  return { score: clamp(score), note };
}

function scoreTone(data: ResumeData): { score: number; note?: string } {
  const summary = data.basicInfo?.summary?.trim() ?? "";
  let score = 50;
  if (summary.length >= 100) score += 25;
  if (summary.length >= 200 && summary.length <= 400) score += 15;
  const professional = /experience|developed|led|managed|skills|professional|engineer|developer|team/i.test(summary);
  if (professional) score += 10;
  const note = score >= 80 ? "Professional tone and appropriate length." : score >= 60 ? "Summary could be more professional or concise." : "Add a professional summary (100+ characters).";
  return { score: clamp(score), note };
}

function scoreLanguageFluency(data: ResumeData): { score: number; note?: string } {
  const bullets = (data.workExperience || []).reduce((a, w) => a + (w.description?.length || 0), 0);
  const summaryLen = data.basicInfo?.summary?.length ?? 0;
  let score = 50;
  if (bullets >= 4) score += 20;
  if (bullets >= 6) score += 15;
  if (summaryLen >= 80) score += 15;
  const note = score >= 80 ? "Content reads fluently with good variety." : score >= 60 ? "Add more descriptive bullets for clarity." : "Expand descriptions for better flow.";
  return { score: clamp(score), note };
}

function scoreGrammar(data: ResumeData): { score: number; note?: string } {
  const hasSummary = (data.basicInfo?.summary?.trim().length ?? 0) >= 50;
  const bullets = (data.workExperience || []).reduce((a, w) => a + (w.description?.length || 0), 0);
  let score = hasSummary ? 70 : 55;
  if (bullets >= 4) score += 15;
  if (bullets >= 6) score += 10;
  const note = "Use action verbs and consistent punctuation. Consider a grammar check before submitting.";
  return { score: clamp(score), note };
}

function scoreConsistency(data: ResumeData): { score: number; note?: string } {
  let score = 70;
  const dates = [
    ...(data.workExperience || []).flatMap((w) => [w.startDate, w.endDate].filter(Boolean)),
    ...(data.education || []).flatMap((e) => [e.startDate, e.endDate].filter(Boolean)),
  ];
  const isoLike = dates.filter((d) => /^\d{4}-\d{2}/.test(d)).length;
  if (dates.length > 0 && isoLike === dates.length) score += 15;
  const bullets = (data.workExperience || []).reduce((a, w) => a + (w.description?.length || 0), 0);
  if (bullets >= 4) score += 10;
  const note = score >= 85 ? "Consistent date format and structure." : "Use consistent date format (e.g. YYYY-MM) and bullet style.";
  return { score: clamp(score), note };
}

function scoreEvidenceAuthentication(data: ResumeData, placeholderScore: number, placeholderConcerns: string[]): { score: number; note?: string } {
  const score = placeholderScore;
  const note = placeholderConcerns.length > 0
    ? "Replace placeholder or generic entries with real company names, institutions, and credentials."
    : "Details look consistent. Ensure links (portfolio, LinkedIn) are valid.";
  return { score, note };
}

function scoreSectionBalance(data: ResumeData): { score: number; note?: string } {
  let score = 0;
  const checks = [
    !!data.basicInfo?.summary?.trim(),
    (data.workExperience?.length ?? 0) >= 1,
    (data.education?.length ?? 0) >= 1,
    (data.skills?.length ?? 0) >= 1,
    (data.projects?.length ?? 0) >= 1,
    (data.certifications?.length ?? 0) >= 1,
  ];
  const present = checks.filter(Boolean).length;
  score = Math.round((present / 6) * 100);
  const note = score >= 85 ? "All key sections present." : score >= 65 ? "Add missing sections (e.g. projects or certifications)." : "Include work, education, skills, and a summary.";
  return { score: clamp(score), note };
}

function scoreContactCompleteness(data: ResumeData): { score: number; note?: string } {
  const b = data.basicInfo;
  let score = 0;
  if (b?.email?.trim()) score += 25;
  if (b?.phone?.trim()) score += 20;
  if (b?.location?.trim()) score += 15;
  const links = [b?.linkedin, b?.github, b?.portfolio].filter(Boolean).length;
  score += Math.min(40, links * 15);
  const note = score >= 80 ? "Contact and profile links are complete." : score >= 50 ? "Add phone, location, or LinkedIn/GitHub." : "Add email, phone, and at least one profile link.";
  return { score: clamp(score), note };
}

const ACTION_VERB_PATTERN = /^(led|built|developed|improved|managed|created|designed|implemented|achieved|increased|reduced|launched|established|coordinated|delivered|optimized|automated|analyzed|resolved|trained|supported|maintained|collaborated|drove|spearheaded|oversaw|executed|streamlined)/i;
function scoreBulletQuality(data: ResumeData): { score: number; note?: string } {
  const bullets = (data.workExperience || []).flatMap((w) => w.description || []).filter((s) => s?.trim());
  if (bullets.length === 0) return { score: clamp(30), note: "Add bullet points under each role with impact and responsibilities." };
  let score = 40;
  if (bullets.length >= 4) score += 25;
  else if (bullets.length >= 2) score += 15;
  const avgLen = bullets.reduce((a, s) => a + s.length, 0) / bullets.length;
  if (avgLen >= 50 && avgLen <= 120) score += 20;
  else if (avgLen >= 30) score += 10;
  const withAction = bullets.filter((s) => ACTION_VERB_PATTERN.test(s.trim())).length;
  if (bullets.length > 0) score += Math.round((withAction / bullets.length) * 15);
  const note = score >= 80 ? "Strong bullet points with good length and action verbs." : score >= 60 ? "Start bullets with action verbs (Led, Built, Improved) and add impact." : "Add 3–5 bullets per job; start each with an action verb.";
  return { score: clamp(score), note };
}

function scoreDateRecency(data: ResumeData): { score: number; note?: string } {
  const dates = [
    ...(data.workExperience || []).flatMap((w) => [w.startDate, w.endDate].filter(Boolean)),
    ...(data.education || []).flatMap((e) => [e.startDate, e.endDate].filter(Boolean)),
  ];
  if (dates.length === 0) return { score: clamp(50), note: "Add start/end dates to work and education." };
  const isoFormat = dates.filter((d) => /^\d{4}-\d{2}/.test(d)).length;
  const consistent = dates.length > 0 && isoFormat === dates.length;
  let score = consistent ? 70 : 50;
  const currentYear = new Date().getFullYear();
  const hasRecent = dates.some((d) => {
    const y = parseInt(d.slice(0, 4), 10);
    return !isNaN(y) && currentYear - y <= 2;
  });
  if (hasRecent) score += 20;
  const note = consistent && hasRecent ? "Dates are consistent and recent." : consistent ? "Use YYYY-MM format; include current or recent roles." : "Use consistent date format (e.g. 2020-01 to 2023-06).";
  return { score: clamp(score), note };
}

const SUGGESTION_TEMPLATES = [
  { condition: (b: { format: number }) => b.format < 80, text: "Add or complete work experience, education, and skills sections." },
  { condition: (b: { completeness: number }) => b.completeness < 80, text: "Include email, phone, and a professional summary (50+ characters)." },
  { condition: (b: { contentDepth: number }) => b.contentDepth < 70, text: "Add more bullet points per role (aim for 3–5 per job) and list 5+ skills." },
  { condition: (_: unknown, d: ResumeData) => (d.skills?.length ?? 0) < 5, text: "List at least 5 relevant skills for your target role." },
  { condition: (_: unknown, d: ResumeData) => !d.projects?.length, text: "Include at least one project with technologies and outcomes." },
  { condition: (_: unknown, d: ResumeData) => !(d.basicInfo?.linkedin || d.basicInfo?.github), text: "Add LinkedIn or GitHub profile link for credibility." },
  { condition: (_: unknown, d: ResumeData) => (d.basicInfo?.summary?.length ?? 0) < 100, text: "Write a professional summary of 100–300 characters." },
  { condition: (b: { sectionBalance: number }) => b.sectionBalance < 85, text: "Ensure all key sections (summary, work, education, skills, projects) are filled." },
  { condition: (b: { contactCompleteness: number }) => b.contactCompleteness < 70, text: "Complete contact info: email, phone, location, and at least one profile link." },
  { condition: (b: { bulletQuality: number }) => b.bulletQuality < 70, text: "Start each bullet with an action verb (Led, Built, Improved) and include impact." },
  { condition: (b: { dateConsistency: number }) => b.dateConsistency < 70, text: "Use consistent date format (YYYY-MM) across work and education." },
  { condition: () => true, text: "Paste a job description and run 'Analyze with AI' for tailored feedback." },
] as const;

function scoreLength(data: ResumeData): { score: number; note?: string } {
  // Approximate "page count" by total content characters. ~3000 chars/page is a rough guide.
  let chars = 0;
  chars += (data.basicInfo?.summary ?? "").length;
  for (const e of data.workExperience ?? []) {
    chars += (e.position ?? "").length + (e.company ?? "").length;
    chars += (e.description ?? []).reduce((a, b) => a + (b ?? "").length, 0);
  }
  for (const e of data.education ?? []) {
    chars += (e.degree ?? "").length + (e.institution ?? "").length + (e.description ?? "").length;
  }
  for (const p of data.projects ?? []) {
    chars += (p.name ?? "").length + (p.description ?? "").length;
  }
  for (const s of data.skills ?? []) chars += (s.name ?? "").length + 4;

  const pages = chars / 3000;
  if (pages < 0.5) {
    return { score: 40, note: "Resume looks very short. Aim for 1 well-filled page." };
  }
  if (pages >= 0.5 && pages <= 2.2) {
    return { score: 90, note: pages < 1 ? "Slightly short but acceptable." : "Length is appropriate." };
  }
  if (pages > 2.2 && pages <= 3) {
    return { score: 65, note: "Tightens better at 1-2 pages. Consider removing older or less-relevant content." };
  }
  return { score: 40, note: "Resume is too long - cut down to 1-2 focused pages." };
}

export function computeStandardATSScoreReport(data: ResumeData): StandardATSScoreReport {
  const base = computeATSScore(data, "");
  const sectionPresence = scoreSectionBalance(data);
  const contactCompleteness = scoreContactCompleteness(data);
  const bulletQuality = scoreBulletQuality(data);
  const dateConsistency = scoreDateRecency(data);
  const length = scoreLength(data);

  // Parseability = how well an ATS can extract structured data (the 20% portion).
  const parseabilityAvg = (sectionPresence.score + contactCompleteness.score + dateConsistency.score + length.score) / 4;

  const breakdown: OfflineCriteriaBreakdown = {
    format: base.breakdown.format,
    completeness: base.breakdown.completeness,
    contentDepth: base.breakdown.contentDepth,
    sectionBalance: sectionPresence.score,
    contactCompleteness: contactCompleteness.score,
    bulletQuality: bulletQuality.score,
    dateConsistency: dateConsistency.score,
    experienceLevel: base.breakdown.experienceLevel,
    educationCerts: base.breakdown.educationCerts,
    presentation: Math.round(parseabilityAvg),
  };

  const goodThings: string[] = [];
  if (sectionPresence.score >= 85) goodThings.push("Standard ATS-parseable sections (Experience, Education, Skills, Contact) are present.");
  if (contactCompleteness.score >= 80) goodThings.push("Contact info is complete and recruiter-reachable.");
  if (bulletQuality.score >= 70) goodThings.push("Bullet points use action verbs and convey impact.");
  if (dateConsistency.score >= 80) goodThings.push("Dates are consistent and parseable.");
  if (length.score >= 80) goodThings.push("Resume length is appropriate.");
  if (data.projects?.length) goodThings.push("Projects section adds credibility.");
  if (data.certifications?.length) goodThings.push("Certifications strengthen the profile.");
  if (goodThings.length === 0) goodThings.push("Resume has the basic sections; add more detail for a stronger report.");

  const scopeForImprovement: string[] = [];
  if (sectionPresence.score < 85) scopeForImprovement.push("Fill in missing standard sections (Experience, Education, Skills, Contact).");
  if (contactCompleteness.score < 70) scopeForImprovement.push("Complete contact info: name, email, phone, location, plus LinkedIn or GitHub.");
  if (bulletQuality.score < 70) scopeForImprovement.push("Improve bullet quality: lead with action verbs and quantify impact (numbers, %, scale).");
  if (dateConsistency.score < 70) scopeForImprovement.push("Use consistent date format (YYYY-MM) across all work and education entries.");
  if (length.score < 70) scopeForImprovement.push(length.note ?? "Tighten the resume to 1-2 focused pages.");
  if (scopeForImprovement.length === 0) scopeForImprovement.push("Minor refinements can further improve ATS compatibility.");

  const suggestions: string[] = [];
  for (const t of SUGGESTION_TEMPLATES) {
    if (t.condition(breakdown, data)) {
      suggestions.push(t.text);
    }
  }
  if (base.suggestions.length > 0) {
    base.suggestions.forEach((s) => { if (!suggestions.includes(s)) suggestions.push(s); });
  }
  if (suggestions.length === 0) {
    suggestions.push("Use consistent date format (e.g. 2020-01 to 2023-06) across all sections.");
  }

  const tips = [
    "Paste a job description and click 'Analyze with AI' for a tailored report.",
    "Use action verbs (Led, Built, Improved) in bullet points.",
    "Keep formatting simple for ATS readability.",
  ];

  const executiveSummary =
    base.overall >= 70
      ? "Your resume has solid structure and completeness. Adding more bullet points and skills will strengthen it further. For job-specific feedback, paste a job description and run AI analysis."
      : "Your resume has room to improve in content depth and completeness. Follow the suggestions below and consider running AI analysis with a job description for tailored advice.";

  const feedbackCategory = (
    score: number,
    positive: string[],
    improve: string[]
  ): StandardReportFeedbackCategory => ({
    score: clamp(score),
    message: score >= 75 ? "Meets expectations." : score >= 50 ? "Could be improved." : "Needs attention.",
    positivePoints: positive,
    improvementPoints: improve,
  });

  const technicalScores = [
    breakdown.contentDepth,
    breakdown.experienceLevel ?? breakdown.contentDepth,
    breakdown.educationCerts ?? breakdown.contentDepth,
    breakdown.bulletQuality,
  ];
  const technicalAvg = technicalScores.reduce((a, b) => a + b, 0) / technicalScores.length;
  let blendedOverall = technicalAvg * TECHNICAL_WEIGHT + parseabilityAvg * PRESENTATION_WEIGHT;
  if (technicalAvg < POOR_TECHNICAL_THRESHOLD) {
    blendedOverall = Math.min(blendedOverall, POOR_TECHNICAL_CAP);
  }
  blendedOverall = Math.round(blendedOverall);

  return {
    overallScore: clamp(blendedOverall),
    atsScore: clamp(blendedOverall),
    tips,
    breakdown,
    detailedReport: {
      goodThings,
      scopeForImprovement,
      suggestions,
      executiveSummary,
    },
    qualityChecks: {
      sectionPresence,
      contactCompleteness,
      bulletQuality,
      dateConsistency,
      length,
    },
    feedback: {
      content: feedbackCategory(
        bulletQuality.score,
        bulletQuality.score >= 70 ? ["Bullets are specific and outcome-focused"] : [],
        bulletQuality.score < 70 ? ["Lead with action verbs and quantify impact (numbers, %)."] : []
      ),
      structure: feedbackCategory(
        Math.round((sectionPresence.score + dateConsistency.score + length.score) / 3),
        sectionPresence.score >= 80 ? ["Standard sections present"] : [],
        sectionPresence.score < 80 ? ["Add missing standard sections"] : dateConsistency.score < 70 ? ["Fix inconsistent dates"] : []
      ),
      skills: feedbackCategory(
        base.breakdown.contentDepth >= 60 ? 75 : 55,
        (data.skills?.length ?? 0) >= 5 ? ["Good skills list"] : [],
        (data.skills?.length ?? 0) < 5 ? ["List 5+ relevant skills"] : []
      ),
    },
  };
}
