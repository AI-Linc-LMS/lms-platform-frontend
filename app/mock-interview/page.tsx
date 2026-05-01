"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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
        showToast(t("mockInterview.failedToLoad"), "error");
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
                backgroundColor: "var(--accent-indigo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper icon="mdi:account-voice" size={32} color="var(--font-light)" />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", md: "2rem" } }}
              >
                {t("mockInterview.practiceTitle")}
              </Typography>
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                {t("mockInterview.practiceSubtitle")}
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
            backgroundColor: "var(--surface)",
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
              backgroundColor: "var(--card-bg)",
              boxShadow: "0 2px 8px color-mix(in srgb, var(--font-primary) 10%, transparent)",
            }}
          >
            <IconWrapper icon="mdi:lightning-bolt" size={20} color="var(--accent-indigo)" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--font-primary)",
              }}
            >
              {t("mockInterview.newInterview")}
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
                backgroundColor:
                  "color-mix(in srgb, var(--font-primary) 8%, transparent)",
              },
            }}
          >
            <IconWrapper icon="mdi:history" size={20} color="var(--font-secondary)" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--font-secondary)",
              }}
            >
              {t("mockInterview.previous")}
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
                backgroundColor:
                  "color-mix(in srgb, var(--font-primary) 8%, transparent)",
              },
            }}
          >
            <IconWrapper icon="mdi:calendar-clock" size={20} color="var(--font-secondary)" />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--font-secondary)",
              }}
            >
              {t("mockInterview.scheduled")}
            </Typography>
          </Box>
        </Box>

        {/* Interview Mode Selector */}
        <InterviewModeSelector />
      </Container>
    </MainLayout>
  );
}
