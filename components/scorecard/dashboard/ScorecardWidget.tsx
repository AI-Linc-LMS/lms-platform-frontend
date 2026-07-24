"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Paper,
  Skeleton,
  alpha,
  useTheme,
} from "@mui/material";

import { IconWrapper } from "@/components/common/IconWrapper";
import { formatTimeSpent, scorecardService } from "@/lib/services/scorecard.service";
import type { LearningConsumption, PerformanceLevel } from "@/lib/types/scorecard.types";
import {
  AnimatedRing,
  CountUp,
  Reveal,
  SectionShell,
} from "@/components/scorecard/shared";
import {
  gradeLevelColor,
  gradeLevelGradient,
} from "@/lib/utils/scorecard-visual";

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

const WIDGET_MESH = [
  "radial-gradient(60% 50% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 12%, transparent), transparent 65%)",
  "radial-gradient(50% 50% at 100% 0%, color-mix(in srgb, var(--accent-cyan) 10%, transparent), transparent 65%)",
  "radial-gradient(45% 45% at 100% 100%, color-mix(in srgb, var(--accent-purple) 9%, transparent), transparent 65%)",
];

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

  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <SectionShell radialMesh={WIDGET_MESH}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              <Skeleton variant="rounded" width={48} height={48} animation="wave" sx={{ borderRadius: 1.5 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={140} height={20} animation="wave" sx={{ mb: 0.75 }} />
                <Skeleton variant="text" width="60%" height={36} animation="wave" sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="40%" height={20} animation="wave" />
              </Box>
            </Box>
            <Skeleton variant="rounded" width={170} height={42} animation="wave" sx={{ borderRadius: 999, display: { xs: "none", sm: "block" } }} />
          </Box>
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
              mb: 3,
            }}
          >
            <Skeleton variant="rounded" height={280} animation="wave" sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" height={280} animation="wave" sx={{ borderRadius: 3 }} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={90} animation="wave" />
            ))}
          </Box>
        </SectionShell>
      </Box>
    );
  }

  if (loadError || !data) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          mb: 3,
          textAlign: "center",
          backgroundColor: "var(--card-bg)",
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
          <Button
            variant="outlined"
            color="primary"
            onClick={() => fetchData()}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 999, px: 2.5 }}
          >
            Retry
          </Button>
          <Button
            variant="contained"
            onClick={() => router.push("/user/scorecard")}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 999, px: 2.5 }}
          >
            Open scorecard
          </Button>
        </Box>
      </Paper>
    );
  }

  const lc = data.learningConsumption;
  const gradeColor = gradeLevelColor(data.overallGrade);
  const gradeGrad = gradeLevelGradient(data.overallGrade);

  const breakdown: ReadonlyArray<{
    key: string;
    label: string;
    icon: string;
    accent: string;
    completed: number;
    total: number;
  }> = [
    {
      key: "videos",
      label: "Videos",
      icon: "mdi:play-circle",
      accent: theme.palette.primary.main,
      completed: lc.videos.completed,
      total: lc.videos.totalAssigned,
    },
    {
      key: "articles",
      label: "Articles",
      icon: "mdi:book-open-variant",
      accent: theme.palette.success.main,
      completed: lc.articles.read,
      total: lc.articles.totalAssigned,
    },
    {
      key: "quizzes",
      label: "Course quizzes",
      icon: "mdi:help-circle-outline",
      accent: theme.palette.warning.main,
      completed: lc.practice.mcqsAttempted,
      total: lc.practice.mcqsTotal,
    },
    {
      key: "coding",
      label: "Coding",
      icon: "mdi:code-braces",
      accent: theme.palette.info.main,
      completed: lc.codingProblems.completed,
      total: lc.codingProblems.totalAssigned,
    },
    {
      key: "mock",
      label: "Mock interviews",
      icon: "mdi:account-voice",
      accent: theme.palette.secondary.main,
      completed: lc.mockInterviews.completed,
      total: lc.mockInterviews.totalAssigned,
    },
    {
      key: "assessments",
      label: "Assessments",
      icon: "mdi:clipboard-text-outline",
      accent: "#8b5cf6",
      completed: lc.practice.assessmentsAttempted,
      total: lc.practice.totalAssessmentsPresent ?? 0,
    },
  ];

  const bottomStats = [
    {
      key: "time",
      label: "Total time",
      value: formatTimeSpent(data.totalTimeSpentSeconds),
      icon: "mdi:clock-outline",
      accent: "#0a66c2",
    },
    {
      key: "streak",
      label: "Active streak",
      value: (
        <>
          <CountUp value={data.activeDaysStreak} />
          <Box component="span" sx={{ ml: 0.5, fontSize: "0.5em", fontWeight: 700, color: "var(--font-secondary)" }}>
            days
          </Box>
        </>
      ),
      icon: "mdi:fire",
      accent: "#f59e0b",
    },
    {
      key: "completion",
      label: "Program completion",
      value: (
        <>
          <CountUp value={data.completionPercentage} />
          <Box component="span" sx={{ ml: 0.25, fontSize: "0.5em", fontWeight: 700, color: "var(--font-secondary)" }}>
            %
          </Box>
        </>
      ),
      icon: "mdi:progress-check",
      accent: "#10b981",
    },
  ];

  const learningProgress = Math.max(0, Math.min(100, data.learningProgressPct));

  return (
    <Box sx={{ mb: 3 }}>
      <Reveal as="section">
        <SectionShell radialMesh={WIDGET_MESH} meshOpacity={0.55}>
          {/* Editorial header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              pb: { xs: 3, md: 3.5 },
              mb: { xs: 3, md: 4 },
              borderBottom: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  flexShrink: 0,
                  background:
                    "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 14px 28px -14px color-mix(in srgb, var(--accent-indigo) 65%, transparent)",
                }}
              >
                <IconWrapper icon="mdi:chart-timeline-variant" size={24} color="#ffffff" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    mb: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--accent-indigo)",
                      boxShadow:
                        "0 0 0 3px color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    Learning Scorecard · Snapshot
                  </Typography>
                </Box>
                <Typography
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "1.6rem", sm: "1.9rem", md: "2.25rem" },
                    lineHeight: 1.05,
                    letterSpacing: "-0.035em",
                  }}
                >
                  Performance,{" "}
                  <Box
                    component="span"
                    sx={{
                      background:
                        "linear-gradient(120deg, var(--accent-indigo) 0%, var(--accent-cyan) 50%, var(--accent-purple) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    at a glance.
                  </Box>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    fontSize: "0.9rem",
                    mt: 0.75,
                    maxWidth: 520,
                    lineHeight: 1.5,
                  }}
                >
                  Your performance ring, learning progress, and quick stats - tap below for the full report.
                </Typography>
              </Box>
            </Box>
            <Button
              endIcon={<IconWrapper icon="mdi:arrow-top-right" size={16} />}
              onClick={() => router.push("/user/scorecard")}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.875rem",
                px: 2.5,
                py: 1,
                borderRadius: 999,
                color: "#ffffff",
                background:
                  "linear-gradient(120deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
                boxShadow:
                  "0 14px 30px -14px color-mix(in srgb, var(--accent-indigo) 70%, transparent)",
                flexShrink: 0,
                "&:hover": {
                  background:
                    "linear-gradient(120deg, var(--accent-indigo-dark) 0%, var(--accent-purple) 100%)",
                },
                display: { xs: "none", sm: "inline-flex" },
              }}
            >
              View full scorecard
            </Button>
          </Box>

          {/* Hero grid: performance ring + learning progress */}
          <Box
            sx={{
              display: "grid",
              gap: { xs: 3, md: 3 },
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
              mb: { xs: 3, md: 4 },
            }}
          >
            {/* Left: overall performance ring */}
            <Box
              sx={{
                position: "relative",
                p: { xs: 3, sm: 3.5 },
                borderRadius: 3,
                overflow: "hidden",
                background: `linear-gradient(160deg, ${gradeColor}18 0%, ${gradeColor}04 60%, transparent 100%)`,
                border: `1px solid ${gradeColor}30`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2.5,
                minHeight: 280,
              }}
            >
              <AnimatedRing
                value={data.overallScore}
                size={180}
                strokeWidth={12}
                color={gradeColor}
                colorEnd={"#0a66c2"}
                valueFontSize={44}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  textAlign: "center",
                  mt: -0.5,
                }}
              >
                Overall Performance
              </Typography>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.75,
                  py: 0.625,
                  borderRadius: 999,
                  background: gradeGrad,
                  color: "#ffffff",
                  boxShadow: `0 8px 20px -8px ${gradeColor}88`,
                }}
              >
                <IconWrapper icon="mdi:star-four-points" size={14} color="#ffffff" />
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {data.overallGrade}
                </Typography>
              </Box>
            </Box>

            {/* Right: learning progress panel */}
            <Box
              sx={{
                position: "relative",
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                overflow: "hidden",
                backgroundColor: "var(--card-bg)",
                border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
                backgroundImage:
                  "linear-gradient(160deg, color-mix(in srgb, var(--accent-indigo) 8%, transparent) 0%, transparent 60%)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background:
                      "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-cyan) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      "0 10px 20px -10px color-mix(in srgb, var(--accent-indigo) 60%, transparent)",
                  }}
                >
                  <IconWrapper icon="mdi:chart-arc" size={20} color="#ffffff" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: "1.05rem",
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Learning progress
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.78rem",
                      display: "block",
                      mt: 0.25,
                    }}
                  >
                    Completed vs assigned across content types
                  </Typography>
                </Box>
              </Box>

              {/* Weighted completion */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 0.75,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontSize: "0.65rem",
                    }}
                  >
                    Weighted completion
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: "var(--accent-indigo)",
                      fontSize: "0.95rem",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <CountUp value={learningProgress} duration={1.2} />%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${learningProgress}%`,
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-cyan) 100%)",
                      boxShadow:
                        "0 0 14px color-mix(in srgb, var(--accent-indigo) 60%, transparent)",
                      transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </Box>
              </Box>

              {/* Content type mini bento */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
                  gap: 1.25,
                }}
              >
                {breakdown.map((row) => (
                  <BreakdownTile
                    key={row.key}
                    accent={row.accent}
                    icon={row.icon}
                    label={row.label}
                    completed={row.completed}
                    total={row.total}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Bottom stats strip - editorial hairline cells */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
              borderLeft: { sm: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" },
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {bottomStats.map((stat) => (
              <Box
                key={stat.key}
                sx={{
                  position: "relative",
                  p: { xs: 2, sm: 2.5 },
                  display: "flex",
                  alignItems: "center",
                  gap: 1.75,
                  borderBottom: { xs: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)", sm: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" },
                  borderRight: { sm: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" },
                  borderLeft: { xs: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)", sm: "none" },
                  backgroundImage: `linear-gradient(180deg, transparent 0%, color-mix(in srgb, ${stat.accent} 4%, transparent) 100%)`,
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 32,
                    height: 2,
                    background: stat.accent,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: `color-mix(in srgb, ${stat.accent} 14%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconWrapper icon={stat.icon} size={20} color={stat.accent} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--font-secondary)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      display: "block",
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    component="div"
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      fontSize: "1.4rem",
                      lineHeight: 1.05,
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                      mt: 0.25,
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Mobile-only CTA */}
          <Box sx={{ mt: 2.5, display: { xs: "block", sm: "none" } }}>
            <Button
              fullWidth
              endIcon={<IconWrapper icon="mdi:arrow-right" size={18} />}
              onClick={() => router.push("/user/scorecard")}
              sx={{
                py: 1.35,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "#ffffff",
                background:
                  "linear-gradient(120deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
                boxShadow:
                  "0 14px 30px -14px color-mix(in srgb, var(--accent-indigo) 70%, transparent)",
                "&:hover": {
                  background:
                    "linear-gradient(120deg, var(--accent-indigo-dark) 0%, var(--accent-purple) 100%)",
                },
              }}
            >
              View full scorecard
            </Button>
          </Box>
        </SectionShell>
      </Reveal>
    </Box>
  );
}

interface BreakdownTileProps {
  accent: string;
  icon: string;
  label: string;
  completed: number;
  total: number;
}

function BreakdownTile({ accent, icon, label, completed, total }: BreakdownTileProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        position: "relative",
        p: 1.5,
        borderRadius: 2,
        backgroundColor: alpha(accent, isDark ? 0.12 : 0.05),
        border: `1px solid ${alpha(accent, isDark ? 0.28 : 0.18)}`,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -16,
          right: -16,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(accent, 0.18)} 0%, transparent 70%)`,
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />
      <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 0.5 }}>
        <IconWrapper icon={icon} size={14} color={accent} />
        <Typography
          variant="caption"
          sx={{
            color: "var(--font-secondary)",
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={label}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        component="div"
        sx={{
          position: "relative",
          fontWeight: 800,
          color: "var(--font-primary)",
          fontSize: "1.05rem",
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <CountUp value={completed} duration={1.1} />
        <Box
          component="span"
          sx={{
            color: "var(--font-secondary)",
            fontWeight: 600,
            fontSize: "0.85em",
            ml: 0.5,
          }}
        >
          / {total}
        </Box>
      </Typography>
    </Box>
  );
}
