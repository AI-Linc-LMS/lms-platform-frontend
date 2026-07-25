"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { InterviewModeSelector } from "@/components/mock-interview/InterviewModeSelector";
import { InterviewStats } from "@/components/mock-interview/InterviewStats";
import { IconWrapper } from "@/components/common/IconWrapper";
import mockInterviewService, {
  MockInterview,
} from "@/lib/services/mock-interview.service";
import { useToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";
import { Chip } from "@mui/material";

export default function MockInterviewPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  // Just the count - used to render a badge on the "Courses" tab so a student can see at a
  // glance how many assigned interviews are waiting. The full list lives on the
  // /mock-interview/courses page.
  const [pendingCoursesCount, setPendingCoursesCount] = useState(0);
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
        // Pending-templates call is best-effort: if it fails (no enrollment, network blip)
        // we just don't show a count badge on the Courses tab. The dedicated /courses page
        // does its own fetch and surfaces real errors there.
        const [list, pending] = await Promise.all([
          mockInterviewService.listInterviews(),
          mockInterviewService.listPendingCourseInterviews().catch(() => []),
        ]);
        setInterviews(list);
        setPendingCoursesCount(pending.length);
      } catch (error) {
        showToast(t("mockInterview.failedToLoad"), "error");
        hasLoadedRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, [showToast, t]);

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
    <PageShell>
      <ModulePageHeader
        eyebrow="Career"
        title="Interview"
        description="Practice AI-driven mock interviews with instant, rubric-based feedback to sharpen your answers."
        accent="pink"
        icon="mdi:account-voice"
      />

        {/* Statistics */}
        <Box data-tour-id="mock-stats" sx={{ mb: 4 }}>
          <InterviewStats
            totalInterviews={stats.total}
            completedInterviews={stats.completed}
            scheduledInterviews={stats.scheduled}
            averageScore={stats.averageScore}
          />
        </Box>

        {/* The "pending interviews from your courses" cards used to render inline here;
            they now live on the /mock-interview/courses page (the "Courses" tab below) so
            this landing page stays focused on Quick Start while the Courses tab gives
            assigned interviews their own dedicated space. We still load the pending count
            for the badge on the Courses tab. */}

        {/* Tabs Navigation */}
        <Box
          data-tour-id="mock-tabs"
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

          {/* "Courses" tab: assigned interviews from the student's enrolled courses. The
              badge shows the count of pending items so a student knows at a glance whether
              they have something waiting. */}
          <Box
            onClick={() => router.push("/mock-interview/courses")}
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
            <IconWrapper
              icon="mdi:school-outline"
              size={20}
              color="var(--font-secondary)"
            />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "0.95rem",
                color: "var(--font-secondary)",
              }}
            >
              Courses
            </Typography>
            {pendingCoursesCount > 0 && (
              <Chip
                label={pendingCoursesCount}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  backgroundColor: "var(--accent-indigo)",
                  color: "var(--font-light)",
                }}
              />
            )}
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
        <Box data-tour-id="mock-modes">
          <InterviewModeSelector />
        </Box>
    </PageShell>
  );
}
