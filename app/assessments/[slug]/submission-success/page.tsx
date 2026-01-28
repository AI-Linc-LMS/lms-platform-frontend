"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
        showToast("Failed to load assessment details", "error");
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
          <Typography>Assessment not found</Typography>
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
              <IconWrapper icon="mdi:check-circle" size={80} color="#10b981" />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Assessment Submitted Successfully!
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
                  Your Score: {scholarshipStatus.score}
                </Typography>
                {scholarshipStatus.offered_scholarship_percentage > 0 && (
                  <Typography variant="body2">
                    You have been offered a{" "}
                    {scholarshipStatus.offered_scholarship_percentage}%
                    scholarship!
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
                      Scholarship Code:
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: "monospace",
                        backgroundColor: "#f3f4f6",
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
            Your assessment has been submitted and is being reviewed. You will
            receive results shortly.
          </Typography>

          <Box
            sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push("/assessments")}
              startIcon={<IconWrapper icon="mdi:arrow-left" />}
            >
              Back to Assessments
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push(`/assessments/result/${slug}`)}
              startIcon={<IconWrapper icon="mdi:file-document-edit" />}
            >
              View Assessment Result
            </Button>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
