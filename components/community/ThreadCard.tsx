"use client";

import { useRouter } from "next/navigation";
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

interface ThreadCardProps {
  thread: Thread;
  onVote: (threadId: number, type: "upvote" | "downvote") => Promise<void>;
  onBookmark?: (threadId: number) => Promise<void>;
}

export function ThreadCard({ thread, onVote, onBookmark }: ThreadCardProps) {
  const router = useRouter();

  const handleThreadClick = () => {
    router.push(`/community/${thread.id}`);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        background: "#ffffff",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "#cbd5e1",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
              color: "#1f2937",
              "&:hover": {
                color: "#2563eb",
              },
            }}
            onClick={handleThreadClick}
          >
            {thread.title}
          </Typography>

          {/* Body Preview */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {thread.body}
          </Typography>

          {/* Tags */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {thread.tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 26,
                  borderRadius: "6px",
                  "&:hover": {
                    backgroundColor: "#bfdbfe",
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
              <Typography variant="caption" color="text.secondary">
                {thread.author.name}
              </Typography>
              <Chip
                label={thread.author.role}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.65rem",
                  backgroundColor: "#f3f4f6",
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
              <Tooltip title="Comments">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconWrapper
                    icon="mdi:comment-outline"
                    size={16}
                    color="#6b7280"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {thread.comments_count}
                  </Typography>
                </Box>
              </Tooltip>

              <Tooltip title="Bookmarks">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconWrapper
                    icon="mdi:bookmark-outline"
                    size={16}
                    color="#6b7280"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {thread.bookmarks_count}
                  </Typography>
                </Box>
              </Tooltip>

              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(thread.created_at)}
              </Typography>
            </Box>

            {/* Bookmark Button */}
            {onBookmark && (
              <Box sx={{ marginLeft: "auto" }}>
                <Tooltip title={thread.user_bookmarked ? "Remove bookmark" : "Bookmark"}>
                  <IconButton
                    size="small"
                    onClick={() => onBookmark(thread.id)}
                    sx={{
                      color: thread.user_bookmarked ? "#f59e0b" : "#6b7280",
                      backgroundColor: thread.user_bookmarked ? "#fef3c7" : "transparent",
                      "&:hover": {
                        color: "#f59e0b",
                        backgroundColor: "#fef3c7",
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
