"use client";

import { useState, useEffect, useRef } from "react";
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
  Comment as CommentType,
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
  const optimisticCommentVotesRef = useRef<
    Map<number, "upvote" | "downvote" | null>
  >(new Map());
  const optimisticThreadVoteRef = useRef<"upvote" | "downvote" | null>(null);
  const optimisticThreadBookmarkRef = useRef<boolean | null>(null);

  const COMMENT_VOTES_STORAGE_KEY = `community_thread_${threadId}_comment_votes`;
  const THREAD_VOTE_STORAGE_KEY = `community_thread_${threadId}_vote`;
  const THREAD_BOOKMARK_STORAGE_KEY = `community_thread_${threadId}_bookmark`;

  const loadCommentVotesFromStorage = (): Map<
    number,
    "upvote" | "downvote" | null
  > => {
    try {
      const stored = sessionStorage.getItem(COMMENT_VOTES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(
          Object.entries(parsed).map(([id, vote]) => [
            Number(id),
            vote as "upvote" | "downvote" | null,
          ])
        );
      }
    } catch (error) {
    }
    return new Map();
  };

  const saveCommentVotesToStorage = (
    votes: Map<number, "upvote" | "downvote" | null>
  ) => {
    try {
      const obj = Object.fromEntries(votes);
      sessionStorage.setItem(COMMENT_VOTES_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
    }
  };

  const loadThreadVoteFromStorage = (): "upvote" | "downvote" | null => {
    try {
      const stored = sessionStorage.getItem(THREAD_VOTE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
    }
    return null;
  };

  const saveThreadVoteToStorage = (vote: "upvote" | "downvote" | null) => {
    try {
      sessionStorage.setItem(THREAD_VOTE_STORAGE_KEY, JSON.stringify(vote));
    } catch (error) {
    }
  };

  const loadThreadBookmarkFromStorage = (): boolean => {
    try {
      const stored = sessionStorage.getItem(THREAD_BOOKMARK_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
    }
    return false;
  };

  const saveThreadBookmarkToStorage = (bookmarked: boolean) => {
    try {
      sessionStorage.setItem(
        THREAD_BOOKMARK_STORAGE_KEY,
        JSON.stringify(bookmarked)
      );
    } catch (error) {
    }
  };

  useEffect(() => {
    if (threadId) {
      optimisticCommentVotesRef.current = loadCommentVotesFromStorage();
      optimisticThreadVoteRef.current = loadThreadVoteFromStorage();
      optimisticThreadBookmarkRef.current = loadThreadBookmarkFromStorage();
      loadThread();
    }
  }, [threadId]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const data = await communityService.getThreadDetail(threadId);

      const mergeCommentVotes = (
        comments: CommentType[]
      ): CommentType[] => {
        return comments.map((c) => {
          const optimisticVote = optimisticCommentVotesRef.current.get(c.id);

          const updatedComment = {
            ...c,
            user_vote:
              c.user_vote !== undefined ? c.user_vote : optimisticVote ?? null,
          };

          if (c.replies && c.replies.length > 0) {
            return {
              ...updatedComment,
              replies: mergeCommentVotes(c.replies),
            };
          }

          return updatedComment;
        });
      };

      const userVote =
        data.user_vote !== undefined
          ? data.user_vote
          : optimisticThreadVoteRef.current ?? null;
      const userBookmarked =
        data.user_bookmarked !== undefined
          ? data.user_bookmarked
          : optimisticThreadBookmarkRef.current ?? false;

      if (data.user_vote !== undefined) {
        optimisticThreadVoteRef.current = userVote;
      }
      if (data.user_bookmarked !== undefined) {
        optimisticThreadBookmarkRef.current = userBookmarked;
      }

      const updatedComments = mergeCommentVotes(data.comments);
      updatedComments.forEach((comment) => {
        const updateCommentRefs = (c: CommentType) => {
          const finalVote =
            c.user_vote !== undefined
              ? c.user_vote
              : optimisticCommentVotesRef.current.get(c.id) ?? null;
          optimisticCommentVotesRef.current.set(c.id, finalVote);
          if (c.replies && c.replies.length > 0) {
            c.replies.forEach(updateCommentRefs);
          }
        };
        updateCommentRefs(comment);
      });

      if (data.user_vote !== undefined) {
        optimisticThreadVoteRef.current = data.user_vote;
      }
      if (data.user_bookmarked !== undefined) {
        optimisticThreadBookmarkRef.current = data.user_bookmarked;
      }

      saveCommentVotesToStorage(optimisticCommentVotesRef.current);
      saveThreadVoteToStorage(userVote);
      saveThreadBookmarkToStorage(userBookmarked ?? false);

      setThread({
        ...data,
        comments: updatedComments,
        user_vote: userVote,
        user_bookmarked: userBookmarked,
      });
    } catch (error) {
      showToast("Failed to load thread", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVoteThread = async (type: "upvote" | "downvote") => {
    if (!thread) return;

    const currentVote = thread.user_vote ?? null;
    let newUpvotes = thread.upvotes;
    let newDownvotes = thread.downvotes;
    let newUserVote: "upvote" | "downvote" | null = null;

    if (currentVote === type) {
      if (type === "upvote") {
        newUpvotes = Math.max(0, newUpvotes - 1);
      } else {
        newDownvotes = Math.max(0, newDownvotes - 1);
      }
      newUserVote = null;
    } else if (currentVote === null) {
      if (type === "upvote") {
        newUpvotes += 1;
      } else {
        newDownvotes += 1;
      }
      newUserVote = type;
    } else {
      if (type === "upvote") {
        newDownvotes = Math.max(0, newDownvotes - 1);
        newUpvotes += 1;
      } else {
        newUpvotes = Math.max(0, newUpvotes - 1);
        newDownvotes += 1;
      }
      newUserVote = type;
    }

    optimisticThreadVoteRef.current = newUserVote;
    saveThreadVoteToStorage(newUserVote);

    setThread((prev) =>
      prev
        ? {
            ...prev,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            user_vote: newUserVote,
          }
        : null
    );

    try {
      await communityService.voteThread(threadId, type);
      const updatedThread = await communityService.getThreadDetail(threadId);

      setThread((prev) => {
        const mergeCommentVotes = (
          comments: CommentType[]
        ): CommentType[] => {
          return comments.map((c) => {
            const optimisticVote = optimisticCommentVotesRef.current.get(c.id);

            const updatedComment = {
              ...c,
              user_vote:
                c.user_vote !== undefined
                  ? c.user_vote
                  : optimisticVote ?? null,
            };

            if (c.replies && c.replies.length > 0) {
              return {
                ...updatedComment,
                replies: mergeCommentVotes(c.replies),
              };
            }

            return updatedComment;
          });
        };

        return prev
          ? {
              ...updatedThread,
              user_vote:
                updatedThread.user_vote !== undefined
                  ? updatedThread.user_vote
                  : optimisticThreadVoteRef.current ?? null,
              upvotes: updatedThread.upvotes,
              downvotes: updatedThread.downvotes,
              comments: mergeCommentVotes(updatedThread.comments),
              user_bookmarked:
                updatedThread.user_bookmarked !== undefined
                  ? updatedThread.user_bookmarked
                  : optimisticThreadBookmarkRef.current ?? false,
            }
          : updatedThread;
      });

      saveCommentVotesToStorage(optimisticCommentVotesRef.current);
      saveThreadVoteToStorage(optimisticThreadVoteRef.current ?? null);
      saveThreadBookmarkToStorage(
        optimisticThreadBookmarkRef.current ?? false
      );
    } catch (error) {
      optimisticThreadVoteRef.current = thread.user_vote ?? null;
      saveThreadVoteToStorage(optimisticThreadVoteRef.current);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              upvotes: thread.upvotes,
              downvotes: thread.downvotes,
              user_vote: thread.user_vote ?? null,
            }
          : null
      );
      showToast("Failed to vote", "error");
    }
  };

  const handleVoteComment = async (
    commentId: number,
    type: "upvote" | "downvote"
  ) => {
    if (!thread) return;

    const findComment = (
      comments: CommentType[],
      id: number
    ): CommentType | undefined => {
      for (const comment of comments) {
        if (comment.id === id) return comment;
        if (comment.replies) {
          const found = findComment(comment.replies, id);
          if (found) return found;
        }
      }
      return undefined;
    };

    const comment = findComment(thread.comments, commentId);
    if (!comment) return;

    const currentVote = comment.user_vote ?? null;
    let newUpvotes = comment.upvotes;
    let newDownvotes = comment.downvotes;
    let newUserVote: "upvote" | "downvote" | null = null;

    if (currentVote === type) {
      if (type === "upvote") {
        newUpvotes = Math.max(0, newUpvotes - 1);
      } else {
        newDownvotes = Math.max(0, newDownvotes - 1);
      }
      newUserVote = null;
    } else if (currentVote === null) {
      if (type === "upvote") {
        newUpvotes += 1;
      } else {
        newDownvotes += 1;
      }
      newUserVote = type;
    } else {
      if (type === "upvote") {
        newDownvotes = Math.max(0, newDownvotes - 1);
        newUpvotes += 1;
      } else {
        newUpvotes = Math.max(0, newUpvotes - 1);
        newDownvotes += 1;
      }
      newUserVote = type;
    }

    optimisticCommentVotesRef.current.set(commentId, newUserVote);
    saveCommentVotesToStorage(optimisticCommentVotesRef.current);

    const updateCommentInThread = (
      comments: CommentType[]
    ): CommentType[] => {
      return comments.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            user_vote: newUserVote,
          };
        }
        if (c.replies) {
          return { ...c, replies: updateCommentInThread(c.replies) };
        }
        return c;
      });
    };

    setThread((prev) =>
      prev
        ? {
            ...prev,
            comments: updateCommentInThread(prev.comments),
          }
        : null
    );

    try {
      await communityService.voteComment(threadId, commentId, type);
      const updatedThread = await communityService.getThreadDetail(threadId);

      const mergeCommentVotes = (comments: CommentType[]): CommentType[] => {
        return comments.map((c) => {
          const optimisticVote = optimisticCommentVotesRef.current.get(c.id);

          if (c.id === commentId) {
            return {
              ...c,
              upvotes: c.upvotes,
              downvotes: c.downvotes,
              user_vote:
                c.user_vote !== undefined ? c.user_vote : optimisticVote ?? null,
            };
          }

          const updatedComment = {
            ...c,
            user_vote:
              c.user_vote !== undefined ? c.user_vote : optimisticVote ?? null,
          };

          if (c.replies && c.replies.length > 0) {
            return {
              ...updatedComment,
              replies: mergeCommentVotes(c.replies),
            };
          }

          return updatedComment;
        });
      };

      setThread((prev) =>
        prev
          ? {
              ...updatedThread,
              comments: mergeCommentVotes(updatedThread.comments),
              user_vote:
                updatedThread.user_vote !== undefined
                  ? updatedThread.user_vote
                  : optimisticThreadVoteRef.current ?? prev?.user_vote ?? null,
              user_bookmarked:
                updatedThread.user_bookmarked !== undefined
                  ? updatedThread.user_bookmarked
                  : optimisticThreadBookmarkRef.current ?? prev?.user_bookmarked ?? false,
            }
          : updatedThread
      );
    } catch (error) {
      optimisticCommentVotesRef.current.delete(commentId);
      await loadThread();
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
    if (!thread) return;

    const isBookmarked = thread.user_bookmarked ?? false;
    let newBookmarksCount = thread.bookmarks_count;
    let newUserBookmarked = !isBookmarked;

    if (isBookmarked) {
      newBookmarksCount = Math.max(0, newBookmarksCount - 1);
      newUserBookmarked = false;
    } else {
      newBookmarksCount += 1;
      newUserBookmarked = true;
    }

    optimisticThreadBookmarkRef.current = newUserBookmarked;
    saveThreadBookmarkToStorage(newUserBookmarked);

    setThread((prev) =>
      prev
        ? {
            ...prev,
            bookmarks_count: newBookmarksCount,
            user_bookmarked: newUserBookmarked,
          }
        : null
      );

    try {
      await communityService.bookmarkThread(threadId);
      const updatedThread = await communityService.getThreadDetail(threadId);

      setThread((prev) => {
        const mergeCommentVotes = (
          comments: CommentType[]
        ): CommentType[] => {
          return comments.map((c) => {
            const optimisticVote = optimisticCommentVotesRef.current.get(c.id);

            const updatedComment = {
              ...c,
              user_vote:
                c.user_vote !== undefined
                  ? c.user_vote
                  : optimisticVote ?? null,
            };

            if (c.replies && c.replies.length > 0) {
              return {
                ...updatedComment,
                replies: mergeCommentVotes(c.replies),
              };
            }

            return updatedComment;
          });
        };

        return prev
          ? {
              ...updatedThread,
              user_bookmarked:
                updatedThread.user_bookmarked !== undefined
                  ? updatedThread.user_bookmarked
                  : optimisticThreadBookmarkRef.current ?? false,
              bookmarks_count: updatedThread.bookmarks_count,
              user_vote:
                updatedThread.user_vote !== undefined
                  ? updatedThread.user_vote
                  : optimisticThreadVoteRef.current ?? prev.user_vote ?? null,
              comments: mergeCommentVotes(updatedThread.comments),
            }
          : updatedThread;
      });

      showToast(
        newUserBookmarked ? "Thread bookmarked!" : "Bookmark removed!",
        "success"
      );
    } catch (error) {
      optimisticThreadBookmarkRef.current = thread.user_bookmarked ?? false;
      setThread((prev) =>
        prev
          ? {
              ...prev,
              bookmarks_count: thread.bookmarks_count,
              user_bookmarked: thread.user_bookmarked ?? false,
            }
          : null
      );
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
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid #e5e7eb",
            mb: 3,
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
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
              <Box
                dangerouslySetInnerHTML={{ __html: thread.body }}
                sx={{
                  mb: 3,
                  color: "#374151",
                  lineHeight: 1.7,
                  fontSize: "1rem",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  overflow: "hidden",
                  width: "100%",
                  maxWidth: "100%",
                  "& p": {
                    margin: 0,
                    marginBottom: "1rem",
                    "&:last-child": {
                      marginBottom: 0,
                    },
                  },
                  "& b, & strong": {
                    fontWeight: 600,
                  },
                  "& i, & em": {
                    fontStyle: "italic",
                  },
                  "& img": {
                    maxWidth: "100%",
                    width: "100%",
                    height: "auto",
                    display: "block",
                    margin: "1rem 0",
                    borderRadius: "4px",
                    objectFit: "contain",
                  },
                  "& a": {
                    color: "#2563eb",
                    textDecoration: "none",
                    wordBreak: "break-all",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  },
                  "& code": {
                    backgroundColor: "#f3f4f6",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.875em",
                    fontFamily: "monospace",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  },
                  "& pre": {
                    backgroundColor: "#f3f4f6",
                    padding: "0.75rem",
                    borderRadius: "4px",
                    overflow: "auto",
                    margin: "1rem 0",
                    maxWidth: "100%",
                    "& code": {
                      backgroundColor: "transparent",
                      padding: 0,
                    },
                  },
                }}
              />

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
                  startIcon={
                    <IconWrapper
                      icon={
                        thread.user_bookmarked
                          ? "mdi:bookmark"
                          : "mdi:bookmark-outline"
                      }
                    />
                  }
                  onClick={handleBookmark}
                  sx={{
                    textTransform: "none",
                    color: thread.user_bookmarked ? "#f59e0b" : "inherit",
                    "&:hover": {
                      backgroundColor: thread.user_bookmarked
                        ? "#fef3c7"
                        : "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  {thread.user_bookmarked ? "Bookmarked" : "Bookmark"} (
                  {thread.bookmarks_count})
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Comments Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid #e5e7eb",
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
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
