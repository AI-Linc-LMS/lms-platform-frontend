"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { AssessmentResultHeader } from "@/components/assessment/result/AssessmentResultHeader";
import { EnhancedStatsBar } from "@/components/assessment/result/EnhancedStatsBar";
import {
  GradientRing,
  StatStrip,
  StatusChip,
} from "@/components/admin/assessment/shared";
import { TopicWiseBreakdown } from "@/components/assessment/result/TopicWiseBreakdown";
import { EnhancedSkillsTags } from "@/components/assessment/result/EnhancedSkillsTags";
import { OverallFeedback } from "@/components/assessment/result/OverallFeedback";
import { PsychometricResultView } from "@/components/assessment/result/PsychometricResultView";
import { EyeMovementViolations } from "@/components/assessment/result/EyeMovementViolations";
import { QuizResponsesSection } from "@/components/assessment/result/QuizResponsesSection";
import { CodingProblemResponsesSection } from "@/components/assessment/result/CodingProblemResponsesSection";
import { SubjectiveResponsesSection } from "@/components/assessment/result/SubjectiveResponsesSection";
import { buildAssessmentFeedbackPoints } from "@/lib/utils/assessment-feedback.utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { generateAssessmentResultPdfVector } from "@/lib/utils/assessment-result-pdf.utils";
import { getMockPsychometricData } from "@/lib/mock-data/assessment-mock-data";
import {
  buildAssessmentAppreciationCertificate,
  buildAssessmentResultCertificate,
} from "@/lib/certificate/copy";
import {
  buildCertificateBranding,
  finalizeBranding,
} from "@/lib/certificate/client-branding";
import { isScoreInAppreciationBand, scoreToPercent } from "@/lib/certificate/pass-band";
import { getLearnerDisplayNameFromResult } from "@/lib/certificate/learner-name";
import { CertificateLearnerToolbar } from "@/components/certificate/CertificateLearnerToolbar";
import { DynamicCertificate } from "@/components/certificate/DynamicCertificate";
import { getUploadedFiles } from "@/lib/services/file-upload.service";
import { config } from "@/lib/config";

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
      // Retry only on 404 — covers the brief window after submit where the
      // result row isn't queryable yet. Other errors (auth, server) fail fast.
      if (status !== 404 || attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

function sanitizeCertificateFileSegment(raw: string, fallback: string): string {
  const s = raw
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return s || fallback;
}

function asNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function looksLikeImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
}

