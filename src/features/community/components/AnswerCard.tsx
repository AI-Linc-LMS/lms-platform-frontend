import React, { useState } from 'react';
import {
    ArrowUp,
    ArrowDown,
    Edit3,
    Trash2,
    CheckCircle,
    MessageCircle
} from 'lucide-react';
import { Answer } from '../types';
import RichContentDisplay from './RichContentDisplay';
import CommentSection from './CommentSection';
import RichTextEditor from './RichTextEditor';
import { getUserAvatar } from '../utils/avatarUtils';

interface AnswerCardProps {
    answer: Answer;
    onVote: (answerId: string, type: 'up' | 'down') => void;
    onEdit: (answerId: string, content: string) => void;
    onDelete: (answerId: string) => void;
    onAddComment: (answerId: string, content: string) => void;
    canEdit: (author: string) => boolean;
}

const AnswerCard: React.FC<AnswerCardProps> = ({
    answer,
    onVote,
    onEdit,
    onDelete,
    onAddComment,
    canEdit
}) => {
    const [editingAnswer, setEditingAnswer] = useState(false);
    const [editedContent, setEditedContent] = useState(answer.content);
    const [showCommentForm, setShowCommentForm] = useState(false);

    const answerAuthorAvatar = getUserAvatar(answer.author, answer.avatar);

    const handleSaveEdit = () => {
        onEdit(answer.id, editedContent);
        setEditingAnswer(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(answer.content);
        setEditingAnswer(false);
    };

    return (
        <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${answer.isAccepted ? 'ring-2 ring-green-200' : ''
            }`}>
            {/* Accepted Answer Banner */}
            {answer.isAccepted && (
                <div className="bg-green-50 px-4 sm:px-6 py-2 sm:py-3 border-b border-green-200">
                    <div className="flex items-center gap-2 text-green-700 font-medium text-sm sm:text-base">
                        <CheckCircle size={16} className="sm:w-4 sm:h-4" />
                        <span>Accepted Answer</span>
                    </div>
                </div>
            )}

            <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Vote Section */}
                    <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 min-w-[60px] order-2 sm:order-1">
                        <button
                            onClick={() => onVote(answer.id, 'up')}
                            className={`p-1.5 sm:p-2 rounded-md transition-colors ${answer.isUpvoted
                                    ? 'text-orange-600 bg-orange-50'
                                    : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                }`}
                        >
                            <ArrowUp size={16} className="sm:w-4 sm:h-4" />
                        </button>
                        <span className={`text-base sm:text-lg font-bold px-1.5 sm:px-2 py-1 rounded ${answer.upvotes - answer.downvotes > 0 ? 'text-orange-600' :
                                answer.upvotes - answer.downvotes < 0 ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                            {answer.upvotes - answer.downvotes}
                        </span>
                        <button
                            onClick={() => onVote(answer.id, 'down')}
                            className={`p-1.5 sm:p-2 rounded-md transition-colors ${answer.isDownvoted
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                        >
                            <ArrowDown size={16} className="sm:w-4 sm:h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 order-1 sm:order-2">
                        {editingAnswer ? (
                            <div className="space-y-3 sm:space-y-4">
                                <RichTextEditor
                                    value={editedContent}
                                    onChange={setEditedContent}
                                    placeholder="Edit your answer..."
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
                                    content={answer.content}
                                    className="mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed text-gray-700"
                                />

                                {/* Author Info and Actions */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        {answerAuthorAvatar.avatar ? (
                                            <img
                                                src={answerAuthorAvatar.avatar}
                                                alt={answer.author}
                                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${answerAuthorAvatar.color} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm`}>
                                                {answerAuthorAvatar.initials}
                                            </div>
                                        )}

                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm sm:text-base">{answer.author}</div>
                                            <div className="text-xs sm:text-sm text-gray-500">{answer.createdAt}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2">
                                        <button
                                            onClick={() => setShowCommentForm(!showCommentForm)}
                                            className="text-gray-600 hover:text-blue-600 font-medium text-xs sm:text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                                        >
                                            <MessageCircle size={14} />
                                            Reply
                                        </button>

                                        {canEdit(answer.author) && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setEditingAnswer(true)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <Edit3 size={12} className="sm:w-3.5 sm:h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(answer.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Comment Section */}
                                <CommentSection
                                    comments={answer.comments}
                                    showCommentForm={showCommentForm}
                                    onAddComment={(content) => onAddComment(answer.id, content)}
                                    onCloseCommentForm={() => setShowCommentForm(false)}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnswerCard;
