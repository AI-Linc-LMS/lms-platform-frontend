"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Button,
  TextField,
  IconButton,
  Collapse,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Comment } from "@/lib/services/community.service";
import { VoteButtons } from "./VoteButtons";
import { formatDistanceToNow } from "@/lib/utils/date-utils";

interface CommentItemProps {
  comment: Comment;
  threadId: number;
  onVote: (commentId: number, type: "upvote" | "downvote") => Promise<void>;
  onReply: (commentId: number, body: string) => Promise<void>;
  depth?: number;
}

export function CommentItem({
  comment,
  threadId,
  onVote,
  onReply,
  depth = 0,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyBody.trim()) return;

    setSubmitting(true);
    try {
      await onReply(comment.id, replyBody.trim());
      setReplyBody("");
      setShowReplyForm(false);
    } catch (error) {
      // Silently handle reply error
    } finally {
      setSubmitting(false);
    }
  };

  const maxDepth = 3;
  const isMaxDepth = depth >= maxDepth;

  return (
    <Box
      sx={{
        pl: depth > 0 ? 4 : 0,
        borderLeft: depth > 0 ? "2px solid #e5e7eb" : "none",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          backgroundColor: depth % 2 === 0 ? "#ffffff" : "#fafafa",
        }}
      >
        {/* Comment Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
          }}
        >
          <Avatar
            src={comment.author.profile_pic_url}
            sx={{ width: 32, height: 32 }}
          >
            {comment.author.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {comment.author.name}
              </Typography>
              <Chip
                label={comment.author.role}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.65rem",
                  backgroundColor: "#f3f4f6",
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(comment.created_at)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Comment Body */}
        <Typography
          variant="body2"
          sx={{
            mb: 1.5,
            whiteSpace: "pre-wrap",
            color: "#374151",
          }}
        >
          {comment.body}
        </Typography>

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
              startIcon={<IconWrapper icon="mdi:reply" size={16} />}
              onClick={() => setShowReplyForm(!showReplyForm)}
              sx={{ textTransform: "none", minWidth: "auto" }}
            >
              Reply
            </Button>
          )}
        </Box>

        {/* Reply Form */}
        <Collapse in={showReplyForm}>
          <Box sx={{ mt: 2 }}>
            <TextField
              placeholder="Write your reply..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              fullWidth
              multiline
              rows={3}
              size="small"
            />
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                onClick={handleSubmitReply}
                disabled={!replyBody.trim() || submitting}
              >
                {submitting ? "Posting..." : "Post Reply"}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyBody("");
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Paper>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              threadId={threadId}
              onVote={onVote}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

