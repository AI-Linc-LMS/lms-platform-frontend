import React, { useState } from "react";
import { ArrowUp, ArrowDown, MessageCircle } from "lucide-react";
import { CreateComment, Comment, VoteType } from "../types";
import RichContentDisplay from "./RichContentDisplay";
import RichTextEditor from "./RichTextEditor";
import { getUserAvatar } from "../utils/avatarUtils";
import { useMutation } from "@tanstack/react-query";
import { createComment } from "../../../services/community/commentApis";

interface CommentSectionProps {
  threadId: string;
  comments: Comment[];
  showCommentForm: boolean;
  onAddComment: (content: string) => void;
  onCloseCommentForm: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  threadId,
  showCommentForm,
  onAddComment,
  onCloseCommentForm,
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const threadIdNum = Number(threadId);
  const [newComment, setNewComment] = useState("");

  const addReplyToCommentMutation = useMutation({
    mutationFn: (variables: CreateComment) =>
      createComment(clientId, threadIdNum ?? 0, variables),
  });

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment("");
      onCloseCommentForm();
    }

    addReplyToCommentMutation.mutate({
      parent: 2,
      body: newComment,
    });
  };

  const handleVoteComment = (commentId: number, type: VoteType) => {
    // This would typically update the comment's vote count
    console.log(`Voting ${type} on comment ${commentId}`);
  };

  return (
    <>
      {/* Comment Form */}
      {showCommentForm && (
        <div className="mt-3 sm:mt-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-3 sm:p-4">
              <div className="prose prose-sm max-w-none mb-3">
                <p className="text-gray-600 text-sm">
                  Add a comment to this answer. You can use formatting tools to
                  include:
                </p>
                <ul className="text-gray-600 text-sm list-disc pl-5">
                  <li>Code snippets</li>
                  <li>Links and references</li>
                  <li>Basic formatting</li>
                </ul>
              </div>

              <RichTextEditor
                value={newComment}
                onChange={setNewComment}
                placeholder="Add your comment..."
                height="h-32 sm:h-40"
              />

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-3">
                <button
                  onClick={onCloseCommentForm}
                  className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className="bg-blue-600 text-[var(--font-light)] px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={14} />
                  Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
          {comments.map((comment) => {
            const commentAuthorAvatar = getUserAvatar(
              comment.author.user_name,
              comment.author.profile_pic_url
            );
            return (
              <div
                key={comment.id}
                className="bg-white border border-gray-200 rounded-lg p-3"
              >
                <RichContentDisplay
                  content={comment.body}
                  className="text-gray-700 mb-2 text-sm leading-relaxed"
                />
                <div className="flex items-center gap-2">
                  {commentAuthorAvatar.avatar ? (
                    <img
                      src={commentAuthorAvatar.avatar}
                      alt={comment.author.user_name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-6 h-6 ${commentAuthorAvatar.color} rounded-full flex items-center justify-center text-[var(--font-light)] text-xs font-medium`}
                    >
                      {commentAuthorAvatar.initials}
                    </div>
                  )}
                  <span className="font-medium text-gray-900 text-sm">
                    {comment.author.user_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {comment.created_at}
                  </span>

                  {/* Vote buttons for comments */}
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() =>
                        handleVoteComment(comment.id, VoteType.Upvote)
                      }
                      className={`p-1 rounded transition-colors
                        text-orange-600 bg-orange-50`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <span className="text-xs font-medium text-gray-600">
                      {comment.upvotes - comment.downvotes}
                    </span>
                    <button
                      onClick={() =>
                        handleVoteComment(comment.id, VoteType.Downvote)
                      }
                      className={`p-1 rounded transition-colors text-blue-600 bg-blue-50
                          `}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default CommentSection;
