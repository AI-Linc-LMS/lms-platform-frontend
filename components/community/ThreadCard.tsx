"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Thread } from "@/lib/services/community.service";
import { VoteButtons } from "./VoteButtons";
import { formatDistanceToNow } from "@/lib/utils/date-utils";
import { getHtmlPreview } from "@/lib/utils/html-utils";

interface ThreadCardProps {
  thread: Thread;
  onVote: (threadId: number, type: "upvote" | "downvote") => Promise<void>;
  onBookmark?: (threadId: number) => Promise<void>;
}

export function ThreadCard({ thread, onVote, onBookmark }: ThreadCardProps) {
  const router = useRouter();
  const { t } = useTranslation("common");

  const handleThreadClick = () => {
    router.push(`/community/${thread.id}`);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        background: "var(--card-bg)",
        transition: "all 0.2s",
        "&:hover": {
          borderColor:
            "color-mix(in srgb, var(--border-default) 70%, var(--font-secondary) 30%)",
          boxShadow:
            "0 2px 8px color-mix(in srgb, var(--font-primary) 18%, transparent)",
        },
      }}
    >
      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Vote Buttons */}
        <Box
          sx={{
            minWidth: 56,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <VoteButtons
            upvotes={thread.upvotes}
            downvotes={thread.downvotes}
            userVote={thread.user_vote}
            onVote={(type) => onVote(thread.id, type)}
            size="small"
            orientation="vertical"
          />
        </Box>

        {/* Thread Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{
              mb: 1,
              cursor: "pointer",
              color: "var(--font-primary)",
              "&:hover": {
                color: "var(--accent-indigo)",
              },
            }}
            onClick={handleThreadClick}
          >
            {thread.title}
          </Typography>

          {/* Body Preview */}
          <Typography
            variant="body2"
            color="var(--font-secondary)"
            sx={{
              mb: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {thread.body ? getHtmlPreview(thread.body, 150) : ""}
          </Typography>

          {/* Tags */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {thread.tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 18%, var(--surface) 82%)",
                  color: "var(--accent-indigo)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 26,
                  borderRadius: "6px",
                  "&:hover": {
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 26%, var(--surface) 74%)",
                  },
                }}
              />
            ))}
          </Box>

          {/* Meta Info */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            {/* Author */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                src={thread.author.profile_pic_url}
                sx={{ width: 20, height: 20 }}
              >
                {thread.author.name.charAt(0)}
              </Avatar>
              <Typography variant="caption" color="var(--font-secondary)">
                {thread.author.name}
              </Typography>
              <Chip
                label={thread.author.role}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.65rem",
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--font-secondary)",
                }}
              />
            </Box>

            {/* Stats */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                ml: "auto",
              }}
            >
              <Tooltip title={t("community.comments")}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconWrapper
                    icon="mdi:comment-outline"
                    size={16}
                    color="var(--font-secondary)"
                  />
                  <Typography variant="caption" color="var(--font-secondary)">
                    {thread.comments_count}
                  </Typography>
                </Box>
              </Tooltip>

              <Tooltip title={t("community.bookmarks")}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconWrapper
                    icon="mdi:bookmark-outline"
                    size={16}
                    color="var(--font-secondary)"
                  />
                  <Typography variant="caption" color="var(--font-secondary)">
                    {thread.bookmarks_count}
                  </Typography>
                </Box>
              </Tooltip>

              <Typography variant="caption" color="var(--font-secondary)">
                {formatDistanceToNow(thread.created_at)}
              </Typography>
            </Box>

            {/* Bookmark Button */}
            {onBookmark && (
              <Box sx={{ marginInlineStart: "auto" }}>
                <Tooltip title={thread.user_bookmarked ? t("community.removeBookmark") : t("community.bookmark")}>
                  <IconButton
                    size="small"
                    onClick={() => onBookmark(thread.id)}
                    sx={{
                      color: "var(--font-secondary)",
                      backgroundColor: "transparent",
                      "&:hover": {
                        backgroundColor:
                          "color-mix(in srgb, var(--font-primary) 8%, transparent)",
                      },
                    }}
                  >
                    <IconWrapper
                      icon={
                        thread.user_bookmarked
                          ? "mdi:bookmark"
                          : "mdi:bookmark-outline"
                      }
                      size={20}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
