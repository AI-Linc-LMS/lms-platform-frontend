import React, { useState } from "react";
import { Edit3, Trash2, MessageCircle } from "lucide-react";
import { Comment } from "../types";
import RichContentDisplay from "./RichContentDisplay";
import RichTextEditor from "./RichTextEditor";
import { getUserAvatar } from "../utils/avatarUtils";
import VoteCard from "./Vote";

interface CommentCardProps {
  threadId: number;
  comment: Comment;
  onEdit: (commentId: number, content: string) => void;
  onDelete: (commentId: number) => void;
  onAddReply: (parentId: number, content: string) => void;
  canEdit: (author: string) => boolean;
  nestingLevel?: number;
  onToggleReplies?: (commentId: number) => void;
  visibleReplies?: Set<number>;
  refetch: () => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  threadId,
  comment,
  onEdit,
  onDelete,
  onAddReply,
  canEdit,
  nestingLevel = 0,
  onToggleReplies,
  visibleReplies = new Set(),
  refetch,
}) => {
  const [editingComment, setEditingComment] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.body);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const commentAuthorAvatar = getUserAvatar(
    comment?.author.user_name,
    comment?.author.profile_pic_url
  );

  const handleSaveEdit = () => {
    onEdit(comment?.id, editedContent);
    setEditingComment(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(comment.body);
    setEditingComment(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-5">
      {/* Reply indicator - show if this is a reply */}
      {nestingLevel > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <MessageCircle size={14} />
            <span>Reply to comment</span>
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6">
        <div className="flex flex-row gap-4 sm:gap-6">
          {/* Vote Section */}
          <VoteCard
            threadId={threadId}
            Vote="comment"
            commentId={comment.id}
            upvote={comment.upvotes}
            downvote={comment.downvotes}
            refetch={refetch}
          />

          {/* Content */}
          <div className="flex-1 order-1 sm:order-2">
            {editingComment ? (
              <div className="space-y-3 sm:space-y-4">
                <RichTextEditor
                  value={editedContent}
                  onChange={setEditedContent}
                  placeholder="Edit your comment..."
                  height="h-32 sm:h-48"
                />
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <RichContentDisplay
                  content={comment.body}
                  className="mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed text-gray-700"
                  darkMode={false}
                />

                {/* Author Info and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {commentAuthorAvatar.avatar ? (
                      <img
                        src={commentAuthorAvatar.avatar}
                        alt={comment.author.user_name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 ${commentAuthorAvatar.color} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm`}
                      >
                        {commentAuthorAvatar.initials}
                      </div>
                    )}

                    <div>
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">
                        {comment.author.user_name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {comment.created_at}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {nestingLevel === 0 && (
                      <>
                        <button
                          onClick={() => setShowCommentForm(!showCommentForm)}
                          className="text-gray-600 hover:text-blue-600 font-medium text-xs sm:text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                        >
                          <MessageCircle size={14} />
                          Reply
                        </button>

                        {comment.replies &&
                          comment.replies.length > 0 &&
                          onToggleReplies && (
                            <button
                              onClick={() => onToggleReplies(comment.id)}
                              className="text-gray-600 hover:text-blue-600 font-medium text-xs sm:text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              {visibleReplies.has(comment.id) ? "Hide" : "Show"}{" "}
                              {comment.replies.length}{" "}
                              {comment.replies.length === 1
                                ? "reply"
                                : "replies"}
                            </button>
                          )}
                      </>
                    )}

                    {canEdit(comment.author.user_name) && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingComment(true)}
                          className="p-1.5  text-blue-600 bg-blue-50 hover:text-blue-900 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <Edit3 size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(comment.id)}
                          className="p-1.5 text-red-600 bg-red-50 hover:text-red-900 hover:bg-red-100 rounded-md transition-colors"
                        >
                          <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reply Form - only show for top-level comments */}
                {showCommentForm && nestingLevel === 0 && (
                  <div className="mt-3 sm:mt-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                      <RichTextEditor
                        value={replyContent}
                        onChange={setReplyContent}
                        placeholder="Write your reply..."
                        height="h-24 sm:h-32"
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => setShowCommentForm(false)}
                          className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onAddReply(comment.id, replyContent);
                            setReplyContent("");
                            setShowCommentForm(false);
                          }}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-1.5"
                        >
                          <MessageCircle size={14} />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies - shown when this comment's replies are visible */}
      {comment.replies &&
        comment.replies.length > 0 &&
        visibleReplies.has(comment.id) && (
          <div className="ml-4 sm:ml-8 p-4 space-y-4">
            {comment.replies
              .sort((a, b) => {
                // Sort replies by created_at in descending order (newest first)
                return (
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
                );
              })
              .map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddReply={onAddReply}
                  canEdit={canEdit}
                  nestingLevel={nestingLevel + 1}
                  threadId={threadId}
                  refetch={refetch}
                />
              ))}
          </div>
        )}
    </div>
  );
};

export default CommentCard;
