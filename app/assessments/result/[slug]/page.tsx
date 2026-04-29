"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Paper, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  assessmentService,
  AssessmentDetail,
  AssessmentResult,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { AssessmentResultHeader } from "@/components/assessment/result/AssessmentResultHeader";
import { ScoreDisplay } from "@/components/assessment/result/ScoreDisplay";
import { EnhancedStatsBar } from "@/components/assessment/result/EnhancedStatsBar";
import { TopicWiseBreakdown } from "@/components/assessment/result/TopicWiseBreakdown";
import { StrengthsWeaknesses } from "@/components/assessment/result/StrengthsWeaknesses";
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

function sanitizeCertificateFileSegment(raw: string, fallback: string): string {
  const s = raw
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return s || fallback;
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
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentDetail | null>(null);

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

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    assessmentService
      .getAssessmentDetail(slug)
      .then((d) => {
        if (!cancelled) setAssessmentDetail(d);
      })
      .catch(() => {
        if (!cancelled) setAssessmentDetail(null);
      });
    return () => {
      cancelled = true;
    };
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
      branding: finalizeBranding(buildCertificateBranding(clientInfo)),
      scoreText,
    });
  }, [assessmentResult, assessmentDetail, clientInfo, user, slug, inAppreciationBand]);

  /**
   * Result record with metric lines. Always completion-style so it does not duplicate the achievement
   * headline when both certificates are shown.
   * Must return `null` when not ready — `return true` makes this a boolean and breaks certificate + PNG.
   */
  const resultCertificateContent = useMemo(() => {
    // if (!assessmentResult || !user) return null;
    // if (!assessmentDetail) return null;
    // if (!assessmentDetail.certificate_available) return null;
    const s:any = assessmentResult?.stats || {};
    const name = getLearnerDisplayNameFromResult(assessmentResult, user);
    return buildAssessmentResultCertificate({
      recipientName: name,
      assessmentTitle: assessmentResult?.assessment_name || slug,
      branding: finalizeBranding(buildCertificateBranding(clientInfo)),
      score: s.score,
      maximumMarks: s.maximum_marks,
      accuracyPercent: s.accuracy_percent,
      percentile: s.percentile,
      attemptedQuestions: s.attempted_questions,
      totalQuestions: s.total_questions,
      timeTakenMinutes: s.time_taken_minutes,
      inAppreciationBand: false,
    });
  }, [assessmentResult, assessmentDetail, clientInfo, user, slug]);

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

  const loadAssessmentResult = async () => {
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

      const result = await assessmentService.getAssessmentResult(slug);

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

  if (!assessmentResult && !psychometricData) return null;

  if (psychometricData) {
    return (
      <MainLayout>
        <PsychometricResultView data={psychometricData} />
      </MainLayout>
    );
  }

  const stats = assessmentResult?.stats || ({} as AssessmentResult["stats"]);

  const quizResponses = assessmentResult?.user_responses?.quiz_responses || [];

  const codingResponses =
    assessmentResult?.user_responses?.coding_problem_responses || [];

  const subjectiveResponses =
    assessmentResult?.user_responses?.subjective_responses || [];

  const hasQuiz = quizResponses.length > 0;
  const hasCoding = codingResponses.length > 0;
  const hasSubjective = subjectiveResponses.length > 0;

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

  return (
    <MainLayout>
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          px: 3,
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

        {/* Score */}
        <ScoreDisplay
          score={stats.score}
          maximumMarks={stats.maximum_marks}
          accuracy={stats?.accuracy_percent||0}
          percentile={stats.percentile}
        />
  {JSON.stringify(resultCertificateContent)}
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
              {appreciationCertificateContent ? "Certificates" : "Your certificate"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {appreciationCertificateContent
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
              </Box>
            </Box>

            {appreciationCertificateContent ? (
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

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Certificate with result summary
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Includes score, accuracy, percentile, attempts, and time. Signatory image uses client
                branding when configured.
              </Typography>
              {JSON.stringify(resultCertificateContent)}
              <CertificateLearnerToolbar
                key={`res-${certificateBrandingKey}`}
                content={resultCertificateContent}
                fileNameBase={`certificate-result-summary-${certificateDownloadFileStem.assessment}-${certificateDownloadFileStem.learner}`}
                dense
                pngButtonLabel="Download result-summary certificate (PNG)"
                pdfButtonLabel="Download result-summary certificate (PDF)"
              />
            </Box>
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
      </Box>
    </MainLayout>
  );
}
