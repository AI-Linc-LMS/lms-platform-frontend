"use client";

import Link from "next/link";
import { Box, Typography, Paper, Chip, Tooltip, Avatar } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ProgressRingChart } from "@/components/charts";
import { formatTimeSpent } from "@/lib/services/scorecard.service";
import { StudentOverview } from "@/lib/types/scorecard.types";
import {
  gradeLevelColor,
  gradeLevelGradient,
  learningStateAccentColor,
  learningStateLabel,
  learningStateTooltip,
} from "@/lib/utils/scorecard-visual";

interface StudentOverviewSectionProps {
  data: StudentOverview;
  /** When true (e.g. admin view), course cards are not clickable */
  readOnly?: boolean;
}

export function StudentOverviewSection({ data, readOnly }: StudentOverviewSectionProps) {
  const gradeColor = gradeLevelColor(data.overallGrade);
  const gradeGrad = gradeLevelGradient(data.overallGrade);
  const learningStateColor = learningStateAccentColor(data.statusBadge);

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
                background: gradeGrad,
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
            programNames.map((name, index) => (
              <Chip
                key={`program-${index}-${name}`}
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
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 2fr)" },
          gap: 3,
        }}
      >
        {/* Left: Overall Performance Score */}
        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${gradeColor}15 0%, ${gradeColor}05 100%)`,
              border: `2px solid ${gradeColor}30`,
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: gradeGrad,
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
                      background: gradeGrad,
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
        </Box>

        {/* Right: Performance Metrics */}
        <Box sx={{ minWidth: 0 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#000000", fontSize: "1.25rem", mb: 2 }}>
              Performance Metrics
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
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
              </Box>

              <Box sx={{ minWidth: 0 }}>
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
              </Box>

              <Box sx={{ minWidth: 0 }}>
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
              </Box>

              <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                minHeight: 150,
                backgroundColor: "#ffffff",
                border: `2px solid ${learningStateColor}40`,
                background: `linear-gradient(135deg, ${learningStateColor}15 0%, ${learningStateColor}05 100%)`,
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: `0 4px 12px ${learningStateColor}30`,
                  transform: "translateY(-2px)",
                  borderColor: `${learningStateColor}60`,
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: `${learningStateColor}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IconWrapper icon="mdi:school-outline" size={24} color={learningStateColor} />
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
                    Learning state
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <Chip
                      label={learningStateLabel(data.statusBadge)}
                      sx={{
                        backgroundColor: learningStateColor,
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "1rem",
                        height: 30,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Tooltip title={learningStateTooltip(data.statusBadge)} placement="top" arrow>
                      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", cursor: "help" }}>
                        <IconWrapper icon="mdi:information-outline" size={18} color="#666666" />
                      </Box>
                    </Tooltip>
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
                Based on recent activity vs targets.
              </Typography>
            </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            {data.courseProgress.map((course) => (
              <Box key={course.courseId} sx={{ minWidth: 0 }}>
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
              </Box>
            ))}
          </Box>
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
