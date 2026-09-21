"use client";

import { useState } from "react";
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PHONE } from "./phone";

export interface PostAction {
  key: string;
  label: string;
  icon: string;
  onClick: () => void;
  /** Tint for a destructive or highlighted action, e.g. Report. */
  color?: string;
}

/**
 * The secondary actions of a post (share, report, offer a bounty) on a phone.
 *
 * Votes, comments and bookmark are what a thumb reaches for; with the rest inline a card's action
 * row needs ~330px and wraps inside a 324px card. On a phone those secondary actions fold into
 * this one 44px "more" button. It is display:none at sm and up (the same `{ xs, sm }` display
 * switch the mobile primitives use), where the actions stay inline exactly as they were.
 */
export function PostActionsMenu({ actions, testId }: { actions: PostAction[]; testId?: string }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (actions.length === 0) return null;

  return (
    <>
      <IconButton
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={anchor ? "true" : undefined}
        data-testid={testId}
        onClick={(e) => {
          // The card itself is a link to the thread; opening the menu must not navigate.
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
        sx={{
          display: { xs: "inline-flex", sm: "none" },
          color: "var(--font-secondary)",
          [PHONE]: { width: 44, height: 44, flexShrink: 0 },
        }}
      >
        <IconWrapper icon="mdi:dots-horizontal" size={20} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {actions.map((a) => (
          <MenuItem
            key={a.key}
            onClick={() => {
              setAnchor(null);
              a.onClick();
            }}
            sx={{ minHeight: 48, color: a.color }}
          >
            <ListItemIcon sx={{ color: a.color ?? "var(--font-secondary)" }}>
              <IconWrapper icon={a.icon} size={20} />
            </ListItemIcon>
            <ListItemText>{a.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
