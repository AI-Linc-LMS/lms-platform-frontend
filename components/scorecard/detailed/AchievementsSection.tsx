"use client";

import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Achievement, Badge } from "@/lib/types/scorecard.types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

const BADGE_ICON_MAP: Record<string, string> = {
  trophy: "mdi:trophy-outline",
  medal: "mdi:medal-outline",
  star: "mdi:star-outline",
  crown: "mdi:crown-outline",
  fire: "mdi:fire",
  video: "mdi:video-outline",
};

const BADGE_ICONS = ["mdi:trophy-outline", "mdi:medal-outline", "mdi:star-outline", "mdi:crown-outline", "mdi:fire", "mdi:video-outline", "mdi:star-circle-outline"];

const BADGE_PASTEL_BGS = ["#fef3c7", "#dbeafe", "#d1fae5", "#ede9fe", "#fee2e2", "#fce7f3", "#fef9c3"];
const BADGE_ICON_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#ec4899", "#eab308"];

function getBadgeIcon(badge: Badge, index: number): string {
  if (badge.iconSlug && BADGE_ICON_MAP[badge.iconSlug]) {
    return BADGE_ICON_MAP[badge.iconSlug];
  }
  return BADGE_ICONS[index % BADGE_ICONS.length];
}

interface AchievementsSectionProps {
  data: Achievement;
}

