import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, AlertCircle } from "lucide-react";
import { Thread, Comment, CreateComment, Tag } from "../types";
import ThreadHeader from "../components/ThreadHeader";
import CommentForm from "../components/CommentForm";
import CommentCard from "../components/CommentCard";
import RichTextEditor from "../components/RichTextEditor";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "../../../contexts/ToastContext";
import {
  getThreadData,
  updateThread,
  deleteThread,
  getAllTags,
} from "../../../services/community/threadApis";
import {
  addBookmark,
  createComment,
  deleteComment,
  getAllComments,
  removeBookmark,
  updateComment,
} from "../../../services/community/commentApis";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";

const ThreadDetailPage: React.FC = () => {
  // Pagination for top-level comments
  const [commentsPage, setCommentsPage] = useState(1);
  const commentsPerPage = 1;
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { threadId } = useParams<{ threadId: string }>();
  const threadIdNum = Number(threadId);
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const user = useSelector((state: RootState) => state.user);

  const {
    data: threadData,
    isLoading,
    error,
    refetch: refetchThread,
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

  const { data: tagsData } = useQuery<Tag[]>({
    queryKey: ["tags", clientId],
    queryFn: () => getAllTags(clientId),
    retry: 2,
    retryDelay: 1000,
  });

  const allTags: Tag[] = useMemo(
    () =>
      tagsData || [
        // Fallback with some default tags if API doesn't return structured data
        { id: 1, name: "python" },
        { id: 2, name: "excel" },
        { id: 3, name: "react" },
        { id: 4, name: "typescript" },
        { id: 5, name: "api" },
      ],
    [tagsData]
  );

  useEffect(() => {
    if (threadData) {
      setThread(threadData);
      // Initialize edit form data with current thread data
      // Convert tag names to IDs for editing
      const tagIds = threadData.tags
        .map((tagName) => {
          const tag = allTags.find((t) => t.name === tagName);
          return tag ? tag.id : 0; // Default to 0 if tag not found
        })
        .filter((id) => id !== 0); // Remove invalid tags

      setEditedThreadData({
        title: threadData.title,
        body: threadData.body,
        tags: tagIds,
      });
    }
  }, [threadData, allTags]);

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
  const [editingThread, setEditingThread] = useState(false);
  const [editedThreadData, setEditedThreadData] = useState({
    title: "",
    body: "",
    tags: [] as number[],
  });

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

  const updateThreadMutation = useMutation({
    mutationFn: (variables: {
      threadId: string;
      threadData: Partial<{ title: string; body: string; tags: number[] }>;
    }) => updateThread(clientId, variables.threadId, variables.threadData),
    onSuccess: () => {
      refetchThread();
    },
    onError: (error) => {
      console.error("Failed to update thread:", error);
      showError(
        "Failed to update thread",
        "There was an error updating the thread. Please try again."
      );
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (threadId: string) => deleteThread(clientId, threadId),
    onSuccess: () => {
      success("Thread deleted", "The thread has been deleted successfully.");
      navigate("/community");
    },
    onError: (error) => {
      console.error("Failed to delete thread:", error);
      showError(
        "Failed to delete thread",
        "There was an error deleting the thread. Please try again."
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

  const addBookmarkMutation = useMutation({
    mutationFn: (threadId: number) => addBookmark(clientId, threadId),
    onError: (error) => {
      console.error("Failed to add bookmark:", error);
      showError(
        "Failed to bookmark",
        "There was an error bookmarking this thread."
      );
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (threadId: number) => removeBookmark(clientId, threadId),
    onError: (error) => {
      console.error("Failed to remove bookmark:", error);
      showError(
        "Failed to remove bookmark",
        "There was an error removing the bookmark."
      );
    },
  });

  const toggleBookmark = (): void => {
    if (isBookmarked) {
      removeBookmarkMutation.mutate(threadIdNum);
    } else {
      addBookmarkMutation.mutate(threadIdNum);
    }
    setIsBookmarked((prev) => !prev);
    refetchThread();
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

  const handleEditThread = (thread: Thread) => {
    // Set the editing state and populate the form with current thread data
    setEditingThread(true);
    // Convert tag names to IDs for editing
    const tagIds = thread.tags
      .map((tagName) => {
        const tag = allTags.find((t) => t.name === tagName);
        return tag ? tag.id : 0; // Default to 0 if tag not found
      })
      .filter((id) => id !== 0); // Remove invalid tags

    setEditedThreadData({
      title: thread.title,
      body: thread.body,
      tags: tagIds,
    });
  };

  const handleSaveThreadEdit = async () => {
    if (!editedThreadData.title.trim() || !editedThreadData.body.trim()) {
      showError(
        "Invalid thread data",
        "Please provide both title and body for the thread."
      );
      return;
    }

    try {
      await updateThreadMutation.mutateAsync({
        threadId: threadIdNum.toString(),
        threadData: {
          title: editedThreadData.title,
          body: editedThreadData.body,
          tags: editedThreadData.tags,
        },
      });
      setEditingThread(false);
    } catch (error) {
      console.error("Failed to update thread:", error);
      // Error toast is already handled in mutation onError
    }
  };

  const handleCancelThreadEdit = () => {
    setEditingThread(false);
    // Reset form data to original thread data
    if (thread) {
      // Convert tag names to IDs for editing
      const tagIds = thread.tags
        .map((tagName) => {
          const tag = allTags.find((t) => t.name === tagName);
          return tag ? tag.id : 0; // Default to 0 if tag not found
        })
        .filter((id) => id !== 0); // Remove invalid tags

      setEditedThreadData({
        title: thread.title,
        body: thread.body,
        tags: tagIds,
      });
    }
  };

  const handleDeleteThread = (threadId: number) => {
    deleteThreadMutation.mutate(threadId.toString());
  };

  const handleBackToCommunity = () => {
    navigate("/community");
  };

  const canEdit = (author: string): boolean => {
    return user.username === author || user.full_name === author;
  };

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

  // Pagination logic for top-level comments
  const totalCommentPages = Math.ceil(
    (topLevelComments?.length ?? 0) / commentsPerPage
  );
  const startIdx = (commentsPage - 1) * commentsPerPage;
  const endIdx = startIdx + commentsPerPage;
  const paginatedComments = topLevelComments.slice(startIdx, endIdx);

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
          isBookmarked={isBookmarked}
          onToggleBookmark={toggleBookmark}
          participants={participants}
          refetch={refetchThread}
          onEditThread={handleEditThread}
          onDeleteThread={handleDeleteThread}
          canEdit={canEdit}
          allTags={allTags}
        />

        {/* Thread Edit Form */}
        {editingThread && canEdit(thread.author.user_name) && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Thread
            </h2>

            {/* Title Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={editedThreadData.title}
                onChange={(e) =>
                  setEditedThreadData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter thread title..."
              />
            </div>

            {/* Body Editor */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <RichTextEditor
                value={editedThreadData.body}
                onChange={(content) =>
                  setEditedThreadData((prev) => ({ ...prev, body: content }))
                }
                placeholder="Write your thread content..."
                height="h-48"
              />
            </div>

            {/* Tags Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={editedThreadData.tags
                  .map((tagId) => {
                    const tag = allTags.find((t) => t.id === tagId);
                    return tag ? tag.name : "";
                  })
                  .filter((name) => name !== "")
                  .join(", ")}
                onChange={(e) => {
                  const tagNames = e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0);

                  const tagIds = tagNames
                    .map((tagName) => {
                      const tag = allTags.find(
                        (t) => t.name.toLowerCase() === tagName.toLowerCase()
                      );
                      return tag ? tag.id : 0; // Default to 0 if tag not found
                    })
                    .filter((id) => id !== 0); // Remove invalid tags

                  setEditedThreadData((prev) => ({
                    ...prev,
                    tags: tagIds,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tags separated by commas..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleSaveThreadEdit}
                disabled={updateThreadMutation.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateThreadMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancelThreadEdit}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
              {paginatedComments && paginatedComments.length > 0 ? (
                <>
                  {topLevelComments.slice(0, endIdx).map((comment) => (
                    <CommentCard
                      key={comment.id}
                      threadId={thread.id}
                      refetch={refetchComments}
                      comment={comment}
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
                  ))}
                  {totalCommentPages > commentsPage && (
                    <div className="flex justify-center mt-2">
                      <span
                        onClick={() => setCommentsPage(commentsPage + 1)}
                        className="text-blue-600 hover:underline cursor-pointer text-sm font-medium"
                        role="button"
                        tabIndex={0}
                      >
                        See more comments
                      </span>
                    </div>
                  )}
                </>
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
