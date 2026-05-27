"use client";

import { useState, memo } from "react";

import { useTranslation } from "react-i18next";
import { Box, Typography, Avatar, Chip, Button, TextField, IconButton, Collapse, Tooltip } from "@mui/material";
import { LoadingButton } from "@/components/common/LoadingButton";

import type { Comment } from "@/lib/services/community.service";
import { IconWrapper } from "@/components/common/IconWrapper";
import { VoteButtons } from "./VoteButtons";
import { MentionText } from "./MentionText";

import { formatDistanceToNow } from "@/lib/utils/date-utils";

const XP_TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#94a3b8",
  gold: "#fbbf24",
  platinum: "#a78bfa",
};

function getAvatarRingStyle(tier?: string) {
  if (!tier || tier === "bronze") return {};
  const color = XP_TIER_COLORS[tier] ?? XP_TIER_COLORS.bronze;
  return {
    outline: `2.5px solid ${color}`,
    outlineOffset: "1.5px",
  };
}

interface CommentItemProps {
  comment: Comment;
  threadId: number;
  onVote: (commentId: number, type: "upvote" | "downvote") => Promise<void>;
  onReply: (commentId: number, body: string) => Promise<void>;
  onAccept?: (commentId: number) => Promise<void>;
  onReport?: (commentId: number) => void;
  onAuthorClick?: (authorId: number) => void;
  isThreadAuthor?: boolean;
  depth?: number;
  parentAuthorName?: string;
}

export const CommentItem = memo(function CommentItem({
  comment,
  threadId,
  onVote,
  onReply,
  onAccept,
  onReport,
  onAuthorClick,
  isThreadAuthor = false,
  depth = 0,
  parentAuthorName,
}: CommentItemProps) {
  const { t } = useTranslation("common");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxDepth = 4;
  const isMaxDepth = depth >= maxDepth;
  const isAccepted = !!comment.is_accepted;

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

  const handleAccept = async () => {
    if (!onAccept) return;
    setAccepting(true);
    try {
      await onAccept(comment.id);
    } finally {
      setAccepting(false);
    }
  };

  const avatarSize = depth === 0 ? 34 : 28;
  const tier = comment.author.xp_tier;
  const ringStyle = getAvatarRingStyle(tier);

  return (
    <Box
      sx={
        isAccepted
          ? {
              borderRadius: "10px",
              border: "1.5px solid rgba(22,163,74,0.55)",
              backgroundColor: "rgba(22,163,74,0.06)",
              p: 1.25,
              mx: -1.25,
            }
          : {}
      }
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: avatarSize }}>
          <Avatar
            src={comment.author.profile_pic_url}
            sx={{ width: avatarSize, height: avatarSize, fontSize: depth === 0 ? "0.9rem" : "0.75rem", ...ringStyle }}
          >
            {comment.author.name.charAt(0)}
          </Avatar>
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

        <Box sx={{ flex: 1, minWidth: 0, pb: hasReplies ? 1.5 : 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75, mb: 0.4 }}>
            <Typography
              variant={depth === 0 ? "body2" : "caption"}
              fontWeight={700}
              onClick={
                onAuthorClick && comment.author.id
                  ? () => onAuthorClick(comment.author.id)
                  : undefined
              }
              sx={{
                color: "var(--font-primary)",
                cursor: onAuthorClick && comment.author.id ? "pointer" : "default",
                "&:hover":
                  onAuthorClick && comment.author.id
                    ? { color: "var(--accent-indigo)", textDecoration: "underline" }
                    : undefined,
              }}
            >
              {comment.author.name}
            </Typography>
            {tier && tier !== "bronze" && (
              <Box
                sx={{
                  width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: XP_TIER_COLORS[tier],
                  flexShrink: 0,
                }}
              />
            )}
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

          {depth > 0 && parentAuthorName && (
            <Typography
              variant="caption"
              sx={{ color: "var(--accent-indigo)", display: "block", mb: 0.4, fontSize: "0.72rem" }}
            >
              ↩ replying to @{parentAuthorName}
            </Typography>
          )}

          <Typography
            variant="body2"
            component="div"
            sx={{
              color: "var(--font-secondary)",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: depth === 0 ? "0.875rem" : "0.85rem",
              mb: 0.75,
            }}
          >
            <MentionText text={comment.body} inline />
          </Typography>

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

            {isThreadAuthor && depth === 0 && onAccept && (
              <Tooltip
                title={
                  isAccepted
                    ? "Unmark as helpful"
                    : "Mark as helpful (up to 3 per thread)"
                }
              >
                <Button
                  size="small"
                  onClick={handleAccept}
                  disabled={accepting}
                  startIcon={
                    <IconWrapper
                      icon={isAccepted ? "mdi:check-decagram" : "mdi:check-decagram-outline"}
                      size={15}
                      color={isAccepted ? "#16a34a" : undefined}
                    />
                  }
                  sx={{
                    textTransform: "none",
                    fontSize: "0.78rem",
                    fontWeight: isAccepted ? 700 : 500,
                    minWidth: "auto",
                    px: 1,
                    py: 0.25,
                    color: isAccepted ? "#15803d" : "var(--font-secondary)",
                    backgroundColor: isAccepted ? "rgba(22,163,74,0.10)" : "transparent",
                    border: isAccepted
                      ? "1px solid rgba(22,163,74,0.32)"
                      : "1px solid transparent",
                    borderRadius: "6px",
                    "&:hover": {
                      color: "#15803d",
                      backgroundColor: "rgba(22,163,74,0.14)",
                      borderColor: "rgba(22,163,74,0.36)",
                    },
                  }}
                >
                  Helpful
                </Button>
              </Tooltip>
            )}
            {onReport && (
              <Tooltip title="Report comment">
                <IconButton
                  size="small"
                  onClick={() => onReport(comment.id)}
                  sx={{
                    p: 0.5,
                    ml: "auto",
                    color: "var(--font-tertiary)",
                    "&:hover": { color: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)" },
                  }}
                >
                  <IconWrapper icon="mdi:flag-outline" size={15} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

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
                <LoadingButton
                  size="small"
                  variant="contained"
                  onClick={handleSubmitReply}
                  disabled={!replyBody.trim()}
                  loading={submitting}
                  loadingText={t("common.posting")}
                  sx={{
                    textTransform: "none", fontSize: "0.78rem", borderRadius: "7px",
                    backgroundColor: "var(--accent-indigo)", boxShadow: "none",
                    "&:hover": { backgroundColor: "var(--accent-indigo)", filter: "brightness(0.9)", boxShadow: "none" },
                  }}
                >
                  {t("community.postReply")}
                </LoadingButton>
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
              onAccept={onAccept}
              isThreadAuthor={isThreadAuthor}
              depth={depth + 1}
              parentAuthorName={comment.author.name}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});
