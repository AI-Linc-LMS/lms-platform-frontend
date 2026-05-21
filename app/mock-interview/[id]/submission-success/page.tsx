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
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";
import mockInterviewService, {
  MockInterviewDetail,
} from "@/lib/services/mock-interview.service";

type GatedDetail = {
  result_visible_to_student?: boolean;
  scheduled_release_at?: string | null;
  result_release_mode?: string;
  message?: string;
};

export default function SubmissionSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = Number(params.id);
  const [, setInterview] = useState<MockInterviewDetail | null>(null);
  const [resultGated, setResultGated] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [gatedMessage, setGatedMessage] = useState<string>("");
  const { showToast } = useToast();

  useStopCameraOnMount();

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!interviewId) return;
      try {
        const data = (await mockInterviewService.getInterviewDetail(
          interviewId,
        )) as MockInterviewDetail & GatedDetail;
        if (cancelled) return;
        if (data && data.result_visible_to_student === false) {
          setResultGated(true);
          setScheduledAt(data.scheduled_release_at ?? null);
          setGatedMessage(
            data.message ||
              "Your interview was submitted successfully. The evaluation will be released by your instructor.",
          );
        } else {
          setInterview(data as MockInterviewDetail);
        }
      } catch (error: unknown) {
        if (cancelled) return;
        showToast("Failed to load interview details", "error");
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [interviewId, router, showToast]);


  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
          }}
        >
          {/* Success Icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "var(--course-cta)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 6px color-mix(in srgb, var(--course-cta) 30%, transparent)",
              }}
            >
              <IconWrapper icon="mdi:check-circle" size={48} color="var(--font-light)" />
            </Box>
          </Box>

          {/* Success Message */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary-dark)",
              mb: 2,
            }}
          >
            Interview Submitted Successfully!
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "var(--font-secondary)",
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            {resultGated
              ? gatedMessage
              : "Your mock interview has been submitted and is being reviewed. You can view your results and feedback now."}
          </Typography>

          <Alert
            severity="info"
            sx={{
              mb: 4,
              textAlign: "left",
              backgroundColor: "var(--info-surface)",
              border: "1px solid var(--info-border)",
              "& .MuiAlert-icon": {
                color: "var(--info-accent)",
              },
            }}
          >
            <Typography variant="body2" sx={{ color: "var(--info-strong)" }}>
              {resultGated ? (
                <>
                  Your responses have been recorded. You&apos;ll receive a
                  notification when your evaluation is released
                  {scheduledAt
                    ? ` on ${new Date(scheduledAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : " by your instructor"}
                  .
                </>
              ) : (
                "Your interview responses have been recorded and will be analyzed by our AI system. You can review detailed feedback, performance metrics, and suggestions for improvement in the results page."
              )}
            </Typography>
          </Alert>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push("/mock-interview")}
              startIcon={<IconWrapper icon="mdi:home" size={20} />}
              sx={{
                borderColor: "var(--border-light)",
                color: "var(--ats-cta-bg)",
                textTransform: "none",
                px: 3,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "var(--font-tertiary)",
                  backgroundColor: "var(--surface)",
                },
              }}
            >
              Back to Homepage
            </Button>
            {!resultGated && (
              <Button
                variant="contained"
                onClick={() =>
                  router.push(`/mock-interview/${interviewId}/result`)
                }
                startIcon={
                  <IconWrapper icon="mdi:file-document-edit" size={20} />
                }
                sx={{
                  backgroundColor: "var(--accent-indigo)",
                  color: "var(--font-light)",
                  textTransform: "none",
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  boxShadow: "0 4px 6px color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
                  "&:hover": {
                    backgroundColor: "var(--accent-indigo-dark)",
                    boxShadow: "0 6px 8px color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
                  },
                }}
              >
                View Result
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
