"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography, Avatar, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { communityService } from "@/lib/services/community.service";
import { config } from "@/lib/config";

interface Contributor {
  user_id: number;
  user_name: string;
  name: string;
  role: string;
  profile_pic_url: string;
  impact_points: number;
}

const RANK_COLORS = [
  "var(--warning-500)", // gold
  "var(--neutral-300)", // silver
  "var(--accent-orange)", // bronze
];

/** Compact leaderboard for the right sidebar — top 5 IP earners. */
export function TopContributorsWidget({ limit = 5 }: { limit?: number }) {
  const [items, setItems] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!config.communityWidgetApi) {
        setItems([]);
        setLoading(false);
        return;
      }
      const res = await communityService.getTopContributors(limit);
      if (cancelled) return;
      if (res.ok) setItems(res.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        backgroundColor: "var(--card-bg)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <IconWrapper icon="mdi:trophy-outline" size={18} color="var(--warning-500)" />
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "var(--font-primary-dark)" }}>
          Top contributors
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
              <Box className="community-skeleton" sx={{ width: 28, height: 28, borderRadius: "50%" }} />
              <Box sx={{ flex: 1 }}>
                <Box className="community-skeleton" sx={{ width: "70%", height: 12, mb: 0.5 }} />
                <Box className="community-skeleton" sx={{ width: "40%", height: 10 }} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : items.length === 0 ? (
        <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
          No leaderboard yet — earn Impact Points to appear here.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {items.map((c, idx) => (
            <Box
              key={c.user_id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                py: 0.5,
              }}
            >
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={c.profile_pic_url}
                  sx={{ width: 32, height: 32, fontSize: "0.85rem", fontWeight: 700 }}
                >
                  {c.name.charAt(0)}
                </Avatar>
                {idx < 3 && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: "var(--card-bg)",
                      border: `2px solid ${RANK_COLORS[idx]}`,
                      color: RANK_COLORS[idx],
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {idx + 1}
                  </Box>
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: "var(--font-primary-dark)", display: "block" }}
                  noWrap
                >
                  {c.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--font-tertiary)", fontSize: "0.7rem" }}
                >
                  {c.role}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${c.impact_points} IP`}
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  backgroundColor: "var(--surface-indigo-light)",
                  color: "var(--accent-indigo)",
                  border: "1px solid color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
