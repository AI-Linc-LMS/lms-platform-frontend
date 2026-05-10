"use client";

import { useState, useRef, MouseEvent, ReactNode } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  ThreadPermissionFlags,
  CommentPermissionFlags,
} from "@/lib/community/permissions";

type Permissions = ThreadPermissionFlags | CommentPermissionFlags;

interface ContentActionsMenuProps {
  permissions: Permissions;
  isPinned?: boolean;
  isLocked?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePin?: () => void;
  onToggleLock?: () => void;
  onReport?: () => void;
  /** Smaller icon button — for use inside CommentItem. */
  size?: "small" | "medium";
}

/**
 * Three-dot overflow menu shared by threads and comments.
 *
 * Items are computed into a flat array because MUI's Menu uses Children.map
 * internally and rejects React fragments as direct children. Conditional
 * Divider+MenuItem groups are pushed individually with unique keys.
 */
export function ContentActionsMenu({
  permissions,
  isPinned,
  isLocked,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleLock,
  onReport,
  size = "small",
}: ContentActionsMenuProps) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const isThreadPerms = (p: Permissions): p is ThreadPermissionFlags =>
    "canPin" in p || "canLock" in p;
  const tp = isThreadPerms(permissions) ? permissions : null;

  const showMenu =
    permissions.canEdit ||
    permissions.canDelete ||
    permissions.canReport ||
    Boolean(tp?.canPin) ||
    Boolean(tp?.canLock);

  if (!showMenu) return null;

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    anchorRef.current = e.currentTarget;
    setOpen(true);
  };
  const close = () => setOpen(false);

  const itemSx = {
    py: 0.75,
    px: 1.5,
    fontSize: "0.875rem",
    color: "var(--font-primary-dark)",
    "&:hover": { backgroundColor: "var(--surface)" },
  } as const;
  const dangerSx = {
    ...itemSx,
    color: "var(--ats-error-muted)",
    "&:hover": { backgroundColor: "var(--error-100)" },
  } as const;

  // Build the children list as a flat array so MUI's Children.map walks it
  // without hitting fragments.
  const items: ReactNode[] = [];
  let dividerNeeded = false;

  if (permissions.canEdit && onEdit) {
    items.push(
      <MenuItem
        key="edit"
        sx={itemSx}
        onClick={() => {
          close();
          onEdit();
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <IconWrapper icon="mdi:pencil-outline" size={18} color="var(--font-secondary)" />
        </ListItemIcon>
        <ListItemText>Edit</ListItemText>
      </MenuItem>
    );
    dividerNeeded = true;
  }

  if (tp?.canPin && onTogglePin) {
    items.push(
      <MenuItem
        key="pin"
        sx={itemSx}
        onClick={() => {
          close();
          onTogglePin();
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <IconWrapper
            icon={isPinned ? "mdi:pin-off-outline" : "mdi:pin-outline"}
            size={18}
            color="var(--font-secondary)"
          />
        </ListItemIcon>
        <ListItemText>{isPinned ? "Unpin from feed" : "Pin to top"}</ListItemText>
      </MenuItem>
    );
    dividerNeeded = true;
  }

  if (tp?.canLock && onToggleLock) {
    items.push(
      <MenuItem
        key="lock"
        sx={itemSx}
        onClick={() => {
          close();
          onToggleLock();
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <IconWrapper
            icon={isLocked ? "mdi:lock-open-variant-outline" : "mdi:lock-outline"}
            size={18}
            color="var(--font-secondary)"
          />
        </ListItemIcon>
        <ListItemText>{isLocked ? "Unlock thread" : "Lock thread"}</ListItemText>
      </MenuItem>
    );
    dividerNeeded = true;
  }

  if (permissions.canReport && onReport) {
    if (dividerNeeded) {
      items.push(
        <Divider key="div-before-report" sx={{ my: 0.5, borderColor: "var(--border-default)" }} />
      );
    }
    items.push(
      <MenuItem
        key="report"
        sx={itemSx}
        onClick={() => {
          close();
          onReport();
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <IconWrapper icon="mdi:flag-outline" size={18} color="var(--font-secondary)" />
        </ListItemIcon>
        <ListItemText>Report</ListItemText>
      </MenuItem>
    );
    dividerNeeded = true;
  }

  if (permissions.canDelete && onDelete) {
    if (dividerNeeded) {
      items.push(
        <Divider key="div-before-delete" sx={{ my: 0.5, borderColor: "var(--border-default)" }} />
      );
    }
    items.push(
      <MenuItem
        key="delete"
        sx={dangerSx}
        onClick={() => {
          close();
          onDelete();
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          <IconWrapper
            icon="mdi:trash-can-outline"
            size={18}
            color="var(--ats-error-muted)"
          />
        </ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
    );
  }

  return (
    <Box>
      <IconButton
        size={size}
        onClick={handleOpen}
        aria-label="More actions"
        sx={{ color: "var(--font-tertiary)" }}
      >
        <IconWrapper icon="mdi:dots-horizontal" size={size === "small" ? 18 : 20} />
      </IconButton>
      <Menu
        anchorEl={anchorRef.current}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 0.5,
              minWidth: 200,
              border: "1px solid var(--border-default)",
              borderRadius: 2,
              backgroundColor: "var(--card-bg)",
              boxShadow:
                "0 8px 24px color-mix(in srgb, var(--font-primary) 12%, transparent)",
            },
          },
        }}
      >
        {items}
      </Menu>
    </Box>
  );
}
