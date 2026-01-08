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
      // Call API and wait for response
      // Parent will reload data and update props
      await onVote(type);
    } catch (error) {
      // Silently handle vote error
    } finally {
      setVoting(false);
    }
  };

  const isVertical = orientation === "vertical";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        gap: isVertical ? 0.5 : 2,
      }}
    >
      {/* Upvote Button and Count */}
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
            color: userVote === "upvote" ? "#10b981" : "#6b7280",
            backgroundColor:
              userVote === "upvote" ? "#f0fdf4" : "transparent",
            "&:hover": {
              color: "#10b981",
              backgroundColor: "#f0fdf4",
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
                userVote === "upvote" ? "mdi:thumb-up" : "mdi:thumb-up-outline"
              }
              size={size === "small" ? 20 : 24}
            />
          )}
        </IconButton>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{
            color: userVote === "upvote" ? "#10b981" : "#6b7280",
            fontSize: size === "small" ? "0.75rem" : "0.875rem",
          }}
        >
          {upvotes}
        </Typography>
      </Box>

      {/* Downvote Button and Count */}
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
            color: userVote === "downvote" ? "#ef4444" : "#6b7280",
            backgroundColor:
              userVote === "downvote" ? "#fef2f2" : "transparent",
            "&:hover": {
              color: "#ef4444",
              backgroundColor: "#fef2f2",
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
                userVote === "downvote"
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
            color: userVote === "downvote" ? "#ef4444" : "#6b7280",
            fontSize: size === "small" ? "0.75rem" : "0.875rem",
          }}
        >
          {downvotes}
        </Typography>
      </Box>
    </Box>
  );
}
