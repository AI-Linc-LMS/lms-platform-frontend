"use client";

import { useState } from "react";
import { Box, IconButton, Typography, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * A vote button is the single most-tapped control in Community, and the audit measured it at
 * 30px on a phone - small enough that a miss lands on the card and opens the thread instead.
 * MUI's `size="small"` keeps the desktop density; the floor only applies on xs.
 */
const TOUCH = {
  width: { xs: 44, sm: "auto" },
  height: { xs: 44, sm: "auto" },
} as const;

interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  userVote?: "upvote" | "downvote" | null;
  onVote: (type: "upvote" | "downvote") => Promise<void>;
  size?: "small" | "medium";
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
}

export function VoteButtons({
  upvotes,
  downvotes,
  userVote,
  onVote,
  size = "medium",
  orientation = "vertical",
  disabled = false,
}: VoteButtonsProps) {
  const [voting, setVoting] = useState(false);

  const handleVote = async (type: "upvote" | "downvote") => {
    if (voting) return;

    setVoting(true);
    try {
      await onVote(type);
    } catch (error) {
    } finally {
      setVoting(false);
    }
  };

  const isVertical = orientation === "vertical";
  const normalizedUserVote = userVote ?? null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        gap: isVertical ? 0.5 : 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.25,
        }}
      >
        <IconButton
          size={size}
          onClick={() => handleVote("upvote")}
          disabled={voting || disabled}
          sx={{
            ...TOUCH,
            color: "var(--font-secondary)",
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor:
                "color-mix(in srgb, var(--font-primary) 8%, transparent)",
            },
            "&:disabled": {
              color: "var(--font-tertiary)",
            },
          }}
        >
          {voting ? (
            <CircularProgress size={size === "small" ? 16 : 20} />
          ) : (
            <IconWrapper
              icon={
                normalizedUserVote === "upvote" ? "mdi:thumb-up" : "mdi:thumb-up-outline"
              }
              size={size === "small" ? 20 : 24}
            />
          )}
        </IconButton>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{
            color: "var(--font-secondary)",
            fontSize: size === "small" ? { xs: "0.78rem", sm: "0.75rem" } : "0.875rem",
          }}
        >
          {upvotes}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.25,
        }}
      >
        <IconButton
          size={size}
          onClick={() => handleVote("downvote")}
          disabled={voting}
          sx={{
            ...TOUCH,
            color: "var(--font-secondary)",
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor:
                "color-mix(in srgb, var(--font-primary) 8%, transparent)",
            },
            "&:disabled": {
              color: "var(--font-tertiary)",
            },
          }}
        >
          {voting ? (
            <CircularProgress size={size === "small" ? 16 : 20} />
          ) : (
            <IconWrapper
              icon={
                normalizedUserVote === "downvote"
                  ? "mdi:thumb-down"
                  : "mdi:thumb-down-outline"
              }
              size={size === "small" ? 20 : 24}
            />
          )}
        </IconButton>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{
            color: "var(--font-secondary)",
            fontSize: size === "small" ? { xs: "0.78rem", sm: "0.75rem" } : "0.875rem",
          }}
        >
          {downvotes}
        </Typography>
      </Box>
    </Box>
  );
}
