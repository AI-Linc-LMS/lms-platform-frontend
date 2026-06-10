"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { ConceptMap as ConceptMapData } from "@/lib/services/adaptive-video.service";

/**
 * Live concept map (spec §3.3a): the center concept with branch nodes, ones the
 * watch has reached rendered solid + glowing, upcoming ones dimmed. A radial wash
 * keeps it readable without a graph library.
 */
export function ConceptMap({ data, currentTime }: { data: ConceptMapData; currentTime: number }) {
  const nodes = data?.nodes ?? [];
  const center = data?.center;
  const branches = nodes.filter((n) => n.id !== center);
  const reachedCount = branches.filter((n) => currentTime >= (n.timestamp_seconds ?? 0)).length;

  if (!branches.length) {
    return (
      <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
        The concept map builds as the video plays.
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>What the video has covered</Typography>
        <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 700 }}>
          {reachedCount}/{branches.length} concepts
        </Typography>
      </Box>
      <Box
        sx={{
          position: "relative",
          minHeight: 200,
          borderRadius: 2.5,
          p: 2.5,
          overflow: "hidden",
          background: "var(--bg-subtle, #fafafb)",
          border: "1px solid var(--border-default, #ececf1)",
          display: "flex",
          flexWrap: "wrap",
          gap: 1.25,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {center && (
          <Box
            sx={{
              order: -1, width: "100%", maxWidth: 240, mx: "auto", mb: 0.5, textAlign: "center",
              px: 2.25, py: 1.1, borderRadius: 999, fontWeight: 800, fontSize: "0.95rem", color: "#fff",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
              boxShadow: "0 14px 30px -14px rgba(168,85,247,0.7)",
            }}
          >
            {center}
          </Box>
        )}
        {branches.map((n) => {
          const reached = currentTime >= (n.timestamp_seconds ?? 0);
          return (
            <Box
              key={n.id}
              sx={{
                px: 1.5, py: 0.85, borderRadius: 2, fontSize: "0.83rem", fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 0.6,
                opacity: reached ? 1 : 0.45,
                color: reached ? "text.primary" : "text.secondary",
                border: "1px solid",
                borderColor: reached ? "color-mix(in srgb, #6366f1 40%, transparent)" : "var(--border-default, #ddd)",
                background: reached ? "var(--card-bg, #fff)" : "transparent",
                boxShadow: reached ? "0 8px 20px -14px color-mix(in srgb, #6366f1 70%, transparent)" : "none",
                transition: "all 200ms ease",
              }}
            >
              {reached && <Box sx={{ width: 6, height: 6, borderRadius: 999, background: "linear-gradient(135deg,#6366f1,#ec4899)" }} />}
              {n.label}
              {!reached && <Icon icon="mdi:lock-clock" width={13} style={{ opacity: 0.6 }} />}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
