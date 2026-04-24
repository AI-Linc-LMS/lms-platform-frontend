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
import { buildAssessmentAppreciationCertificate } from "@/lib/certificate/copy";
import {
  buildCertificateBranding,
  finalizeBranding,
} from "@/lib/certificate/client-branding";
import { isScoreInAppreciationBand, scoreToPercent } from "@/lib/certificate/pass-band";
import { getLearnerDisplayNameFromResult } from "@/lib/certificate/learner-name";
import { CertificateLearnerToolbar } from "@/components/certificate/CertificateLearnerToolbar";

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

  const appreciationCertificateContent = useMemo(() => {
    if (!assessmentResult || !user || !assessmentDetail?.certificate_available) return null;
    const s = assessmentResult.stats;
    const pct = scoreToPercent(s.score, s.maximum_marks);
    if (
      !isScoreInAppreciationBand(
        pct,
        assessmentDetail.pass_band_lower_min_percent,
        assessmentDetail.pass_band_upper_min_percent
      )
    ) {
      return null;
    }
    const name = getLearnerDisplayNameFromResult(assessmentResult, user);
    const scorePct = Math.round(pct);
    return buildAssessmentAppreciationCertificate({
      recipientName: name,
      assessmentTitle: assessmentResult.assessment_name || slug,
      branding: finalizeBranding(buildCertificateBranding(clientInfo)),
      scoreText: `${scorePct}%`,
    });
  }, [assessmentResult, assessmentDetail, clientInfo, user, slug]);

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

        {appreciationCertificateContent && user ? (
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
              Certificate of achievement
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your score is within the configured appreciation band. Download your certificate below.
            </Typography>
            <CertificateLearnerToolbar
              content={appreciationCertificateContent}
              fileNameBase={`certificate-achievement-${slug}`}
              dense
            />
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