/**
 * Performance band — mirrors ScoreDisplay's thresholds exactly
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

function pickCertificateCourseDisplayName(
  detail: AssessmentDetailsSnapshot | null | undefined,
): string | null {
  if (!detail) return null;
  const picks = [
    detail.certificate_course_name,
    detail.course_title,
    detail.certificateCourseName,
    detail.courseTitle,
  ];
  for (const v of picks) {
    if (typeof v === "string") {
      const t = v.trim();
      if (t) return t;
    }
  }
  return null;
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
  const [uploadCertificateExporting, setUploadCertificateExporting] = useState(false);
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentDetailsSnapshot | null>(null);
  const [uploadedCertificateUrl, setUploadedCertificateUrl] = useState<string>("");
  const [uploadedCertificateTier, setUploadedCertificateTier] =
    useState<"participation" | "excellence"|"">();
  const [checkingUploadedCertificate, setCheckingUploadedCertificate] = useState(false);

  const { showToast } = useToast();
  const { user } = useAuth();
  const { clientInfo } = useClientInfo();

  /** Remount certificate export when tenant branding loads or changes */
  const certificateBrandingKey = useMemo(() => {
    if (!clientInfo) return "client-pending";
    return [
      clientInfo.id ?? "",
      clientInfo.name ?? "",
      clientInfo.slug ?? "",
      clientInfo.app_logo_url ?? "",
      clientInfo.login_logo_url ?? "",
      clientInfo.app_icon_url ?? "",
    ].join("|");
  }, [clientInfo]);

  const forcePsychometric = searchParams?.get("type") === "psychometric";

  useEffect(() => {
    if (!slug) return;
    loadAssessmentResult();
  }, [slug]);


  const inAppreciationBand = useMemo(() => {
    if (!assessmentResult || !assessmentDetail?.certificate_available) return false;
    const s = assessmentResult.stats;
    const pct = scoreToPercent(s.score, s.maximum_marks);
    return isScoreInAppreciationBand(
      pct,
      assessmentDetail.pass_band_lower_min_percent,
      assessmentDetail.pass_band_upper_min_percent
    );
  }, [assessmentResult, assessmentDetail]);

  const preferredCertificateTier = useMemo<"participation" | "excellence"|"">(() => {
   
    if (!assessmentResult || !assessmentDetail?.certificate_available) {
      return "";
    }
    const upper = asNumber(assessmentDetail.pass_band_upper_min_percent);
    const lower = asNumber(assessmentDetail?.pass_band_lower_min_percent||0);
    if (upper == null||lower == null) return "";
    const pct =scoreToPercent(assessmentResult.stats?.score, assessmentResult.stats?.maximum_marks);
    return pct >= upper ? "excellence" : pct<=upper && pct>=lower ? "participation" : "";
  }, [assessmentResult, assessmentDetail]);

  const isCertificateEligible = useMemo(() => {
    if (!assessmentResult || !assessmentDetail?.certificate_available) return false;
    const lower = asNumber(assessmentDetail.pass_band_lower_min_percent);
    if (lower == null) return false;
    const pct = scoreToPercent(
      assessmentResult.stats?.score,
      assessmentResult.stats?.maximum_marks,
    );
    return pct > lower;
  }, [assessmentResult, assessmentDetail]);

  /** Shown after “For completing structured training in …”. API course label if set, else assessment/test title. */
  const structuredTrainingSubject = useMemo(() => {
    const fromApi = pickCertificateCourseDisplayName(assessmentDetail);
    if (fromApi) return fromApi;
    const fallback = (
      assessmentResult?.assessment_name ||
      assessmentDetail?.title ||
      slug ||
      ""
    ).trim();
    return fallback || null;
  }, [assessmentDetail, assessmentResult, slug]);

  useEffect(() => {
    if (!assessmentResult) {
      setUploadedCertificateUrl("");
      return;
    }

    // Only skip when backend explicitly disables certificates.
    if (assessmentDetail?.certificate_available === false) {
      setUploadedCertificateUrl("");
      return;
    }

    if (!isCertificateEligible || !preferredCertificateTier) {
      setUploadedCertificateUrl("");
      setCheckingUploadedCertificate(false);
      return;
    }


    const clientId = Number(config.clientId);
    if (!Number.isFinite(clientId) || clientId <= 0) {
      setUploadedCertificateUrl("");
      return;
    }

    const folderSlug = (assessmentDetail?.slug || slug || "").trim().toLowerCase();
    if (!folderSlug) {
      setUploadedCertificateUrl("");
      return;
    }

    let cancelled = false;
    setCheckingUploadedCertificate(true);
    setUploadedCertificateTier(preferredCertificateTier);

    getUploadedFiles(clientId,"certificate")
      .then((res) => {
        if (cancelled) return;
        const files = Array.isArray(res?.files) ? res.files?.filter((f) => f.module === "certificate") : [];
        const pathNeedle = `/certificate/${clientId}/${folderSlug}/${preferredCertificateTier}/`;
        const byPath = files.find((f) =>
          (f.url || "").toLowerCase().includes(pathNeedle)
        );
        // Fallback for alternate backend layouts: ensure at least client + slug + tier are present.
        const relaxed = files.find((f) => {
          const u = (f.url || "").toLowerCase();
          return (
            u.includes(`/certificate/${clientId}/`) &&
            u.includes(`/${folderSlug}/`) &&
            u.includes(`/${preferredCertificateTier}/`)
          );
        });

        setUploadedCertificateUrl((byPath?.url || relaxed?.url || "").trim());
      })
      .catch(() => {
        if (!cancelled) setUploadedCertificateUrl("");
      })
      .finally(() => {
        if (!cancelled) setCheckingUploadedCertificate(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assessmentResult, assessmentDetail, isCertificateEligible, preferredCertificateTier, slug]);

  /** Classic achievement wording (no credential lines). Shown only when score is in the appreciation band. */
  const appreciationCertificateContent = useMemo(() => {
    if (!assessmentResult || !user || !assessmentDetail?.certificate_available || !inAppreciationBand) {
      return null;
    }
    const s = assessmentResult.stats;
    const pct = scoreToPercent(s.score, s.maximum_marks);
    const scorePct = Math.round(pct);
    const max = Number(s.maximum_marks) || 0;
    const scoreText =
      max > 0 ? `${s.score} / ${max} (${scorePct}%)` : `${scorePct}%`;
    const name = getLearnerDisplayNameFromResult(assessmentResult, user);
    return buildAssessmentAppreciationCertificate({
      recipientName: name,
      assessmentTitle: assessmentResult.assessment_name || slug,
      certificateCourseName: structuredTrainingSubject,
      branding: finalizeBranding(buildCertificateBranding(clientInfo)),
      scoreText,
    });
  }, [
    assessmentResult,
    assessmentDetail,
    clientInfo,
    user,
    slug,
    inAppreciationBand,
    structuredTrainingSubject,
  ]);

  /**
   * Result record with metric lines. Always completion-style so it does not duplicate the achievement
   * headline when both certificate are shown.
   * Must return `null` when not ready — `return true` makes this a boolean and breaks certificate + PNG.
   */
  const resultCertificateContent = useMemo(() => {
    if (!assessmentResult || !user) return null;
    if (!assessmentDetail) return null;
    if (!assessmentDetail.certificate_available) return null;
    if (!isCertificateEligible || !preferredCertificateTier) return null;
    const s:any = assessmentResult?.stats || {};
    const name = getLearnerDisplayNameFromResult(assessmentResult, user);
    return buildAssessmentResultCertificate({
      recipientName: name,
      assessmentTitle: assessmentResult?.assessment_name || slug,
      certificateCourseName: structuredTrainingSubject,
      branding: finalizeBranding(buildCertificateBranding(clientInfo)),
      score: s.score,
      maximumMarks: s.maximum_marks,
      accuracyPercent: s.accuracy_percent,
      percentile: s.percentile,
      attemptedQuestions: s.attempted_questions,
      totalQuestions: s.total_questions,
      timeTakenMinutes: s.time_taken_minutes,
      inAppreciationBand: preferredCertificateTier === "excellence",
    });
  }, [
    assessmentResult,
    assessmentDetail,
    clientInfo,
    user,
    slug,
    isCertificateEligible,
    preferredCertificateTier,
    structuredTrainingSubject,
  ]);

  const certificateDownloadFileStem = useMemo(() => {
    if (!assessmentResult || !user) {
      return {
        assessment: sanitizeCertificateFileSegment(slug || "", "assessment"),
        learner: "learner",
      };
    }
    const assessment = sanitizeCertificateFileSegment(
      assessmentResult.assessment_name || slug || "assessment",
      "assessment"
    );
    const learner = sanitizeCertificateFileSegment(
      getLearnerDisplayNameFromResult(assessmentResult, user),
      "learner"
    );
    return { assessment, learner };
  }, [assessmentResult, user, slug]);

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
      <MainLayout>
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

  // Score hero — same pct the retired ScoreDisplay used (score / maximum_marks * 100).
  const heroScore = Number(stats.score) || 0;
  const heroMax = Number(stats.maximum_marks) || 0;
  const heroPct = heroMax > 0 ? (heroScore / heroMax) * 100 : 0;
  const heroBand = getPerformanceBand(heroPct);
  const heroScoreText = heroMax > 0 ? `${heroScore} / ${heroMax}` : `${heroScore}`;
  const heroSummary =
    heroMax > 0
      ? `You scored ${heroScore} out of ${heroMax} (${Math.round(heroPct)}%) — ${heroBand.label.toLowerCase()} performance.`
      : "Your submission has been evaluated.";

  const handleDownloadResultPdf = () => {
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

      generateAssessmentResultPdfVector(
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

  const handleDownloadUploadedCertificate = async () => {
    if (!uploadedCertificateUrl || uploadCertificateExporting) return;
    const learnerName = getLearnerDisplayNameFromResult(assessmentResult, user);
    if (!learnerName) {
      showToast("Could not resolve learner name for certificate.", "error");
      return;
    }

    try {
      setUploadCertificateExporting(true);
      const response = await fetch("/api/certificate/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: learnerName,
          templateUrl: uploadedCertificateUrl,
          issuerName: clientInfo?.name || "",
          courseName: assessmentResult?.assessment_name || slug,
          structuredTrainingSubject,
        }),
      });

      if (!response.ok) {
        let message = "Failed to generate personalized certificate";
        try {
          const data = (await response.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // ignore JSON parse failure
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const fileBase = `certificate-${certificateDownloadFileStem.assessment}-${certificateDownloadFileStem.learner}`;
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${fileBase}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      showToast("Certificate downloaded.", "success");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Failed to generate personalized certificate",
        "error",
      );
    } finally {
      setUploadCertificateExporting(false);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ bgcolor: "var(--canvas)", minHeight: "100%" }}>
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          px: { xs: 2, md: 3 },
          py: 3,
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

        {/* Header */}
        <AssessmentResultHeader
          assessmentTitle={assessmentResult?.assessment_name || ""}
          status={assessmentResult?.status || ""}
        />

        {/* Multi-attempt selector. Renders only when this learner has more
            than one submitted attempt — i.e. admin has granted at least one
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
                sx={{ fontWeight: 700, color: "var(--font-primary)" }}
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
            {/* SegmentedTabs-like pill track — same handleAttemptChange contract. */}
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
                  : "—";
                const scoreLabel = att.score != null ? `${att.score}` : "—";
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

        {/* Score hero — gradient percentage ring + performance band */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: { xs: 3, md: 4 },
            borderRadius: "var(--radius-card)",
            bgcolor: "var(--card-bg)",
            border: "1px solid var(--border-default)",
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
        {resultCertificateContent && user ? (
          <Paper
            className="exclude-from-pdf"
            elevation={0}
            sx={{
              mt: 3,
              mb: 2,
              p: 2.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {appreciationCertificateContent ? "Your certificate" : "Your certificate"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {uploadedCertificateUrl
                ? "The top bar \"Download PDF\" is your full result report."
                : appreciationCertificateContent
                  ? "Each row has its own download buttons. The top bar \"Download PDF\" is your full result report, not a certificate."
                  : "Download buttons below match this certificate. The top bar \"Download PDF\" is your full result report, not a certificate."}
            </Typography>

            <Box
              sx={{
                mb: 2.5,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, py: 1, display: "block" }}>
                Certificate preview (same layout as PNG/PDF)
              </Typography>
              <Box sx={{ height: 210, position: "relative", overflow: "hidden" }}>
                {checkingUploadedCertificate ? (
                  <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Checking certificate...
                    </Typography>
                  </Box>
                ) : uploadedCertificateUrl ? (
                  looksLikeImageUrl(uploadedCertificateUrl) ? (
                    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                      <Box
                        component="img"
                        src={uploadedCertificateUrl}
                        alt={`${uploadedCertificateTier} certificate`}
                        sx={{ width: "100%", height: "100%", objectFit: "contain", bgcolor: "background.paper" }}
                      />
                      <Typography
                        sx={{
                          position: "absolute",
                          top: "53%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          px: 1.5,
                          borderRadius: 1,
                          fontWeight: 700,
                          fontSize: { xs: "0.95rem", sm: "1.1rem" },
                          color: "#ffffff",
                          bgcolor: "rgba(17, 24, 39, 0.45)",
                          textAlign: "center",
                          maxWidth: "80%",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {getLearnerDisplayNameFromResult(assessmentResult, user)}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: "100%", display: "grid", placeItems: "center", p: 2 }}>
                      <Typography variant="body2" color="text.secondary" align="center">
                         Certificate file is available. Use the download button below.
                      </Typography>
                    </Box>
                  )
                ) : (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      transform: "scale(0.3)",
                      transformOrigin: "top left",
                      pointerEvents: "none",
                    }}
                  >
                    <DynamicCertificate content={resultCertificateContent} />
                  </Box>
                )}
              </Box>
            </Box>

            {uploadedCertificateUrl ? (
              <Box sx={{ mb: 3 }}>
                
                <Button
                  onClick={handleDownloadUploadedCertificate}
                  disabled={uploadCertificateExporting}
                  variant="contained"
                  startIcon={<IconWrapper icon="mdi:download" size={18} />}
                >
                  {uploadCertificateExporting ? "Preparing..." : "Download certificate"}
                </Button>
              </Box>
            ) : appreciationCertificateContent ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Certificate of achievement
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  For scores in your organization&apos;s appreciation band.
                </Typography>
                <CertificateLearnerToolbar
                  key={`ach-${certificateBrandingKey}`}
                  content={appreciationCertificateContent}
                  fileNameBase={`certificate-achievement-${certificateDownloadFileStem.assessment}-${certificateDownloadFileStem.learner}`}
                  dense
                  pngButtonLabel="Download achievement certificate (PNG)"
                  pdfButtonLabel="Download achievement certificate (PDF)"
                />
              </Box>
            ) : null}

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
