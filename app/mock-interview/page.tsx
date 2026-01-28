"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Container, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { InterviewModeSelector } from "@/components/mock-interview/InterviewModeSelector";
import { InterviewStats } from "@/components/mock-interview/InterviewStats";
import { IconWrapper } from "@/components/common/IconWrapper";
import mockInterviewService, {
  MockInterview,
} from "@/lib/services/mock-interview.service";
import { useToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";

export default function MockInterviewPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const hasLoadedRef = useRef(false);

  // Stop any active camera streams on this page
  useStopCameraOnMount();

  // Load interviews
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const loadInterviews = async () => {
      try {
        hasLoadedRef.current = true;
        setLoading(true);
        const data = await mockInterviewService.listInterviews();
        setInterviews(data);
      } catch (error) {
        showToast("Failed to load interviews", "error");
        hasLoadedRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, [showToast]);

  // Calculate statistics
  const total = interviews.length;
  const completed = interviews.filter((i) => i.status === "completed").length;
  const scheduled = interviews.filter((i) => i.status === "scheduled").length;
  const completedWithScores = interviews.filter(
    (i) => i.status === "completed" && i.score !== undefined
  );
  const averageScore =
    completedWithScores.length > 0
      ? Math.round(
          completedWithScores.reduce((sum, i) => sum + (i.score || 0), 0) /
            completedWithScores.length
        )
      : 0;

  const stats = {
    total,
    completed,
    scheduled,
    averageScore,
  };


  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                backgroundColor: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="mdi:account-voice" size={32} color="#ffffff" />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", md: "2rem" } }}
              >
                Mock Interview Practice
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                Prepare for your dream job with AI-powered mock interviews
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Statistics */}
        <Box sx={{ mb: 4 }}>
          <InterviewStats
            totalInterviews={stats.total}
            completedInterviews={stats.completed}
            scheduledInterviews={stats.scheduled}
            averageScore={stats.averageScore}
          />
        </Box>

        {/* Tabs Navigation */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 4,
            p: 1,
            backgroundColor: "#f3f4f6",
            borderRadius: 3,
            width: "fit-content",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              py: 1.5,
              borderRadius: 2.5,
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            <IconWrapper icon="mdi:lightning-bolt" size={20} color="#6366f1" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "#1f2937",
              }}
            >
              New Interview
            </Typography>
          </Box>

          <Box
            onClick={() => router.push("/mock-interview/previous")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              py: 1.5,
              borderRadius: 2.5,
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "#e5e7eb",
              },
            }}
          >
            <IconWrapper icon="mdi:history" size={20} color="#6b7280" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "#6b7280",
              }}
            >
              Previous
            </Typography>
          </Box>

          <Box
            onClick={() => router.push("/mock-interview/scheduled")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              py: 1.5,
              borderRadius: 2.5,
              cursor: "pointer",
              transition: "all 0.3s ease",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "#e5e7eb",
              },
            }}
          >
            <IconWrapper icon="mdi:calendar-clock" size={20} color="#6b7280" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "#6b7280",
              }}
            >
              Scheduled
            </Typography>
          </Box>
        </Box>

        {/* Interview Mode Selector */}
        <InterviewModeSelector />
      </Container>
    </MainLayout>
  );
}
