"use client";

import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { SelfState } from "@/lib/services/roadmaps.service";

export const NODE_STATES: {
  value: SelfState;
  label: string;
  icon: string;
  tone: string;
  key: string;
}[] = [
  { value: "done", label: "Done", icon: "solar:check-circle-bold", tone: "var(--accent-green)", key: "D" },
  { value: "learning", label: "In progress", icon: "solar:book-bookmark-bold", tone: "var(--accent-purple)", key: "L" },
  { value: "skipped", label: "Skipped", icon: "solar:close-circle-bold", tone: "var(--font-tertiary)", key: "S" },
];

/**
 * Right-click status menu for a node on the map.
 *
 * The three states already existed and were reachable only by opening a node's drawer, which
 * meant a learner had to open, read and close 150 drawers to track a map. This is the
 * interaction roadmap.sh settled on for the same problem: left-click opens the content,
 * right-click sets the status without leaving the map. Long-press is the touch equivalent and
 * is wired by the caller.
 *
 * "In progress" rather than "Learning" as the visible label: the server value stays `learning`
 * (it is a stored enum), but every other progress surface in this product says in progress,
 * and a status vocabulary that differs per screen is one a learner has to re-learn per screen.
 */
export function NodeStateMenu({
  anchor,
  current,
  onClose,
  onPick,
}: {
  anchor: { x: number; y: number } | null;
  current: SelfState;
  onClose: () => void;
  onPick: (state: SelfState) => void;
}) {
  return (
    <Menu
      open={anchor !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchor ? { top: anchor.y, left: anchor.x } : undefined}
      slotProps={{
        paper: {
          sx: {
            minWidth: 208,
            borderRadius: 2,
            border: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            // Menus are the one surface that legitimately floats, but it still gets a hairline
            // rather than the usual MUI elevation stack.
            boxShadow: "none",
            backgroundImage: "none",
          },
        },
      }}
    >
      {NODE_STATES.map((s) => {
        const active = current === s.value;
        return (
          <MenuItem
            key={s.value}
            onClick={() => {
              // Picking the state a node already has clears it, so the same gesture that set a
              // status can undo it. Without this the only way back to "pending" is the drawer.
              onPick(active ? "pending" : s.value);
              onClose();
            }}
            sx={{ gap: 1.25, py: 0.9, fontSize: "0.85rem" }}
          >
            <Icon icon={s.icon} width={17} color={active ? s.tone : "var(--font-tertiary)"} />
            <Typography
              sx={{
                fontSize: "0.85rem",
                fontWeight: active ? 600 : 400,
                color: "var(--font-primary)",
                flex: 1,
              }}
            >
              {active ? `Clear ${s.label.toLowerCase()}` : s.label}
            </Typography>
            <Box
              component="kbd"
              sx={{
                fontSize: "0.68rem",
                px: 0.6,
                py: 0.1,
                borderRadius: 1,
                border: "1px solid var(--border-default)",
                color: "var(--font-tertiary)",
              }}
            >
              {s.key}
            </Box>
          </MenuItem>
        );
      })}
    </Menu>
  );
}
