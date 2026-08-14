"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { RoadmapCard } from "@/lib/services/roadmaps.service";

/**
 * The whole catalog, at a glance.
 *
 * This replaces a grid of cards. A card spends most of its area on chrome and per-item numbers
 * (topic counts, rounds, salary bands) that nobody compares across twenty entries, and it forces
 * scrolling to see what is on offer. The choice a learner is making here is "which path", and
 * that needs a legible NAME, not a dossier. So each entry is one row: a mark, a name, and
 * nothing else.
 *
 * Dense multi-column columns mean the entire catalogue lands in one view, which is the point:
 * you should be able to take in everything available without moving.
 */
export function RoadmapIndex({
  title,
  icon,
  roadmaps,
  onOpen,
  onHover,
}: {
  title: string;
  icon: string;
  roadmaps: RoadmapCard[];
  onOpen: (slug: string) => void;
  onHover?: (slug: string) => void;
}) {
  if (!roadmaps.length) return null;

  return (
    <Box sx={{ mb: 3.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
        <Box sx={{ display: "flex", color: "var(--accent-purple)" }}>
          <Icon icon={icon} width={16} />
        </Box>
        <Typography
          sx={{
            fontSize: "0.74rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
          }}
        >
          {title}
        </Typography>
        <Box sx={{ flex: 1, height: "1px", bgcolor: "var(--border-default)" }} />
      </Stack>

      <Box
        sx={{
          display: "grid",
          // No row gap: the rows butt against each other so their hairlines form one continuous
          // rule down each column. A gap here would break the rule into floating dashes, which
          // is what made the list read as a wall of text.
          columnGap: 5,
          rowGap: 0,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0,1fr))",
            lg: "repeat(3, minmax(0,1fr))",
            xl: "repeat(4, minmax(0,1fr))",
          },
        }}
      >
        {roadmaps.map((r) => {
          const company = r.company;
          return (
            <Box
              key={r.slug}
              component="button"
              onClick={() => onOpen(r.slug)}
              onMouseEnter={() => onHover?.(r.slug)}
              onFocus={() => onHover?.(r.slug)}
              sx={{
                appearance: "none",
                border: "none",
                cursor: "pointer",
                font: "inherit",
                textAlign: "start",
                width: "100%",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                px: 1,
                py: 1.05,
                bgcolor: "transparent",
                color: "var(--font-primary)",
                // One hairline per row. This is the separation: it delimits every entry and
                // makes the column boundaries obvious, without a card's worth of chrome.
                // Declared after `border: none` above, so it is the one that survives. Longhand
                // rather than the `border-bottom` shorthand: a shorthand carrying a var() is
                // dropped wholesale by parsers that do not resolve custom properties.
                borderBottomWidth: "1px",
                borderBottomStyle: "solid",
                borderBottomColor: "var(--border-default)",
                transition: "background-color .12s ease",
                "&:hover": { bgcolor: "var(--surface)" },
                "&:focus-visible": {
                  outline: "none",
                  boxShadow: "0 0 0 2px var(--surface), 0 0 0 4px var(--accent-purple)",
                },
              }}
            >
              {/* A logo where there is one, a dot where there is not. Both are 20px, so the
                  names stay on a single optical line down the column. */}
              {company?.logoUrl ? (
                <Box
                  component="img"
                  src={company.logoUrl}
                  alt=""
                  loading="lazy"
                  sx={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }}
                />
              ) : (
                <Box
                  sx={{
                    width: 20,
                    display: "grid",
                    placeItems: "center",
                    color: "var(--font-tertiary)",
                    flexShrink: 0,
                  }}
                >
                  <Icon icon="solar:map-point-linear" width={15} />
                </Box>
              )}

              {/* The name, and nothing else. There WAS an New/Updated badge here; it fired on
                  14 of 20 entries, so it distinguished nothing and only added a second
                  ragged edge to every row. A badge that is almost always on is decoration. */}
              <Typography
                sx={{
                  fontSize: "0.92rem",
                  fontWeight: 500,
                  lineHeight: 1.35,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {company?.displayName ?? r.pageTitle}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
