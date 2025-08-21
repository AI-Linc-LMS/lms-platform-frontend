import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, AlertCircle } from "lucide-react";
import { Thread, Comment, CreateComment, VoteType } from "../types";
import ThreadHeader from "../components/ThreadHeader";
import CommentForm from "../components/CommentForm";
import CommentCard from "../components/CommentCard";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "../../../contexts/ToastContext";
import {
  addVoteOnThread,
  getThreadData,
} from "../../../services/community/threadApis";
import {
  addVoteOnComment,
  createComment,
  deleteComment,
  getAllComments,
  updateComment,
} from "../../../services/community/commentApis";

const ThreadDetailPage: React.FC = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { threadId } = useParams<{ threadId: string }>();
  const threadIdNum = Number(threadId);
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const {
    data: threadData,
    isLoading,
    error,
  } = useQuery<Thread>({
    queryKey: ["thread", threadIdNum],
    queryFn: () => getThreadData(clientId, threadIdNum),
  });

  const {
    data: commentsData,
    isLoading: isLoadingComments,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery<Comment[]>({
    queryKey: ["comments", threadIdNum],
    queryFn: () => getAllComments(clientId, threadIdNum),
  });

  useEffect(() => {
    if (threadData) {
      setThread(threadData);
    }
  }, [threadData]);

  useEffect(() => {
    if (commentsData) {
      setComments(commentsData);
    }
  }, [commentsData]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: "comment";
    id: number;
  } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [visibleReplies, setVisibleReplies] = useState<Set<number>>(new Set());

  const getParticipants = (): string[] => {
    const participants = new Set<string>();

    // Add thread author
    if (thread?.author?.user_name) {
      participants.add(thread.author.user_name);
    }

    // Add comment authors recursively
    const addCommentAuthors = (comments: Comment[]) => {
      comments.forEach((comment) => {
        if (comment.author.user_name) {
          participants.add(comment.author.user_name);
        }
        // Recursively add reply authors
        if (comment.replies && comment.replies.length > 0) {
          addCommentAuthors(comment.replies);
        }
      });
    };

    addCommentAuthors(comments);
    return Array.from(participants).slice(0, 8);
  };

  // Get only top-level comments (those without a parent)
  const getTopLevelComments = (): Comment[] => {
    // If comments are already structured with nested replies, return all root comments
    // Otherwise, filter out comments that have a parent
    return comments.filter(
      (comment) => comment.parent === null || comment.parent === undefined
    );
  };

  const toggleRepliesVisibility = (commentId: number) => {
    const newVisibleReplies = new Set(visibleReplies);
    if (newVisibleReplies.has(commentId)) {
      newVisibleReplies.delete(commentId);
    } else {
      newVisibleReplies.add(commentId);
    }
    setVisibleReplies(newVisibleReplies);
  };

  const upVoteToThreadMutation = useMutation({
    mutationFn: () => addVoteOnThread(clientId, threadIdNum, VoteType.Upvote),
    onError: (error) => {
      console.error("Failed to upvote thread:", error);
      showError(
        "Failed to upvote",
        "There was an error processing your vote. Please try again."
      );
    },
  });

  const downVoteFromThreadMutation = useMutation({
    mutationFn: () => addVoteOnThread(clientId, threadIdNum, VoteType.Downvote),
    onError: (error) => {
      console.error("Failed to downvote thread:", error);
      showError(
        "Failed to downvote",
        "There was an error processing your vote. Please try again."
      );
    },
  });

  const handleVoteThread = (type: VoteType) => {
    if (
      upVoteToThreadMutation.isPending ||
      downVoteFromThreadMutation.isPending
    ) {
      return; // Prevent multiple votes while one is in progress
    }

    if (type === VoteType.Upvote) {
      upVoteToThreadMutation.mutate();
    } else {
      downVoteFromThreadMutation.mutate();
    }
  };

  const addVoteOnCommentMutation = useMutation({
    mutationFn: (variables: { commentId: number; type: VoteType }) =>
      addVoteOnComment(
        clientId,
        threadIdNum ?? 0,
        variables.commentId,
        variables.type
      ),
    onSuccess: () => {
      // Refetch comments to get updated vote counts
      refetchComments();
    },
    onError: (error) => {
      console.error("Failed to vote on comment:", error);
      showError(
        "Failed to vote",
        "There was an error processing your vote on the comment."
      );
    },
  });

  const handleVoteComment = (commentId: number, type: VoteType) => {
    if (addVoteOnCommentMutation.isPending) {
      return; // Prevent multiple votes while one is in progress
    }

    addVoteOnCommentMutation.mutate({
      commentId,
      type,
    });
  };

  const addCommentMutation = useMutation({
    mutationFn: (commentData: CreateComment) =>
      createComment(clientId, threadIdNum ?? 0, commentData),
    onSuccess: () => {
      // Refetch comments to get the updated list including new comment
      refetchComments();
      success("Comment added", "Your comment has been posted successfully.");
    },
    onError: (error) => {
      console.error("Failed to add comment:", error);
      showError(
        "Failed to add comment",
        "There was an error posting your comment. Please try again."
      );
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: (variables: {
      commentId: number;
      commentData: Partial<CreateComment>;
    }) =>
      updateComment(
        clientId,
        threadIdNum ?? 0,
        variables.commentId,
        variables.commentData
      ),
    onSuccess: () => {
      // Refetch comments to get the updated comment
      refetchComments();
      success("Comment updated", "Your comment has been updated successfully.");
    },
    onError: (error) => {
      console.error("Failed to update comment:", error);
      showError(
        "Failed to update comment",
        "There was an error updating your comment. Please try again."
      );
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      deleteComment(clientId, threadIdNum ?? 0, commentId),
    onSuccess: () => {
      // Refetch comments to get the updated list without deleted comment
      refetchComments();
      success("Comment deleted", "The comment has been deleted successfully.");
    },
    onError: (error) => {
      console.error("Failed to delete comment:", error);
      showError(
        "Failed to delete comment",
        "There was an error deleting the comment. Please try again."
      );
    },
  });

  const handleAddComment = async (content: string) => {
    if (!content.trim()) {
      showError(
        "Empty comment",
        "Please write something before posting your comment."
      );
      return;
    }

    const commentData: CreateComment = {
      body: content,
      parent: null, // Top-level comment
    };

    try {
      await addCommentMutation.mutateAsync(commentData);
    } catch (error) {
      console.error("Failed to add comment:", error);
      // Error toast is already handled in mutation onError
    }
  };

  const handleAddReply = async (parentCommentId: number, content: string) => {
    if (!content.trim()) {
      showError(
        "Empty reply",
        "Please write something before posting your reply."
      );
      return;
    }

    try {
      const replyData: CreateComment = {
        body: content,
        parent: parentCommentId, // Reply to specific comment
      };
      await addCommentMutation.mutateAsync(replyData);
    } catch (error) {
      console.error("Failed to add reply:", error);
      // Error toast is already handled in mutation onError
    }
  };

  const handleEditComment = (commentId: number, content: string) => {
    updateCommentMutation.mutate({
      commentId: commentId,
      commentData: { body: content },
    });
    // setThread((prev) => ({
    //   ...prev,
    //   comments: prev.comments.map((comment) =>
    //     comment.id === commentId ? { ...comment, content } : comment
    //   ),
    // }));
  };

  const handleDeleteComment = (commentId: number) => {
    // setThread((prev) => ({
    //   ...prev,
    //   comments: prev.comments.filter((comment) => comment.id !== commentId),
    // }));
    deleteCommentMutation.mutate(commentId);
    setShowDeleteConfirm(null);
  };

  const handleBackToCommunity = () => {
    navigate("/community");
  };

  const canEdit = (author: string) => author === "Current User";

  // Validate thread ID
  if (!threadId || isNaN(threadIdNum) || threadIdNum <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Invalid Thread</h2>
          <p className="text-gray-500 mb-6">
            The thread ID is invalid. Please check the URL and try again.
          </p>
          <button
            onClick={() => navigate("/community")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  // Loading state - show loading if either thread or comments are loading initially
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading thread...</p>
        </div>
      </div>
    );
  }

  // Thread error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Thread not found</h2>
          <p className="text-gray-500 mb-6">
            The thread you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBackToCommunity}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  // Thread not found
  if (!thread) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">
            Thread not available
          </h2>
          <p className="text-gray-500 mb-6">
            Unable to load the thread data. Please try again later.
          </p>
          <button
            onClick={handleBackToCommunity}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  const participants = getParticipants();
  const topLevelComments = getTopLevelComments();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete {showDeleteConfirm.type}
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Are you sure you want to delete this {showDeleteConfirm.type}?
                This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === "comment") {
                      handleDeleteComment(showDeleteConfirm.id);
                    }
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={handleBackToCommunity}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-800 font-medium text-sm sm:text-base"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Back to</span>
              <span>Community</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Thread Header */}
        <ThreadHeader
          thread={thread}
          comments={comments}
          onVote={(type: VoteType) =>
            handleVoteThread(
              type === VoteType.Upvote ? VoteType.Upvote : VoteType.Downvote
            )
          }
          onToggleBookmark={() => setIsBookmarked(!isBookmarked)}
          participants={participants}
        />

        {/* Comments Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              <span className="hidden sm:inline">
                {comments?.length ?? 0} Comments
              </span>
            </h2>
          </div>

          {/* Add Comment Form */}
          <CommentForm onSubmit={handleAddComment} />

          {/* Comments Loading State */}
          {isLoadingComments && (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Loading comments...</p>
              </div>
            </div>
          )}

          {/* Comments Error State */}
          {commentsError && !isLoadingComments && (
            <div className="bg-white border border-red-200 rounded-lg p-6">
              <div className="text-center">
                <AlertCircle size={24} className="text-red-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Failed to load comments
                </h3>
                <p className="text-gray-600 mb-4">
                  There was an error loading the comments. Please try again.
                </p>
                <button
                  onClick={() => refetchComments()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          {!isLoadingComments && !commentsError && (
            <>
              {topLevelComments && topLevelComments.length > 0 ? (
                topLevelComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onVote={(commentId: number, type: VoteType) =>
                      handleVoteComment(commentId, type)
                    }
                    onEdit={(commentId: number, content: string) =>
                      handleEditComment(commentId, content)
                    }
                    onDelete={(commentId: number) =>
                      setShowDeleteConfirm({ type: "comment", id: commentId })
                    }
                    onAddReply={handleAddReply}
                    canEdit={canEdit}
                    nestingLevel={0}
                    onToggleReplies={toggleRepliesVisibility}
                    visibleReplies={visibleReplies}
                  />
                ))
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No comments yet
                    </h3>
                    <p className="text-gray-600">
                      Be the first to share your thoughts on this thread.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;
