"use client";

import { useState } from "react";

import { useTranslation } from "react-i18next";
import { Box, Typography, Avatar, Chip, Button, TextField, IconButton, Collapse } from "@mui/material";

import type { Comment } from "@/lib/services/community.service";
import { IconWrapper } from "@/components/common/IconWrapper";
import { VoteButtons } from "./VoteButtons";

import { formatDistanceToNow } from "@/lib/utils/date-utils";

interface CommentItemProps {
  comment: Comment;
  threadId: number;
  onVote: (commentId: number, type: "upvote" | "downvote") => Promise<void>;
  onReply: (commentId: number, body: string) => Promise<void>;
  depth?: number;
  parentAuthorName?: string;
}

export function CommentItem({
  comment,
  threadId,
  onVote,
  onReply,
  depth = 0,
  parentAuthorName,
}: CommentItemProps) {
  const { t } = useTranslation("common");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepth = 4;
  const isMaxDepth = depth >= maxDepth;

  const handleSubmitReply = async () => {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      await onReply(comment.id, replyBody.trim());
      setReplyBody("");
      setShowReplyForm(false);
    } catch {
      // silently handled
    } finally {
      setSubmitting(false);
    }
  };

  const avatarSize = depth === 0 ? 34 : 28;

  return (
    <Box>
      {/* Comment row: avatar column + content column */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        {/* Left column: avatar + thread line */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: avatarSize }}>
          <Avatar
            src={comment.author.profile_pic_url}
            sx={{ width: avatarSize, height: avatarSize, fontSize: depth === 0 ? "0.9rem" : "0.75rem" }}
          >
            {comment.author.name.charAt(0)}
          </Avatar>
          {/* Thread line going down to replies */}
          {hasReplies && (
            <Box
              sx={{
                width: 2,
                flex: 1,
                minHeight: 20,
                mt: 0.5,
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 25%, var(--border-default) 75%)",
                borderRadius: 1,
              }}
            />
          )}
        </Box>

        {/* Right column: header + body + actions */}
        <Box sx={{ flex: 1, minWidth: 0, pb: hasReplies ? 1.5 : 0 }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, mb: 0.4 }}>
            <Typography variant={depth === 0 ? "body2" : "caption"} fontWeight={700} sx={{ color: "var(--font-primary)" }}>
              {comment.author.name}
            </Typography>
            <Chip
              label={comment.author.role}
              size="small"
              sx={{
                height: 16, fontSize: "0.62rem",
                backgroundColor: "var(--surface)", border: "1px solid var(--border-default)",
                color: "var(--font-secondary)",
              }}
            />
            <Typography variant="caption" color="var(--font-secondary)" sx={{ fontSize: "0.72rem" }}>
              {formatDistanceToNow(comment.created_at)}
            </Typography>
          </Box>

          {/* Reply-to indicator */}
          {depth > 0 && parentAuthorName && (
            <Typography
              variant="caption"
              sx={{ color: "var(--accent-indigo)", display: "block", mb: 0.4, fontSize: "0.72rem" }}
            >
              ↩ replying to @{parentAuthorName}
            </Typography>
          )}

          {/* Body */}
          <Typography
            variant="body2"
            sx={{
              color: "var(--font-secondary)",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: depth === 0 ? "0.875rem" : "0.85rem",
              mb: 0.75,
            }}
          >
            {comment.body}
          </Typography>

          {/* Actions */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <VoteButtons
              upvotes={comment.upvotes}
              downvotes={comment.downvotes}
              userVote={comment.user_vote}
              onVote={(type) => onVote(comment.id, type)}
              size="small"
              orientation="horizontal"
            />

            {!isMaxDepth && (
              <Button
                size="small"
                startIcon={<IconWrapper icon="mdi:reply" size={14} />}
                onClick={() => setShowReplyForm(!showReplyForm)}
                sx={{
                  textTransform: "none",
                  fontSize: "0.78rem",
                  minWidth: "auto",
                  px: 1,
                  py: 0.25,
                  color: showReplyForm ? "var(--accent-indigo)" : "var(--font-secondary)",
                  "&:hover": { color: "var(--accent-indigo)", backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" },
                }}
              >
                {t("community.reply")}
              </Button>
            )}
          </Box>

          {/* Reply form */}
          <Collapse in={showReplyForm}>
            <Box sx={{ mt: 1.25 }}>
              <TextField
                placeholder={`Reply to ${comment.author.name}…`}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                fullWidth
                multiline
                rows={2}
                size="small"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && replyBody.trim()) {
                    e.preventDefault();
                    handleSubmitReply();
                  }
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.875rem" } }}
              />
              <Box sx={{ display: "flex", gap: 1, mt: 0.75 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSubmitReply}
                  disabled={!replyBody.trim() || submitting}
                  sx={{
                    textTransform: "none", fontSize: "0.78rem", borderRadius: "7px",
                    backgroundColor: "var(--accent-indigo)", boxShadow: "none",
                    "&:hover": { backgroundColor: "var(--accent-indigo)", filter: "brightness(0.9)", boxShadow: "none" },
                  }}
                >
                  {submitting ? t("community.posting") : t("community.postReply")}
                </Button>
                <Button
                  size="small"
                  onClick={() => { setShowReplyForm(false); setReplyBody(""); }}
                  sx={{ textTransform: "none", fontSize: "0.78rem", color: "var(--font-secondary)" }}
                >
                  {t("common.cancel")}
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Box>
      </Box>

      {/* Nested replies — connected via thread line from parent avatar */}
      {hasReplies && (
        <Box
          sx={{
            ml: `${avatarSize / 2 + 12}px`,
            mt: 0,
            pl: 2,
            borderLeft: "2px solid color-mix(in srgb, var(--accent-indigo) 25%, var(--border-default) 75%)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              threadId={threadId}
              onVote={onVote}
              onReply={onReply}
              depth={depth + 1}
              parentAuthorName={comment.author.name}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
