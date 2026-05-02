"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Tooltip,
  Chip,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  assessmentService,
  AssessmentDetail,
} from "@/lib/services/assessment.service";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { isMobileOrTabletForAssessment } from "@/lib/utils/assessment-device.utils";
import { AssessmentDesktopOnlyDialog } from "@/components/assessment/AssessmentDesktopOnlyGate";
import { isCurrentDeviceAllowedForAssessment } from "@/lib/utils/assessment-device";
import { AssessmentDeviceStatusPanel } from "@/components/assessment/AssessmentDeviceStatusPanel";

function parseAssessmentStartTime(
  s: string | undefined | null
): Date | null {
  if (!s || typeof s !== "string" || !s.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = useTranslation("common");
  const { slug } = use(params);
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [desktopOnlyOpen, setDesktopOnlyOpen] = useState(false);
  const { showToast } = useToast();
  const [startTimeTick, setStartTimeTick] = useState(0);

  const assessmentStartAt = useMemo(
    () => parseAssessmentStartTime(assessment?.start_time),
    [assessment?.start_time]
  );

  const canStartAssessment = useMemo(() => {
    void startTimeTick;
    if (!assessmentStartAt) return true;
    return Date.now() >= assessmentStartAt.getTime();
  }, [assessmentStartAt, startTimeTick]);

  useEffect(() => {
    if (!assessmentStartAt) return;
    if (Date.now() >= assessmentStartAt.getTime()) return;

    const id = setInterval(() => {
      setStartTimeTick((n) => n + 1);
      if (Date.now() >= assessmentStartAt.getTime()) {
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [assessmentStartAt]);


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
      showToast(t("assessments.failedToLoadDetails"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {

    if (isMobileOrTabletForAssessment()) {
      setDesktopOnlyOpen(true);
    if (assessment && !isCurrentDeviceAllowedForAssessment(assessment)) {
      showToast(t("assessmentDevice.toastBlocked"), "warning");
      return;
    }
    // Skip device-check if proctoring is disabled
  
  }
  if (assessment && assessment.proctoring_enabled === false) {
    router.push(`/assessments/${slug}/take`);
  } else {
    router.push(`/assessments/${slug}/device-check`);
  }
}

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
            py: 8,
          }}
        >
          <CircularProgress size={40} sx={{ color: "var(--accent-indigo)" }} />
        </Box>
      </MainLayout>
    );
  }

  if (!assessment) {
    return (
      <MainLayout>
        <Container>
          <Typography>{t("assessments.failedToLoadDetails")}</Typography>
        </Container>
      </MainLayout>
    );
  }

  const deviceAllowed = isCurrentDeviceAllowedForAssessment(assessment);

  return (
    <MainLayout>
      <AssessmentDesktopOnlyDialog
        open={desktopOnlyOpen}
        onClose={() => setDesktopOnlyOpen(false)}
      />
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
            color: "var(--font-secondary)",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
              color: "var(--accent-indigo)",
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
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <IconWrapper
              icon="mdi:clock-outline"
              size={24}
              color="var(--accent-indigo)"
            />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-tertiary)",
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
                  color: "var(--font-primary)",
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
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <IconWrapper
              icon="mdi:help-circle-outline"
              size={24}
              color="var(--accent-indigo)"
            />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-tertiary)",
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
                  color: "var(--font-primary)",
                  fontWeight: 600,
                }}
              >
                {assessment.number_of_questions}
              </Typography>
            </Box>
          </Box>
        </Box>

        <AssessmentDeviceStatusPanel assessment={assessment} />

        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: "1px solid var(--border-default)",
            borderRadius: 3,
            backgroundColor: "var(--card-bg)",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              mb: 2,
            }}
          >
            {assessment.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "var(--font-secondary)",
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
                border: "2px solid var(--warning-500)",
                backgroundColor: "color-mix(in srgb, var(--warning-100) 95%, var(--card-bg))",
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
                  style={{ color: "var(--warning-500)" }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))",
                  }}
                >
                  Proctored Assessment - Important Instructions
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: "color-mix(in srgb, var(--warning-500) 55%, var(--font-dark))",
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
                    color: "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))",
                    lineHeight: 1.7,
                  },
                }}
              >
                <li>
                  <strong>Camera & Microphone Required:</strong> You must have a
                  working camera and microphone. Your device will be tested before
                  the exam begins. Position your face clearly in frame and look at
                  the screen—you’ll need to pass a quick face check before starting.
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
                    <li>
                      Do not exit fullscreen mode during the exam — if you do,
                      you will be prompted to either submit or return to
                      fullscreen to continue
                    </li>
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
                  backgroundColor: "color-mix(in srgb, var(--warning-500) 18%, transparent)",
                  border: "1px solid var(--warning-500)",
                  "& .MuiAlert-icon": {
                    color: "var(--ats-warning-muted)",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))" }}
                >
                  {t("assessments.startAcknowledgment")}
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
                  color: "var(--font-primary)",
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
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: "var(--font-primary)",
                    }}
                  >
                    {section.title || `Section ${index + 1}`}
                  </Typography>
                  {section.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-secondary)",
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

          {assessment.allow_movement === false && (
            <Paper
              elevation={0}
              sx={{
                mb: 3,
                p: 2.5,
                borderRadius: 2,
                border: "2px solid var(--accent-indigo)",
                background: "linear-gradient(135deg, var(--surface-indigo-light) 0%, color-mix(in srgb, var(--surface-indigo-light) 85%, var(--accent-indigo)) 100%)",
                boxShadow: "0 4px 20px color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 1.5,
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "var(--accent-indigo-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon="mdi:routes" size={26} color="var(--font-light)" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Chip
                    label={t("assessments.take.strictNavImportantBadge")}
                    size="small"
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      bgcolor: "var(--accent-indigo-dark)",
                      color: "var(--font-light)",
                      "& .MuiChip-label": { px: 1.25 },
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: "var(--accent-indigo-dark)",
                      lineHeight: 1.3,
                    }}
                  >
                    {t("assessments.take.strictNavTitle")}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "var(--accent-indigo-dark)",
                  fontWeight: 700,
                  mb: 1.5,
                  lineHeight: 1.5,
                }}
              >
                {t("assessments.take.strictNavReadBeforeStart")}
              </Typography>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  color: "color-mix(in srgb, var(--accent-indigo-dark) 88%, var(--font-dark))",
                  whiteSpace: "pre-line",
                  lineHeight: 1.75,
                  fontWeight: 500,
                }}
              >
                {t("assessments.take.strictNavInstructions")}
              </Typography>
            </Paper>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<IconWrapper icon="mdi:play-circle-outline" size={24} />}
            onClick={handleStart}
            disabled={!deviceAllowed || !canStartAssessment}
            sx={{
              backgroundColor: "var(--accent-indigo)",
              color: "var(--font-light)",
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "1rem",
              boxShadow: "var(--assessment-catalog-cta-auto-shadow)",
              "&:hover": {
                backgroundColor: "var(--accent-indigo-dark)",
                boxShadow: "var(--assessment-catalog-cta-auto-shadow-hover)",
              },
            }}
          >
            {t("assessments.startAssessment")}
          </Button>
        </Paper>
      </Box>
    </MainLayout>
  );
}
