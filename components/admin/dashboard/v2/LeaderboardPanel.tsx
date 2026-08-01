"use client";

import { Box, Skeleton, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Panel, DefinitionMark, EmptyState, INSIGHT } from "@/components/admin/insights/primitives";
import type { LeaderboardPayload } from "@/lib/services/admin/admin-insights.service";

/**
 * Top students by adaptive points.
 *
 * The board this replaces ranked on `UserActivity.marks`, which the adaptive scorer never
 * writes — so on an adaptive-only tenant it showed nobody, or worse, a stale ranking from
 * whatever legacy course work happened to exist. This one reads the points students actually
 * earned.
 */

const MEDAL = ["#f59e0b", "#94a3b8", "#b45309"];

export function LeaderboardPanel({
  data,
  loading,
}: {
  data: LeaderboardPayload | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Panel title="Leaderboard" subtitle="Adaptive points" icon="mdi:trophy-outline" accent={INSIGHT.amber}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={38} sx={{ borderRadius: 1 }} />
        ))}
      </Panel>
    );
  }

  const rows = data?.rows ?? [];

  return (
    <Panel
      title="Leaderboard"
      subtitle={data?.scope?.label ?? "Adaptive points"}
      icon="mdi:trophy-outline"
      accent={INSIGHT.amber}
      action={data?.definition ? <DefinitionMark text={data.definition} /> : undefined}
    >
      {rows.length === 0 ? (
        <EmptyState
          icon="mdi:trophy-outline"
          title="Nobody has scored yet"
          hint="Points appear here once students complete their first adaptive activities."
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {rows.map((r) => (
            <Box
              key={r.student_id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                py: 1,
                px: r.rank <= 3 ? 1 : 0,
                mb: r.rank <= 3 ? 0.5 : 0,
                borderRadius: r.rank <= 3 ? 2 : 0,
                // The podium gets a tint of its own medal. A leaderboard where the top row looks
                // exactly like the tenth is a list, not a ranking.
                background:
                  r.rank <= 3
                    ? `linear-gradient(110deg, color-mix(in srgb, ${MEDAL[r.rank - 1]} 14%, transparent) 0%, transparent 65%)`
                    : "transparent",
                borderBottom:
                  r.rank <= 3
                    ? "none"
                    : "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
                "&:last-of-type": { borderBottom: 0 },
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1.2,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: r.rank <= 3 ? "#fff" : "var(--font-secondary)",
                  background:
                    r.rank <= 3
                      ? `linear-gradient(140deg, ${MEDAL[r.rank - 1]}, color-mix(in srgb, ${MEDAL[r.rank - 1]} 65%, #7c3aed))`
                      : "color-mix(in srgb, var(--border-default) 40%, transparent)",
                  boxShadow:
                    r.rank <= 3
                      ? `0 6px 14px -8px color-mix(in srgb, ${MEDAL[r.rank - 1]} 90%, transparent)`
                      : "none",
                }}
              >
                {r.rank}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "var(--font-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={r.email}
                >
                  {r.name}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)" }}>
                  {r.activities.toLocaleString()} {r.activities === 1 ? "activity" : "activities"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, flexShrink: 0 }}>
                <IconWrapper icon="mdi:lightning-bolt" size={14} color={INSIGHT.amber} />
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--font-primary)" }}>
                  {r.points.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Panel>
  );
}
