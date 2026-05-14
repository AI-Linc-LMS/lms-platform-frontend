"use client";

import { useState } from "react";

import { Box, IconButton, InputBase } from "@mui/material";

import { IconWrapper } from "@/components/common/IconWrapper";

interface QuickCommentBarProps {
  threadId: number;
  onComment: (threadId: number, body: string) => Promise<void>;
}

export function QuickCommentBar({ threadId, onComment }: QuickCommentBarProps) {
  const [commentBar, setCommentBar] = useState({
    input: "",
    isFocused: false,
    isSubmitting: false,
  });

  const handleSubmit = async () => {
    if (!commentBar.input.trim()) return;
    setCommentBar((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await onComment(threadId, commentBar.input.trim());
      setCommentBar({ input: "", isFocused: false, isSubmitting: false });
    } catch {
      // handled by parent
      setCommentBar((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <Box
      sx={{
        px: 3,
        py: 1,
        borderTop: "1px solid var(--border-default)",
        backgroundColor: commentBar.isFocused
          ? "color-mix(in srgb, var(--accent-indigo) 4%, var(--card-bg))"
          : "transparent",
        transition: "background-color 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 1.25,
      }}
    >
      <IconWrapper icon="mdi:comment-outline" size={15} color="var(--font-tertiary)" />
      <InputBase
        placeholder="Write a comment…"
        value={commentBar.input}
        onChange={(e) => setCommentBar((prev) => ({ ...prev, input: e.target.value }))}
        onFocus={() => setCommentBar((prev) => ({ ...prev, isFocused: true }))}
        onBlur={() => {
          if (!commentBar.input) setCommentBar((prev) => ({ ...prev, isFocused: false }));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && commentBar.input.trim()) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        sx={{
          flex: 1,
          fontSize: "0.84rem",
          color: "var(--font-primary)",
          "& input": {
            py: 0.375,
            "&::placeholder": { color: "var(--font-tertiary)", opacity: 1, fontSize: "0.84rem" },
          },
        }}
      />
      {(commentBar.input.trim() || commentBar.isSubmitting) && (
        <IconButton
          size="small"
          onClick={handleSubmit}
          disabled={commentBar.isSubmitting || !commentBar.input.trim()}
          sx={{
            color: "var(--accent-indigo)",
            p: 0.5,
            "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)" },
          }}
        >
          <IconWrapper icon={commentBar.isSubmitting ? "mdi:loading" : "mdi:send"} size={15} />
        </IconButton>
      )}
    </Box>
  );
}
