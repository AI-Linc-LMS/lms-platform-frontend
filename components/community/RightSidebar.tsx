"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, LinearProgress, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useImpactEconomy } from "@/lib/contexts/ImpactEconomyContext";
import { config } from "@/lib/config";
import type { DailyQuestDto, TrendingKeywordDto } from "@/lib/community/widget-types";
import { TopContributorsWidget } from "@/components/community/TopContributorsWidget";
import { UpcomingSessionsWidget } from "@/components/community/UpcomingSessionsWidget";

function getNextImpactThreshold(pts: number): number {
  if (pts < 500) return 500;
  if (pts < 1000) return 1000;
  return 2000;
}

function nextTierLabel(pts: number): string {
  if (pts < 500) return "Contributor (Silver)";
  if (pts < 1000) return "Mentor (Gold)";
  return "Champion tier";
}

interface RightSidebarProps {
  dailyQuest: DailyQuestDto | null;
  trendingTopics: TrendingKeywordDto[];
  onJoinQuest: () => Promise<void>;
  questLoading?: boolean;
}

export function RightSidebar({
  dailyQuest,
  trendingTopics,
  onJoinQuest,
  questLoading = false,
}: RightSidebarProps) {
  const { points, tier, title } = useImpactEconomy();

  const nextLevel = getNextImpactThreshold(points);
  const progress = Math.min(100, (points / nextLevel) * 100);
  const pointsToGo = Math.max(0, nextLevel - points);

  const [timeLeft, setTimeLeft] = useState("");
  const [joining, setJoining] = useState(false);

  const questEndsAt = dailyQuest?.ends_at ? new Date(dailyQuest.ends_at).getTime() : null;

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const target = questEndsAt ?? (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })();
      const diff = Math.max(0, target - now);
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [questEndsAt]);

  // Real quest only when the widget API is enabled AND the server returned one.
  const hasRealQuest = config.communityWidgetApi && Boolean(dailyQuest);
  const isDemoQuest = !config.communityWidgetApi && Boolean(dailyQuest);
  const noQuestScheduled = config.communityWidgetApi && !dailyQuest;

  const questTitle =
    dailyQuest?.title ??
    (noQuestScheduled
      ? "No quest scheduled today"
      : "Bug Hunt: Find the 3 security flaws in this Node.js/Express snippet.");
  const questDescription =
    dailyQuest?.description ??
    (noQuestScheduled
      ? "Daily quests give the whole community a shared challenge. Check back tomorrow — or ask an admin to schedule one in the dashboard."
      : "");
  const questProgress = dailyQuest?.progress_percent ?? 0;
  const participantLine = dailyQuest
    ? `${dailyQuest.participant_count} members joined`
    : noQuestScheduled
      ? ""
      : "215 members joined (demo)";

  const handleJoin = async () => {
    if (joining) return;
    setJoining(true);
    try {
      await onJoinQuest();
    } finally {
      setJoining(false);
    }
  };

  const displayTrending = trendingTopics;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, var(--secondary-500) 0%, var(--primary-700) 100%)",
          color: "var(--font-light)",
          border: "1px solid color-mix(in srgb, var(--primary-400) 35%, transparent)",
          boxShadow: "0 8px 28px color-mix(in srgb, var(--secondary-500) 22%, transparent)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -50,
            right: -20,
            width: 120,
            height: 120,
            background: "color-mix(in srgb, var(--primary-300) 28%, transparent)",
            filter: "blur(30px)",
            borderRadius: "50%",
          }}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:flag-checkered" color="var(--accent-yellow)" size={24} />
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ textTransform: "uppercase", letterSpacing: 1, color: "var(--accent-yellow)" }}
            >
              Daily Quest
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: "color-mix(in srgb, var(--font-dark) 22%, transparent)",
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              border: "1px solid color-mix(in srgb, var(--font-light) 12%, transparent)",
            }}
          >
            <Typography variant="caption" fontWeight={700} sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
              {timeLeft ? `⏱ ${timeLeft}` : "—"}
            </Typography>
          </Box>
        </Box>

        {isDemoQuest && (
          <Typography variant="caption" sx={{ display: "block", mb: 1, opacity: 0.85, position: "relative", zIndex: 1 }}>
            Demo quest (widget API off)
          </Typography>
        )}

        <Typography variant="body1" fontWeight={600} sx={{ mb: 1, lineHeight: 1.4, position: "relative", zIndex: 1 }}>
          {questTitle}
        </Typography>
        {questDescription ? (
          <Typography variant="caption" sx={{ mb: 2, display: "block", opacity: 0.9, position: "relative", zIndex: 1 }}>
            {questDescription}
          </Typography>
        ) : null}

        {!noQuestScheduled && (
          <Box sx={{ mb: 2, position: "relative", zIndex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" fontWeight={600} sx={{ color: "color-mix(in srgb, var(--font-light) 78%, transparent)" }}>
                Community Progress
              </Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: "var(--accent-yellow)" }}>
                {questProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={questProgress}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: "color-mix(in srgb, var(--font-light) 14%, transparent)",
                "& .MuiLinearProgress-bar": {
                  background: `linear-gradient(90deg, var(--primary-200) 0%, var(--accent-yellow) 100%)`,
                  borderRadius: 5,
                },
              }}
            />
            {participantLine && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.5,
                  color: "color-mix(in srgb, var(--font-light) 72%, transparent)",
                  fontStyle: "italic",
                }}
              >
                {participantLine}
              </Typography>
            )}
          </Box>
        )}

        {noQuestScheduled ? (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "color-mix(in srgb, var(--font-light) 78%, transparent)",
              position: "relative",
              zIndex: 1,
            }}
          >
            New quests appear here when an admin schedules one.
          </Typography>
        ) : (
          <Button
            fullWidth
            variant="contained"
            disabled={joining || questLoading || Boolean(dailyQuest?.joined_today)}
            onClick={handleJoin}
            sx={{
              backgroundColor: "var(--card-bg)",
              color: "var(--primary-700)",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              position: "relative",
              zIndex: 1,
              boxShadow: "none",
              "&:hover": { backgroundColor: "var(--accent-yellow)", color: "var(--font-primary-dark)" },
            }}
          >
            {dailyQuest?.joined_today
              ? "Joined today"
              : joining || questLoading
                ? "…"
                : hasRealQuest
                  ? "Join Quest"
                  : "Try the demo"}
          </Button>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: "1px solid var(--border-default)",
          borderRadius: 2,
          backgroundColor: "var(--card-bg)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <IconWrapper icon="mdi:trophy-outline" color="var(--warning-500)" size={24} />
          <Typography variant="h6" fontWeight={700} sx={{ color: "var(--font-primary-dark)" }}>
            Milestones
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" fontWeight={600} sx={{ color: "var(--font-muted)" }}>
              {tier} · {title}
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: "var(--primary-600)" }}>
              {points} IP
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "var(--neutral-100)",
              "& .MuiLinearProgress-bar": { backgroundColor: "var(--primary-600)" },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            {pointsToGo} points to {nextTierLabel(points)}
          </Typography>
        </Box>
      </Paper>

      <UpcomingSessionsWidget />

      <TopContributorsWidget />

      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: "1px solid var(--border-default)",
          borderRadius: 2,
          backgroundColor: "var(--card-bg)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <IconWrapper icon="mdi:trending-up" color="var(--accent-red)" size={24} />
          <Typography variant="h6" fontWeight={700} sx={{ color: "var(--font-primary-dark)" }}>
            Trending Topics
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {displayTrending.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Post threads mentioning tech keywords to see trends here.
            </Typography>
          ) : null}
          {displayTrending.map((topic) => (
            <Box
              key={topic.keyword}
              sx={{
                backgroundColor: "var(--surface)",
                px: 1.5,
                py: 1,
                borderRadius: 2,
                border: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "default",
                "&:hover": { backgroundColor: "var(--primary-50)" },
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ color: "var(--font-secondary)" }}>
                {topic.keyword}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {topic.count} posts
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
