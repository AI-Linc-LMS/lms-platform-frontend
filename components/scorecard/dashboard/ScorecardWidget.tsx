"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  Paper,
  Skeleton,
  LinearProgress,
  Chip,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";

import { IconWrapper } from "@/components/common/IconWrapper";
import { formatTimeSpent, scorecardService } from "@/lib/services/scorecard.service";
import type { LearningConsumption, PerformanceLevel } from "@/lib/types/scorecard.types";

import { OverallScoreCard } from "./OverallScoreCard";

interface DashboardSummary {
  overallScore: number;
  overallGrade: PerformanceLevel;
  totalTimeSpentSeconds: number;
  activeDaysStreak: number;
  completionPercentage: number;
  currentWeek: number;
  currentModule: string;
  learningConsumption: LearningConsumption;
  learningProgressPct: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function ScorecardWidget() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadError(false);
    setLoading(true);
    try {
      const summary = await scorecardService.getDashboardSummary();
      setData(summary);
    } catch {
      setData(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const primary = theme.palette.primary.main;

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5, md: 4 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          backgroundImage: (t) =>
            `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.04)} 0%, ${t.palette.background.paper} 50%)`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
          mb: 3,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            pb: 2.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Skeleton variant="circular" width={52} height={52} animation="wave" sx={{ flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="rounded" width={200} height={28} animation="wave" sx={{ mb: 0.75, borderRadius: 1 }} />
              <Skeleton variant="rounded" width={260} height={18} animation="wave" sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
          <Skeleton
            variant="rounded"
            width={132}
            height={42}
            animation="wave"
            sx={{ borderRadius: 3, display: { xs: "none", sm: "block" } }}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Skeleton variant="circular" width={128} height={128} animation="wave" />
              <Skeleton variant="rounded" width={88} height={26} animation="wave" sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" width={120} height={18} animation="wave" />
            </Box>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Skeleton variant="rounded" height={200} animation="wave" sx={{ borderRadius: 3, width: "100%" }} />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" }, minWidth: 0 }}>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  height={84}
                  animation="wave"
                  sx={{ borderRadius: 2, flex: "1 1 130px", minWidth: 120 }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Paper>
    );
  }

  if (loadError || !data) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
          textAlign: "center",
          backgroundImage: (t) =>
            `linear-gradient(135deg, ${alpha(t.palette.error.main, 0.04)} 0%, ${t.palette.background.paper} 45%)`,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.error.main, 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <IconWrapper icon="mdi:chart-line-variant" size={28} color={theme.palette.error.main} />
        </Box>
        <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
          Couldn&apos;t load scorecard preview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 360, mx: "auto" }}>
          Check your connection and try again, or open the full scorecard page.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="outlined" color="primary" onClick={() => fetchData()} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
            Retry
          </Button>
          <Button variant="contained" onClick={() => router.push("/user/scorecard")} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
            Open scorecard
          </Button>
        </Box>
      </Paper>
    );
  }

  const lc = data.learningConsumption;
  const stats = [
    {
      label: "Total time",
      value: formatTimeSpent(data.totalTimeSpentSeconds),
      icon: "mdi:clock-outline",
      color: primary,
      hint: "Time tracked across your learning activity.",
    },
    {
      label: "Active streak",
      value: `${data.activeDaysStreak} days`,
      icon: "mdi:fire",
      color: theme.palette.warning.main,
      hint: "Consecutive days with activity.",
    },
    {
      label: "Program completion",
      value: `${data.completionPercentage}%`,
      icon: "mdi:check-circle-outline",
      color: theme.palette.success.main,
      hint: "Overall completion across your program.",
    },
  ];

  const breakdown = [
    {
      key: "videos",
      label: "Videos",
      icon: "mdi:play-circle" as const,
      accent: primary,
      value: `${lc.videos.completed} / ${lc.videos.totalAssigned}`,
    },
    {
      key: "articles",
      label: "Articles",
      icon: "mdi:book-open-variant" as const,
      accent: theme.palette.success.main,
      value: `${lc.articles.read} / ${lc.articles.totalAssigned}`,
    },
    {
      key: "quizzes",
      label: "Course quizzes",
      icon: "mdi:help-circle-outline" as const,
      accent: theme.palette.warning.main,
      value: `${lc.practice.mcqsAttempted} / ${lc.practice.mcqsTotal}`,
    },
    {
      key: "coding",
      label: "Coding",
      icon: "mdi:code-braces" as const,
      accent: theme.palette.info.main,
      value: `${lc.codingProblems.completed} / ${lc.codingProblems.totalAssigned}`,
    },
    {
      key: "mock",
      label: "Mock interviews",
      icon: "mdi:account-voice" as const,
      accent: "#8b5cf6",
      value: `${lc.mockInterviews.completed} / ${lc.mockInterviews.totalAssigned}`,
    },
    {
      key: "assessments",
      label: "Assessments",
      icon: "mdi:clipboard-text-outline" as const,
      accent: theme.palette.secondary.main,
      value: `${lc.practice.assessmentsAttempted} / ${lc.practice.totalAssessmentsPresent ?? "—"}`,
    },
  ];

  return (
    <Paper
      component={motion.div}
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={fadeUp.transition}
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5, md: 4 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        backgroundImage: (t) =>
          `linear-gradient(145deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.primary.main, 0.02)} 28%, ${t.palette.background.paper} 55%)`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.045)",
        mb: 3,
        overflow: "hidden",
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${primary} 0%, ${alpha(primary, 0.5)} 50%, ${alpha(primary, 0.2)} 100%)`,
          opacity: 0.9,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
          pb: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${primary} 0%, ${alpha(primary, 0.75)} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 2px 8px ${alpha(primary, 0.2)}`,
            }}
          >
            <IconWrapper icon="mdi:chart-timeline-variant" size={26} color="#ffffff" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "text.primary",
                  fontSize: { xs: "1.35rem", sm: "1.65rem", md: "1.85rem" },
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                }}
              >
                Learning scorecard
              </Typography>
              <Chip
                size="small"
                label="Snapshot"
                sx={{
                  height: 24,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  bgcolor: alpha(primary, 0.12),
                  color: primary,
                  border: "1px solid",
                  borderColor: alpha(primary, 0.25),
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
              Performance ring, learning progress, and quick stats — tap below for the full report.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          endIcon={<IconWrapper icon="mdi:arrow-right" size={18} />}
          onClick={() => router.push("/user/scorecard")}
          sx={{
            backgroundColor: primary,
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.9rem",
            px: 2.75,
            py: 1.1,
            borderRadius: 2.5,
            boxShadow: `0 2px 8px ${alpha(primary, 0.22)}`,
            flexShrink: 0,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
              boxShadow: `0 3px 10px ${alpha(primary, 0.28)}`,
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s ease",
            display: { xs: "none", sm: "inline-flex" },
          }}
        >
          View full scorecard
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <OverallScoreCard score={data.overallScore} grade={data.overallGrade} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: alpha(primary, 0.2),
              background: (t) =>
                `linear-gradient(160deg, ${alpha(t.palette.primary.main, 0.08)} 0%, ${alpha(t.palette.primary.main, 0.02)} 42%, ${t.palette.background.paper} 100%)`,
              boxShadow: `0 0 0 1px ${alpha(primary, 0.06)}, 0 2px 10px rgba(0,0,0,0.035)`,
              height: "100%",
              position: "relative",
              overflow: "hidden",
              transition: "box-shadow 0.25s ease, border-color 0.25s ease",
              "&:hover": {
                borderColor: alpha(primary, 0.35),
                boxShadow: `0 0 0 1px ${alpha(primary, 0.08)}, 0 4px 14px rgba(0,0,0,0.05)`,
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, ${primary} 0%, ${alpha(primary, 0.4)} 100%)`,
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5, pt: 0.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: alpha(primary, 0.12),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:chart-arc" size={22} color={primary} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", fontSize: "1.05rem", lineHeight: 1.2 }}>
                  Learning progress
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                  Completed vs assigned across content types
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}>
                Weighted completion
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: primary, fontVariantNumeric: "tabular-nums" }}>
                {data.learningProgressPct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, data.learningProgressPct)}
              sx={{
                height: 12,
                borderRadius: 6,
                mb: 2,
                bgcolor: alpha(primary, 0.12),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 6,
                  background: `linear-gradient(90deg, ${primary} 0%, ${theme.palette.primary.dark} 100%)`,
                },
              }}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
                gap: 1.25,
              }}
            >
              {breakdown.map((row) => (
                <Tooltip key={row.key} title={`${row.label}: completed vs assigned`} arrow placement="top">
                  <Box
                    sx={{
                      p: 1.35,
                      borderRadius: 2,
                      bgcolor: alpha(row.accent, theme.palette.mode === "dark" ? 0.12 : 0.06),
                      border: "1px solid",
                      borderColor: alpha(row.accent, 0.22),
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      cursor: "default",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 2px 6px ${alpha(row.accent, 0.1)}`,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                      <IconWrapper icon={row.icon} size={16} color={row.accent} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: "0.68rem", lineHeight: 1.2 }}>
                        {row.label}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "text.primary", fontSize: "0.875rem" }}>
                      {row.value}
                    </Typography>
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" }, minWidth: 0 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 1.5,
            }}
          >
            {stats.map((s) => (
              <Tooltip key={s.label} title={s.hint} arrow>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    bgcolor: alpha(s.color, theme.palette.mode === "dark" ? 0.1 : 0.04),
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: alpha(s.color, 0.35),
                      bgcolor: alpha(s.color, theme.palette.mode === "dark" ? 0.14 : 0.07),
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: alpha(s.color, 0.15),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <IconWrapper icon={s.icon} size={22} color={s.color} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", letterSpacing: "0.02em" }}>
                      {s.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.25, fontVariantNumeric: "tabular-nums" }}>
                      {s.value}
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 2.5, display: { xs: "flex", sm: "none" }, justifyContent: "stretch" }}>
        <Button
          variant="contained"
          fullWidth
          endIcon={<IconWrapper icon="mdi:arrow-right" size={18} />}
          onClick={() => router.push("/user/scorecard")}
          sx={{
            backgroundColor: primary,
            py: 1.35,
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.95rem",
            boxShadow: `0 2px 8px ${alpha(primary, 0.2)}`,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
            },
          }}
        >
          View full scorecard
        </Button>
      </Box>
    </Paper>
  );
}
