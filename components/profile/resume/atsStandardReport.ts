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
}

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
    authenticityScore: number;
    authenticityConcerns: string[];
  };
  qualityChecks: {
    spacingAlignment: { score: number; note?: string };
    tone: { score: number; note?: string };
    languageFluency: { score: number; note?: string };
    grammar: { score: number; note?: string };
    consistency: { score: number; note?: string };
    evidenceAuthentication: { score: number; note?: string };
    sectionBalance: { score: number; note?: string };
    contactCompleteness: { score: number; note?: string };
    bulletQuality: { score: number; note?: string };
    dateRecency: { score: number; note?: string };
  };
  feedback: {
    toneAndStyle: StandardReportFeedbackCategory;
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

export function computeStandardATSScoreReport(data: ResumeData): StandardATSScoreReport {
  const base = computeATSScore(data, "");
  const { score: authenticityScore, concerns: authenticityConcerns } = detectPlaceholders(data);

  const spacing = scoreSpacingAlignment(data);
  const tone = scoreTone(data);
  const fluency = scoreLanguageFluency(data);
  const grammar = scoreGrammar(data);
  const consistency = scoreConsistency(data);
  const evidence = scoreEvidenceAuthentication(data, authenticityScore, authenticityConcerns);
  const sectionBalance = scoreSectionBalance(data);
  const contactCompleteness = scoreContactCompleteness(data);
  const bulletQuality = scoreBulletQuality(data);
  const dateRecency = scoreDateRecency(data);

  const breakdown: OfflineCriteriaBreakdown = {
    format: base.breakdown.format,
    completeness: base.breakdown.completeness,
    contentDepth: base.breakdown.contentDepth,
    sectionBalance: sectionBalance.score,
    contactCompleteness: contactCompleteness.score,
    bulletQuality: bulletQuality.score,
    dateConsistency: dateRecency.score,
  };

  const goodThings: string[] = [];
  if (base.breakdown.format >= 80) goodThings.push("Clear section structure with experience, education, and skills.");
  if (base.breakdown.completeness >= 80) goodThings.push("Contact info and summary are present.");
  if (base.breakdown.contentDepth >= 70) goodThings.push("Good content depth with multiple bullets and skills.");
  if (sectionBalance.score >= 85) goodThings.push("All key sections (summary, work, education, skills) are present.");
  if (contactCompleteness.score >= 80) goodThings.push("Contact and profile links are complete.");
  if (bulletQuality.score >= 70) goodThings.push("Bullet points show impact and use action-oriented language.");
  if (dateRecency.score >= 80) goodThings.push("Dates are consistent and include recent experience.");
  if (data.projects?.length) goodThings.push("Projects section adds credibility.");
  if (data.certifications?.length) goodThings.push("Certifications strengthen the profile.");
  if (authenticityConcerns.length === 0) goodThings.push("No obvious placeholder or fake-looking entries detected.");
  if (goodThings.length === 0) goodThings.push("Resume has the basic sections; add more detail for a stronger report.");

  const scopeForImprovement: string[] = [];
  if (base.breakdown.format < 80) scopeForImprovement.push("Add or complete work experience, education, and skills sections.");
  if (base.breakdown.completeness < 80) scopeForImprovement.push("Include email, phone, and a professional summary (50+ characters).");
  if (base.breakdown.contentDepth < 70) scopeForImprovement.push("Add more bullet points per role and list 5+ relevant skills.");
  if (sectionBalance.score < 85) scopeForImprovement.push("Fill in missing sections (e.g. projects or certifications).");
  if (contactCompleteness.score < 70) scopeForImprovement.push("Add phone, location, or LinkedIn/GitHub for recruiters.");
  if (bulletQuality.score < 70) scopeForImprovement.push("Improve bullet quality: use action verbs and quantify impact where possible.");
  if (dateRecency.score < 70) scopeForImprovement.push("Use consistent date format (YYYY-MM) and include current or recent roles.");
  if (authenticityConcerns.length > 0) scopeForImprovement.push("Replace placeholder or generic names with real company and institution names.");
  if (spacing.score < 70) scopeForImprovement.push("Improve spacing and alignment for a cleaner layout.");
  if (tone.score < 70) scopeForImprovement.push("Strengthen professional tone in the summary.");
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
    authenticityConcerns.length > 0
      ? "Your resume has the right structure, but some entries look like placeholders. Replacing them with real company and institution names will improve credibility. Use 'Analyze with AI' with a job description for a detailed match report."
      : base.overall >= 70
        ? "Your resume has solid structure and completeness. Adding more bullet points and skills will strengthen it further. For job-specific feedback, paste a job description and run AI analysis."
        : "Your resume has room to improve in content depth and completeness. Follow the suggestions below and consider running AI analysis with a job description for tailored advice.";

  const avgFeedback = Math.round(
    (spacing.score + tone.score + fluency.score + grammar.score + consistency.score) / 5
  );
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

  const breakdownScores = [
    breakdown.format,
    breakdown.completeness,
    breakdown.contentDepth,
    breakdown.sectionBalance,
    breakdown.contactCompleteness,
    breakdown.bulletQuality,
    breakdown.dateConsistency,
  ];
  const average = breakdownScores.reduce((a, b) => a + b, 0) / breakdownScores.length;
  const minScore = Math.min(...breakdownScores);
  const blendedOverall = Math.round(0.78 * average + 0.22 * minScore);

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
      authenticityScore,
      authenticityConcerns,
    },
    qualityChecks: {
      spacingAlignment: spacing,
      tone,
      languageFluency: fluency,
      grammar,
      consistency,
      evidenceAuthentication: evidence,
      sectionBalance,
      contactCompleteness,
      bulletQuality,
      dateRecency,
    },
    feedback: {
      toneAndStyle: feedbackCategory(tone.score, tone.score >= 70 ? ["Professional tone"] : [], tone.score < 70 ? ["Strengthen summary tone"] : []),
      content: feedbackCategory(fluency.score, fluency.score >= 70 ? ["Adequate content depth"] : [], fluency.score < 70 ? ["Add more descriptive bullets"] : []),
      structure: feedbackCategory(spacing.score, spacing.score >= 70 ? ["Clear structure"] : [], spacing.score < 70 ? ["Improve section spacing"] : []),
      skills: feedbackCategory(
        base.breakdown.contentDepth >= 60 ? 75 : 55,
        (data.skills?.length ?? 0) >= 5 ? ["Good skills list"] : [],
        (data.skills?.length ?? 0) < 5 ? ["List 5+ relevant skills"] : []
      ),
    },
  };
}
