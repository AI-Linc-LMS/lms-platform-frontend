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
  ScholarshipStatus,
} from "@/lib/services/assessment.service";

export default function SubmissionSuccessPage() {
  const { t } = useTranslation("common");
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [scholarshipStatus, setScholarshipStatus] =
    useState<ScholarshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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
