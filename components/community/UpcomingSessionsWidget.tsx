"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography, Button, Tooltip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { communityService } from "@/lib/services/community.service";
import { config } from "@/lib/config";
import { addToCalendarUrl, minutesUntilStart } from "@/lib/community/community-live";
import type { LiveSessionDto } from "@/lib/community/widget-types";

function formatStart(dt: string): string {
  try {
    const d = new Date(dt);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dt;
  }
}

/** Right-sidebar list of soon-to-start scheduled sessions (server-driven). */
export function UpcomingSessionsWidget({ limit = 4 }: { limit?: number }) {
  const [items, setItems] = useState<LiveSessionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!config.communityWidgetApi) {
        setItems([]);
        setLoading(false);
        return;
      }
      const res = await communityService.getUpcomingSessions(limit);
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
        <IconWrapper icon="mdi:calendar-clock" size={18} color="var(--accent-indigo)" />
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "var(--font-primary-dark)" }}>
          Upcoming sessions
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i}>
              <Box className="community-skeleton" sx={{ width: "78%", height: 13, mb: 0.5 }} />
              <Box className="community-skeleton" sx={{ width: "55%", height: 11 }} />
            </Box>
          ))}
        </Box>
      ) : items.length === 0 ? (
        <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
          No sessions scheduled. Hosts can schedule one from the feed header.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {items.map((s) => {
            const mins = minutesUntilStart(s.starts_at) ?? 0;
            const startingSoon = mins >= 0 && mins <= 30;
            const cal = addToCalendarUrl(s.title, s.starts_at, s.ends_at);
            return (
              <Box
                key={s.id}
                sx={{
                  pb: 1.25,
                  borderBottom: "1px dashed var(--border-default)",
                  "&:last-child": { borderBottom: "none", pb: 0 },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ color: "var(--font-primary-dark)", lineHeight: 1.3 }}
                >
                  {s.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: startingSoon ? "var(--ats-error-muted)" : "var(--font-tertiary)",
                    fontWeight: startingSoon ? 700 : 600,
                    mb: 0.5,
                  }}
                >
                  {startingSoon
                    ? mins <= 0
                      ? "Live now"
                      : `Starts in ${mins} min`
                    : formatStart(s.starts_at)}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75 }}>
                  <Button
                    size="small"
                    href={
                      s.builtin_livekit
                        ? `/community/live/${s.id}`
                        : s.meet_url
                    }
                    target={s.builtin_livekit ? undefined : "_blank"}
                    rel={s.builtin_livekit ? undefined : "noopener noreferrer"}
                    startIcon={
                      <IconWrapper
                        icon={s.builtin_livekit ? "mdi:video" : "mdi:open-in-new"}
                        size={14}
                        color="var(--accent-indigo)"
                      />
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      color: "var(--accent-indigo)",
                      px: 0.75,
                      minWidth: 0,
                    }}
                  >
                    {startingSoon ? "Join" : "Details"}
                  </Button>
                  {cal && (
                    <Tooltip title="Add to Google Calendar">
                      <Button
                        size="small"
                        href={cal}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          textTransform: "none",
                          fontSize: "0.7rem",
                          color: "var(--font-secondary)",
                          minWidth: 0,
                          px: 0.75,
                        }}
                        startIcon={
                          <IconWrapper
                            icon="mdi:calendar-export"
                            size={14}
                            color="var(--font-secondary)"
                          />
                        }
                      >
                        Add
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
