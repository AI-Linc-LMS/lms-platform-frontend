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
import { Loading } from "@/components/common/Loading";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";
import mockInterviewService, {
  MockInterviewDetail,
} from "@/lib/services/mock-interview.service";

export default function SubmissionSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = Number(params.id);
  const [interview, setInterview] = useState<MockInterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Stop any active camera and audio streams on this page
  useStopCameraOnMount();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load interview details if needed
        // For now, we'll just show the success message
      } catch (error: any) {
        showToast("Failed to load interview details", "error");
        router.push("/mock-interview");
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      loadData();
    }
  }, [interviewId, router, showToast]);

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
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
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)",
              }}
            >
              <IconWrapper icon="mdi:check-circle" size={48} color="#ffffff" />
            </Box>
          </Box>

          {/* Success Message */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              mb: 2,
            }}
          >
            Interview Submitted Successfully!
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#6b7280",
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            Your mock interview has been submitted and is being reviewed. You
            can view your results and feedback now.
          </Typography>

          {/* Info Alert */}
          <Alert
            severity="info"
            sx={{
              mb: 4,
              textAlign: "left",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              "& .MuiAlert-icon": {
                color: "#3b82f6",
              },
            }}
          >
            <Typography variant="body2" sx={{ color: "#1e40af" }}>
              Your interview responses have been recorded and will be analyzed
              by our AI system. You can review detailed feedback, performance
              metrics, and suggestions for improvement in the results page.
            </Typography>
          </Alert>

          {/* Action Buttons */}
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
                borderColor: "#d1d5db",
                color: "#374151",
                textTransform: "none",
                px: 3,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#9ca3af",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Back to Homepage
            </Button>
            <Button
              variant="contained"
              onClick={() =>
                router.push(`/mock-interview/${interviewId}/result`)
              }
              startIcon={
                <IconWrapper icon="mdi:file-document-edit" size={20} />
              }
              sx={{
                backgroundColor: "#6366f1",
                color: "#ffffff",
                textTransform: "none",
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: 600,
                boxShadow: "0 4px 6px rgba(99, 102, 241, 0.3)",
                "&:hover": {
                  backgroundColor: "#4f46e5",
                  boxShadow: "0 6px 8px rgba(99, 102, 241, 0.4)",
                },
              }}
            >
              View Result
            </Button>
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
