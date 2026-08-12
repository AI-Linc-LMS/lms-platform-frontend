"use client";

import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { RoadmapCard as Card } from "@/lib/services/roadmaps.service";
import { RM } from "./roadmapTokens";

/**
 * A recruiter tile for the "Prepare for a company" rail.
 *
 * Deliberately a different object from `RoadmapCard`: a company is chosen by recognising a
 * logo, not by reading a summary, so the logo is the card and the prose is cut to a single
 * line of facts. It wears the poster chrome (hard 2px outline, offset shadow, press-on-hover)
 * that the map canvas uses, which is what ties the catalog to the roadmap it opens.
 *
 * Logos are arbitrary external URLs (Wikimedia SVGs), so they render through a plain `img`.
 * `next/image` blocks SVG by default and has bitten this codebase before on client branding.
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
    company.difficulty || null,
    roadmap.topicCount ? `${roadmap.topicCount} steps` : null,
  ].filter(Boolean) as string[];

  return (
    <ButtonBase
      onClick={onOpen}
      onMouseEnter={onHover}
      onFocus={onHover}
      aria-label={`Open the ${company.displayName} preparation roadmap`}
      sx={{
        width: "100%",
        height: "100%",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        borderRadius: 2.5,
        border: RM.border,
        bgcolor: "#fff",
        p: 2,
        boxShadow: RM.shadow(3),
        transition: "transform .14s ease, box-shadow .14s ease",
        // Press the sticker rather than lift it: the shadow shortens by exactly the distance
        // the card travels, so the object reads as physically pushed down.
        "&:hover": { transform: "translate(1px, 1px)", boxShadow: RM.shadow(2) },
        "&:active": { transform: "translate(3px, 3px)", boxShadow: RM.shadow(0) },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2,
            border: "1px solid #e6e8ef",
            bgcolor: "#fff",
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
            <Typography sx={{ fontWeight: 800, color: RM.rail, fontSize: 16 }}>
              {company.displayName.slice(0, 2).toUpperCase()}
            </Typography>
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontWeight: 800, fontSize: 15.5, color: RM.ink, lineHeight: 1.25 }}
            noWrap
          >
            {company.displayName}
          </Typography>
          {company.packageRange && (
            <Typography sx={{ fontSize: 12, color: "#475569" }} noWrap>
              {company.packageRange}
            </Typography>
          )}
        </Box>
      </Stack>

      {company.badge && (
        <Chip
          label={company.badge}
          size="small"
          sx={{
            alignSelf: "flex-start",
            height: 21,
            fontSize: 11,
            fontWeight: 700,
            bgcolor: "#f3f0ff",
            color: "#5b21b6",
            mb: 1,
          }}
        />
      )}

      <Box sx={{ mt: "auto", pt: 0.5 }}>
        {pct != null && pct > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ height: 5, borderRadius: 3, bgcolor: "#eef2f7", overflow: "hidden" }}>
              <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: RM.rail }} />
            </Box>
            <Typography sx={{ mt: 0.5, fontSize: 11, color: "#64748b" }}>
              {pct}% covered
            </Typography>
          </Box>
        )}
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ color: "#64748b", flexWrap: "wrap" }}
        >
          <Icon icon="solar:layers-minimalistic-bold-duotone" width={14} />
          <Typography sx={{ fontSize: 12 }}>{facts.join(" · ")}</Typography>
        </Stack>
      </Box>
    </ButtonBase>
  );
}
