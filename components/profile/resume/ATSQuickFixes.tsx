"use client";

import { useMemo } from "react";
import { Box, Paper, Typography, Chip, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { ResumeData } from "./types";

type Severity = "high" | "medium" | "low";

interface QuickFix {
  id: string;
  severity: Severity;
  /** Section the user should head to */
  section:
    | "basicInfo"
    | "workExperience"
    | "education"
    | "skills"
    | "projects"
    | "certifications";
  title: string;
  /** One-line explanation of why this matters */
  why: string;
  /** Optional concrete example/template */
  example?: string;
}

interface ATSQuickFixesProps {
  resumeData: ResumeData;
  /** Optional: scroll to a section in the form when a fix is clicked. */
  onJumpToSection?: (section: QuickFix["section"]) => void;
}

const QUANTIFY_REGEX = /\d|\bmillion\b|\bthousand\b|\bx\b|%/i;
const FIRST_PERSON_REGEX = /\b(i|i've|i'm|i'll|my|me|myself)\b/i;
const WEAK_VERBS = new Set([
  "responsible",
  "worked",
  "helped",
  "did",
  "involved",
  "tasked",
  "handled",
  "assisted",
]);

function startsWithWeakVerb(text: string): boolean {
  const first = text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
  if (!first) return false;
  return WEAK_VERBS.has(first) || first === "responsibilities";
}

/** Compute the prioritized list of fixes from the resume data alone (no API). */
function computeQuickFixes(data: ResumeData): QuickFix[] {
  const fixes: QuickFix[] = [];
  const b = data.basicInfo;

  // ---- Basic info ----
  if (!b.firstName.trim() || !b.lastName.trim()) {
    fixes.push({
      id: "name",
      severity: "high",
      section: "basicInfo",
      title: "Add your full name",
      why: "ATS systems index resumes by name. Without it, your resume can't be retrieved.",
    });
  }
  if (!b.email.trim()) {
    fixes.push({
      id: "email",
      severity: "high",
      section: "basicInfo",
      title: "Add an email address",
      why: "Recruiters can't contact you without one — this is the #1 most-missed field.",
    });
  }
  if (!b.phone.trim()) {
    fixes.push({
      id: "phone",
      severity: "medium",
      section: "basicInfo",
      title: "Add a phone number",
      why: "Many ATS profiles flag missing phone as a recruiter-contactability issue.",
    });
  }
  if (!b.location.trim()) {
    fixes.push({
      id: "location",
      severity: "medium",
      section: "basicInfo",
      title: "Add your city / location",
      why: "Recruiters filter by location. Even just a city helps you appear in local searches.",
    });
  }
  if (!b.professionalTitle.trim()) {
    fixes.push({
      id: "title",
      severity: "high",
      section: "basicInfo",
      title: "Add a professional title",
      why: "A clear title (e.g. 'Senior Frontend Engineer') helps ATS keyword matching and recruiter scanning.",
      example: "Senior Backend Engineer · 5+ yrs Python / AWS",
    });
  }
  const summary = b.summary.trim();
  if (!summary) {
    fixes.push({
      id: "summary-empty",
      severity: "high",
      section: "basicInfo",
      title: "Add a professional summary",
      why: "Recruiters spend ~7 seconds on first pass — your summary anchors that scan.",
      example:
        "Backend engineer with 5+ years building distributed systems. Shipped real-time payment infra at scale (10K req/s). Strong in Go, Postgres, and AWS.",
    });
  } else if (summary.length < 150) {
    fixes.push({
      id: "summary-short",
      severity: "medium",
      section: "basicInfo",
      title: "Expand your professional summary",
      why: "A summary under ~150 chars usually misses your strongest selling point. Aim for 2-3 sentences.",
    });
  } else if (summary.length > 600) {
    fixes.push({
      id: "summary-long",
      severity: "low",
      section: "basicInfo",
      title: "Trim your professional summary",
      why: "Anything over 4 sentences gets skimmed past. Keep your top 2-3 strengths up front.",
    });
  }

  // ---- Social / professional links ----
  const hasAnyLink = !!(
    b.linkedin?.trim() ||
    b.github?.trim() ||
    b.portfolio?.trim() ||
    b.leetcode?.trim() ||
    b.hackerrank?.trim() ||
    b.kaggle?.trim() ||
    b.medium?.trim()
  );
  if (!hasAnyLink) {
    fixes.push({
      id: "no-links",
      severity: "medium",
      section: "basicInfo",
      title: "Add at least one professional link",
      why: "LinkedIn, GitHub, or a portfolio gives recruiters a place to verify your work and reach out.",
    });
  }

  // ---- Work experience ----
  const exp = data.workExperience;
  if (exp.length === 0) {
    fixes.push({
      id: "no-exp",
      severity: "high",
      section: "workExperience",
      title: "Add work experience",
      why: "Even one entry (internship, contract, freelance) dramatically lifts ATS scoring.",
    });
  } else {
    // Bullets without quantification
    let unquantifiedBullets = 0;
    let weakStartBullets = 0;
    let firstPersonBullets = 0;
    let totalBullets = 0;
    for (const e of exp) {
      for (const desc of e.description) {
        const text = desc.trim();
        if (!text) continue;
        totalBullets++;
        if (!QUANTIFY_REGEX.test(text)) unquantifiedBullets++;
        if (startsWithWeakVerb(text)) weakStartBullets++;
        if (FIRST_PERSON_REGEX.test(text)) firstPersonBullets++;
      }
    }
    if (totalBullets === 0) {
      fixes.push({
        id: "no-bullets",
        severity: "high",
        section: "workExperience",
        title: "Add bullet points to each role",
        why: "Empty roles look like placeholder entries. Add 2-4 outcome-focused bullets per job.",
        example: "Reduced API p95 latency from 800ms → 120ms by introducing read-replica routing.",
      });
    } else {
      const unquantifiedPct = unquantifiedBullets / totalBullets;
      if (unquantifiedPct > 0.7) {
        fixes.push({
          id: "quantify",
          severity: "high",
          section: "workExperience",
          title: `Add numbers to your bullets (${Math.round(unquantifiedPct * 100)}% have none)`,
          why: "Quantified bullets ('reduced X by 40%', '5-person team', '$2M ARR') are 3-4× more likely to convert to interviews.",
          example: "Use the AI 'Improve' button next to each bullet for a quick rewrite.",
        });
      }
      if (weakStartBullets > 0) {
        fixes.push({
          id: "weak-verbs",
          severity: "medium",
          section: "workExperience",
          title: `Replace weak openers in ${weakStartBullets} bullet${weakStartBullets > 1 ? "s" : ""}`,
          why: "Bullets that start with 'Responsible for', 'Worked on', or 'Helped' read as passive. Lead with action verbs (Shipped, Reduced, Architected, Migrated, Led).",
        });
      }
      if (firstPersonBullets > 0) {
        fixes.push({
          id: "first-person",
          severity: "medium",
          section: "workExperience",
          title: `Remove first-person pronouns (${firstPersonBullets} found)`,
          why: "Resumes use implicit subject — 'Shipped feature X' not 'I shipped feature X'. ATS parsers and recruiters expect this convention.",
        });
      }
    }

    // Date hygiene
    const missingDates = exp.filter((e) => !e.startDate.trim()).length;
    if (missingDates > 0) {
      fixes.push({
        id: "missing-dates",
        severity: "medium",
        section: "workExperience",
        title: `Add start dates to ${missingDates} role${missingDates > 1 ? "s" : ""}`,
        why: "ATS systems use date ranges to compute years of experience — missing dates often mean you're filtered out of seniority searches.",
      });
    }
  }

  // ---- Skills ----
  if (data.skills.length === 0) {
    fixes.push({
      id: "no-skills",
      severity: "high",
      section: "skills",
      title: "Add a skills section",
      why: "ATS keyword matching runs heavily against this section. Aim for 8-15 specific, technical skills.",
    });
  } else if (data.skills.length < 5) {
    fixes.push({
      id: "few-skills",
      severity: "medium",
      section: "skills",
      title: `Add more skills (you have ${data.skills.length} — aim for 8-15)`,
      why: "Most JDs list 6-12 required + nice-to-have skills. Resumes with too few skills miss keyword matches.",
    });
  }

  // ---- Education ----
  if (data.education.length === 0) {
    fixes.push({
      id: "no-edu",
      severity: "low",
      section: "education",
      title: "Add an education entry",
      why: "Even bootcamps and certifications count — many ATS systems require an education entry to score the resume.",
    });
  }

  // ---- Projects ----
  if (data.projects.length === 0 && data.workExperience.length < 2) {
    fixes.push({
      id: "no-projects",
      severity: "medium",
      section: "projects",
      title: "Add 1-2 projects",
      why: "If your work experience is light, projects fill the gap and show recruiters how you actually work.",
    });
  }
  const projectsWithoutLinks = data.projects.filter((p) => !p.link?.trim()).length;
  if (data.projects.length > 0 && projectsWithoutLinks === data.projects.length) {
    fixes.push({
      id: "project-links",
      severity: "low",
      section: "projects",
      title: "Add a link to at least one project",
      why: "GitHub repo, live demo, or write-up — a working link converts 'claim' into 'evidence' for the reviewer.",
    });
  }

  // Sort: high → medium → low
  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return fixes.sort((a, b) => order[a.severity] - order[b.severity]);
}

const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; icon: string; bg: string }
> = {
  high: {
    label: "High impact",
    color: "var(--error-500)",
    icon: "mdi:alert-circle",
    bg: "color-mix(in srgb, var(--error-500) 8%, var(--card-bg))",
  },
  medium: {
    label: "Medium",
    color: "var(--warning-500)",
    icon: "mdi:alert-outline",
    bg: "color-mix(in srgb, var(--warning-500) 8%, var(--card-bg))",
  },
  low: {
    label: "Polish",
    color: "var(--accent-purple)",
    icon: "mdi:lightbulb-on-outline",
    bg: "color-mix(in srgb, var(--accent-purple) 6%, var(--card-bg))",
  },
};

export function ATSQuickFixes({ resumeData, onJumpToSection }: ATSQuickFixesProps) {
  const fixes = useMemo(() => computeQuickFixes(resumeData), [resumeData]);

  if (fixes.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderColor: "var(--success-500)",
          backgroundColor: "color-mix(in srgb, var(--success-500) 8%, var(--card-bg))",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <IconWrapper icon="mdi:check-decagram" size={28} />
        <Box>
          <Typography sx={{ fontWeight: 700 }}>Looking solid</Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            No high-impact issues detected. Run the full AI analysis below for deeper feedback.
          </Typography>
        </Box>
      </Paper>
    );
  }

  const counts = {
    high: fixes.filter((f) => f.severity === "high").length,
    medium: fixes.filter((f) => f.severity === "medium").length,
    low: fixes.filter((f) => f.severity === "low").length,
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <IconWrapper icon="mdi:wrench-outline" />
        <Typography sx={{ fontWeight: 700 }}>Quick fixes</Typography>
        {counts.high > 0 && (
          <Chip
            size="small"
            label={`${counts.high} high impact`}
            sx={{
              backgroundColor: SEVERITY_META.high.bg,
              color: SEVERITY_META.high.color,
              fontWeight: 600,
            }}
          />
        )}
        {counts.medium > 0 && (
          <Chip
            size="small"
            label={`${counts.medium} medium`}
            sx={{
              backgroundColor: SEVERITY_META.medium.bg,
              color: SEVERITY_META.medium.color,
            }}
          />
        )}
        {counts.low > 0 && (
          <Chip
            size="small"
            label={`${counts.low} polish`}
            sx={{
              backgroundColor: SEVERITY_META.low.bg,
              color: SEVERITY_META.low.color,
            }}
          />
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {fixes.map((fix) => {
          const meta = SEVERITY_META[fix.severity];
          const isActionable = !!onJumpToSection;
          const card = (
            <Paper
              variant="outlined"
              onClick={isActionable ? () => onJumpToSection(fix.section) : undefined}
              sx={{
                p: 1.5,
                borderLeft: `4px solid ${meta.color}`,
                borderColor: "var(--border-default)",
                backgroundColor: meta.bg,
                cursor: isActionable ? "pointer" : "default",
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
                "&:hover": isActionable
                  ? {
                      borderColor: meta.color,
                    }
                  : undefined,
              }}
            >
              <IconWrapper icon={meta.icon} size={20} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                  {fix.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem", mt: 0.25 }}
                >
                  {fix.why}
                </Typography>
                {fix.example && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.75,
                      p: 0.75,
                      borderRadius: 0.5,
                      backgroundColor: "var(--surface)",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: "var(--font-secondary)",
                    }}
                  >
                    e.g. {fix.example}
                  </Typography>
                )}
              </Box>
            </Paper>
          );
          return isActionable ? (
            <Tooltip key={fix.id} title={`Jump to ${fix.section}`}>
              {card}
            </Tooltip>
          ) : (
            <Box key={fix.id}>{card}</Box>
          );
        })}
      </Box>
    </Box>
  );
}
