"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  Chip,
  Divider,
  TextField,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
import {
  assessmentService,
  AssessmentDetail,
  ScholarshipStatus,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [scholarshipStatus, setScholarshipStatus] =
    useState<ScholarshipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!slug) return;

    let isCancelled = false;

    const loadData = async () => {
      if (isCancelled) return;
      await loadAssessmentDetail();
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const loadAssessmentDetail = async () => {
    try {
      const data = await assessmentService.getAssessmentDetail(slug);

      setAssessment(data);
    } catch (error: any) {
      showToast("Failed to load assessment details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    // Skip device-check if proctoring is disabled
    if (assessment && assessment.proctoring_enabled === false) {
      router.push(`/assessments/${slug}/take`);
    } else {
      router.push(`/assessments/${slug}/device-check`);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

  if (!assessment) {
    return (
      <MainLayout>
        <Container>
          <Typography>
            {" "}
            <Loading fullScreen />
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          width: "100%",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          maxWidth: "1200px",
          mx: "auto",
        }}
      >
        {/* Back Button */}
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={() => router.push("/assessments")}
          sx={{
            mb: 3,
            color: "#6b7280",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "rgba(99, 102, 241, 0.08)",
              color: "#6366f1",
            },
          }}
        >
          Back to Assessments
        </Button>

        {/* Assessment Info */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              p: 2,
              backgroundColor: "#f3f4f6",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <IconWrapper icon="mdi:clock-outline" size={24} color="#6366f1" />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#9ca3af",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                }}
              >
                Duration
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#1f2937",
                  fontWeight: 600,
                }}
              >
                {assessment.duration_minutes} minutes
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              p: 2,
              backgroundColor: "#f3f4f6",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <IconWrapper
              icon="mdi:help-circle-outline"
              size={24}
              color="#6366f1"
            />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#9ca3af",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                }}
              >
                Questions
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#1f2937",
                  fontWeight: 600,
                }}
              >
                {assessment.number_of_questions}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              mb: 2,
            }}
          >
            {assessment.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#6b7280",
              mb: 3,
              lineHeight: 1.6,
            }}
          >
            {assessment.description}
          </Typography>

          {assessment.instructions && (
            <Alert
              severity="info"
              sx={{
                mb: 3,
                borderRadius: 2,
              }}
            >
              {assessment.instructions}
            </Alert>
          )}

          {/* Proctoring & Exam Instructions */}
          {assessment.proctoring_enabled && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                border: "2px solid #f59e0b",
                backgroundColor: "#fffbeb",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <IconWrapper
                  icon="mdi:shield-account"
                  size={28}
                  style={{ color: "#f59e0b" }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#92400e",
                  }}
                >
                  Proctored Assessment - Important Instructions
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: "#78350f",
                  mb: 2,
                  fontWeight: 600,
                }}
              >
                This is a proctored examination. Please read the following
                instructions carefully before starting:
              </Typography>

              <Box
                component="ul"
                sx={{
                  m: 0,
                  pl: 3,
                  mb: 2,
                  "& li": {
                    mb: 1.5,
                    color: "#92400e",
                    lineHeight: 1.7,
                  },
                }}
              >
                <li>
                  <strong>Camera & Microphone Required:</strong> You must have a
                  working camera and microphone. Your device will be tested before
                  the exam begins.
                </li>
                <li>
                  <strong>AI Proctoring Active:</strong> This exam is monitored by
                  AI proctoring software that tracks:
                  <Box
                    component="ul"
                    sx={{
                      mt: 0.5,
                      mb: 0,
                      pl: 2.5,
                      "& li": {
                        mb: 0.5,
                      },
                    }}
                  >
                    <li>Face detection and visibility</li>
                    <li>Looking away from screen</li>
                    <li>Multiple people in the frame</li>
                    <li>Tab switches and browser window changes</li>
                    <li>Fullscreen mode violations</li>
                  </Box>
                </li>
                <li>
                  <strong>Exam Environment:</strong> Ensure you are in a quiet,
                  well-lit room with no distractions. Remove any unauthorized
                  materials from your workspace.
                </li>
                <li>
                  <strong>During the Exam:</strong>
                  <Box
                    component="ul"
                    sx={{
                      mt: 0.5,
                      mb: 0,
                      pl: 2.5,
                      "& li": {
                        mb: 0.5,
                      },
                    }}
                  >
                    <li>Do not switch browser tabs or minimize the window</li>
                    <li>Do not exit fullscreen mode</li>
                    <li>Keep your face visible to the camera at all times</li>
                    <li>Do not use any unauthorized aids or assistance</li>
                    <li>Do not communicate with anyone during the exam</li>
                  </Box>
                </li>
                <li>
                  <strong>Violation Policy:</strong> Violations of exam rules will
                  be recorded and may result in exam disqualification. Multiple
                  violations will result in automatic submission of your
                  assessment.
                </li>
                <li>
                  <strong>Time Limit:</strong> The exam has a strict time limit.
                  Once started, the timer cannot be paused. Ensure you have
                  adequate time to complete the assessment.
                </li>
              </Box>

              <Alert
                severity="warning"
                icon={<IconWrapper icon="mdi:alert-circle" size={20} />}
                sx={{
                  mt: 2,
                  backgroundColor: "#fef3c7",
                  border: "1px solid #f59e0b",
                  "& .MuiAlert-icon": {
                    color: "#d97706",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: "#92400e" }}
                >
                  By clicking &quot;Start Assessment&quot;, you acknowledge that
                  you have read and understood all instructions and agree to abide
                  by the examination rules and proctoring policies.
                </Typography>
              </Alert>
            </Paper>
          )}

          {assessment.sections && assessment.sections.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#1f2937",
                  mb: 2,
                }}
              >
                Assessment Sections
              </Typography>
              {assessment.sections.map((section: any, index: number) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    {section.title || `Section ${index + 1}`}
                  </Typography>
                  {section.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#6b7280",
                        mt: 0.5,
                      }}
                    >
                      {section.description}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<IconWrapper icon="mdi:play-circle-outline" size={24} />}
            onClick={handleStart}
            sx={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: "0 4px 14px 0 rgba(99, 102, 241, 0.39)",
              "&:hover": {
                backgroundColor: "#4f46e5",
                boxShadow: "0 6px 20px 0 rgba(99, 102, 241, 0.5)",
              },
            }}
          >
            Start Assessment
          </Button>
        </Paper>
      </Box>
    </MainLayout>
  );
}
