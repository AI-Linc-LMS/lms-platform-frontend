"use client";

import Link from "next/link";
import { Box, Typography, Paper, Grid, Chip, Divider, Tooltip, Avatar } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ProgressRingChart } from "../charts/ProgressRingChart";
import { formatTimeSpent } from "@/lib/services/scorecard.service";
import { StudentOverview } from "@/lib/types/scorecard.types";

interface StudentOverviewSectionProps {
  data: StudentOverview;
  /** When true (e.g. admin view), course cards are not clickable */
  readOnly?: boolean;
}

export function StudentOverviewSection({ data, readOnly }: StudentOverviewSectionProps) {
  const getGradeColor = () => {
    switch (data.overallGrade) {
      case "Interview-Ready":
        return "#10b981";
      case "Advanced":
        return "#0a66c2";
      case "Intermediate":
        return "#f59e0b";
      default:
        return "#9ca3af";
    }
  };

  const getStatusColor = () => {
    switch (data.statusBadge) {
      case "Green":
        return "#10b981";
      case "Amber":
        return "#f59e0b";
      default:
        return "#ef4444";
    }
  };

  const getGradeGradient = () => {
    switch (data.overallGrade) {
      case "Interview-Ready":
        return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      case "Advanced":
        return "linear-gradient(135deg, #0a66c2 0%, #004182 100%)";
      case "Intermediate":
        return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      default:
        return "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
    }
  };

  // Daily performance score from API (composite of today's completion, quiz, assessment, mock interview)
  const dailyScoreLabel =
    data.dailyPerformanceScore != null && data.dailyPerformanceScore >= 0
      ? `Today: ${Math.round(data.dailyPerformanceScore)}`
      : null;

  // Programs: split comma-separated names so we can show each in full (no truncation)
  const programNames = data.programName
    ? data.programName.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      {/* Row 1: Identity strip - Name, Programs (chips), Cohort */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          mb: 3,
          pb: 3,
          borderBottom: "2px solid rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {data.profilePicUrl ? (
            <Avatar
              src={data.profilePicUrl}
              alt={data.studentName || "Student"}
              sx={{
                width: 48,
                height: 48,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            />
          ) : (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: getGradeGradient(),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <IconWrapper icon="mdi:account-circle" size={28} color="#ffffff" />
            </Box>
          )}
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: { xs: "1.15rem", sm: "1.35rem" },
                lineHeight: 1.2,
              }}
            >
              {data.studentName || "—"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#666666", fontSize: "0.8rem", mt: 0.25 }}
            >
              Student Overview
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {programNames.length > 0 ? (
            programNames.map((name) => (
              <Chip
                key={name}
                label={name}
                size="small"
                icon={<IconWrapper icon="mdi:school-outline" size={16} color="#0a66c2" />}
                sx={{
                  backgroundColor: "rgba(10, 102, 194, 0.08)",
                  color: "#0a66c2",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  "& .MuiChip-icon": { color: "#0a66c2" },
                }}
              />
            ))
          ) : (
            <Typography variant="body2" sx={{ color: "#666666" }}>
              No program
            </Typography>
          )}
        </Box>
        {data.cohort && (
          <Chip
            label={data.cohort}
            size="small"
            sx={{
              backgroundColor: "rgba(0,0,0,0.06)",
              color: "#555",
              fontWeight: 500,
              fontSize: "0.75rem",
            }}
          />
        )}
      </Box>

      {/* Row 2: Overall Performance Score (left) + Performance Metrics (right) */}
      <Grid container spacing={3}>
        {/* Left: Overall Performance Score */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${getGradeColor()}15 0%, ${getGradeColor()}05 100%)`,
              border: `2px solid ${getGradeColor()}30`,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: getGradeGradient(),
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5 }}>
              <Box sx={{ position: "relative" }}>
                <ProgressRingChart value={data.overallPerformanceScore} size={200} fontSize={42} />
                {dailyScoreLabel != null && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -10,
                      right: -10,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "20px",
                      backgroundColor: "#10b981",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <IconWrapper icon="mdi:trending-up" size={16} color="#ffffff" />
                    <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: 700, fontSize: "0.75rem" }}>
                      {dailyScoreLabel}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ textAlign: "center", width: "100%" }}>
                <Typography variant="body2" sx={{ color: "#666666", fontSize: "0.875rem", mb: 1.5, fontWeight: 500 }}>
                  Overall Performance Score
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, flexWrap: "wrap" }}>
                  <Chip
                    label={data.overallGrade}
                    icon={<IconWrapper icon="mdi:star" size={18} color="#ffffff" />}
                    sx={{
                      background: getGradeGradient(),
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "1rem",
                      height: 36,
                      px: 1,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      "& .MuiChip-icon": { color: "#ffffff" },
                    }}
                  />
                  {data.gradeCriteria && (
                    <Tooltip title={data.gradeCriteria} placement="top" arrow>
                      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", cursor: "help" }}>
                        <IconWrapper icon="mdi:information-outline" size={20} color="#666666" />
                      </Box>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem", display: "block", mt: 1.5 }}>
                  Based on completion and time (score 0–100)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Right: Performance Metrics */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#000000", fontSize: "1.25rem", mb: 2 }}>
              Performance Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    minHeight: 150,
                    backgroundColor: "#ffffff",
                    border: "2px solid rgba(10, 102, 194, 0.2)",
                background: "linear-gradient(135deg, rgba(10, 102, 194, 0.05) 0%, rgba(10, 102, 194, 0.02) 100%)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(10, 102, 194, 0.15)",
                  transform: "translateY(-2px)",
                  borderColor: "rgba(10, 102, 194, 0.4)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: "rgba(10, 102, 194, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon="mdi:clock-outline" size={24} color="#0a66c2" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#666666",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      display: "block",
                    }}
                  >
                    Total Time Spent
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: "#000000",
                      fontSize: "1.75rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {formatTimeSpent(data.totalTimeSpentSeconds)}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.875rem",
                }}
              >
                Active learning time
              </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    minHeight: 150,
                    backgroundColor: "#ffffff",
                    border: "2px solid rgba(245, 158, 11, 0.2)",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
                  transform: "translateY(-2px)",
                  borderColor: "rgba(245, 158, 11, 0.4)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon="mdi:fire" size={24} color="#f59e0b" />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#666666",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      display: "block",
                    }}
                  >
                    Active Days Streak
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: "#000000",
                        fontSize: "1.75rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {data.activeDaysStreak}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.25,
                        px: 1,
                        py: 0.25,
                        borderRadius: "12px",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                      }}
                    >
                      <IconWrapper icon="mdi:trending-up" size={14} color="#10b981" />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#10b981",
                          fontWeight: 700,
                          fontSize: "0.8125rem",
                        }}
                      >
                        {data.activeDaysStreak === 0
                          ? "0 days"
                          : data.activeDaysStreak === 1
                            ? "+1 day"
                            : `+${data.activeDaysStreak} days`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.875rem",
                }}
              >
                {data.totalDaysActive ?? 0} total days active · Consecutive active days
              </Typography>
            </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                minHeight: 150,
                backgroundColor: "#ffffff",
                border: "2px solid rgba(16, 185, 129, 0.2)",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
                  transform: "translateY(-2px)",
                  borderColor: "rgba(16, 185, 129, 0.4)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Box sx={{ position: "relative" }}>
                  <ProgressRingChart
                    value={data.completionPercentage}
                    size={48}
                    fontSize={14}
                    showLabel={false}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#666666",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      display: "block",
                    }}
                  >
                    Completion
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: "#000000",
                      fontSize: "1.75rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {data.completionPercentage}%
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.875rem",
                }}
              >
                Course completion progress
              </Typography>
            </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                minHeight: 150,
                backgroundColor: "#ffffff",
                border: `2px solid ${getStatusColor()}40`,
                background: `linear-gradient(135deg, ${getStatusColor()}15 0%, ${getStatusColor()}05 100%)`,
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: `0 4px 12px ${getStatusColor()}30`,
                  transform: "translateY(-2px)",
                  borderColor: `${getStatusColor()}60`,
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: `${getStatusColor()}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon="mdi:flag" size={24} color={getStatusColor()} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#666666",
                      fontSize: "0.9375rem",
                      fontWeight: 500,
                      display: "block",
                    }}
                  >
                    Status
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <Chip
                      label={data.statusBadge}
                      sx={{
                        backgroundColor: getStatusColor(),
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "1rem",
                        height: 30,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                    {data.statusCriteria && (
                      <Tooltip title={data.statusCriteria} placement="top" arrow>
                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", cursor: "help" }}>
                          <IconWrapper icon="mdi:information-outline" size={18} color="#666666" />
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#666666",
                  fontSize: "0.875rem",
                }}
              >
                Overall performance status
              </Typography>
            </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Row 3: Current Week / Module - Across all enrolled courses (full width) */}
      <Box
        sx={{
          mt: 3,
          p: 2.5,
          borderRadius: 2,
          backgroundColor: "#f9fafb",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: "rgba(10, 102, 194, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:calendar-week" size={22} color="#0a66c2" />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem", fontWeight: 500, display: "block" }}>
              Current Week / Module
            </Typography>
            <Typography variant="body2" sx={{ color: "#000000", fontSize: "0.875rem", fontWeight: 600 }}>
              Across all enrolled courses
            </Typography>
          </Box>
        </Box>
        {data.courseProgress && data.courseProgress.length > 0 ? (
          <Grid container spacing={2}>
            {data.courseProgress.map((course) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.courseId}>
                {readOnly ? (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid rgba(10, 102, 194, 0.2)",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#0a66c2",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        display: "block",
                        mb: 0.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {course.courseName}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>
                      Week {course.currentWeek}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem", display: "block", mt: 0.25 }}>
                      {course.currentModule}
                    </Typography>
                  </Box>
                ) : (
                  <Link href={`/courses/${course.courseId}`} style={{ textDecoration: "none" }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid rgba(10, 102, 194, 0.2)",
                        backgroundColor: "#ffffff",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        "&:hover": {
                          boxShadow: "0 2px 8px rgba(10, 102, 194, 0.12)",
                          borderColor: "rgba(10, 102, 194, 0.35)",
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#0a66c2",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          display: "block",
                          mb: 0.5,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {course.courseName}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>
                        Week {course.currentWeek}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem", display: "block", mt: 0.25 }}>
                        {course.currentModule}
                      </Typography>
                    </Box>
                  </Link>
                )}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="body1" sx={{ fontWeight: 700, color: "#000000", fontSize: "1rem" }}>
              Week {data.currentWeek}
            </Typography>
            <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
              {data.currentModule}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
