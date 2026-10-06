"use client";

/**
 * The end of the path: a milestone, not another step.
 *
 * A course's two terminal events - the mock interview and the certificate - were both real and
 * both invisible as destinations. The interview was a card above the timeline, the certificate
 * was a panel in the right-hand rail, and neither appeared anywhere in the journey the learner
 * was actually walking. Nothing on the page said what finishing the course leads to.
 *
 * So they sit on the rail, after the last module, and they are drawn as events: dark, not
 * white, with a diamond on the rail rather than a step number. A learner should be able to see
 * the end of their course without reading a word.
 */

import { Box, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { ReactNode } from "react";
import { PHONE } from "@/components/common/mobile/phone";
import { SpineRow, type RailTone } from "./SpineRow";

/** The diamond that marks a milestone. Larger than a week's and ringed, because this is where
 *  the path ends rather than where a module does. */
export function MilestoneMarker({ reached, icon }: { reached: boolean; icon: string }) {
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        zIndex: 1,
        color: "white",
        background: reached
          ? "linear-gradient(135deg, #22c55e 0%, #15803d 100%)"
          : "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
        boxShadow: reached ? "0 0 0 4px rgba(34,197,94,0.16)" : "0 0 0 4px rgba(124,58,237,0.14)",
      }}
    >
      <Icon icon={reached ? "mdi:check-decagram" : icon} width={16} />
    </Box>
  );
}

export function MilestoneRow({
  icon,
  label,
  title,
  blurb,
  reached,
  tone = "ahead",
  first,
  last,
  action,
  children,
  below,
}: {
  icon: string;
  /** The small tracked line above the title. */
  label: string;
  title: string;
  blurb: string;
  /** Whether the learner has got here. Changes the marker and the border, nothing else. */
  reached: boolean;
  tone?: RailTone;
  first?: boolean;
  last?: boolean;
  action?: ReactNode;
  /** Content inside the dark stage. */
  children?: ReactNode;
  /** Content in the same rung but OUTSIDE the stage, for something that brings its own
   *  surface - the certificate card, which is a white card and would read as a mistake
   *  nested inside a dark one. */
  below?: ReactNode;
}) {
  return (
    <SpineRow marker={<MilestoneMarker reached={reached} icon={icon} />} tone={tone} first={first} last={last}>
      <Box
        sx={{
          mb: 1.5,
          p: { xs: 1.75, md: 2.25 },
          borderRadius: 3.5,
          bgcolor: "#fff",
          border: "1px solid",
          borderColor: reached ? "#bbf7d0" : "#eef2f7",
          // A terminal station is a warm card, not a dark one: only the page hero is dark, and
          // a black box mid-column reads as an error state rather than as a destination.
          backgroundImage: reached
            ? "linear-gradient(120deg, #f0fdf4 0%, #ffffff 55%)"
            : "linear-gradient(120deg, #fffbeb 0%, #ffffff 55%)",
          boxShadow: "0 10px 26px -24px rgba(99,102,241,0.7)",
          [PHONE]: { p: 1.5 },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
              display: "grid", placeItems: "center", color: "white",
              background: reached
                ? "linear-gradient(135deg, #22c55e 0%, #15803d 100%)"
                : "linear-gradient(135deg, #f59e0b 0%, #db2777 100%)",
              boxShadow: "0 10px 22px -14px rgba(219,39,119,0.8)",
            }}
          >
            <Icon icon={icon} width={21} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.64rem",
                fontWeight: 800,
                letterSpacing: 0.8,
                color: reached ? "#15803d" : "#b45309",
                // RTL has no tracked uppercase convention; the letterSpacing turns the script
                // into disconnected glyphs.
                '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
                [PHONE]: { fontSize: "0.75rem", letterSpacing: 0.5 },
              }}
            >
              {label}
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", mt: 0.25, color: "#0f172a", [PHONE]: { fontSize: "1rem" } }}>
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.82rem",
                color: "#64748b",
                mt: 0.5,
                lineHeight: 1.5,
                [PHONE]: { fontSize: "0.85rem" },
              }}
            >
              {blurb}
            </Typography>
          </Box>
          </Stack>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Stack>
        {children && <Box sx={{ mt: 2 }}>{children}</Box>}
      </Box>
      {below}
    </SpineRow>
  );
}
