"use client";

import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import type { RoadmapCard as Card } from "@/lib/services/roadmaps.service";
import { cardInteraction } from "./surfaces";

/**
 * A recruiter tile.
 *
 * A different object from `RoadmapCard` because a company is chosen by recognising a logo, not
 * by reading a title, so the logo leads and the prose is cut to a line of facts.
 *
 * Logos are arbitrary external URLs (Wikimedia SVGs), so they render through a plain `img`:
 * `next/image` blocks SVG by default and has broken client branding in this codebase before.
 */
export function CompanyRoadmapCard({
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
  const company = roadmap.company;
  if (!company) return null;

  const pct = coverage != null ? Math.round(coverage * 100) : null;
  const facts = [
    company.rounds ? `${company.rounds} rounds` : null,
    roadmap.topicCount ? `${roadmap.topicCount} steps` : null,
  ].filter(Boolean) as string[];

  return (
    <ButtonBase
      onClick={onOpen}
      onMouseEnter={onHover}
      onFocus={onHover}
      aria-label={`Open the ${company.displayName} preparation roadmap`}
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
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            bgcolor: "var(--surface)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            overflow: "hidden",
            p: 0.75,
          }}
        >
          {company.logoUrl ? (
            <Box
              component="img"
              src={company.logoUrl}
              alt=""
              loading="lazy"
              sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <Typography sx={{ fontWeight: 600, color: "var(--font-secondary)", fontSize: 15 }}>
              {company.displayName.slice(0, 2).toUpperCase()}
            </Typography>
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "1.02rem",
              color: "var(--font-primary)",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
            }}
            noWrap
          >
            {company.displayName}
          </Typography>
          {company.packageRange && (
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--font-secondary)" }} noWrap>
              {company.packageRange}
            </Typography>
          )}
        </Box>
      </Stack>

      <Box sx={{ mt: "auto" }}>
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
            <Typography sx={{ mt: 0.5, fontSize: "0.75rem", color: "var(--font-secondary)" }}>
              {pct}% covered
            </Typography>
          </Box>
        )}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--font-secondary)" }}>
            {facts.join(" · ")}
          </Typography>
          {company.badge && (
            <Typography
              sx={{
                ml: "auto",
                fontSize: "0.72rem",
                fontWeight: 600,
                px: 0.85,
                py: 0.25,
                borderRadius: 999,
                bgcolor: "color-mix(in srgb, var(--accent-purple) 10%, transparent)",
                color: "var(--accent-purple)",
                whiteSpace: "nowrap",
              }}
            >
              {company.badge}
            </Typography>
          )}
        </Stack>
      </Box>
    </ButtonBase>
  );
}
