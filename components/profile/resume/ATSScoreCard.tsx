"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { computeATSScore, type ATSScoreResult } from "./atsScore";
import { computeStandardATSScoreReport, type OfflineCriteriaBreakdown } from "./atsStandardReport";
import type { ResumeData } from "./types";

interface FeedbackCategory {
  score: number;
  message: string;
  positivePoints?: string[];
  improvementPoints?: string[];
}

interface AIAnalysisResult {
  overallScore: number;
  atsScore: number;
  tips: string[];
  breakdown?: OfflineCriteriaBreakdown;
  detailedReport?: {
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
    sectionBalance?: { score: number; note?: string };
    contactCompleteness?: { score: number; note?: string };
    bulletQuality?: { score: number; note?: string };
    dateRecency?: { score: number; note?: string };
  };
  feedback: {
    toneAndStyle: FeedbackCategory;
    content: FeedbackCategory;
    structure: FeedbackCategory;
    skills: FeedbackCategory;
  };
}

interface ATSScoreCardProps {
  resumeData: ResumeData;
  initialLiveScore?: number;
  dialogOpen?: boolean;
}

function getScoreLabel(score: number): "strong" | "goodStart" | "needsWork" {
  if (score >= 80) return "strong";
  if (score >= 50) return "goodStart";
  return "needsWork";
}

function getScoreColor(score: number): "success" | "warning" | "error" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "error";
}

function ScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const normalized = Math.min(100, Math.max(0, score));
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;
  const color = getScoreColor(score) === "success" ? "var(--ats-success)" : getScoreColor(score) === "warning" ? "var(--ats-warning)" : "var(--ats-error)";
  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {Math.round(normalized)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          /100
        </Typography>
      </Box>
    </Box>
  );
}

function ScoreBadge({
  label,
  score,
  scoreLabel,
}: {
  label: string;
  score: number;
  scoreLabel: string;
}) {
  const color = getScoreColor(score);
  const bgColor = color === "success" ? "var(--ats-success-bg)" : color === "warning" ? "var(--ats-warning-bg)" : "var(--ats-error-bg)";
  const textColor = color === "success" ? "var(--ats-success-muted)" : color === "warning" ? "var(--ats-warning-muted)" : "var(--ats-error-muted)";
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 1,
        px: 1.5,
        borderRadius: 1,
        bgcolor: bgColor,
        mb: 1,
      }}
    >
      <Typography variant="body2" fontWeight={500}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="caption" sx={{ color: textColor, fontWeight: 600 }}>
          {scoreLabel}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {Math.round(score)}/100
        </Typography>
      </Box>
    </Box>
  );
}

const CATEGORY_KEYS = ["toneAndStyle", "content", "structure", "skills"] as const;

