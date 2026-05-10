"use client";

import { useEffect, useState } from "react";
import { Box, Button, Chip, Tooltip, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface LiveRoomHostBarProps {
  title: string;
  hostName?: string | null;
  endsAt?: string | null;
  /** True for the user who scheduled the room (or admin). Shows additional controls. */
  isHost: boolean;
  onLeave: () => void;
  onCopyInvite: () => void;
  /** Show a green "live" indicator dot. */
  live?: boolean;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "ended";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min left`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
}

/**
 * Slim header strip displayed inside the live room.
 *
 * Per-participant mute/kick lives in the LiveKit prefab; this bar handles room-level
 * concerns: invite link, time remaining, leave, and (future) end-for-everyone.
 */
export function LiveRoomHostBar({
  title,
  hostName,
  endsAt,
  isHost,
  onLeave,
  onCopyInvite,
  live = true,
}: LiveRoomHostBarProps) {
  const [remaining, setRemaining] = useState<number | null>(
    endsAt ? new Date(endsAt).getTime() - Date.now() : null
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setRemaining(new Date(endsAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [endsAt]);

  const handleCopy = () => {
    onCopyInvite();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        borderBottom: "1px solid var(--border-default)",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
        {live && (
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: "var(--ats-success)",
              boxShadow: "0 0 0 4px color-mix(in srgb, var(--ats-success) 22%, transparent)",
              flexShrink: 0,
            }}
          />
        )}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          noWrap
          sx={{ color: "var(--font-primary-dark)" }}
        >
          {title || "Live room"}
        </Typography>
        {hostName && (
          <Chip
            size="small"
            icon={<IconWrapper icon="mdi:account-tie" size={14} color="var(--font-secondary)" />}
            label={hostName}
            sx={{
              backgroundColor: "var(--surface)",
              color: "var(--font-secondary)",
              border: "1px solid var(--border-default)",
              fontWeight: 600,
              display: { xs: "none", sm: "inline-flex" },
            }}
          />
        )}
        {remaining !== null && (
          <Chip
            size="small"
            icon={<IconWrapper icon="mdi:clock-outline" size={14} color="var(--font-secondary)" />}
            label={formatRemaining(remaining)}
            sx={{
              backgroundColor: "var(--surface)",
              color: remaining < 5 * 60_000 ? "var(--ats-error-muted)" : "var(--font-secondary)",
              border: "1px solid var(--border-default)",
              fontWeight: 600,
            }}
          />
        )}
        {isHost && (
          <Chip
            size="small"
            label="Host"
            sx={{
              backgroundColor: "var(--surface-indigo-light)",
              color: "var(--accent-indigo)",
              border: "1px solid color-mix(in srgb, var(--accent-indigo) 28%, transparent)",
              fontWeight: 700,
            }}
          />
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
        <Tooltip title={copied ? "Link copied" : "Copy invite link"}>
          <Button
            size="small"
            startIcon={
              <IconWrapper
                icon={copied ? "mdi:check" : "mdi:link-variant"}
                size={16}
                color={copied ? "var(--ats-success-muted)" : "var(--font-secondary)"}
              />
            }
            onClick={handleCopy}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: copied ? "var(--ats-success-muted)" : "var(--font-secondary)",
              borderColor: "var(--border-default)",
              "&:hover": { backgroundColor: "var(--surface)" },
            }}
            variant="outlined"
          >
            {copied ? "Copied" : "Invite"}
          </Button>
        </Tooltip>
        <Button
          size="small"
          startIcon={<IconWrapper icon="mdi:phone-hangup" size={16} color="var(--font-light)" />}
          onClick={onLeave}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            backgroundColor: "var(--ats-error-muted)",
            color: "var(--font-light)",
            "&:hover": { backgroundColor: "var(--error-600)" },
          }}
          variant="contained"
        >
          Leave
        </Button>
      </Box>
    </Box>
  );
}
