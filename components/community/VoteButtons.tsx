"use client";

import { useState } from "react";
import { Box, IconButton, Typography, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  userVote?: "upvote" | "downvote" | null;
  onVote: (type: "upvote" | "downvote") => Promise<void>;
  size?: "small" | "medium";
  orientation?: "vertical" | "horizontal";
}

export function VoteButtons({
  upvotes,
  downvotes,
  userVote,
  onVote,
  size = "medium",
  orientation = "vertical",
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
          disabled={voting}
          sx={{
            color: "#6b7280",
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
            "&:disabled": {
              color: "#d1d5db",
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
            color: "#6b7280",
            fontSize: size === "small" ? "0.75rem" : "0.875rem",
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
            color: "#6b7280",
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
            "&:disabled": {
              color: "#d1d5db",
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
            color: "#6b7280",
            fontSize: size === "small" ? "0.75rem" : "0.875rem",
          }}
        >
          {downvotes}
        </Typography>
      </Box>
    </Box>
  );
}
