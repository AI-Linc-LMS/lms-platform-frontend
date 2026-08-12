"use client";

import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { RoadmapCard as Card, RoadmapKind } from "@/lib/services/roadmaps.service";
import { cardInteraction } from "./surfaces";

const KIND_META: Record<RoadmapKind, { label: string; icon: string }> = {
  role: { label: "Role", icon: "solar:case-minimalistic-linear" },
  skill: { label: "Skill", icon: "solar:layers-minimalistic-linear" },
  beginner: { label: "Start here", icon: "solar:star-linear" },
  practice: { label: "Practices", icon: "solar:checklist-minimalistic-linear" },
  company: { label: "Company", icon: "solar:buildings-2-linear" },
};

/**
 * A roadmap in the catalog grid.
 *
 * No summary, by design: a three-line clamp made every card a different height and turned a
 * scannable grid into a wall of prose. A learner picks off this grid by title, kind and size.
 * The summary is still the page description and is still what the catalog search matches.
 *
 * `coverage` shows only once the learner has started, because a row of 0% bars across a
 * catalog reads as failure rather than as opportunity.
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
        ...cardInteraction,
        width: "100%",
        height: "100%",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        p: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Box sx={{ display: "flex", color: "var(--font-tertiary)" }}>
          <Icon icon={meta.icon} width={17} />
        </Box>
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--font-tertiary)",
          }}
        >
          {meta.label}
        </Typography>
        {(roadmap.isNew || roadmap.isRevamped) && (
          <Typography
            sx={{
              ml: "auto",
              fontSize: "0.7rem",
              fontWeight: 500,
              color: "var(--accent-purple)",
            }}
          >
            {roadmap.isNew ? "New" : "Updated"}
          </Typography>
        )}
      </Stack>

      <Typography
        sx={{
          fontWeight: 600,
          fontSize: "0.98rem",
          color: "var(--font-primary)",
          lineHeight: 1.35,
          letterSpacing: "-0.01em",
        }}
      >
        {roadmap.pageTitle}
      </Typography>

      {/* Meta pinned to the bottom so cards line up when a title wraps to two lines. */}
      <Box sx={{ mt: "auto", pt: 1.5 }}>
        {pct != null && pct > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: "var(--surface)",
                border: "1px solid var(--border-default)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: "var(--accent-purple)" }} />
            </Box>
            <Typography sx={{ mt: 0.5, fontSize: "0.72rem", color: "var(--font-tertiary)" }}>
              {pct}% covered
            </Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)" }}>
          {roadmap.topicCount} {roadmap.topicCount === 1 ? "topic" : "topics"}
        </Typography>
      </Box>
    </ButtonBase>
  );
}
