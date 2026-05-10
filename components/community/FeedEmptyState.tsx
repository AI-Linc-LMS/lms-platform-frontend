"use client";

import { Box, Typography, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface FeedEmptyStateProps {
  filter: "all" | "queries" | "polls" | "humor" | "mine" | "search";
  searchTerm?: string;
  onCreate?: () => void;
  onClearFilters?: () => void;
}

const COPY: Record<
  FeedEmptyStateProps["filter"],
  { icon: string; title: string; body: string; cta: string; tone: string }
> = {
  all: {
    icon: "mdi:forum-outline",
    title: "Nothing here yet",
    body: "Be the first to start a conversation. A short, specific question gets the best answers.",
    cta: "Start a discussion",
    tone: "var(--accent-indigo)",
  },
  queries: {
    icon: "mdi:help-circle-outline",
    title: "No questions yet",
    body: "Stuck on something? Other learners have probably hit the same wall.",
    cta: "Ask a question",
    tone: "var(--accent-indigo)",
  },
  polls: {
    icon: "mdi:poll",
    title: "No polls running",
    body: "Polls let the community vote on a quick question. Reach 500 IP to start one.",
    cta: "Create a poll",
    tone: "var(--accent-purple)",
  },
  humor: {
    icon: "mdi:emoticon-happy-outline",
    title: "Quiet in here",
    body: "Share a tech meme, a programming joke, or a debugging story. Keep it kind.",
    cta: "Share a meme",
    tone: "var(--warning-500)",
  },
  mine: {
    icon: "mdi:pencil-outline",
    title: "You haven't posted yet",
    body: "Post a question, share a solution, or drop a useful resource — your activity will show up here.",
    cta: "Write your first post",
    tone: "var(--accent-teal)",
  },
  search: {
    icon: "mdi:magnify-close",
    title: "No matches",
    body: "Try fewer words, broader keywords, or clearing filters to widen the search.",
    cta: "Clear filters",
    tone: "var(--font-secondary)",
  },
};

export function FeedEmptyState({
  filter,
  searchTerm,
  onCreate,
  onClearFilters,
}: FeedEmptyStateProps) {
  const copy = COPY[filter];
  const isSearch = filter === "search";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: { xs: 6, md: 8 },
        px: 3,
        border: "1px dashed var(--border-default)",
        borderRadius: 3,
        backgroundColor: "color-mix(in srgb, var(--card-bg) 92%, var(--surface) 8%)",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          backgroundColor: `color-mix(in srgb, ${copy.tone} 14%, var(--surface))`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        <IconWrapper icon={copy.icon} size={28} color={copy.tone} />
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ color: "var(--font-primary-dark)", mb: 0.75 }}>
        {copy.title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "var(--font-secondary)", maxWidth: 460, mb: 2.5 }}
      >
        {searchTerm && isSearch ? (
          <>
            Nothing matched <strong>“{searchTerm}”</strong>. {copy.body}
          </>
        ) : (
          copy.body
        )}
      </Typography>
      {(isSearch ? onClearFilters : onCreate) && (
        <Button
          variant="contained"
          onClick={isSearch ? onClearFilters : onCreate}
          startIcon={
            <IconWrapper
              icon={isSearch ? "mdi:filter-off" : "mdi:plus"}
              size={16}
              color="var(--font-light)"
            />
          }
          sx={{
            textTransform: "none",
            fontWeight: 700,
            backgroundColor: "var(--primary-600)",
            color: "var(--font-light)",
            px: 2.5,
            "&:hover": { backgroundColor: "var(--primary-700)" },
          }}
        >
          {copy.cta}
        </Button>
      )}
    </Box>
  );
}
