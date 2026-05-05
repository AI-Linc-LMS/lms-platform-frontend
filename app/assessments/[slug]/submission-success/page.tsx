"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  Divider,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";
import {
  assessmentService,
  AssessmentDetail,
  AssessmentResult,
  ScholarshipStatus,
} from "@/lib/services/assessment.service";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { getUserDisplayName } from "@/lib/utils/user-utils";
import { buildAssessmentParticipationCertificate } from "@/lib/certificate/copy";
import {
  buildCertificateBranding,
  finalizeBranding,
} from "@/lib/certificate/client-branding";
import { CertificateLearnerToolbar } from "@/components/certificate/CertificateLearnerToolbar";

export default function SubmissionSuccessPage() {
  const { t } = useTranslation("common");
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [scholarshipStatus, setScholarshipStatus] =
    useState<ScholarshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoSubmitMessage, setAutoSubmitMessage] = useState<string | null>(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { clientInfo } = useClientInfo();

  // Stop any active camera and audio streams on this page
  useStopCameraOnMount();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const assessmentData = await assessmentService.getAssessmentDetail(
          slug
        );
        setAssessment(assessmentData);

        // Load scholarship status if assessment is completed
        try {
          const status = await assessmentService.getScholarshipStatus(slug);
          setScholarshipStatus(status);
        } catch (error) {
          // Scholarship status might not be available yet - silently fail
        }
        try {
          const result = await assessmentService.getAssessmentResult(slug);
          const reason = (result as AssessmentResult).auto_submitted_reason;
          if (reason === "tab_switch_limit") {
            setAutoSubmitMessage(
              (result as AssessmentResult).auto_submit_message ||
                "This assessment was auto-submitted because the tab-switch limit was reached."
            );
          } else {
            setAutoSubmitMessage(null);
          }
        } catch {
          setAutoSubmitMessage(null);
        }
      } catch (error: any) {
        showToast(t("assessments.failedToLoadDetails"), "error");
        router.push(`/assessments/${slug}`);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadData();
    }
  }, [slug]);


  if (!assessment) {
    return (
      <MainLayout>
        <Container>
          <Typography>{t("assessments.notFound")}</Typography>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <IconWrapper
                icon="mdi:check-circle"
                size={80}
                color="var(--success-500)"
              />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {t("assessments.submittedSuccess")}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {assessment.title}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {autoSubmitMessage ? (
            <Alert severity="warning" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="body2">{autoSubmitMessage}</Typography>
            </Alert>
          ) : null}

          {scholarshipStatus && scholarshipStatus.has_submitted && (
            <Box sx={{ mb: 4 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  {t("assessments.yourScore")} {scholarshipStatus.score}
                </Typography>
                {scholarshipStatus.offered_scholarship_percentage > 0 && (
                  <Typography variant="body2">
                    {t("assessments.scholarshipOffered", { percent: scholarshipStatus.offered_scholarship_percentage })}
                  </Typography>
                )}
              </Alert>

              {scholarshipStatus.offered_scholarship_percentage > 0 &&
                !scholarshipStatus.is_redeemed && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {t("assessments.scholarshipCode")}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "monospace",
                        backgroundColor: "var(--surface)",
                        color: "var(--font-primary)",
                        p: 2,
                        borderRadius: 1,
                        fontWeight: 600,
                      }}
                    >
                      {scholarshipStatus.referral_code}
                    </Typography>
                  </Box>
                )}
            </Box>
          )}

          <Typography variant="body1" color="text.secondary" paragraph>
            {assessment.evaluation_mode === "manual"
              ? "Your submission is pending manual evaluation. You will be notified once published."
              : t("assessments.submittedReview")}
          </Typography>

          {assessment.certificate_available && user ? (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Certificate of participation
              </Typography>
              <CertificateLearnerToolbar
                content={buildAssessmentParticipationCertificate({
                  recipientName: getUserDisplayName(user),
                  assessmentTitle: assessment.title,
                  certificateCourseName: (() => {
                    const vals = [
                      assessment.certificate_course_name,
                      assessment.course_title,
                      assessment.certificateCourseName,
                      assessment.courseTitle,
                    ];
                    for (const v of vals) {
                      if (typeof v === "string" && v.trim()) return v.trim();
                    }
                    return (assessment.title || "").trim() || null;
                  })(),
                  branding: finalizeBranding(buildCertificateBranding(clientInfo)),
                })}
                fileNameBase={`certificate-participation-${assessment.slug || slug}`}
              />
            </Box>
          ) : null}

          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4, flexWrap: "wrap" }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push("/assessments")}
              startIcon={<IconWrapper icon="mdi:arrow-left" />}
            >
              {t("assessments.backToAssessments")}
            </Button>
            {assessment.show_result !== false && (
              <Button
                variant="contained"
                onClick={() => router.push(`/assessments/result/${slug}`)}
                startIcon={<IconWrapper icon="mdi:file-document-edit" />}
              >
                {t("assessments.viewResult")}
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
