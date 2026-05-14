"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  TextField,
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
  PostType,
  POST_TYPE_CONFIG,
  UserXP,
} from "@/lib/services/community.service";
import { MilestoneWidget } from "@/components/community/MilestoneWidget";
import { useToast } from "@/components/common/Toast";
import { formatDistanceToNow } from "@/lib/utils/date-utils";
import { softBreakMarkdown } from "@/lib/utils/html-utils";
import { config } from "@/lib/config";

const THREAD_EXTRAS_KEY = `community_thread_extras_${config.clientId}`;

interface ThreadExtras {
  post_type?: PostType;
  image_urls?: string[];
  poll_options?: string[];
  resource_url?: string;
  tried_steps?: string;
  humor_tone?: string;
  punchline?: string;
  stance?: string;
  tldr?: string;
}

function loadThreadExtras(threadId: number): ThreadExtras {
  try {
    const raw = localStorage.getItem(THREAD_EXTRAS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return (parsed[String(threadId)] as ThreadExtras) ?? {};
    }
  } catch {}
  return {};
}

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const threadId = Number(params.threadId);

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [extras, setExtras] = useState<ThreadExtras>({});
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
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
      setExtras(loadThreadExtras(threadId));
      loadThread();
      communityService.getUserXP().then(setUserXP).catch(() => {});
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

      // Always trust backend data first - use backend values if provided
      // Only use optimistic state as fallback if backend doesn't provide the data
      const userVote =
        data.user_vote !== undefined
          ? data.user_vote
          : optimisticThreadVoteRef.current ?? null;
      const userBookmarked =
        data.user_bookmarked !== undefined
          ? data.user_bookmarked
          : optimisticThreadBookmarkRef.current ?? false;

      // Update optimistic state to match backend if backend provided it
      if (data.user_vote !== undefined) {
        optimisticThreadVoteRef.current = data.user_vote;
      }
      if (data.user_bookmarked !== undefined) {
        optimisticThreadBookmarkRef.current = data.user_bookmarked;
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
      showToast(t("community.failedToLoadThread"), "error");
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
      refreshXP();
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
              // Always trust backend data first - use backend user_vote if provided
              // Only use optimistic state as fallback if backend doesn't provide it
              user_vote:
                updatedThread.user_vote !== undefined
                  ? updatedThread.user_vote
                  : optimisticThreadVoteRef.current ?? null,
              upvotes: updatedThread.upvotes,
              downvotes: updatedThread.downvotes,
              comments: mergeCommentVotes(updatedThread.comments),
              // Always trust backend data first - use backend user_bookmarked if provided
              // Only use optimistic state as fallback if backend doesn't provide it
              user_bookmarked:
                updatedThread.user_bookmarked !== undefined
                  ? updatedThread.user_bookmarked
                  : optimisticThreadBookmarkRef.current ?? prev.user_bookmarked ?? false,
            }
          : updatedThread;
      });

      // Update optimistic state to match backend response
      if (updatedThread.user_vote !== undefined) {
        optimisticThreadVoteRef.current = updatedThread.user_vote;
      }
      if (updatedThread.user_bookmarked !== undefined) {
        optimisticThreadBookmarkRef.current = updatedThread.user_bookmarked;
      }

      // Also update the shared community list storage to keep them in sync
      // This ensures when user navigates back to list page, it shows correct state
      if (typeof window !== "undefined") {
        try {
          const VOTES_STORAGE_KEY = "community_thread_votes";
          const BOOKMARKS_STORAGE_KEY = "community_thread_bookmarks";
          
          const storedVotes = sessionStorage.getItem(VOTES_STORAGE_KEY);
          const votesMap = storedVotes ? JSON.parse(storedVotes) : {};
          
          const storedBookmarks = sessionStorage.getItem(BOOKMARKS_STORAGE_KEY);
          const bookmarksMap = storedBookmarks ? JSON.parse(storedBookmarks) : {};
          
          // Update with backend data
          if (updatedThread.user_vote !== undefined) {
            votesMap[threadId] = updatedThread.user_vote;
          }
          if (updatedThread.user_bookmarked !== undefined) {
            bookmarksMap[threadId] = updatedThread.user_bookmarked;
          }
          
          sessionStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votesMap));
          sessionStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarksMap));
        } catch (error) {
          // Silently handle storage errors
        }
      }

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
      showToast(t("community.failedToVote"), "error");
    }
  };

  const handleVoteComment = useCallback(async (
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
      refreshXP();
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
      showToast(t("community.failedToVote"), "error");
    }
  }, [thread, threadId, showToast, t]);

  const refreshXP = () => communityService.getUserXP().then(setUserXP).catch(() => {});

  const handleAddComment = async () => {
    if (!commentBody.trim()) return;

    setSubmitting(true);
    try {
      await communityService.createComment(threadId, { body: commentBody.trim() });
      setCommentBody("");
      await loadThread();
      refreshXP();
      showToast(t("community.commentAdded"), "success");
    } catch (error) {
      showToast(t("community.failedToAddComment"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = useCallback(async (parentId: number, body: string) => {
    try {
      await communityService.createComment(threadId, { body, parent_id: parentId });
      await loadThread();
      refreshXP();
      showToast(t("community.replyAdded"), "success");
    } catch (error) {
      showToast(t("community.failedToAddReply"), "error");
      throw error;
    }
  }, [threadId, showToast, t]);

  const handleAcceptComment = useCallback(async (commentId: number) => {
    try {
      const updated = await communityService.acceptComment(threadId, commentId);
      setThread((prev) => {
        if (!prev) return prev;
        const updateComment = (comments: CommentType[]): CommentType[] =>
          comments.map((c) => {
            if (c.id === commentId) return { ...c, is_accepted: updated.is_accepted, accepted_at: updated.accepted_at };
            if (c.id !== commentId && updated.is_accepted) return { ...c, is_accepted: false, accepted_at: null };
            return { ...c, replies: c.replies ? updateComment(c.replies) : c.replies };
          });
        return { ...prev, comments: updateComment(prev.comments) };
      });
      communityService.getUserXP().then(setUserXP).catch(() => {});
    } catch {
      showToast(t("community.failedToAcceptAnswer"), "error");
    }
  }, [threadId, showToast, t]);

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
      refreshXP();
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
              // Always trust backend data first - use backend user_bookmarked if provided
              // Only use optimistic state as fallback if backend doesn't provide it
              user_bookmarked:
                updatedThread.user_bookmarked !== undefined
                  ? updatedThread.user_bookmarked
                  : optimisticThreadBookmarkRef.current ?? prev.user_bookmarked ?? false,
              bookmarks_count: updatedThread.bookmarks_count,
              // Always trust backend data first - use backend user_vote if provided
              // Only use optimistic state as fallback if backend doesn't provide it
              user_vote:
                updatedThread.user_vote !== undefined
                  ? updatedThread.user_vote
                  : optimisticThreadVoteRef.current ?? prev.user_vote ?? null,
              comments: mergeCommentVotes(updatedThread.comments),
            }
          : updatedThread;
      });

      // Update optimistic state to match backend response
      if (updatedThread.user_bookmarked !== undefined) {
        optimisticThreadBookmarkRef.current = updatedThread.user_bookmarked;
      }
      if (updatedThread.user_vote !== undefined) {
        optimisticThreadVoteRef.current = updatedThread.user_vote;
      }

      // Also update the shared community list storage to keep them in sync
      if (typeof window !== "undefined") {
        try {
          const VOTES_STORAGE_KEY = "community_thread_votes";
          const BOOKMARKS_STORAGE_KEY = "community_thread_bookmarks";
          
          const storedVotes = sessionStorage.getItem(VOTES_STORAGE_KEY);
          const votesMap = storedVotes ? JSON.parse(storedVotes) : {};
          
          const storedBookmarks = sessionStorage.getItem(BOOKMARKS_STORAGE_KEY);
          const bookmarksMap = storedBookmarks ? JSON.parse(storedBookmarks) : {};
          
          // Update with backend data
          if (updatedThread.user_vote !== undefined) {
            votesMap[threadId] = updatedThread.user_vote;
          }
          if (updatedThread.user_bookmarked !== undefined) {
            bookmarksMap[threadId] = updatedThread.user_bookmarked;
          }
          
          sessionStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votesMap));
          sessionStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarksMap));
        } catch (error) {
          // Silently handle storage errors
        }
      }

      // Save optimistic state to storage after successful API call
      saveThreadBookmarkToStorage(optimisticThreadBookmarkRef.current ?? false);
      saveThreadVoteToStorage(optimisticThreadVoteRef.current ?? null);
      
      showToast(
        newUserBookmarked ? t("community.threadBookmarked") : t("community.bookmarkRemoved"),
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
      showToast(t("community.failedToBookmark"), "error");
    }
  };

  if (loading) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ py: 2, maxWidth: 1800, mx: "auto", width: "100%" }}>
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (!thread) {
    return (
      <MainLayout fullWidthContent>
        <Box sx={{ py: 2, maxWidth: 1800, mx: "auto", width: "100%" }}>
          <Paper elevation={0} sx={{ p: 8, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              {t("community.threadNotFound")}
            </Typography>
            <Button onClick={() => router.push("/community")} sx={{ mt: 2 }}>
              {t("community.backToCommunity")}
            </Button>
          </Paper>
        </Box>
      </MainLayout>
    );
  }

  const canAcceptAnswers = !!thread && (
    !!thread.current_user_is_author ||
    ['admin', 'superadmin', 'instructor'].includes(thread.current_user_role ?? '')
  );

  const sortedComments = thread
    ? [...thread.comments].sort((a, b) => {
        if (a.is_accepted && !b.is_accepted) return -1;
        if (!a.is_accepted && b.is_accepted) return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
    : [];

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ py: 2, maxWidth: 1800, mx: "auto", width: "100%" }}>
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
            {t("community.title")}
          </Link>
          <Typography color="text.primary">{thread.title}</Typography>
        </Breadcrumbs>

        {/* Two-column layout: main content + sidebar */}
        <Box sx={{ display: "flex", gap: { md: 3, lg: 3.5 }, alignItems: "flex-start" }}>
        {/* Main content column */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

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
              {/* Post type badge */}
              {(() => {
                const pt = (thread.post_type || extras.post_type || "question") as PostType;
                const cfg = POST_TYPE_CONFIG[pt];
                return (
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      icon={<IconWrapper icon={cfg.icon} size={12} color={cfg.color} />}
                      label={cfg.label}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        backgroundColor: `${cfg.color}12`,
                        color: cfg.color,
                        border: `1px solid ${cfg.color}28`,
                        "& .MuiChip-icon": { ml: 0.5 },
                      }}
                    />
                  </Box>
                );
              })()}

              {/* Title */}
              <Typography variant="h4" fontWeight={700} gutterBottom>
                {thread.title}
              </Typography>

              {/* Tags */}
              {thread.tags.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                  {thread.tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      sx={{
                        backgroundColor:
                          "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
                        color: "var(--accent-indigo)",
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Resource URL */}
              {extras.resource_url && (
                <Box
                  sx={{
                    mb: 2, p: 1.5, borderRadius: "8px",
                    border: "1px solid #bfdbfe", backgroundColor: "#eff6ff",
                    display: "flex", alignItems: "center", gap: 1,
                  }}
                >
                  <IconWrapper icon="mdi:link-variant" size={16} color="#3b82f6" />
                  <Link
                    href={extras.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ fontSize: "0.875rem", color: "#2563eb", wordBreak: "break-all" }}
                  >
                    {extras.resource_url}
                  </Link>
                </Box>
              )}

              {/* Tried steps (Question extra) */}
              {extras.tried_steps && (
                <Box sx={{ mb: 2.5, pl: 2, borderLeft: "3px solid #a5b4fc" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                    <IconWrapper icon="mdi:wrench-clock-outline" size={13} color="#6366f1" />
                    <Typography variant="caption" fontWeight={700} sx={{ color: "#6366f1", letterSpacing: "0.02em", textTransform: "uppercase", fontSize: "0.68rem" }}>
                      What they already tried
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {extras.tried_steps}
                  </Typography>
                </Box>
              )}

              {/* Body — rendered as markdown */}
              <Box
                sx={{
                  mb: 3,
                  "& p": { mb: 1, lineHeight: 1.8, color: "var(--font-primary)", fontSize: "0.95rem" },
                  "& h1": { fontSize: "1.6rem", fontWeight: 700, mt: 2, mb: 1, color: "var(--font-primary)" },
                  "& h2": { fontSize: "1.35rem", fontWeight: 700, mt: 2, mb: 1, color: "var(--font-primary)" },
                  "& h3": { fontSize: "1.15rem", fontWeight: 600, mt: 1.5, mb: 0.75, color: "var(--font-primary)" },
                  "& strong": { fontWeight: 700 },
                  "& em": { fontStyle: "italic" },
                  "& code": {
                    fontFamily: "monospace", fontSize: "0.875em",
                    backgroundColor: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "4px", px: "5px", py: "1px",
                  },
                  "& pre": {
                    backgroundColor: "#1a1b26", color: "#c0caf5",
                    borderRadius: "10px", p: 2, overflowX: "auto",
                    my: 1.5, fontSize: "0.875rem", lineHeight: 1.6,
                    "& code": { backgroundColor: "transparent", border: "none", color: "inherit", p: 0 },
                  },
                  "& blockquote": {
                    borderLeft: "3px solid var(--accent-indigo)", pl: 2, ml: 0,
                    color: "var(--font-secondary)", fontStyle: "italic", my: 1.5,
                  },
                  "& ul, & ol": { pl: 3, mb: 1 },
                  "& li": { mb: 0.4, fontSize: "0.95rem", color: "var(--font-primary)" },
                  "& a": { color: "var(--accent-indigo)", textDecoration: "underline", wordBreak: "break-all" },
                  "& hr": { border: "none", borderTop: "1px solid var(--border-default)", my: 2 },
                  "& table": { borderCollapse: "collapse", width: "100%", mb: 1.5 },
                  "& th, & td": { border: "1px solid var(--border-default)", px: 1.5, py: 0.75, fontSize: "0.9rem" },
                  "& th": { backgroundColor: "var(--surface)", fontWeight: 700 },
                  "& img": { maxWidth: "100%", borderRadius: "8px", my: 1 },
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {softBreakMarkdown(thread.body)}
                </ReactMarkdown>
              </Box>

              {/* Attached images */}
              {(() => {
                const imageUrls = thread.image_urls?.length ? thread.image_urls : extras.image_urls;
                return imageUrls && imageUrls.length > 0 ? (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
                    {imageUrls.map((url, i) => (
                      <Box
                        key={i}
                        component="img"
                        src={url}
                        alt=""
                        sx={{
                          maxWidth: "100%",
                          width: imageUrls.length === 1 ? "100%" : "calc(50% - 4px)",
                          maxHeight: 360,
                          objectFit: "cover",
                          borderRadius: "10px",
                          border: "1px solid var(--border-default)",
                          cursor: "pointer",
                        }}
                        onClick={() => window.open(url, "_blank")}
                      />
                    ))}
                  </Box>
                ) : null;
              })()}

              {/* Humorous extras */}
              {extras.punchline && (
                <Box sx={{ mb: 2, p: 1.5, borderRadius: "8px", backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#b45309" }}>
                    ⚡ {extras.punchline}
                  </Typography>
                </Box>
              )}

              {/* Discussion TL;DR */}
              {extras.tldr && (
                <Box sx={{ mb: 2, p: 1.5, borderRadius: "8px", backgroundColor: "#f0fdf8", border: "1px solid #6ee7b7" }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#065f46" }}>TL;DR</Typography>
                  <Typography variant="body2" sx={{ color: "#065f46", mt: 0.25 }}>{extras.tldr}</Typography>
                </Box>
              )}

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
                          backgroundColor: "var(--surface)",
                          border: "1px solid var(--border-default)",
                          color: "var(--font-secondary)",
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
                    color: "inherit",
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  {thread.user_bookmarked ? t("community.bookmarked") : t("community.bookmark")} (
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
            {t("community.answer", { count: thread.comments_count })}
          </Typography>

          {/* Add Comment Form */}
          <Box sx={{ mb: 3 }}>
            <TextField
              placeholder={t("community.writeAnswerPlaceholder")}
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
              sx={{
                textTransform: "none",
                backgroundColor: "var(--accent-indigo)",
                color: "var(--font-light)",
                "&:hover": {
                  backgroundColor: "var(--accent-indigo-dark)",
                },
                "&.Mui-disabled": {
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 45%, var(--surface) 55%)",
                  color: "var(--font-secondary)",
                  WebkitTextFillColor: "var(--font-secondary)",
                  opacity: 1,
                },
              }}
            >
              {submitting ? t("community.posting") : t("community.postAnswer")}
            </Button>
          </Box>

          {/* Comments List */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {sortedComments.map((comment) => (
              <Box
                key={comment.id}
                sx={{
                  p: comment.is_accepted ? 0 : 2,
                  border: comment.is_accepted ? "none" : "1px solid var(--border-default)",
                  borderRadius: 2,
                  backgroundColor: comment.is_accepted ? "transparent" : "var(--card-bg)",
                }}
              >
                <CommentItem
                  comment={comment}
                  threadId={threadId}
                  onVote={handleVoteComment}
                  onReply={handleReply}
                  onAccept={handleAcceptComment}
                  isThreadAuthor={canAcceptAnswers}
                />
              </Box>
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
                  color="var(--font-tertiary)"
                  style={{ marginBottom: 8 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {t("community.noAnswersYet")}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        </Box>{/* end main content column */}

        {/* Sidebar — fluid width, sticky */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            width: { md: "26%", lg: "23%", xl: "20%" },
            maxWidth: 320,
            minWidth: 220,
            flexShrink: 0,
            position: "sticky",
            top: 80,
          }}
        >
          {userXP && <MilestoneWidget xp={userXP} />}
        </Box>

        </Box>{/* end two-column layout */}
      </Box>
    </MainLayout>
  );
}
