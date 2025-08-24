import React from "react";
import { Calendar, Bookmark, MessageCircle, Edit2, Trash2 } from "lucide-react";
import { Thread, Tag } from "../types";
import RichContentDisplay from "./RichContentDisplay";
import { getUserAvatar } from "../utils/avatarUtils";
import { Comment } from "../types/index";
import VoteCard from "./Vote";

interface ThreadHeaderProps {
  thread: Thread;
  comments: Comment[];
  onToggleBookmark: () => void;
  isBookmarked: boolean;
  participants: string[];
  refetch: () => void;
  onEditThread?: (thread: Thread) => void;
  onDeleteThread?: (threadId: number) => void;
  canEdit?: (author: string) => boolean;
  allTags?: Tag[]; // Add allTags prop
}

const ThreadHeader: React.FC<ThreadHeaderProps> = ({
  thread,
  comments,
  onToggleBookmark,
  isBookmarked,
  participants,
  refetch,
  onEditThread,
  onDeleteThread,
  canEdit,
  allTags = [],
}) => {
  const authorAvatar = getUserAvatar(
    thread.author.user_name,
    thread.author.profile_pic_url
  );

  // Helper function to get tag objects from tag names in thread
  const getThreadTags = (): Tag[] => {
    return thread.tags
      .map((tagName) => allTags.find((tag) => tag.name === tagName))
      .filter(Boolean) as Tag[];
  };

  const threadTags = getThreadTags();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Vote Section */}
        <div className="flex gap-2 sm:gap-4">
          <VoteCard
            threadId={thread.id}
            Vote="thread"
            upvote={thread.upvotes}
            downvote={thread.downvotes}
            refetch={refetch}
          />

          {/* Content */}
          <div className="flex-1 order-1 sm:order-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {thread.title}
            </h1>

            {/* Edit/Delete buttons for thread */}
            {canEdit &&
              onEditThread &&
              onDeleteThread &&
              canEdit(thread.author.user_name) && (
                <div className="flex items-center gap-1 mb-3 sm:mb-4">
                  <button
                    onClick={() => onEditThread(thread)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteThread(thread.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
              {threadTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>

            {/* Content */}
            <RichContentDisplay
              content={thread.body}
              className="mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed text-gray-700"
            />

            {/* Author Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-200 gap-3 sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                {authorAvatar.avatar ? (
                  <img
                    src={authorAvatar.avatar}
                    alt={thread.author.user_name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 ${authorAvatar.color} rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base`}
                  >
                    {authorAvatar.initials}
                  </div>
                )}

                <div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">
                    {thread.author.user_name}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 sm:gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span className="truncate">{thread.created_at}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-xs sm:text-sm text-gray-600">
                  <span className="sm:hidden">
                    {participants.length} people
                  </span>
                  <span className="hidden sm:inline">
                    {participants.length} participants
                  </span>
                </span>
                <div className="flex -space-x-1">
                  {participants.slice(0, 4).map((participant) => {
                    const participantName = participant as string;
                    const participantData = getUserAvatar(participantName);
                    const participantAnswer = comments.find(
                      (a) => a.author.user_name === participantName
                    );
                    return (
                      <div key={participantName}>
                        {participantAnswer?.author?.profile_pic_url ? (
                          <img
                            src={participantAnswer?.author?.profile_pic_url}
                            alt={participantName}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white object-cover"
                            title={participantName}
                          />
                        ) : (
                          <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 ${participantData.color} rounded-full border-2 border-white flex items-center justify-center text-white text-xs sm:text-sm font-medium`}
                            title={participantName}
                          >
                            {participantData.initials}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {participants.length > 4 && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs sm:text-sm font-medium">
                      +{participants.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-1 sm:gap-2 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onToggleBookmark}
          className={`flex items-center gap-1 p-1.5 rounded-md transition-colors ${
            isBookmarked
              ? "text-yellow-600 bg-yellow-50"
              : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
          }`}
        >
          <Bookmark size={18} className="sm:w-5 sm:h-5" />
          <span
            className={`font-semibold text-xs ${
              isBookmarked ? "text-yellow-600" : "text-gray-500"
            }`}
            style={{ letterSpacing: "0.2px" }}
          >
            {thread.bookmarks_count}
          </span>
        </button>

        <div className="flex items-center gap-1 p-1.5">
          <MessageCircle size={16} className="text-blue-400 sm:w-4 sm:h-4" />
          <span
            className="font-semibold text-xs text-blue-500"
            style={{ letterSpacing: "0.2px" }}
          >
            {thread.comments_count ?? comments.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ThreadHeader;
