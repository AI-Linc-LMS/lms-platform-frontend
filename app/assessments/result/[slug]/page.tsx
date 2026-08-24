"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, Button, Paper, Alert, Typography, CircularProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  assessmentService,
  AssessmentDetail,
  AssessmentResult,
  AssessmentDetailsSnapshot,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { EnhancedStatsBar } from "@/components/assessment/result/EnhancedStatsBar";
import {
  GradientRing,
  StatStrip,
  StatusChip,
} from "@/components/admin/assessment/shared";
import { TopicWiseBreakdown } from "@/components/assessment/result/TopicWiseBreakdown";
import { EnhancedSkillsTags } from "@/components/assessment/result/EnhancedSkillsTags";
import { OverallFeedback } from "@/components/assessment/result/OverallFeedback";
// Loads on demand: the psychometric view drags the whole recharts stack.
import dynamic from "next/dynamic";
const PsychometricResultView = dynamic(
  () => import("@/components/assessment/result/PsychometricResultView").then(m => m.PsychometricResultView),
  { ssr: false },
);
import { EyeMovementViolations } from "@/components/assessment/result/EyeMovementViolations";
import { QuizResponsesSection } from "@/components/assessment/result/QuizResponsesSection";
import { CodingProblemResponsesSection } from "@/components/assessment/result/CodingProblemResponsesSection";
import { SubjectiveResponsesSection } from "@/components/assessment/result/SubjectiveResponsesSection";
import { buildAssessmentFeedbackPoints } from "@/lib/utils/assessment-feedback.utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { generateAssessmentResultPdfVector } from "@/lib/utils/assessment-result-pdf.utils";
import { preloadPdfBrandAssets } from "@/lib/utils/assessment-pdf-assets";
import { resolveCertificateLogoUrl } from "@/lib/utils/resolveCertificateLogoUrl";
import { getMockPsychometricData } from "@/lib/mock-data/assessment-mock-data";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";
import {
  certificateFileBase,
  downloadCertificatePdf,
  downloadCertificatePng,
} from "@/lib/certificates/export";
import { learnerCertificatesService } from "@/lib/services/certificates.service";
import type { CertificateRenderPayload } from "@/lib/certificates/types";

