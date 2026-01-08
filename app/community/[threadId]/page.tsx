"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Breadcrumbs,
  Link,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { VoteButtons } from "@/components/community/VoteButtons";
import { CommentItem } from "@/components/community/CommentItem";
import {
  communityService,
  ThreadDetail,
} from "@/lib/services/community.service";
import { useToast } from "@/components/common/Toast";
import { formatDistanceToNow } from "@/lib/utils/date-utils";

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const threadId = Number(params.threadId);

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (threadId) {
      loadThread();
    }
  }, [threadId]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const data = await communityService.getThreadDetail(threadId);
      setThread(data);
    } catch (error) {
      showToast("Failed to load thread", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVoteThread = async (type: "upvote" | "downvote") => {
    try {
      await communityService.voteThread(threadId, type);
      // Reload thread to get updated vote counts and user_vote status
      await loadThread();
    } catch (error) {
      showToast("Failed to vote", "error");
    }
  };

  const handleVoteComment = async (
    commentId: number,
    type: "upvote" | "downvote"
  ) => {
    try {
      await communityService.voteComment(threadId, commentId, type);
      // Reload thread to get updated comments
      await loadThread();
    } catch (error) {
      showToast("Failed to vote", "error");
    }
  };

  const handleAddComment = async () => {
    if (!commentBody.trim()) return;

    setSubmitting(true);
    try {
      await communityService.createComment(threadId, {
        body: commentBody.trim(),
      });
      setCommentBody("");
      await loadThread();
      showToast("Comment added successfully!", "success");
    } catch (error) {
      showToast("Failed to add comment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, body: string) => {
    try {
      await communityService.createComment(threadId, {
        body,
        parent_id: parentId,
      });
      await loadThread();
      showToast("Reply added successfully!", "success");
    } catch (error) {
      showToast("Failed to add reply", "error");
      throw error;
    }
  };

  const handleBookmark = async () => {
    try {
      await communityService.bookmarkThread(threadId);
      setThread((prev) =>
        prev ? { ...prev, bookmarks_count: prev.bookmarks_count + 1 } : null
      );
      showToast("Thread bookmarked!", "success");
    } catch (error) {
      showToast("Failed to bookmark thread", "error");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </Container>
      </MainLayout>
    );
  }

  if (!thread) {
    return (
      <MainLayout>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper elevation={0} sx={{ p: 8, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Thread not found
            </Typography>
            <Button onClick={() => router.push("/community")} sx={{ mt: 2 }}>
              Back to Community
            </Button>
          </Paper>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            href="/community"
            underline="hover"
            sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={(e) => {
              e.preventDefault();
              router.push("/community");
            }}
          >
            <IconWrapper
              icon="mdi:forum"
              size={20}
              style={{ marginRight: 4 }}
            />
            Community
          </Link>
          <Typography color="text.primary">{thread.title}</Typography>
        </Breadcrumbs>

        {/* Thread Content */}
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e5e7eb", mb: 3 }}>
          <Box sx={{ display: "flex", gap: 3 }}>
            {/* Vote Buttons */}
            <Box sx={{ minWidth: 48 }}>
              <VoteButtons
                upvotes={thread.upvotes}
                downvotes={thread.downvotes}
                userVote={thread.user_vote}
                onVote={(type) => handleVoteThread(type)}
                size="medium"
                orientation="vertical"
              />
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1 }}>
              {/* Title */}
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {thread.title}
              </Typography>

              {/* Tags */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                {thread.tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    sx={{
                      backgroundColor: "#dbeafe",
                      color: "#1e40af",
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>

              {/* Body */}
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  whiteSpace: "pre-wrap",
                  color: "#374151",
                  lineHeight: 1.7,
                }}
              >
                {thread.body}
              </Typography>

              {/* Author & Meta */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  pt: 2,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    src={thread.author.profile_pic_url}
                    sx={{ width: 40, height: 40 }}
                  >
                    {thread.author.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {thread.author.name}
                      </Typography>
                      <Chip
                        label={thread.author.role}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          backgroundColor: "#f3f4f6",
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Posted {formatDistanceToNow(thread.created_at)}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  startIcon={<IconWrapper icon="mdi:bookmark-outline" />}
                  onClick={handleBookmark}
                  sx={{ textTransform: "none" }}
                >
                  Bookmark ({thread.bookmarks_count})
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Comments Section */}
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e5e7eb" }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {thread.comments_count}{" "}
            {thread.comments_count === 1 ? "Answer" : "Answers"}
          </Typography>

          {/* Add Comment Form */}
          <Box sx={{ mb: 3 }}>
            <TextField
              placeholder="Write your answer..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              fullWidth
              multiline
              rows={4}
              sx={{ mb: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={!commentBody.trim() || submitting}
              startIcon={<IconWrapper icon="mdi:send" />}
            >
              {submitting ? "Posting..." : "Post Answer"}
            </Button>
          </Box>

          {/* Comments List */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {thread.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                threadId={threadId}
                onVote={handleVoteComment}
                onReply={handleReply}
              />
            ))}

            {thread.comments.length === 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  py: 4,
                }}
              >
                <IconWrapper
                  icon="mdi:comment-outline"
                  size={48}
                  color="#d1d5db"
                  style={{ marginBottom: 8 }}
                />
                <Typography variant="body2" color="text.secondary">
                  No answers yet. Be the first to answer!
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </MainLayout>
  );
}
