"use client";

import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { RoadmapCard as Card, RoadmapKind } from "@/lib/services/roadmaps.service";

const KIND_META: Record<RoadmapKind, { label: string; icon: string; tint: string }> = {
  role: { label: "Role", icon: "solar:case-minimalistic-bold-duotone", tint: "#7c3aed" },
  skill: { label: "Skill", icon: "solar:layers-minimalistic-bold-duotone", tint: "#0891b2" },
  beginner: { label: "Start here", icon: "solar:star-bold-duotone", tint: "#059669" },
  practice: { label: "Practices", icon: "solar:checklist-minimalistic-bold-duotone", tint: "#d97706" },
};

/**
 * A roadmap in the catalog grid. Modelled on AdaptiveCourseCard (ButtonBase, flex column so
 * meta pins to the bottom, hover lift) so the two surfaces read as one product.
 *
 * `coverage` is the self-declared bar. It is shown only once the learner has actually started,
 * because a row of 0% bars across a catalog reads as failure rather than as opportunity.
 */
export function RoadmapCard({
  roadmap,
  coverage,
  onOpen,
  onHover,
}: {
  roadmap: Card;
  coverage?: number;
  onOpen: () => void;
  onHover?: () => void;
}) {
  const meta = KIND_META[roadmap.kind] ?? KIND_META.skill;
  const pct = coverage != null ? Math.round(coverage * 100) : null;

  return (
    <ButtonBase
      onClick={onOpen}
      onMouseEnter={onHover}
      onFocus={onHover}
      sx={{
        width: "100%",
        height: "100%",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        borderRadius: 3,
        border: "1px solid #e6e8ef",
        bgcolor: "#fff",
        p: 2.25,
        transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "#c7d2fe",
          boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: `${meta.tint}14`,
            color: meta.tint,
            flexShrink: 0,
          }}
        >
          <Icon icon={meta.icon} width={19} />
        </Box>
        <Chip
          label={meta.label}
          size="small"
          sx={{
            height: 21,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: `${meta.tint}12`,
            color: meta.tint,
          }}
        />
        {roadmap.isNew && (
          <Chip label="New" size="small"
            sx={{ height: 21, fontSize: 11, fontWeight: 600, bgcolor: "#ecfdf5", color: "#047857" }} />
        )}
        {!roadmap.isNew && roadmap.isRevamped && (
          <Chip label="Updated" size="small"
            sx={{ height: 21, fontSize: 11, fontWeight: 600, bgcolor: "#eff6ff", color: "#1d4ed8" }} />
        )}
      </Stack>

      <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#0f172a", lineHeight: 1.3 }}>
        {roadmap.pageTitle}
      </Typography>
      <Typography
        sx={{
          mt: 0.75,
          fontSize: 13,
          color: "#475569",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {roadmap.summary}
      </Typography>

      {/* Meta pinned to the bottom so cards of different text lengths still line up. */}
      <Box sx={{ mt: "auto", pt: 1.5 }}>
        {pct != null && pct > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ height: 5, borderRadius: 3, bgcolor: "#eef2f7", overflow: "hidden" }}>
              <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: "#7c3aed" }} />
            </Box>
            <Typography sx={{ mt: 0.5, fontSize: 11, color: "#64748b" }}>
              {pct}% covered
            </Typography>
          </Box>
        )}
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: "#64748b" }}>
          <Icon icon="solar:documents-minimalistic-bold-duotone" width={15} />
          <Typography sx={{ fontSize: 12 }}>
            {roadmap.topicCount} {roadmap.topicCount === 1 ? "topic" : "topics"}
          </Typography>
        </Stack>
      </Box>
    </ButtonBase>
  );
}
