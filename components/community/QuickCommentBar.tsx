"use client";

import { useState } from "react";

import { Box, IconButton, InputBase } from "@mui/material";

import { IconWrapper } from "@/components/common/IconWrapper";
import { PHONE } from "@/components/common/mobile/phone";

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
        px: { xs: 2, sm: 3 },
        py: { xs: 0.75, sm: 1 },
        // The row is the reply affordance on a card, so it has to be thumb-sized on a phone.
        minHeight: { xs: 48, sm: "auto" },
        // The field below grows to 44px on a phone; the row gives back the same room so it stays 49px.
        [PHONE]: { py: 0.25 },
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
        data-testid="quick-comment-field"
        sx={{
          flex: 1,
          minWidth: 0,
          // The input drew 36px; the whole field focuses it, so the field is the 44px target.
          [PHONE]: { minHeight: 44 },
          fontSize: { xs: "0.875rem", sm: "0.84rem" },
          color: "var(--font-primary)",
          "& input": {
            py: { xs: 1, sm: 0.375 },
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
            width: { xs: 44, sm: "auto" },
            height: { xs: 44, sm: "auto" },
            flexShrink: 0,
            "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)" },
          }}
        >
          <IconWrapper icon={commentBar.isSubmitting ? "mdi:loading" : "mdi:send"} size={15} />
        </IconButton>
      )}
    </Box>
  );
}
