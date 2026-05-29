"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  communityService,
  LeaderboardEntry,
} from "@/lib/services/community.service";
import { useToast } from "@/components/common/Toast";

type Period = "all" | "week" | "month";

const TIER_RING: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#94a3b8",
  gold: "#fbbf24",
  platinum: "#a78bfa",
};

const RANK_BADGE: Record<number, { color: string; icon: string }> = {
  1: { color: "#fbbf24", icon: "mdi:trophy" },
  2: { color: "#94a3b8", icon: "mdi:medal" },
  3: { color: "#cd7f32", icon: "mdi:medal-outline" },
};

export default function LeaderboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [period, setPeriod] = useState<Period>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await communityService.getLeaderboard(period);
        if (!cancelled) setEntries(res.results);
      } catch {
        if (!cancelled) showToast("Failed to load leaderboard.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period, showToast]);

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ py: 2, maxWidth: 880, mx: "auto", width: "100%", px: { xs: 2, md: 0 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={16} />}
          onClick={() => router.push("/community")}
          sx={{ textTransform: "none", mb: 2, color: "var(--font-secondary)" }}
        >
          Back to community
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <IconWrapper icon="mdi:trophy-outline" size={28} color="#fbbf24" />
          <Typography variant="h5" fontWeight={700}>
            Community Leaderboard
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Top contributors ranked by IP earned.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Tabs
            value={period}
            onChange={(_, v) => setPeriod(v)}
            sx={{ px: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
          >
            <Tab label="All-time" value="all" />
            <Tab label="This month" value="month" />
            <Tab label="This week" value="week" />
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : entries.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <IconWrapper icon="mdi:trophy-outline" size={48} color="var(--font-tertiary)" />
            <Typography variant="body1" color="text.secondary">
              No activity in this window yet.
            </Typography>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            {entries.map((entry) => {
              const rankBadge = RANK_BADGE[entry.rank];
              const tier = entry.user.xp_tier ?? "bronze";
              return (
                <Box
                  key={entry.user.id}
                  onClick={() => router.push(`/community/user/${entry.user.id}`)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 2.5,
                    py: 1.75,
                    borderBottom: "1px solid var(--border-default)",
                    cursor: "pointer",
                    "&:last-child": { borderBottom: "none" },
                    "&:hover": {
                      backgroundColor: "color-mix(in srgb, var(--font-primary) 4%, transparent)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 44,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {rankBadge ? (
                      <IconWrapper icon={rankBadge.icon} size={26} color={rankBadge.color} />
                    ) : (
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        sx={{ color: "var(--font-secondary)" }}
                      >
                        #{entry.rank}
                      </Typography>
                    )}
                  </Box>

                  <Avatar
                    src={entry.user.profile_pic_url}
                    sx={{
                      width: 42,
                      height: 42,
                      border: `2px solid ${TIER_RING[tier] ?? TIER_RING.bronze}`,
                    }}
                  >
                    {entry.user.name.charAt(0)}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: "var(--font-primary)" }}
                    >
                      {entry.user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{entry.user.user_name} · {entry.user.role}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ color: TIER_RING[tier] ?? "var(--font-primary)", lineHeight: 1.1 }}
                    >
                      {entry.xp.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      IP {period !== "all" && `· ${period === "week" ? "this week" : "this month"}`}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
}
