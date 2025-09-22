import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getCommentsByContentId,
  createComment,
} from "../../services/enrolled-courses-content/courseContentApis";

interface CommentsProps {
  contentId: number;
  courseId: number;
  isDarkTheme: boolean;
  clientId?: number; // Make clientId optional with a default value
}

const Comments: React.FC<CommentsProps> = ({
  contentId,
  courseId,
  isDarkTheme,
  clientId,
}) => {
  const [newComment, setNewComment] = useState("");
  const [visibleComments, setVisibleComments] = useState(5);

  // Comments fetching
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["comments", contentId],
    queryFn: () =>
      getCommentsByContentId(Number(clientId), courseId, contentId),
    enabled: !!contentId && !!courseId,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (comment: string) =>
      createComment(Number(clientId), courseId, contentId, comment),
    onSuccess: () => {
      refetchComments();
      setNewComment("");
    },
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      try {
        await createCommentMutation.mutateAsync(newComment.trim());
      } catch {
        //console.error('Error posting comment:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="space-y-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[border-gray-300] focus:border-transparent resize-none ${
            isDarkTheme
              ? "bg-gray-800 text-white border-gray-600"
              : "bg-white text-[var(--font-dark)] border-gray-300"
          }`}
          rows={3}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="px-4 py-2 bg-[var(--default-primary)] text-white rounded-lg hover:bg-[#1e4a61] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoadingComments ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`${
                isDarkTheme ? "bg-gray-800" : "bg-gray-100"
              } rounded-lg p-4`}
            >
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : commentsData?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-140 overflow-y-auto pr-2">
          {[...commentsData]
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .slice(0, visibleComments)
            .map((comment) => (
              <div
                key={comment.id}
                className={`${
                  isDarkTheme ? "bg-[#252526]" : "bg-gray-50"
                } rounded-lg p-4`}
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={
                      comment.user_profile?.profile_pic_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        comment.user_profile?.user_name || "User"
                      )}&background=0D8ABC&color=fff&size=128&rounded=true`
                    }
                    alt={comment.user_profile?.user_name || "User"}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        comment.user_profile?.user_name || "User"
                      )}&background=0D8ABC&color=fff&size=128&rounded=true`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-semibold text-sm ${
                            isDarkTheme
                              ? "text-[var(--font-light)]"
                              : "text-gray-500"
                          } truncate`}
                        >
                          {comment.user_profile?.user_name || "Anonymous User"}
                        </span>
                        {comment.user_profile?.role && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                            {comment.user_profile.role}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          isDarkTheme
                            ? "text-[var(--font-light)]"
                            : "text-gray-500"
                        } whitespace-nowrap`}
                      >
                        {new Date(comment.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-sm ${
                        isDarkTheme
                          ? "text-[var(--font-light)]"
                          : "text-gray-500"
                      } break-words`}
                    >
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <button className="flex items-center text-gray-500 hover:text-blue-500 text-xs">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                          />
                        </svg>
                        {comment.likes || 0}
                      </button>
                      <button className="flex items-center text-gray-500 hover:text-red-500 text-xs">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                          />
                        </svg>
                        {comment.dislikes || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {commentsData && commentsData.length > visibleComments && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setVisibleComments((prev) => prev + 5)}
                className="w-full sm:w-auto px-4 py-2 text-sm text-[var(--default-primary)] hover:text-[#1e4a61] font-medium flex items-center justify-center rounded-lg border border-[var(--default-primary)] hover:bg-gray-50"
              >
                <span>See more comments</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Comments;
