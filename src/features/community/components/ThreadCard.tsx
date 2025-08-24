import React from "react";
import {
  Calendar,
  Trash2,
  Edit2,
  MessageCircle,
  Bookmark,
  ArrowRight,
} from "lucide-react";
import { Thread } from "../types";
import { getUserAvatar } from "../utils/avatarUtils";
import RichbodyDisplay from "./RichContentDisplay";
import VoteCard from "./Vote";

interface ThreadCardProps {
  thread: Thread;
  isExpanded: boolean;
  isBookmarked: boolean;
  refetch: () => void;
  onToggleExpansion: (threadId: number) => void;
  onToggleBookmark: (threadId: number) => void;
  onDeleteThread: (threadId: number) => void;
  onEditThread: (thread: Thread) => void;
  onThreadClick: (threadId: number) => void;
  onTagSelect: (tag: string) => void;
  canEdit: (author: string) => boolean;
}

const ThreadCard: React.FC<ThreadCardProps> = ({
  thread,
  isExpanded,
  isBookmarked,
  refetch,
  onToggleExpansion,
  onToggleBookmark,
  onDeleteThread,
  onEditThread,
  onThreadClick,
  onTagSelect,
  canEdit,
}) => {
  const authorAvatar = getUserAvatar(
    thread.author.user_name,
    thread.author.profile_pic_url
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow mx-1 sm:mx-0 group">
      <div className="p-3 sm:p-6">
        <div className="flex gap-2 sm:gap-4">
          <VoteCard
            threadId={thread.id}
            Vote="thread"
            upvote={thread.upvotes}
            downvote={thread.downvotes}
            refetch={refetch}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <h3
                onClick={() => onThreadClick(thread.id)}
                className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 pr-2"
              >
                {thread.title}
              </h3>

              {canEdit(thread.author.user_name) && (
                <div
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
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
            </div>

            {/* Thread body Preview */}
            <div
              onClick={() => onThreadClick(thread.id)}
              className={`relative ${
                !isExpanded && "max-h-[300px] overflow-hidden"
              }`}
            >
              <RichbodyDisplay
                content={thread.body}
                className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base"
              />
              {!isExpanded && thread.body.length > 300 && (
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
              )}
            </div>

            {/* Show More/Less Button */}
            {thread.body.length > 300 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpansion(thread.id);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-3"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}

            {/* Tags */}
            <div
              className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4"
              onClick={(e) => e.stopPropagation()}
            >
              {thread.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 cursor-pointer transition-colors"
                  onClick={() => onTagSelect(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  {authorAvatar.avatar ? (
                    <img
                      src={authorAvatar.avatar}
                      alt={thread.author.user_name}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 ${authorAvatar.color} rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium`}
                    >
                      {authorAvatar.initials}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 text-xs sm:text-sm">
                      {thread.author.user_name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2">
                      <Calendar size={8} className="sm:w-2.5 sm:h-2.5" />
                      <span className="truncate max-w-[80px] sm:max-w-none">
                        {thread.created_at}
                      </span>
                      {/* {thread.views && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <Eye size={8} className="sm:w-2.5 sm:h-2.5" />
                          <span className="hidden xs:inline">{thread.views}</span>
                          <span className="xs:hidden">{thread.views}</span>
                        </>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                {/* Participants */}
                <div className="flex items-center gap-2">
                  {/* <div className="flex -space-x-2">
                    {thread.answers.slice(0, 3).map((answer) => {
                      const participantAvatar = getUserAvatar(answer.author, answer.avatar);
                      return (
                        <div key={answer.id} className="relative" title={answer.author}>
                          {answer.avatar ? (
                            <img
                              src={answer.avatar}
                              alt={answer.author}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-white object-cover"
                            />
                          ) : (
                            <div
                              className={`w-6 h-6 sm:w-7 sm:h-7 ${participantAvatar.color} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium`}
                            >
                              {participantAvatar.initials}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {thread.answers.length > 3 && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                        +{thread.answers.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    <span className="sm:hidden">{thread.answers.length}</span>
                    <span className="hidden sm:inline">{thread.answers.length} replies</span>
                  </span>
                </div> */}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleBookmark(thread.id)}
                      className={`flex items-center gap-1 p-1.5 rounded-md transition-colors ${
                        isBookmarked
                          ? "text-yellow-600 bg-yellow-50"
                          : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                      }`}
                      style={{
                        background: "none",
                        border: "none",
                        minWidth: 0,
                      }}
                    >
                      <Bookmark className="sm:w-6 sm:h-6" />
                      <span
                        className={`font-semibold text-[11px] leading-tight ${
                          isBookmarked ? "text-yellow-600" : "text-gray-500"
                        }`}
                        style={{ letterSpacing: "0.2px", textAlign: "center" }}
                      >
                        {thread.bookmarks_count}
                      </span>
                    </button>
                    <div className="flex items-center gap-1 p-1.5">
                      <MessageCircle
                        size={18}
                        className="text-blue-400 sm:w-5 sm:h-5"
                      />
                      <span
                        className="font-semibold text-[11px] leading-tight text-blue-500"
                        style={{ letterSpacing: "0.2px", textAlign: "center" }}
                      >
                        {thread.comments_count ?? 0}
                      </span>
                    </div>
                    <button
                      onClick={() => onThreadClick(thread.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      View Thread
                      <ArrowRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadCard;
