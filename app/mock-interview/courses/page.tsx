"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Chip, Container, Typography } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { useStopCameraOnMount } from "@/lib/hooks/useStopCameraOnMount";
import { cleanInterviewTitle } from "@/lib/utils/mock-interview-title";
import mockInterviewService, {
  type PendingCourseInterview,
} from "@/lib/services/mock-interview.service";

/**
 * Course interviews tab: lists every interview that's been assigned to the student via
 * their enrolled courses. Clicking Start spins up a real attempt from the template (same
 * lazy claim flow as before) and routes the candidate into the standard device-check.
 *
 * This page used to live as an inline section at the top of the main /mock-interview
 * page. Moving it behind its own tab keeps the main page focused on Quick Start while
 * still surfacing pending interviews prominently for students who are enrolled in mapped
 * courses.
 */
export default function MockInterviewCoursesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<PendingCourseInterview[]>([]);
  const [startingId, setStartingId] = useState<number | null>(null);

  useStopCameraOnMount();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await mockInterviewService.listPendingCourseInterviews();
        if (!cancelled) setTemplates(data);
      } catch (err) {
        if (!cancelled) {
          showToast("Couldn't load your course interviews.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const handleStart = async (template: PendingCourseInterview) => {
    if (startingId !== null) return;
    setStartingId(template.id);
    try {
      const created = await mockInterviewService.startTemplateInterview(
        template.id
      );
      router.push(`/mock-interview/${created.id}/device-check`);
    } catch (err) {
      showToast("Couldn't start that interview. Please try again.", "error");
      setStartingId(null);
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header + back link */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Button
            startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
            onClick={() => router.push("/mock-interview")}
            sx={{
              textTransform: "none",
              color: "var(--font-secondary)",
              "&:hover": { backgroundColor: "var(--surface)" },
            }}
          >
            Back to Interviews
          </Button>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "var(--accent-indigo)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper
              icon="mdi:clipboard-clock"
              size={26}
              color="var(--font-light)"
            />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Interviews from your courses
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--font-secondary)" }}
            >
              Interviews your instructors have assigned through your enrolled courses.
              Start whichever you're ready for — they run exactly like Quick Start.
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            Loading your assigned interviews…
          </Typography>
        ) : templates.length === 0 ? (
          // Empty state. Two common cases: student isn't enrolled in any mapped course
          // yet, or they've already completed all their assigned interviews.
          <Box
            sx={{
              p: 6,
              border: "1px dashed var(--border-default)",
              borderRadius: 3,
              textAlign: "center",
              backgroundColor: "var(--surface)",
            }}
          >
            <IconWrapper
              icon="mdi:school-outline"
              size={40}
              color="var(--font-tertiary)"
            />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mt: 2, mb: 0.5 }}
            >
              No pending course interviews
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "var(--font-secondary)" }}
            >
              You'll see interviews here once they're attached to one of your enrolled
              courses. In the meantime, you can practice with Quick Start.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push("/mock-interview/quick-start")}
              startIcon={
                <IconWrapper icon="mdi:lightning-bolt" size={18} />
              }
              sx={{
                mt: 3,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              Go to Quick Start
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                xl: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {templates.map((tmpl) => (
              <Box
                key={tmpl.id}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--card-bg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, flex: 1 }}
                  >
                    {cleanInterviewTitle(tmpl.title)}
                  </Typography>
                  <Chip
                    label={tmpl.difficulty}
                    size="small"
                    sx={{
                      backgroundColor:
                        tmpl.difficulty === "Easy"
                          ? "var(--surface-green-light)"
                          : tmpl.difficulty === "Hard"
                            ? "var(--error-100)"
                            : "var(--warning-100)",
                      color:
                        tmpl.difficulty === "Easy"
                          ? "var(--ats-success-muted)"
                          : tmpl.difficulty === "Hard"
                            ? "var(--error-600)"
                            : "var(--ats-warning-muted)",
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--font-secondary)" }}
                >
                  {tmpl.topic}
                  {tmpl.subtopic ? ` • ${tmpl.subtopic}` : ""}
                </Typography>
                {tmpl.description && (
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--font-secondary)" }}
                  >
                    {tmpl.description}
                  </Typography>
                )}
                {tmpl.course_titles.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--font-tertiary)" }}
                  >
                    From course: {tmpl.course_titles.join(", ")}
                  </Typography>
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mt: "auto",
                    pt: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--font-tertiary)" }}
                  >
                    ~{tmpl.duration_minutes} min
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleStart(tmpl)}
                    disabled={startingId === tmpl.id}
                    sx={{
                      backgroundColor: "var(--accent-indigo)",
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: "var(--accent-indigo-dark)",
                      },
                    }}
                  >
                    {startingId === tmpl.id
                      ? "Starting…"
                      : tmpl.has_attempt
                        ? "Resume"
                        : "Start interview"}
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </MainLayout>
  );
}