export function ATSScoreCard({ resumeData, initialLiveScore, dialogOpen }: ATSScoreCardProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [jobDescription, setJobDescription] = useState("");
  const [showJobRoleInput, setShowJobRoleInput] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState<string | false>("toneAndStyle");
  const hasAutoRunRef = useRef(false);

  const baseResult: ATSScoreResult = useMemo(
    () => computeATSScore(resumeData, ""),
    [resumeData]
  );
  const standardReport = useMemo(
    () => computeStandardATSScoreReport(resumeData),
    [resumeData]
  );
  const report: AIAnalysisResult = aiResult ?? {
    overallScore: standardReport.overallScore,
    atsScore: standardReport.atsScore,
    tips: standardReport.tips,
    breakdown: standardReport.breakdown,
    detailedReport: standardReport.detailedReport,
    linkValidation: undefined,
    qualityChecks: standardReport.qualityChecks,
    feedback: standardReport.feedback,
  };
  const resultWithJob: ATSScoreResult = useMemo(
    () => computeATSScore(resumeData, jobDescription),
    [resumeData, jobDescription]
  );

  const setAiResultFromData = useCallback((data: Record<string, unknown>) => {
    setAiResult({
      overallScore: (data.overallScore as number) ?? 0,
      atsScore: (data.atsScore as number) ?? (data.overallScore as number) ?? 0,
      tips: Array.isArray(data.tips) ? data.tips : [],
      detailedReport: data.detailedReport && typeof data.detailedReport === "object"
        ? {
            goodThings: Array.isArray((data.detailedReport as Record<string, unknown>).goodThings) ? (data.detailedReport as Record<string, unknown>).goodThings as string[] : [],
            scopeForImprovement: Array.isArray((data.detailedReport as Record<string, unknown>).scopeForImprovement) ? (data.detailedReport as Record<string, unknown>).scopeForImprovement as string[] : [],
            suggestions: Array.isArray((data.detailedReport as Record<string, unknown>).suggestions) ? (data.detailedReport as Record<string, unknown>).suggestions as string[] : [],
            executiveSummary: ((data.detailedReport as Record<string, unknown>).executiveSummary as string) ?? "",
            authenticityScore: typeof (data.detailedReport as Record<string, unknown>).authenticityScore === "number" ? (data.detailedReport as Record<string, unknown>).authenticityScore as number : undefined,
            authenticityConcerns: Array.isArray((data.detailedReport as Record<string, unknown>).authenticityConcerns) ? (data.detailedReport as Record<string, unknown>).authenticityConcerns as string[] : [],
            resumeGoodFor: Array.isArray((data.detailedReport as Record<string, unknown>).resumeGoodFor) ? (data.detailedReport as Record<string, unknown>).resumeGoodFor as string[] : undefined,
          }
        : undefined,
      linkValidation: Array.isArray(data.linkValidation) ? data.linkValidation : undefined,
      qualityChecks: data.qualityChecks && typeof data.qualityChecks === "object" ? data.qualityChecks : undefined,
      feedback: ((): AIAnalysisResult["feedback"] => {
        const fb = (data.feedback as Record<string, unknown>) ?? {};
        const defaultCat: FeedbackCategory = { score: 70, message: "", positivePoints: [], improvementPoints: [] };
        const toCat = (raw: unknown): FeedbackCategory => {
          if (!raw || typeof raw !== "object") return defaultCat;
          const o = raw as Record<string, unknown>;
          return {
            score: typeof o.score === "number" ? o.score : 70,
            message: typeof o.message === "string" ? o.message : "",
            positivePoints: Array.isArray(o.positivePoints) ? (o.positivePoints as string[]) : [],
            improvementPoints: Array.isArray(o.improvementPoints) ? (o.improvementPoints as string[]) : [],
          };
        };
        return {
          toneAndStyle: toCat(fb.toneAndStyle),
          content: toCat(fb.content),
          structure: toCat(fb.structure),
          skills: toCat(fb.skills),
        };
      })(),
    });
  }, []);

  const runAIAnalysisWithoutJob = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ats-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data?.error as string) || t("profile.atsAIError");
        setAiError(msg);
        setAiResult(null);
        showToast(msg, "error");
        return;
      }
      setAiResultFromData(data);
      setDetailsExpanded("toneAndStyle");
    } catch {
      const msg = t("profile.atsAIError");
      setAiError(msg);
      setAiResult(null);
      showToast(msg, "error");
    } finally {
      setAiLoading(false);
    }
  }, [resumeData, t, setAiResultFromData, showToast]);

  useEffect(() => {
    if (!dialogOpen) {
      hasAutoRunRef.current = false;
      return;
    }
    if (hasAutoRunRef.current) return;
    hasAutoRunRef.current = true;
    runAIAnalysisWithoutJob();
  }, [dialogOpen, runAIAnalysisWithoutJob]);

  const runAIAnalysis = useCallback(async () => {
    const job = jobDescription.trim();
    if (!job) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ats-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jobDescription: job }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data?.error as string) || t("profile.atsAIError");
        setAiError(msg);
        setAiResult(null);
        showToast(msg, "error");
        return;
      }
      setAiResultFromData(data);
      setDetailsExpanded("toneAndStyle");
    } catch {
      const msg = t("profile.atsAIError");
      setAiError(msg);
      setAiResult(null);
      showToast(msg, "error");
    } finally {
      setAiLoading(false);
    }
  }, [jobDescription, resumeData, t, setAiResultFromData, showToast]);

  const hasJobDesc = jobDescription.trim().length > 0;
  const overall = useMemo(() => {
    if (aiResult) return aiResult.atsScore;
    if (hasJobDesc) {
      const b = resultWithJob.breakdown;
      const technical = (b.keywordMatch * 0.4 + (b.experienceLevel ?? b.contentDepth) * 0.25 + b.contentDepth * 0.2 + (b.educationCerts ?? b.contentDepth) * 0.15);
      const presentation = (b.format + b.completeness) / 2;
      let score = technical * 0.8 + presentation * 0.2;
      if (technical < 40) score = Math.min(score, 30);
      return Math.round(Math.min(100, Math.max(0, score)));
    }
    return report.overallScore;
  }, [aiResult, baseResult, resultWithJob, hasJobDesc, report.overallScore]);

  const categoryLabels: Record<string, string> = {
    toneAndStyle: t("profile.atsToneAndStyle"),
    content: t("profile.atsContent"),
    structure: t("profile.atsStructure"),
    skills: t("profile.atsSkills"),
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        mb: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:file-document-check-outline" size={24} color="var(--accent-indigo)" />
          <Typography variant="subtitle1" fontWeight={600}>
            {t("profile.atsScoreTitle")}
          </Typography>
        </Box>
        <Tooltip title={t("profile.atsScoreTooltip")}>
          <IconButton size="small" sx={{ color: "text.secondary" }} aria-label={t("profile.atsScoreTooltip")}>
            <IconWrapper icon="mdi:information-outline" />
          </IconButton>
        </Tooltip>
      </Box>

      {aiLoading && !aiResult && !aiError && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4, gap: 2 }}>
          <CircularProgress size={40} sx={{ color: "var(--ats-cta-bg)" }} />
          <Typography variant="body2" color="text.secondary">
            {t("profile.atsAnalyzingWithAI")}
          </Typography>
        </Box>
      )}

      {(aiResult || aiError) && (
        <>
          {aiError && !aiResult && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 1.5,
                bgcolor: "var(--ats-warning-bg)",
                border: "1px solid var(--ats-warning-border)",
              }}
            >
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ display: "block" }}>
                {t("profile.atsFallbackBanner")}
              </Typography>
              <Typography
                component="span"
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1,
                  color: "text.secondary",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                <Box component="span" fontWeight={600} sx={{ color: "text.primary" }}>
                  {t("profile.atsFallbackReason")}:
                </Box>{" "}
                {aiError}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <ScoreGauge score={overall} size={140} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
              {t("profile.atsYourResumeScore")}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
              {t("profile.atsScoreCalculatedFrom")}
            </Typography>
          </Box>
        </>
      )}

      {aiResult && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: "var(--surface-subtle)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            <Button
              size="small"
              variant="contained"
              aria-label={t("profile.atsCheckForJobRole")}
              startIcon={<IconWrapper icon="mdi:briefcase-outline" size={18} />}
              endIcon={<IconWrapper icon={showJobRoleInput ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />}
              onClick={() => setShowJobRoleInput(!showJobRoleInput)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "var(--ats-cta-bg)",
                "&:hover": { bgcolor: "var(--ats-cta-bg-hover)" },
              }}
            >
              {t("profile.atsCheckForJobRole")}
            </Button>
          </Box>
          {showJobRoleInput && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid var(--border-subtle)" }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                placeholder={t("profile.atsJobDescPlaceholder")}
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  setAiResult(null);
                  setAiError(null);
                }}
                size="small"
                sx={{ mb: 1 }}
              />
              <Button
                size="small"
                variant="contained"
                aria-label={t("profile.atsAnalyzeWithAI")}
                startIcon={
                  aiLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <IconWrapper icon="mdi:robot-outline" size={18} />
                  )
                }
                onClick={runAIAnalysis}
                disabled={!jobDescription.trim() || aiLoading}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "var(--ats-cta-bg)",
                  "&:hover": { bgcolor: "var(--ats-cta-bg-hover)" },
                }}
              >
                {aiLoading ? t("profile.atsAnalyzing") : t("profile.atsAnalyzeWithAI")}
              </Button>
              {aiError && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {t("profile.atsAICurrentlyUnavailable")}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}

      {!aiResult && aiError && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: "var(--surface-subtle)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.25 }}>
            {t("profile.atsVerifyWithAICta")}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            <Button
              size="small"
              variant="contained"
              startIcon={
                aiLoading && !showJobRoleInput ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <IconWrapper icon="mdi:robot-outline" size={18} />
                )
              }
              onClick={runAIAnalysisWithoutJob}
              disabled={aiLoading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                bgcolor: "var(--ats-cta-bg)",
                "&:hover": { bgcolor: "var(--ats-cta-bg-hover)" },
              }}
            >
              {t("profile.atsAnalyzeWithAI")}
            </Button>
            <Button
              size="small"
              variant="outlined"
              aria-label={t("profile.atsCheckForJobRole")}
              startIcon={<IconWrapper icon="mdi:briefcase-outline" size={18} />}
              endIcon={<IconWrapper icon={showJobRoleInput ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} />}
              onClick={() => setShowJobRoleInput(!showJobRoleInput)}
              disabled={aiLoading}
              sx={{ textTransform: "none", borderColor: "var(--font-tertiary)", color: "var(--font-muted)", "&:hover": { borderColor: "var(--font-secondary)", bgcolor: "var(--surface-subtle)" } }}
            >
              {t("profile.atsCheckForJobRole")}
            </Button>
          </Box>
          {showJobRoleInput && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid var(--border-subtle)" }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={4}
                placeholder={t("profile.atsJobDescPlaceholder")}
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  setAiResult(null);
                  setAiError(null);
                }}
                size="small"
                sx={{ mb: 1 }}
              />
              <Button
                size="small"
                variant="contained"
                startIcon={
                  aiLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <IconWrapper icon="mdi:robot-outline" size={18} />
                  )
                }
                onClick={runAIAnalysis}
                disabled={!jobDescription.trim() || aiLoading}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  bgcolor: "var(--ats-cta-bg)",
                  "&:hover": { bgcolor: "var(--ats-cta-bg-hover)" },
                }}
              >
                {aiLoading ? t("profile.atsAnalyzing") : t("profile.atsAnalyzeWithAI")}
              </Button>
              {aiError && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {t("profile.atsAICurrentlyUnavailable")}
                </Typography>
              )}
            </Box>
          )}
          {aiError && !showJobRoleInput && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {t("profile.atsAICurrentlyUnavailable")}
            </Typography>
          )}
        </Box>
      )}

      {report.breakdown && (aiResult || aiError) && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {t("profile.atsOfflineCriteria")}
          </Typography>
          {(
            [
              { key: "contentDepth", labelKey: "profile.atsContentDepth" },
              { key: "experienceLevel", labelKey: "profile.atsCriteria_experienceLevel" },
              { key: "educationCerts", labelKey: "profile.atsCriteria_educationCerts" },
              { key: "bulletQuality", labelKey: "profile.atsCriteria_bulletQuality" },
              { key: "presentation", labelKey: "profile.atsCriteria_presentation" },
            ] as const
          ).map(({ key, labelKey }) => {
            const value = report.breakdown![key as keyof typeof report.breakdown];
            if (typeof value !== "number") return null;
            return (
              <Box key={key} sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">{t(labelKey)}</Typography>
                  <Typography variant="caption" fontWeight={600}>{value}%</Typography>
                </Box>
                <Box sx={{ height: 6, borderRadius: 1, bgcolor: "var(--border-default)", overflow: "hidden" }}>
                  <Box
                    sx={{
                      width: `${Math.min(100, value)}%`,
                      height: "100%",
                      bgcolor: value >= 70 ? "var(--ats-bar-high)" : value >= 50 ? "var(--ats-bar-mid)" : "var(--ats-bar-low)",
                      borderRadius: 1,
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {(aiResult || aiError) && (
      <>
        {CATEGORY_KEYS.map((key) => {
          const cat = report.feedback[key];
            const label = getScoreLabel(cat.score);
            const scoreLabel = label === "strong" ? t("profile.atsLabelStrong") : label === "goodStart" ? t("profile.atsLabelGoodStart") : t("profile.atsLabelNeedsWork");
            return (
              <ScoreBadge
                key={key}
                label={categoryLabels[key]}
                score={cat.score}
                scoreLabel={scoreLabel}
              />
            );
          })}

        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            background:
              overall >= 70
                ? "var(--ats-gradient-success)"
                : overall >= 50
                  ? "var(--ats-gradient-warning)"
                  : "var(--ats-gradient-error)",
            border:
              overall >= 70
                ? "1px solid var(--ats-success-border)"
                : overall >= 50
                  ? "1px solid var(--ats-warning-border)"
                  : "1px solid var(--ats-error-border)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconWrapper icon="mdi:check-circle" size={28} color="var(--ats-success-muted)" />
            <Typography variant="subtitle1" fontWeight={700}>
              ATS Score - {overall}/100
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
            {overall >= 70
              ? t("profile.atsGreatJob")
              : overall >= 50
                ? t("profile.atsLabelGoodStart")
                : t("profile.atsLabelNeedsWork")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t("profile.atsScoreRepresents")}
          </Typography>
          {report.tips.length > 0 && (
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {report.tips.map((tip, i) => (
                  <Typography component="li" key={i} variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                    {tip}
                  </Typography>
                ))}
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {t("profile.atsRefineAdvice")}
            </Typography>
          </Box>

        {(() => {
          const deductionItems: { label: string; score: number; note?: string }[] = [];
          CATEGORY_KEYS.forEach((key) => {
            const cat = report.feedback[key];
            if (cat && typeof cat.score === "number" && cat.score < 60) {
              deductionItems.push({ label: categoryLabels[key], score: cat.score });
            }
          });
          if (report.qualityChecks) {
            const qualityKeyLabels: Record<string, string> = {
              spacingAlignment: t("profile.atsQuality_spacingAlignment"),
              tone: t("profile.atsQuality_tone"),
              languageFluency: t("profile.atsQuality_languageFluency"),
              grammar: t("profile.atsQuality_grammar"),
              consistency: t("profile.atsQuality_consistency"),
              evidenceAuthentication: t("profile.atsQuality_evidenceAuthentication"),
              sectionBalance: t("profile.atsQuality_sectionBalance"),
              contactCompleteness: t("profile.atsQuality_contactCompleteness"),
              bulletQuality: t("profile.atsQuality_bulletQuality"),
              dateRecency: t("profile.atsQuality_dateRecency"),
            };
            (Object.keys(report.qualityChecks) as Array<keyof typeof report.qualityChecks>).forEach((key) => {
              const item = report.qualityChecks![key];
              if (item && typeof item.score === "number" && item.score < 60) {
                const label = qualityKeyLabels[key] ?? key;
                deductionItems.push({ label, score: item.score, note: item.note });
              }
            });
          }
          deductionItems.sort((a, b) => a.score - b.score);
          if (deductionItems.length === 0) return null;
          return (
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid var(--border-default)" }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                {t("profile.atsWhereDeducted")}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                {t("profile.atsWhereDeductedHint")}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {deductionItems.map((item, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.75 }}>
                    <Box component="span" sx={{ mt: 0.2, flexShrink: 0, display: "inline-flex" }}><IconWrapper icon="mdi:arrow-down-circle" size={20} color="var(--ats-error-muted)" /></Box>
                    <Box>
                      <Typography component="li" variant="body2" sx={{ listStyle: "none", fontWeight: 500 }}>
                        {item.label}: <Box component="span" sx={{ color: "var(--ats-error-muted)", fontWeight: 700 }}>{item.score}/100</Box>
                      </Typography>
                      {item.note && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, pl: 0 }}>{item.note}</Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })()}

        {report.qualityChecks && Object.keys(report.qualityChecks).length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid var(--border-default)" }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
              {t("profile.atsQualityStandards")}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {(
                [
                  "spacingAlignment",
                  "tone",
                  "languageFluency",
                  "grammar",
                  "consistency",
                  "evidenceAuthentication",
                  "sectionBalance",
                  "contactCompleteness",
                  "bulletQuality",
                  "dateRecency",
                ] as const
              ).map((key) => {
                const item = report.qualityChecks![key];
                  if (!item || typeof item.score !== "number") return null;
                  const label = t(`profile.atsQuality_${key}`);
                  const color = getScoreColor(item.score) === "success" ? "var(--ats-success-muted)" : getScoreColor(item.score) === "warning" ? "var(--ats-warning-muted)" : "var(--ats-error-muted)";
                  return (
                    <Box key={key} sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500}>{label}</Typography>
                        {item.note && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>{item.note}</Typography>
                        )}
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color }}>{item.score}/100</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

        {report.detailedReport && (
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid var(--border-default)" }}>
            {report.detailedReport.executiveSummary && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                  {t("profile.atsExecutiveSummary")}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {report.detailedReport.executiveSummary}
                </Typography>
              </Box>
            )}
            {report.detailedReport.resumeGoodFor && report.detailedReport.resumeGoodFor.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  {t("profile.atsResumeGoodFor")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {report.detailedReport.resumeGoodFor.map((item, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                      <Box component="span" sx={{ mt: 0.2, flexShrink: 0, display: "inline-flex" }}><IconWrapper icon="mdi:briefcase-check-outline" size={20} color="var(--accent-indigo)" /></Box>
                      <Typography component="li" variant="body2" sx={{ listStyle: "none" }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            {report.detailedReport.goodThings.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  {t("profile.atsGoodThings")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {report.detailedReport.goodThings.map((item, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.75 }}>
                        <Box component="span" sx={{ mt: 0.2, flexShrink: 0, display: "inline-flex" }}><IconWrapper icon="mdi:check-circle" size={20} color="var(--ats-success-muted)" /></Box>
                        <Typography component="li" variant="body2" sx={{ listStyle: "none" }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            {report.detailedReport.scopeForImprovement.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  {t("profile.atsScopeForImprovement")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {report.detailedReport.scopeForImprovement.map((item, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.75 }}>
                        <Box component="span" sx={{ mt: 0.2, flexShrink: 0, display: "inline-flex" }}><IconWrapper icon="mdi:alert-circle" size={20} color="var(--ats-warning)" /></Box>
                        <Typography component="li" variant="body2" sx={{ listStyle: "none" }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            {report.detailedReport.suggestions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                  {t("profile.atsSuggestions")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {report.detailedReport.suggestions.map((item, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.75 }}>
                        <Box component="span" sx={{ mt: 0.2, flexShrink: 0, display: "inline-flex" }}><IconWrapper icon="mdi:lightbulb-outline" size={20} color="var(--accent-indigo)" /></Box>
                        <Typography component="li" variant="body2" sx={{ listStyle: "none" }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

        {aiResult?.linkValidation && aiResult.linkValidation.length > 0 && (
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid var(--border-default)" }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                {t("profile.atsLinkValidation")}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {aiResult!.linkValidation!.map((item, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    {item.ok ? (
                      <Box component="span" sx={{ flexShrink: 0, display: "inline-flex" }}><IconWrapper icon="mdi:check-circle" size={20} color="var(--ats-success-muted)" /></Box>
                    ) : (
                      <Box component="span" sx={{ flexShrink: 0, display: "inline-flex" }}><IconWrapper icon="mdi:close-circle" size={20} color="var(--ats-error-muted)" /></Box>
                    )}
                    <Typography variant="body2" component="li" sx={{ listStyle: "none" }}>
                      <strong>{item.label}:</strong>{" "}
                      <Box component="a" href={item.url} target="_blank" rel="noopener noreferrer" sx={{ color: "primary.main", wordBreak: "break-all" }}>
                        {item.url}
                      </Box>
                      {!item.ok && (
                        <Typography component="span" variant="caption" color="error.main" sx={{ ml: 0.5 }}>
                          ({item.errorPage ? t("profile.atsLinkErrorPage") : t("profile.atsLinkUnreachable")})
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

        {(report.detailedReport?.authenticityScore != null || (report.detailedReport?.authenticityConcerns?.length ?? 0) > 0) && (
          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid var(--border-default)" }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
              {t("profile.atsAuthenticity")}
            </Typography>
            {report.detailedReport?.authenticityScore != null && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="body2">
                  {t("profile.atsAuthenticityScore")}:{" "}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: getScoreColor(report.detailedReport.authenticityScore) === "success" ? "var(--ats-success-muted)" : getScoreColor(report.detailedReport.authenticityScore) === "warning" ? "var(--ats-warning-muted)" : "var(--ats-error-muted)" }}>
                  {report.detailedReport.authenticityScore}/100
                </Typography>
              </Box>
            )}
            {report.detailedReport?.authenticityConcerns && report.detailedReport.authenticityConcerns.length > 0 && (
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {report.detailedReport.authenticityConcerns.map((c, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                    <Box component="span" sx={{ mt: 0.25, flexShrink: 0, display: "inline-flex" }}><IconWrapper icon="mdi:alert-circle-outline" size={18} color="var(--ats-warning)" /></Box>
                    <Typography component="li" variant="body2" sx={{ listStyle: "none" }}>{c}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
          {t("profile.atsDetails")}
        </Typography>
        {CATEGORY_KEYS.map((key) => {
          const cat = report.feedback[key];
            return (
              <Accordion
                key={key}
                expanded={detailsExpanded === key}
                onChange={(_, exp) => setDetailsExpanded(exp ? key : false)}
                elevation={0}
                sx={{
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px !important",
                  mb: 1,
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {categoryLabels[key]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(cat.score)}/100
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {cat.message && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {cat.message}
                    </Typography>
                  )}
                  {cat.positivePoints && cat.positivePoints.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {cat.positivePoints.map((p, i) => (
                        <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                          <Box component="span" sx={{ mt: 0.25, display: "inline-flex" }}><IconWrapper icon="mdi:check-circle" size={18} color="var(--ats-success-muted)" /></Box>
                          <Typography variant="body2">{p}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {cat.improvementPoints && cat.improvementPoints.length > 0 && (
                    <Box>
                      {cat.improvementPoints.map((p, i) => (
                        <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                          <Box component="span" sx={{ mt: 0.25, display: "inline-flex" }}><IconWrapper icon="mdi:alert-circle" size={18} color="var(--ats-warning)" /></Box>
                          <Typography variant="body2">{p}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
      </>
      )}
    </Paper>
  );
}
