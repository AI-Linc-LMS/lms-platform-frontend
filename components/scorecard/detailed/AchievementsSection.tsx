"use client";

import { Box, Typography, Paper, Grid, Chip, LinearProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Achievement } from "@/lib/types/scorecard.types";
import { ProgressRingChart } from "../charts/ProgressRingChart";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface AchievementsSectionProps {
  data: Achievement;
}

export function AchievementsSection({ data }: AchievementsSectionProps) {
  // Badge icon variations
  const badgeIcons = [
    "mdi:trophy",
    "mdi:medal",
    "mdi:star",
    "mdi:crown",
    "mdi:fire",
    "mdi:rocket-launch",
  ];

  const badgeColors = [
    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
  ];

  const getBadgeIcon = (index: number) => badgeIcons[index % badgeIcons.length];
  const getBadgeColor = (index: number) => badgeColors[index % badgeColors.length];

  // Calculate certificate progress percentage
  const certificateProgress = Math.round(
    (data.certificatesProgress.completed / data.certificatesProgress.total) * 100
  );

  // Certificate chart data
  const certificateData = [
    { name: "Completed", value: data.certificatesProgress.completed, color: "#10b981" },
    { name: "In Progress", value: data.certificatesProgress.inProgress, color: "#f59e0b" },
    {
      name: "Not Started",
      value:
        data.certificatesProgress.total -
        data.certificatesProgress.completed -
        data.certificatesProgress.inProgress,
      color: "#e5e7eb",
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          pb: 3,
          borderBottom: "2px solid rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
            }}
          >
            <IconWrapper icon="mdi:trophy-variant" size={28} color="#ffffff" />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#000000",
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                lineHeight: 1.2,
              }}
            >
              Achievements & Gamification
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#666666",
                fontSize: "0.875rem",
                mt: 0.5,
              }}
            >
              Celebrate your learning milestones and accomplishments
            </Typography>
          </Box>
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#f59e0b",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {data.badges.length}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Badges Earned
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#10b981",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {data.milestones.filter((m) => m.progress === 100).length}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Milestones
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f0fdf4",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#10b981",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {data.streakRewards.currentStreak}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Day Streak
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: "#f9fafb",
                border: "1px solid rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#0a66c2",
                  fontSize: "1.75rem",
                  mb: 0.5,
                }}
              >
                {data.skillUnlocks.length}
              </Typography>
              <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                Skills Unlocked
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Badges */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 2.5,
            fontSize: "1.125rem",
            color: "#000000",
          }}
        >
          Badges Earned
        </Typography>
        <Grid container spacing={3}>
          {data.badges.map((badge, index) => (
            <Grid item xs={12} sm={6} md={4} key={badge.id}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: "#ffffff",
                  border: "2px solid rgba(245, 158, 11, 0.2)",
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 12px 32px rgba(245, 158, 11, 0.25)",
                    transform: "translateY(-6px)",
                    borderColor: "rgba(245, 158, 11, 0.4)",
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: getBadgeColor(index),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: getBadgeColor(index),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      inset: -4,
                      borderRadius: "50%",
                      border: "2px solid",
                      borderColor: "rgba(255,255,255,0.3)",
                    },
                  }}
                >
                  <IconWrapper icon={getBadgeIcon(index)} size={40} color="#ffffff" />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#000000",
                    fontSize: "1.125rem",
                    mb: 0.75,
                  }}
                >
                  {badge.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#666666",
                    fontSize: "0.875rem",
                    mb: 1.5,
                    minHeight: "40px",
                  }}
                >
                  {badge.description}
                </Typography>
                <Chip
                  icon={<IconWrapper icon="mdi:calendar" size={14} color="#666666" />}
                  label={`Earned ${new Date(badge.earnedDate).toLocaleDateString()}`}
                  size="small"
                  sx={{
                    backgroundColor: "#f9fafb",
                    color: "#666666",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    height: 24,
                    "& .MuiChip-icon": {
                      color: "#666666",
                    },
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Milestones */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 2.5,
            fontSize: "1.125rem",
            color: "#000000",
          }}
        >
          Milestones
        </Typography>
        <Grid container spacing={3}>
          {data.milestones.map((milestone) => {
            const isCompleted = milestone.progress === 100;
            return (
              <Grid item xs={12} sm={6} key={milestone.id}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: isCompleted ? "#f0fdf4" : "#ffffff",
                    border: `2px solid ${isCompleted ? "rgba(16, 185, 129, 0.3)" : "rgba(0,0,0,0.08)"}`,
                    background: isCompleted
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)"
                      : "linear-gradient(135deg, rgba(10, 102, 194, 0.05) 0%, rgba(10, 102, 194, 0.02) 100%)",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: isCompleted
                        ? "0 12px 32px rgba(16, 185, 129, 0.2)"
                        : "0 12px 32px rgba(10, 102, 194, 0.2)",
                      transform: "translateY(-4px)",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background: isCompleted
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                        <IconWrapper
                          icon={isCompleted ? "mdi:check-circle" : "mdi:flag"}
                          size={24}
                          color={isCompleted ? "#10b981" : "#0a66c2"}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#000000",
                            fontSize: "1.125rem",
                          }}
                        >
                          {milestone.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#666666",
                          fontSize: "0.875rem",
                          mb: 2,
                        }}
                      >
                        {milestone.description}
                      </Typography>
                    </Box>
                    {isCompleted && (
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                          flexShrink: 0,
                        }}
                      >
                        <IconWrapper icon="mdi:check" size={24} color="#ffffff" />
                      </Box>
                    )}
                  </Box>

                  {!isCompleted && (
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" sx={{ color: "#666666", fontWeight: 500 }}>
                          Progress
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: "#0a66c2",
                            fontSize: "1rem",
                          }}
                        >
                          {milestone.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={milestone.progress}
                        sx={{
                          height: 10,
                          borderRadius: 2,
                          backgroundColor: "#e5e7eb",
                          "& .MuiLinearProgress-bar": {
                            background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                  )}

                  {isCompleted && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        mt: 1.5,
                        pt: 1.5,
                        borderTop: "1px solid rgba(16, 185, 129, 0.2)",
                      }}
                    >
                      <IconWrapper icon="mdi:calendar-check" size={18} color="#10b981" />
                      <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                        Completed on {new Date(milestone.completedDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Other Achievements */}
      <Grid container spacing={3}>
        {/* Skill Unlocks */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              border: "2px solid rgba(10, 102, 194, 0.2)",
              background: "linear-gradient(135deg, rgba(10, 102, 194, 0.05) 0%, rgba(10, 102, 194, 0.02) 100%)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(10, 102, 194, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:lock-open-variant" size={20} color="#0a66c2" />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: "1.125rem",
                }}
              >
                Skill Unlocks
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {data.skillUnlocks.map((skill, index) => (
                <Chip
                  key={index}
                  icon={<IconWrapper icon="mdi:star" size={16} color="#0a66c2" />}
                  label={skill}
                  sx={{
                    backgroundColor: "rgba(10, 102, 194, 0.1)",
                    color: "#0a66c2",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    height: 32,
                    border: "1px solid rgba(10, 102, 194, 0.2)",
                    "&:hover": {
                      backgroundColor: "rgba(10, 102, 194, 0.15)",
                    },
                    "& .MuiChip-icon": {
                      color: "#0a66c2",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Streak Rewards */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              border: "2px solid rgba(245, 158, 11, 0.2)",
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:fire" size={20} color="#f59e0b" />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: "1.125rem",
                }}
              >
                Streak Rewards
              </Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: "#f59e0b",
                      fontSize: "1.5rem",
                      mb: 0.25,
                    }}
                  >
                    {data.streakRewards.currentStreak}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem" }}>
                    Current
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: "#f59e0b",
                      fontSize: "1.5rem",
                      mb: 0.25,
                    }}
                  >
                    {data.streakRewards.longestStreak}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.7rem" }}>
                    Longest
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {data.streakRewards.rewards.map((reward, index) => (
                <Chip
                  key={index}
                  icon={<IconWrapper icon="mdi:trophy" size={16} color="#f59e0b" />}
                  label={reward}
                  sx={{
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    color: "#f59e0b",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    height: 32,
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    "&:hover": {
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                    },
                    "& .MuiChip-icon": {
                      color: "#f59e0b",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Certificates Progress */}
        <Grid item xs={12}>
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: "#ffffff",
              border: "2px solid rgba(10, 102, 194, 0.2)",
              background: "linear-gradient(135deg, rgba(10, 102, 194, 0.05) 0%, rgba(10, 102, 194, 0.02) 100%)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(10, 102, 194, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon="mdi:certificate" size={20} color="#0a66c2" />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#000000",
                  fontSize: "1.125rem",
                }}
              >
                Certificates Progress
              </Typography>
            </Box>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#f9fafb",
                        border: "1px solid rgba(0,0,0,0.08)",
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: "#000000",
                          fontSize: "1.75rem",
                          mb: 0.5,
                        }}
                      >
                        {data.certificatesProgress.total}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#f0fdf4",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: "#10b981",
                          fontSize: "1.75rem",
                          mb: 0.5,
                        }}
                      >
                        {data.certificatesProgress.completed}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                        Completed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#fffbeb",
                        border: "1px solid rgba(245, 158, 11, 0.2)",
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: "#f59e0b",
                          fontSize: "1.75rem",
                          mb: 0.5,
                        }}
                      >
                        {data.certificatesProgress.inProgress}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                        In Progress
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" sx={{ color: "#666666", fontWeight: 500 }}>
                      Overall Progress
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: "#0a66c2",
                        fontSize: "1rem",
                      }}
                    >
                      {certificateProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={certificateProgress}
                    sx={{
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        background: "linear-gradient(135deg, #0a66c2 0%, #004182 100%)",
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    height: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={certificateData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {certificateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