export function AchievementsSection({ data }: AchievementsSectionProps) {
  const earnedBadgesCount = data.badges.filter((b) => b.earnedDate).length;
  const completedMilestonesCount = data.milestones.filter((m) => m.progress === 100).length;
  const certificateProgress =
    data.certificatesProgress.total > 0
      ? Math.round(
          (data.certificatesProgress.completed / data.certificatesProgress.total) * 100
        )
      : 0;

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
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        backgroundColor: "#ffffff",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", mb: 0.5, fontSize: "1.25rem" }}>
          Achievements & Gamification
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280", fontSize: "0.875rem", mb: 3 }}>
          Celebrate your learning milestones and accomplishments
        </Typography>

        {/* Summary Stats - admin-style metric cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {[
            { value: earnedBadgesCount, label: "Badges Earned", icon: "mdi:trophy-outline", bg: "#fef3c7", color: "#f59e0b" },
            { value: completedMilestonesCount, label: "Milestones", icon: "mdi:flag-checkered", bg: "#d1fae5", color: "#10b981" },
            { value: data.streakRewards.currentStreak, label: "Day Streak", icon: "mdi:fire", bg: "#fee2e2", color: "#ef4444" },
            { value: `${data.certificatesProgress.completed}/${data.certificatesProgress.total}`, label: "Certificates", icon: "mdi:certificate-outline", bg: "#dbeafe", color: "#3b82f6" },
          ].map((stat) => (
            <Paper
              key={stat.label}
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: stat.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon={stat.icon} size={24} color={stat.color} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  {stat.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", mt: 0.25, fontSize: "1.25rem" }}>
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Badges Earned - clean admin-style cards */}
      <Box sx={{ mb: 4, width: "100%", maxWidth: "100%", overflow: "hidden" }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", mb: 2, fontSize: "1.125rem" }}>
          Badges Earned
        </Typography>
        <Grid container spacing={2} sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
          {data.badges.map((badge, index) => {
            const isEarned = !!badge.earnedDate;
            const bg = BADGE_PASTEL_BGS[index % BADGE_PASTEL_BGS.length];
            const iconColor = isEarned ? BADGE_ICON_COLORS[index % BADGE_ICON_COLORS.length] : "#9ca3af";
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={badge.id} sx={{ minWidth: 0 }}>
                <Tooltip title={!isEarned ? badge.description : undefined} arrow>
                  <Box component="span" sx={{ display: "block", width: "100%" }}>
                  <Paper
                    sx={{
                      width: "100%",
                      boxSizing: "border-box",
                      p: 2,
                      borderRadius: 2,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: 1,
                      opacity: isEarned ? 1 : 0.85,
                      "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                      transition: "box-shadow 0.2s",
                    }}
                  >
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        backgroundColor: isEarned ? bg : "#e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconWrapper
                        icon={isEarned ? getBadgeIcon(badge, index) : "mdi:lock-outline"}
                        size={28}
                        color={iconColor}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", fontSize: "0.9375rem" }}>
                      {badge.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.8125rem", display: "block" }}>
                      {badge.description}
                    </Typography>
                    {isEarned && badge.earnedDate ? (
                      <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 600, fontSize: "0.75rem" }}>
                        {new Date(badge.earnedDate).toLocaleDateString()}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                        Locked
                      </Typography>
                    )}
                  </Paper>
                  </Box>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Milestones - enhanced cards */}
      <Box sx={{ mb: 4, width: "100%", maxWidth: "100%", overflow: "hidden" }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", mb: 2, fontSize: "1.125rem" }}>
          Milestones
        </Typography>
        <Grid container spacing={2} sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
          {data.milestones.map((milestone) => {
            const isCompleted = milestone.progress === 100;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={milestone.id} sx={{ display: "flex", minWidth: 0 }}>
                <Paper
                  sx={{
                    p: 2.5,
                    width: "100%",
                    flex: 1,
                    minWidth: 0,
                    minHeight: 240,
                    height: "100%",
                    borderRadius: 2,
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: isCompleted ? "rgba(16, 185, 129, 0.3)" : "rgba(0,0,0,0.08)",
                    backgroundColor: isCompleted ? "rgba(16, 185, 129, 0.04)" : "#fafafa",
                    boxShadow: isCompleted ? "0 2px 8px rgba(16, 185, 129, 0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 1.5,
                    "&:hover": {
                      boxShadow: isCompleted ? "0 8px 24px rgba(16, 185, 129, 0.18)" : "0 4px 12px rgba(0,0,0,0.08)",
                    },
                    transition: "all 0.2s ease",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: isCompleted ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #9ca3af, #6b7280)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      flexShrink: 0,
                      borderRadius: "50%",
                      backgroundColor: isCompleted ? "#10b981" : "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isCompleted ? "0 4px 12px rgba(16, 185, 129, 0.35)" : "0 2px 6px rgba(0,0,0,0.08)",
                    }}
                  >
                    <IconWrapper
                      icon={isCompleted ? "mdi:check-circle" : "mdi:flag-outline"}
                      size={30}
                      color={isCompleted ? "#ffffff" : "#6b7280"}
                    />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#111827", fontSize: "1rem" }}>
                    {milestone.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.8125rem", lineHeight: 1.4, minHeight: 36 }}>
                    {milestone.description}
                  </Typography>
                  {!isCompleted ? (
                    <Box sx={{ width: "100%", mt: 0.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                        <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 600 }}>
                          Progress
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#0ea5e9", fontSize: "0.875rem" }}>
                          {milestone.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={milestone.progress}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#e5e7eb",
                          "& .MuiLinearProgress-bar": {
                            background: "linear-gradient(90deg, #0ea5e9, #38bdf8)",
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    milestone.completedDate && (
                      <Chip
                        icon={<IconWrapper icon="mdi:calendar-check" size={14} color="#059669" />}
                        label={new Date(milestone.completedDate).toLocaleDateString()}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          color: "#059669",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          "& .MuiChip-icon": { color: "#059669" },
                        }}
                      />
                    )
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Streak Rewards & Certificates Progress */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid rgba(249, 115, 22, 0.2)",
              backgroundColor: "rgba(249, 115, 22, 0.02)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              height: "100%",
              "&:hover": { boxShadow: "0 4px 12px rgba(249, 115, 22, 0.1)" },
              transition: "box-shadow 0.2s",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                }}
              >
                <IconWrapper icon="mdi:fire" size={24} color="#ffffff" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", fontSize: "1.0625rem" }}>
                  Streak Rewards
                </Typography>
                <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  Keep learning daily to earn rewards
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(249, 115, 22, 0.2)",
                  backgroundColor: "#ffffff",
                  textAlign: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Current
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#f97316", mt: 0.5, fontSize: "1.75rem" }}>
                  {data.streakRewards.currentStreak}
                </Typography>
                <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.7rem" }}>days</Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(249, 115, 22, 0.2)",
                  backgroundColor: "#ffffff",
                  textAlign: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Longest
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#f97316", mt: 0.5, fontSize: "1.75rem" }}>
                  {data.streakRewards.longestStreak}
                </Typography>
                <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.7rem" }}>days</Typography>
              </Box>
            </Box>
            {data.streakRewards.rewards.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {data.streakRewards.rewards.map((reward, index) => (
                  <Chip
                    key={index}
                    icon={<IconWrapper icon="mdi:trophy" size={16} color="#f59e0b" />}
                    label={reward}
                    size="small"
                    sx={{
                      backgroundColor: "#fef3c7",
                      color: "#b45309",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      "& .MuiChip-icon": { color: "#f59e0b" },
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid rgba(59, 130, 246, 0.2)",
              backgroundColor: "rgba(59, 130, 246, 0.02)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              height: "100%",
              "&:hover": { boxShadow: "0 4px 12px rgba(59, 130, 246, 0.1)" },
              transition: "box-shadow 0.2s",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                }}
              >
                <IconWrapper icon="mdi:certificate-outline" size={24} color="#ffffff" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", fontSize: "1.0625rem" }}>
                  Certificates Progress
                </Typography>
                <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  Complete courses to earn certificates
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "nowrap" }}>
              {[
                { label: "Total", value: data.certificatesProgress.total, bg: "#f8fafc", border: "rgba(0,0,0,0.08)", color: "#374151" },
                { label: "Completed", value: data.certificatesProgress.completed, bg: "#f0fdf4", border: "rgba(16, 185, 129, 0.3)", color: "#065f46" },
                { label: "In Progress", value: data.certificatesProgress.inProgress, bg: "#fffbeb", border: "rgba(245, 158, 11, 0.3)", color: "#b45309" },
              ].map((s) => (
                <Box
                  key={s.label}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: s.bg,
                    border: `1px solid ${s.border}`,
                    textAlign: "center",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {s.label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: s.color, mt: 0.5, fontSize: "1.5rem" }}>
                    {s.value}
                  </Typography>
                </Box>
              ))}
            </Box>
            {data.certificatesProgress.total > 0 ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                    <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 600 }}>
                      Overall Progress
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#3b82f6", fontSize: "0.875rem" }}>
                      {certificateProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={certificateProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={certificateData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => ((percent ?? 0) > 0 ? `${name}: ${((percent ?? 0) * 100).toFixed(0)}%` : "")}
                        outerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {certificateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  py: 3,
                  px: 2,
                  borderRadius: 2,
                  backgroundColor: "#f8fafc",
                  border: "1px dashed #e2e8f0",
                  textAlign: "center",
                }}
              >
                <IconWrapper icon="mdi:certificate-outline" size={32} color="#94a3b8" />
                <Typography variant="body2" sx={{ color: "#64748b", mt: 1, fontSize: "0.875rem" }}>
                  No certificates available yet. Enroll in courses to earn certificates.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}
