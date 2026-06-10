"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JourneyTimelineEntry } from "@/lib/services/admin/admin-student.service";
import { ADAPTIVE, EmptyState, formatDateTime } from "./shared";

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  content: { icon: "mdi:book-check", color: ADAPTIVE.indigo, label: "Course content" },
  assessment: { icon: "mdi:clipboard-text", color: ADAPTIVE.green, label: "Assessment" },
  mock_interview: { icon: "mdi:account-voice", color: ADAPTIVE.amber, label: "Mock interview" },
  adaptive_quiz: { icon: "mdi:lightbulb-on", color: ADAPTIVE.indigo, label: "Adaptive quiz" },
  adaptive_coding: { icon: "mdi:code-braces", color: ADAPTIVE.pink, label: "Adaptive coding" },
  adaptive_video: { icon: "mdi:play-circle", color: ADAPTIVE.purple, label: "Video companion" },
};

export function TimelineTab({ timeline }: { timeline: JourneyTimelineEntry[] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <EmptyState
        icon="mdi:timeline-clock-outline"
        title="No activity timeline"
        hint="Once the student engages with the platform, a chronological feed appears here."
      />
    );
  }

  return (
    <Box sx={{ position: "relative", pl: 1 }}>
      {timeline.map((e, i) => {
        const meta = TYPE_META[e.type] || {
          icon: "mdi:circle",
          color: "#94a3b8",
          label: e.type,
        };
        const isLast = i === timeline.length - 1;
        return (
          <Box key={i} sx={{ display: "flex", gap: 2, position: "relative" }}>
            {/* Rail + node */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
                  border: `2px solid color-mix(in srgb, ${meta.color} 40%, transparent)`,
                  zIndex: 1,
                }}
              >
                <IconWrapper icon={meta.icon} size={17} color={meta.color} />
              </Box>
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    minHeight: 24,
                    bgcolor: "color-mix(in srgb, var(--border-default) 80%, transparent)",
                  }}
                />
              )}
            </Box>
            {/* Body */}
            <Box sx={{ pb: 2.5, minWidth: 0, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography
                  sx={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    color: meta.color,
                  }}
                >
                  {meta.label}
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                  {formatDateTime(e.timestamp)}
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 600, color: "var(--font-primary)", mt: 0.25 }}>
                {e.title || "Activity"}
                {e.score != null && (
                  <Box component="span" sx={{ ml: 1, color: meta.color, fontWeight: 800 }}>
                    {e.score}%
                  </Box>
                )}
              </Typography>
              {(e.course || e.activity_type || e.status) && (
                <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                  {[e.course, e.activity_type, e.status].filter(Boolean).join(" · ")}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
