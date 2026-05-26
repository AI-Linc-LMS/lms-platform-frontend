"use client";

import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CountUp, Reveal, gridStagger } from "@/components/scorecard/shared";
import type {
  Achievements,
  BadgeEarned,
  BadgeMilestone,
} from "@/lib/types/scorecard.types";

interface AchievementsSectionProps {
  data: Achievements;
}

function formatEarnedDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function EarnedBadge({ badge }: { badge: BadgeEarned }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10, scale: 0.96 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
      }}
    >
      <Tooltip
        title={`${badge.description || badge.name}${badge.snapshotValue ? ` · ${badge.snapshotValue}` : ""}`}
        arrow
        placement="top"
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.75,
            p: 1.5,
            borderRadius: 2,
            border: "1px solid color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent-indigo) 12%, transparent) 0%, color-mix(in srgb, #fbbf24 10%, transparent) 100%)",
            transition: "transform 0.18s ease",
            "&:hover": { transform: "translateY(-2px)" },
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              color: "#fff",
              boxShadow: "0 10px 20px -10px color-mix(in srgb, #f59e0b 60%, transparent)",
            }}
          >
            <IconWrapper icon={badge.iconSlug || "mdi:trophy-outline"} size={22} color="#fff" />
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: "var(--font-primary)",
              fontSize: "0.72rem",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {badge.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.65rem" }}
          >
            {formatEarnedDate(badge.earnedDate)}
          </Typography>
        </Box>
      </Tooltip>
    </motion.div>
  );
}

function Milestone({ milestone }: { milestone: BadgeMilestone }) {
  const pct = Math.max(0, Math.min(100, milestone.progress));
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
          bgcolor: "var(--card-bg)",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
            color: "var(--accent-indigo-dark)",
          }}
        >
          <IconWrapper icon={milestone.iconSlug || "mdi:flag-outline"} size={18} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.85rem", lineHeight: 1.2 }}
          >
            {milestone.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
            {milestone.description}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              mt: 0.5,
              height: 4,
              borderRadius: 2,
              bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 2,
                background: "linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
              },
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: "var(--accent-indigo-dark)",
            fontVariantNumeric: "tabular-nums",
            fontSize: "0.78rem",
          }}
        >
          {pct}%
        </Typography>
      </Box>
    </motion.div>
  );
}

export function AchievementsSection({ data }: AchievementsSectionProps) {
  const isEmpty = data.badges.length === 0 && data.milestones.length === 0;

  return (
    <Reveal as="section">
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          border:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 0 color-mix(in srgb, var(--border-default) 60%, transparent), 0 30px 60px -30px rgba(15, 23, 42, 0.18)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.5,
            backgroundImage: [
              "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, #fbbf24 16%, transparent), transparent 60%)",
              "radial-gradient(45% 60% at 100% 100%, color-mix(in srgb, var(--accent-indigo) 14%, transparent), transparent 60%)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 4.5 } }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              pb: { xs: 2.5, md: 3 },
              mb: { xs: 2.5, md: 3 },
              borderBottom:
                "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 12px 24px -12px color-mix(in srgb, #fbbf24 60%, transparent)",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:trophy-award" size={22} color="#fff" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "1.05rem", sm: "1.2rem" },
                    lineHeight: 1.25,
                  }}
                >
                  Achievements & Gamification
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem", mt: 0.25 }}>
                  Badges, streaks, and milestones you've unlocked — or are close to.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, auto)" },
                gap: { xs: 1, sm: 1.5 },
              }}
            >
              {[
                {
                  label: "Earned",
                  value: data.badgesEarnedCount,
                  color: "#f59e0b",
                  numeric: true,
                },
                {
                  label: "Available",
                  value: data.badgesAvailableCount,
                  color: "var(--accent-indigo-dark)",
                  numeric: true,
                },
                {
                  label: "Points",
                  value: data.totalPoints,
                  color: "#10b981",
                  numeric: true,
                },
                {
                  label: "Streak",
                  value: `${data.streakRewards.currentStreak}d`,
                  color: "#ef4444",
                },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor:
                      "color-mix(in srgb, var(--border-default) 30%, transparent)",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 70,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", fontSize: "0.65rem" }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: stat.color,
                      fontSize: "1.05rem",
                      lineHeight: 1.2,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {stat.numeric && typeof stat.value === "number" ? (
                      <CountUp value={stat.value} duration={0.8} />
                    ) : (
                      stat.value
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {isEmpty ? (
            <Box
              sx={{
                py: { xs: 4, sm: 6 },
                textAlign: "center",
                borderRadius: 2,
                border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                color: "var(--font-secondary)",
              }}
            >
              <IconWrapper icon="mdi:trophy-outline" size={40} color="var(--font-secondary)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No badges configured yet. Admins can author achievements from the Django admin.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 2.5 }}>
              {data.badges.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1.25 }}>
                    Earned ({data.badges.length})
                  </Typography>
                  <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    }}
                  >
                    {data.badges.map((b) => (
                      <EarnedBadge key={b.id} badge={b} />
                    ))}
                  </motion.div>
                </Box>
              )}

              {data.milestones.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1.25 }}>
                    In progress
                  </Typography>
                  <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: "1fr",
                    }}
                  >
                    {data.milestones.map((m) => (
                      <Milestone key={m.id} milestone={m} />
                    ))}
                  </motion.div>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Reveal>
  );
}
