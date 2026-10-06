"use client";

/**
 * One rung of the spine: a rail column on the left, a marker centred on it, and the row's own
 * content to the right.
 *
 * The board used to draw a rail stub inside each step card, so the line broke at every week
 * boundary and the course read as a stack of unrelated cards rather than one path. Here the
 * rail is a property of the rung, every rung abuts the next, and the colour of each segment
 * says whether that part of the path is behind the learner or ahead of them.
 *
 * `tone` is a colour, not a measurement. Lighting the rail by a measured percentage of total
 * height would need the rows to report their own size, and a self-measuring layout on this page
 * has already cost us a render loop once; abutting per-row segments give the same filling-up
 * effect with nothing to measure.
 */

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { PHONE } from "@/components/common/mobile/phone";

/** How far the rail is lit through this rung. */
export type RailTone = "done" | "active" | "ahead";

const RAIL_COLOR: Record<RailTone, string> = {
  done: "#86efac",
  // The handoff: green behind, indigo ahead. Reads as "you are here" without a separate badge.
  active: "linear-gradient(180deg, #86efac 0%, #a5b4fc 100%)",
  ahead: "#eef2f7",
};

export function SpineRow({
  marker,
  tone = "ahead",
  first = false,
  last = false,
  children,
}: {
  marker: ReactNode;
  tone?: RailTone;
  /** The rail starts at the first marker rather than above it, so it has no loose end. */
  first?: boolean;
  /** And stops at the last one. */
  last?: boolean;
  children: ReactNode;
}) {
  const fill = RAIL_COLOR[tone];
  return (
    <Box sx={{ display: "flex", gap: 1.75, alignItems: "stretch", [PHONE]: { gap: 1.25 } }}>
      <Box sx={{ position: "relative", width: 28, flexShrink: 0 }}>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            left: "50%",
            top: first ? "50%" : 0,
            bottom: last ? "50%" : 0,
            width: "2px",
            transform: "translateX(-50%)",
            background: fill,
            borderRadius: 1,
          }}
        />
        {/* The marker sits on a white disc so the rail appears to pass behind it. */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "grid",
            placeItems: "center",
            bgcolor: "#fff",
            borderRadius: "50%",
            p: "3px",
          }}
        >
          {marker}
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}