async function getAssessmentResultWithRetry(
  slug: string,
  attemptId?: number | string,
  retries = 3,
  delayMs = 600,
): Promise<AssessmentResult> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await assessmentService.getAssessmentResult(slug, attemptId);
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      // Retry only on 404 - covers the brief window after submit where the
      // result row isn't queryable yet. Other errors (auth, server) fail fast.
      if (status !== 404 || attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

/**
 * Performance band - mirrors ScoreDisplay's thresholds exactly
 * (>=80 Excellent / >=60 Good / >=40 Average / else Needs Improvement) so the
 * ring hero stays consistent with the retired gradient-bar card.
 */
function getPerformanceBand(pct: number): {
  label: string;
  tone: "success" | "info" | "warning" | "error";
  icon: string;
} {
  if (pct >= 80) return { label: "Excellent", tone: "success", icon: "mdi:trophy" };
  if (pct >= 60) return { label: "Good", tone: "info", icon: "mdi:medal" };
  if (pct >= 40) return { label: "Average", tone: "warning", icon: "mdi:chart-line" };
  return { label: "Needs Improvement", tone: "error", icon: "mdi:alert-circle" };
}

/** Minutes → "45 min" / "1h 20m" (mirrors EnhancedStatsBar's formatter). */
function formatResultMinutes(minutes: number): string {
  const m = Number.isFinite(minutes) ? minutes : 0;
  if (m < 60) return `${Math.round(m)} min`;
  const hours = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null);

  const [psychometricData, setPsychometricData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentDetailsSnapshot | null>(null);
  // The credential the SERVER issued for this assessment, or null. There is no
  // local notion of "eligible" any more: either the backend gave this learner a
  // certificate or it did not.
  const [certificate, setCertificate] = useState<CertificateRenderPayload | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateExporting, setCertificateExporting] = useState<"png" | "pdf" | null>(null);
  // Points at the untransformed 1000x707 artwork node, never at the scaled
  // preview wrapper: html-to-image reads clientWidth, which a CSS transform does
  // not change, so exporting the wrapper would bake the shrink into the file.
  const certificateNodeRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();
  const { user } = useAuth();
  const { clientInfo } = useClientInfo();
  const { t } = useTranslation("common");

  const forcePsychometric = searchParams?.get("type") === "psychometric";

  useEffect(() => {
    if (!slug) return;
    loadAssessmentResult();
  }, [slug]);


  /**
   * Ask the backend whether this learner earned a certificate for this
   * assessment, and if so render the credential it actually issued.
   *
   * What this replaces, and why it had to go. The page used to decide
   * eligibility here in the browser by comparing the score against the pass
   * bands, then find the artwork by downloading the tenant's ENTIRE uploaded
   * certificate file list and substring-matching presigned URLs for
   * `/certificate/<clientId>/<slug>/<tier>/`. Two failures came out of that.
   * Renaming an assessment's slug made every certificate for it silently
   * disappear, with no error raised anywhere. And every learner who opened any
   * result page downloaded every certificate URL the tenant had ever uploaded,
   * for every other assessment and course.
   *
   * Claiming is an idempotent get_or_create behind the same gate the eager
   * issuance path uses, so this either returns the credential the learner
   * already holds, mints the one they just earned, or refuses. A refusal is the
   * ordinary outcome for a score below the band and must stay silent.
   */
  useEffect(() => {
    const assessmentId = assessmentDetail?.id;
    if (!assessmentResult || !assessmentId) {
      setCertificate(null);
      return;
    }
    // The one thing still worth short-circuiting locally: the backend has said
    // outright that this assessment awards no certificate, so do not ask.
    if (assessmentDetail?.certificate_available === false) {
      setCertificate(null);
      return;
    }

    let cancelled = false;
    setCertificateLoading(true);
    learnerCertificatesService
      .claimAssessment(assessmentId)
      .then((claim) => learnerCertificatesService.detail(claim.credential_id))
      .then((payload) => {
        if (!cancelled) setCertificate(payload);
      })
      .catch(() => {
        if (!cancelled) setCertificate(null);
      })
      .finally(() => {
        if (!cancelled) setCertificateLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assessmentResult, assessmentDetail?.id, assessmentDetail?.certificate_available]);

  const loadAssessmentResult = async (attemptId?: number | string) => {
    try {
      const slugLower = slug?.toLowerCase() || "";

      const isPsychometric =
        forcePsychometric ||
        slugLower.includes("psychometric") ||
        slugLower.includes("kdisha") ||
        slugLower.includes("ksage");

      if (isPsychometric) {
        await new Promise((r) => setTimeout(r, 300));
        setPsychometricData(getMockPsychometricData(slug));
        setLoading(false);
        return;
      }

      const result = await getAssessmentResultWithRetry(slug, attemptId);
      setAssessmentDetail(result?.assessment_details || null);
      if ((result as any).assessment_meta) {
        setPsychometricData(result);
      } else {
        setAssessmentResult(result);
      }
    } catch (error) {
      showToast("Failed to load assessment results", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAttemptChange = async (attemptId: number) => {
    if (attemptId === assessmentResult?.current_attempt_id) return;
    setLoading(true);
    await loadAssessmentResult(attemptId);
  };

  if (loading) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!assessmentResult && !psychometricData) return null;

  if (psychometricData) {
    return (
      <MainLayout>
        <PsychometricResultView data={psychometricData} />
      </MainLayout>
    );
  }

  const stats = assessmentResult?.stats || ({} as AssessmentResult["stats"]);
  const resultHidden = assessmentResult?.show_result === false;
  const tabSwitchAutoSubmit =
    assessmentResult?.auto_submitted_reason === "tab_switch_limit";

  const quizResponses = assessmentResult?.user_responses?.quiz_responses || [];

  const codingResponses =
    assessmentResult?.user_responses?.coding_problem_responses || [];

  const subjectiveResponses =
    assessmentResult?.user_responses?.subjective_responses || [];

  const hasQuiz = quizResponses.length > 0;
  const hasCoding = codingResponses.length > 0;
  const hasSubjective = subjectiveResponses.length > 0;

  // Score hero - same pct the retired ScoreDisplay used (score / maximum_marks * 100).
  const heroScore = Number(stats.score) || 0;
  const heroMax = Number(stats.maximum_marks) || 0;
  const heroPct = heroMax > 0 ? (heroScore / heroMax) * 100 : 0;
  const heroBand = getPerformanceBand(heroPct);
  const heroScoreText = heroMax > 0 ? `${heroScore} / ${heroMax}` : `${heroScore}`;
  const heroSummary =
    heroMax > 0
      ? `You scored ${heroScore} out of ${heroMax} (${Math.round(heroPct)}%) - ${heroBand.label.toLowerCase()} performance.`
      : "Your submission has been evaluated.";

  const handleDownloadResultPdf = async () => {
    if (!assessmentResult || pdfExporting) return;

    setPdfExporting(true);

    try {
      const base =
        (assessmentResult.assessment_name || slug || "assessment-result")
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "") || "assessment-result";

      const fromProfile =
        user &&
        ([user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
          user.user_name ||
          user.email)
          ? {
              name:
                [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
                user.user_name ||
                undefined,
              email: user.email || undefined,
            }
          : undefined;

      // The report carries the INSTITUTION's mark, not ours — a learner keeps this document and
      // may forward it. Awaited because the generator below is synchronous and reads whatever has
      // been loaded by the time it runs; skip this and every tenant's report is AI Linc-branded.
      await preloadPdfBrandAssets({
        name: clientInfo?.name,
        logoUrl: resolveCertificateLogoUrl(clientInfo),
      });

      await generateAssessmentResultPdfVector(
        assessmentResult,
        `${base}-result.pdf`,
        fromProfile,
      );
      showToast("PDF downloaded", "success");
    } catch {
      showToast("Could not generate PDF", "error");
    } finally {
      setPdfExporting(false);
    }
  };

  /**
   * Export the credential exactly as it was issued. Both handlers rasterise the
   * off-screen 1000x707 artwork node, so the PNG a learner attaches to an
   * application and the page a verifier opens at the credential URL are the same
   * drawing rather than two implementations that can disagree.
   */
  const handleDownloadCertificate = async (format: "png" | "pdf") => {
    const node = certificateNodeRef.current;
    if (!certificate || !node || certificateExporting) return;
    try {
      setCertificateExporting(format);
      const base = certificateFileBase(certificate);
      if (format === "png") {
        await downloadCertificatePng(node, `${base}.png`);
      } else {
        await downloadCertificatePdf(node, `${base}.pdf`);
      }
      showToast(t("certificates.downloadStarted", "Certificate downloaded."), "success");
    } catch {
      showToast(
        t("certificates.downloadFailed", "Could not download your certificate."),
        "error",
      );
    } finally {
      setCertificateExporting(null);
    }
  };

  const handleCopyVerifyLink = async () => {
    if (!certificate?.verify_url) return;
    try {
      await navigator.clipboard.writeText(certificate.verify_url);
      showToast(t("certificates.linkCopied", "Verification link copied."), "success");
    } catch {
      showToast(t("certificates.linkCopyFailed", "Could not copy the link."), "warning");
    }
  };

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ bgcolor: "var(--canvas)", minHeight: "100%", p: { xs: 2, sm: 3, md: 4 } }}>
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
        }}
      >
        {/* Top Actions */}
        <Box
          className="exclude-from-pdf"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
            onClick={() => router.push("/assessments")}
          >
            Back
          </Button>

          <Button
            variant="outlined"
            disabled={pdfExporting}
            startIcon={
              <IconWrapper icon="mdi:file-download-outline" size={20} />
            }
            onClick={handleDownloadResultPdf}
          >
            {pdfExporting ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </Box>

        {/* Header - prominent dark gradient banner (mirrors assessment management).
            Non-excluded from the DOM PDF path; the assessment title is data-driven in
            the vector PDF regardless. Interactive chrome stays in the action bar above. */}
        <Box
          sx={{
            mb: 3,
            position: "relative",
            overflow: "hidden",
            borderRadius: "22px",
            p: { xs: 3, md: 4 },
            color: "#fff",
            background:
              "linear-gradient(115deg, #2b1244 0%, #3d1663 45%, #6b1a52 82%, #7d2058 100%)",
            boxShadow: "0 28px 56px -28px rgba(61, 22, 99, 0.55)",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              background: "var(--gradient-ai)",
              fontSize: "0.7rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              mb: 1.5,
            }}
          >
            <IconWrapper icon="mdi:file-document-check" size={14} /> YOUR RESULT
          </Box>
          <Typography
            sx={{
              fontFamily: "var(--font-jakarta)",
              fontWeight: 800,
              fontSize: { xs: "1.5rem", md: "2rem" },
              lineHeight: 1.15,
              mb: 1.5,
            }}
          >
            {assessmentResult?.assessment_name || ""}
          </Typography>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.24)",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            <IconWrapper icon="mdi:check-circle" size={15} />
            {assessmentResult?.status && assessmentResult.status !== "submitted"
              ? assessmentResult.status
              : "Completed"}
          </Box>
        </Box>

        {/* Multi-attempt selector. Renders only when this learner has more
            than one submitted attempt - i.e. admin has granted at least one
            retake that was consumed and finalized. Clicking an attempt
            refetches the full result payload for that submission. */}
        {assessmentResult?.attempts && assessmentResult.attempts.length > 1 && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1.5,
              }}
            >
              <IconWrapper icon="mdi:history" size={18} color="var(--ai-violet)" />
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: "var(--font-jakarta)",
                  fontWeight: 800,
                  color: "var(--font-primary)",
                }}
              >
                Attempt history
              </Typography>
              <Box sx={{ ml: "auto" }}>
                <StatusChip
                  label={`${assessmentResult.attempts.length} attempts`}
                  tone="info"
                />
              </Box>
            </Box>
            {/* SegmentedTabs-like pill track - same handleAttemptChange contract. */}
            <Box
              role="tablist"
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.75,
                p: 0.75,
                borderRadius: "var(--radius-card)",
                border:
                  "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
                bgcolor: "var(--card-bg)",
                boxShadow:
                  "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
                maxWidth: "100%",
              }}
            >
              {assessmentResult.attempts.map((att) => {
                const isCurrent = att.id === assessmentResult.current_attempt_id;
                const dateLabel = att.submitted_at
                  ? new Date(att.submitted_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "-";
                const scoreLabel = att.score != null ? `${att.score}` : "-";
                return (
                  <Box
                    key={att.id}
                    role="tab"
                    aria-selected={isCurrent}
                    tabIndex={0}
                    onClick={() => {
                      if (!loading) handleAttemptChange(att.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!loading) handleAttemptChange(att.id);
                      }
                    }}
                    sx={{
                      cursor: loading ? "default" : "pointer",
                      opacity: loading && !isCurrent ? 0.55 : 1,
                      minWidth: 132,
                      px: 2,
                      py: 1,
                      borderRadius: 999,
                      transition:
                        "background-color 0.15s ease, color 0.15s ease",
                      color: isCurrent
                        ? "var(--font-light)"
                        : "var(--font-secondary)",
                      bgcolor: isCurrent ? "var(--ai-violet)" : "transparent",
                      boxShadow: isCurrent
                        ? "0 6px 14px -8px color-mix(in srgb, var(--ai-violet) 70%, transparent)"
                        : "none",
                      "&:hover": isCurrent
                        ? {}
                        : {
                            bgcolor:
                              "color-mix(in srgb, var(--ai-violet) 10%, var(--surface) 90%)",
                            color: "var(--ai-violet)",
                          },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        lineHeight: 1.35,
                        opacity: isCurrent ? 0.9 : 0.75,
                      }}
                    >
                      Attempt {att.attempt_number}
                      {isCurrent ? " · current" : ""}
                    </Typography>
                    <Typography
                      sx={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.35 }}
                    >
                      Score: {scoreLabel}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        lineHeight: 1.35,
                        opacity: isCurrent ? 0.85 : 0.65,
                      }}
                    >
                      {dateLabel}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {resultHidden && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {assessmentResult?.review_status === "published"
                ? "Result visibility is currently disabled."
                : "Your assessment is under manual evaluation. Results will appear after publish."}
            </Typography>
          </Alert>
        )}

        {tabSwitchAutoSubmit && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {assessmentResult?.auto_submit_message ||
                "This assessment was auto-submitted because the tab-switch limit was reached."}
            </Typography>
          </Alert>
        )}

        {!resultHidden && (
          <>

        {/* Score hero - gradient percentage ring + performance band */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: { xs: 3, md: 4 },
            borderRadius: "var(--radius-card)",
            bgcolor: "var(--card-bg)",
            border: "1px solid var(--border-default)",
            boxShadow:
              "0 2px 8px color-mix(in srgb, var(--font-primary) 8%, transparent)",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            gap: { xs: 2.5, sm: 4 },
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <GradientRing
              value={heroPct}
              size={184}
              strokeWidth={14}
              caption="Score"
              valueFontSize={46}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
                mb: 1.5,
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <StatusChip
                label={heroBand.label}
                tone={heroBand.tone}
                icon={heroBand.icon}
              />
              <Typography
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                  color: "var(--font-primary)",
                }}
              >
                {heroScoreText}
              </Typography>
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: "var(--font-secondary)",
                maxWidth: 560,
                lineHeight: 1.6,
              }}
            >
              {heroSummary}
            </Typography>
          </Box>
        </Paper>

        {/* Headline stats */}
        <Box sx={{ mb: 3 }}>
          <StatStrip
            items={[
              {
                label: "Accuracy",
                value: `${(Number(stats.accuracy_percent) || 0).toFixed(1)}%`,
                icon: "mdi:target-variant",
                tone: "var(--accent-blue-light)",
              },
              {
                label: "Percentile",
                value: `${(Number(stats.percentile) || 0).toFixed(1)}%`,
                icon: "mdi:chart-bell-curve-cumulative",
                tone: "var(--assessment-chart-violet)",
              },
              {
                label: "Attempted",
                value: `${Number(stats.attempted_questions) || 0}/${Number(stats.total_questions) || 0}`,
                icon: "mdi:help-circle",
                tone: "var(--accent-indigo)",
              },
              {
                label: "Correct",
                value: Number(stats.correct_answers) || 0,
                icon: "mdi:check-circle",
                tone: "var(--course-cta)",
              },
              {
                label: "Time",
                value: formatResultMinutes(Number(stats.time_taken_minutes) || 0),
                icon: "mdi:clock-time-four",
                tone: "var(--accent-purple)",
              },
            ]}
          />
        </Box>
        {certificateLoading && !certificate ? (
          <Paper
            className="exclude-from-pdf"
            elevation={0}
            sx={{
              mt: 3,
              mb: 2,
              p: 2.5,
              borderRadius: "var(--radius-card)",
              bgcolor: "var(--card-bg)",
              border: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              {t("certificates.checking", "Checking whether you earned a certificate…")}
            </Typography>
          </Paper>
        ) : null}

        {certificate ? (
          <Paper
            className="exclude-from-pdf"
            elevation={0}
            sx={{
              mt: 3,
              mb: 2,
              p: 2.5,
              borderRadius: "var(--radius-card)",
              bgcolor: "var(--card-bg)",
              border: "1px solid var(--border-default)",
              boxShadow:
                "0 2px 8px color-mix(in srgb, var(--font-primary) 8%, transparent)",
            }}
          >
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                fontFamily: "var(--font-jakarta)",
                fontWeight: 800,
                color: "var(--font-primary)",
              }}
            >
              {t("certificates.yourCertificate", "Your certificate")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(
                "certificates.resultHelp",
                "This is the credential your organization issued you. The Download PDF button at the top of the page is your full result report, not this certificate.",
              )}
            </Typography>

            {/* The scaled preview holds the ref for the export, so what downloads
                is the full-resolution artwork and not this thumbnail. */}
            <Box sx={{ maxWidth: 620, mb: 2 }}>
              <CertificatePreview ref={certificateNodeRef} payload={certificate} />
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
              <Button
                variant="contained"
                disabled={certificateExporting !== null}
                startIcon={
                  certificateExporting === "png" ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <IconWrapper icon="mdi:image-outline" size={18} />
                  )
                }
                onClick={() => handleDownloadCertificate("png")}
              >
                {t("certificates.downloadPng", "Download PNG")}
              </Button>
              <Button
                variant="outlined"
                disabled={certificateExporting !== null}
                startIcon={
                  certificateExporting === "pdf" ? (
                    <CircularProgress size={16} />
                  ) : (
                    <IconWrapper icon="mdi:file-pdf-box" size={18} />
                  )
                }
                onClick={() => handleDownloadCertificate("pdf")}
              >
                {t("certificates.downloadPdf", "Download PDF")}
              </Button>
              {certificate.verify_url ? (
                <Button
                  variant="text"
                  startIcon={<IconWrapper icon="mdi:link-variant" size={18} />}
                  onClick={handleCopyVerifyLink}
                >
                  {t("certificates.copyVerifyLink", "Copy verification link")}
                </Button>
              ) : null}
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1.5 }}
            >
              {t("certificates.credentialIdLabel", "Credential ID")}:{" "}
              <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                {certificate.credential_id}
              </Box>
            </Typography>
          </Paper>
        ) : null}

        {/* Stats */}
        <EnhancedStatsBar
          totalQuestions={stats.total_questions}
          attemptedQuestions={stats.attempted_questions}
          correctAnswers={stats.correct_answers}
          incorrectAnswers={stats.incorrect_answers}
          timeTakenMinutes={stats.time_taken_minutes}
          totalTimeMinutes={stats.total_time_minutes}
        />

        {/* Proctoring */}
        {assessmentResult?.proctoring?.eye_movement_count &&
          assessmentResult?.proctoring?.eye_movement_count > 0 && (
            <EyeMovementViolations
              violations={
                assessmentResult?.proctoring?.eye_movement_violations || []
              }
              count={assessmentResult?.proctoring?.eye_movement_count || 0}
            />
          )}

        {/* Topic breakdown */}
        {stats.topic_wise_stats &&
          Object.keys(stats.topic_wise_stats).length > 0 && (
            <TopicWiseBreakdown topicWiseStats={stats.topic_wise_stats} />
          )}

        {/* Skills */}
        {(stats.top_skills?.length > 0 || stats.low_skills?.length > 0) && (
          <EnhancedSkillsTags
            strongSkills={stats.top_skills || []}
            weakSkills={stats.low_skills || []}
          />
        )}

        {/* Quiz Section */}
        {hasQuiz && <QuizResponsesSection quizResponses={quizResponses} />}

        {/* Coding Section */}
        {hasCoding && (
          <CodingProblemResponsesSection codingResponses={codingResponses} />
        )}

        {/* Written (subjective) Section */}
        {hasSubjective && (
          <SubjectiveResponsesSection subjectiveResponses={subjectiveResponses} />
        )}

        {/* Feedback */}
        <OverallFeedback
          feedbackPoints={buildAssessmentFeedbackPoints(
            assessmentResult as AssessmentResult
          )}
        />
          </>
        )}
      </Box>
      </Box>
    </MainLayout>
  );
}
