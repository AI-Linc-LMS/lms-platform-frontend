import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  //   MessageCircle,
  Calendar,
  //   Heart,
  Edit3,
  Trash2,
  //   Save,
  //   X,
  //   Reply,
  //   MoreHorizontal,
  Pin,
  Award,
  //   Star,
  Eye,
  Share2,
  Bookmark,
  Flag,
  //   Users,
  //   Clock,
  //   Zap,
  CheckCircle,
  AlertCircle,
  //   Send
} from 'lucide-react';

interface ThreadComment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  avatar?: string;
  upvotes: number;
  downvotes: number;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
}

interface Answer {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  comments: ThreadComment[];
  avatar?: string;
  badge?: string;
  isAccepted?: boolean;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  answers: Answer[];
  tags: string[];
  isUpvoted?: boolean;
  isDownvoted?: boolean;
  avatar?: string;
  isPinned?: boolean;
  isSolved?: boolean;
  views?: number;
  badge?: string;
}

const ThreadDetailPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();

  // Mock thread data - in real app, fetch from API
  const [thread, setThread] = useState<Thread>({
    id: '1',
    title: 'How to implement async/await in JavaScript?',
    content: 'I\'m struggling with understanding async/await syntax. Can someone explain with examples? I\'ve been trying to understand how to properly handle asynchronous operations in JavaScript, but I keep running into issues with callback hell and promise chains. I\'ve heard that async/await is supposed to make this easier, but I\'m not sure how to implement it correctly.\n\nHere\'s what I\'ve tried so far:\n\n```javascript\nfunction fetchData() {\n  fetch(\'https://api.example.com/data\')\n    .then(response => response.json())\n    .then(data => console.log(data))\n    .catch(error => console.error(error));\n}\n```\n\nBut I want to convert this to use async/await. Any help would be appreciated!',
    author: 'John Doe',
    createdAt: '2024-01-15',
    upvotes: 15,
    downvotes: 2,
    tags: ['JavaScript', 'Async', 'Programming'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isPinned: true,
    views: 234,
    badge: 'Expert',
    answers: [
      {
        id: 'a1',
        content: 'Async/await is syntactic sugar over Promises that makes asynchronous code look and behave more like synchronous code. Here\'s how you can convert your example:\n\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch(\'https://api.example.com/data\');\n    const data = await response.json();\n    console.log(data);\n  } catch (error) {\n    console.error(error);\n  }\n}\n```\n\nKey points:\n1. The function must be declared with `async`\n2. Use `await` before promise-returning expressions\n3. Wrap in try-catch for error handling\n4. Much cleaner than promise chains!',
        author: 'Jane Smith',
        createdAt: '2024-01-15',
        upvotes: 12,
        downvotes: 0,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        badge: 'Mentor',
        isAccepted: true,
        comments: [
          {
            id: 'c1',
            content: 'Great explanation! This really helped me understand the syntax.',
            author: 'Mike Wilson',
            createdAt: '2024-01-15',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            upvotes: 5,
            downvotes: 0
          },
          {
            id: 'c2',
            content: 'One thing to note is that you can only use await inside async functions.',
            author: 'Sarah Chen',
            createdAt: '2024-01-15',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            upvotes: 3,
            downvotes: 0
          }
        ]
      },
      {
        id: 'a2',
        content: 'To add to Jane\'s excellent answer, here are some additional patterns you might find useful:\n\n**Parallel execution with Promise.all():**\n```javascript\nasync function fetchMultipleData() {\n  try {\n    const [users, posts, comments] = await Promise.all([\n      fetch(\'/api/users\').then(r => r.json()),\n      fetch(\'/api/posts\').then(r => r.json()),\n      fetch(\'/api/comments\').then(r => r.json())\n    ]);\n    return { users, posts, comments };\n  } catch (error) {\n    console.error(\'Failed to fetch data:\', error);\n  }\n}\n```\n\n**Sequential vs Parallel:**\n```javascript\n// Sequential (slower)\nconst user = await fetchUser();\nconst posts = await fetchPosts();\n\n// Parallel (faster when operations are independent)\nconst [user, posts] = await Promise.all([\n  fetchUser(),\n  fetchPosts()\n]);\n```',
        author: 'David Chen',
        createdAt: '2024-01-15',
        upvotes: 8,
        downvotes: 1,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        badge: 'Senior',
        comments: []
      }
    ]
  });

  const [newAnswer, setNewAnswer] = useState('');
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [showCommentForm, setShowCommentForm] = useState<{ [key: string]: boolean }>({});
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  //   const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'answer' | 'comment', id: string } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // Increment view count when component mounts
    if (thread) {
      setThread(prev => ({ ...prev, views: (prev.views || 0) + 1 }));
    }
  }, [thread, threadId]);

  // Helper functions from CommunityPage
  const getUserAvatar = (name: string, avatar?: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-teal-500 to-teal-600'
    ];
    const colorIndex = name.length % colors.length;
    return {
      initials,
      color: colors[colorIndex],
      avatar: avatar || null
    };
  };


  const getParticipants = () => {
    const participants = new Set();
    participants.add(thread.author);
    thread.answers.forEach(answer => {
      participants.add(answer.author);
      answer.comments.forEach(comment => participants.add(comment.author));
    });
    return Array.from(participants).slice(0, 8);
  };

  const handleVote = (type: 'thread' | 'answer' | 'comment', _id: string, voteType: 'up' | 'down') => {
    if (type === 'thread') {
      setThread(prev => ({
        ...prev,
        upvotes: voteType === 'up' ? prev.upvotes + 1 : prev.upvotes,
        downvotes: voteType === 'down' ? prev.downvotes + 1 : prev.downvotes,
        isUpvoted: voteType === 'up' ? true : prev.isUpvoted,
        isDownvoted: voteType === 'down' ? true : prev.isDownvoted
      }));
    }
    // Add similar logic for answers and comments
  };

  const handleAddAnswer = () => {
    if (newAnswer.trim()) {
      const answer: Answer = {
        id: Date.now().toString(),
        content: newAnswer,
        author: 'Current User',
        createdAt: new Date().toISOString().split('T')[0],
        upvotes: 0,
        downvotes: 0,
        comments: []
      };
      setThread(prev => ({
        ...prev,
        answers: [...prev.answers, answer]
      }));
      setNewAnswer('');
    }
  };

  const handleAddComment = (answerId: string) => {
    const commentContent = newComment[answerId];
    if (commentContent?.trim()) {
      const comment: ThreadComment = {
        id: Date.now().toString(),
        content: commentContent,
        author: 'Current User',
        createdAt: new Date().toISOString().split('T')[0],
        upvotes: 0,
        downvotes: 0
      };

      setThread(prev => ({
        ...prev,
        answers: prev.answers.map(answer =>
          answer.id === answerId
            ? { ...answer, comments: [...answer.comments, comment] }
            : answer
        )
      }));

      setNewComment({ ...newComment, [answerId]: '' });
      setShowCommentForm({ ...showCommentForm, [answerId]: false });
    }
  };
  const handleBackToCommunity = () => {
    // Clear any local state that might interfere with navigation
    setNewAnswer('');
    setNewComment({});
    setShowCommentForm({});
    setEditingAnswer(null);
    setEditedContent('');
    setShowDeleteConfirm(null);
    setIsBookmarked(false);

    // Navigate back to community with proper history management
    navigate('/community', {
      replace: false,
      state: { fromThread: threadId }
    });
  };
  const canEdit = (author: string) => author === 'Current User';

  if (!thread) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">Thread not found</h2>
        <p className="text-gray-500 mb-6">The thread you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={handleBackToCommunity}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
        >
          Back to Community
        </button>
      </div>
    </div>;
  }

  const authorAvatar = getUserAvatar(thread.author, thread.avatar);
  const participants = getParticipants();

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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete {showDeleteConfirm.type}</h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Are you sure you want to delete this {showDeleteConfirm.type}? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
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

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${isBookmarked
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Bookmark size={16} className={`sm:w-4 sm:h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button className="p-1.5 sm:p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
                <Share2 size={16} className="sm:w-4 sm:h-4" />
              </button>

              <button className="p-1.5 sm:p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
                <Flag size={16} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Thread Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Status Indicators */}
          {(thread.isPinned || thread.isSolved) && (
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              {thread.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  <Pin size={10} />
                  <span className="hidden xs:inline">Pinned</span>
                </span>
              )}
              {thread.isSolved && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  <Award size={10} />
                  <span className="hidden xs:inline">Solved</span>
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Vote Section */}
            <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 min-w-[80px] order-2 sm:order-1">
              <button
                onClick={() => handleVote('thread', thread.id, 'up')}
                className={`p-2 sm:p-3 rounded-md transition-colors ${thread.isUpvoted ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                  }`}
              >
                <ArrowUp size={20} className="sm:w-6 sm:h-6" />
              </button>
              <span className={`text-lg sm:text-xl font-bold px-2 sm:px-3 py-1 sm:py-2 rounded ${thread.upvotes - thread.downvotes > 0 ? 'text-orange-600' :
                thread.upvotes - thread.downvotes < 0 ? 'text-blue-600' : 'text-gray-500'
                }`}>
                {thread.upvotes - thread.downvotes}
              </span>
              <button
                onClick={() => handleVote('thread', thread.id, 'down')}
                className={`p-2 sm:p-3 rounded-md transition-colors ${thread.isDownvoted ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
              >
                <ArrowDown size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 order-1 sm:order-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">{thread.title}</h1>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
                {thread.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Content */}
              <div className="prose prose-sm sm:prose max-w-none mb-4 sm:mb-6">
                <div className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{thread.content}</div>
              </div>

              {/* Author Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-200 gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  {authorAvatar.avatar ? (
                    <img
                      src={authorAvatar.avatar}
                      alt={thread.author}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${authorAvatar.color} rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base`}>
                      {authorAvatar.initials}
                    </div>
                  )}

                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{thread.author}</div>
                    <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 sm:gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span className="truncate">{thread.createdAt}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span>{thread.views}</span>
                        <span className="hidden xs:inline">views</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="text-xs sm:text-sm text-gray-600">
                    <span className="sm:hidden">{participants.length} people</span>
                    <span className="hidden sm:inline">{participants.length} participants</span>
                  </span>
                  <div className="flex -space-x-1">
                    {participants.slice(0, 4).map((participant) => {
                      const participantName = participant as string;
                      const participantData = getUserAvatar(participantName);
                      const participantAnswer = thread.answers.find(a => a.author === participantName);
                      return (
                        <div key={participantName}>
                          {participantAnswer?.avatar ? (
                            <img
                              src={participantAnswer.avatar}
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

        {/* Answers Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              <span className="sm:hidden">{thread.answers.length} Replies</span>
              <span className="hidden sm:inline">{thread.answers.length} Answers</span>
            </h2>
          </div>

          {/* Add Answer Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Your Answer</h3>
            <textarea
              placeholder="Share your knowledge and help the community..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 sm:h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base"
            />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 sm:mt-4 gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm text-gray-500">
                Be helpful and respectful
              </div>
              <button
                onClick={handleAddAnswer}
                disabled={!newAnswer.trim()}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
              >
                Post Answer
              </button>
            </div>
          </div>

          {/* Answers List */}
          {thread.answers.map((answer) => {
            const answerAuthorAvatar = getUserAvatar(answer.author, answer.avatar);
            return (
              <div key={answer.id} className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${answer.isAccepted ? 'ring-2 ring-green-200' : ''
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
                        onClick={() => handleVote('answer', answer.id, 'up')}
                        className={`p-1.5 sm:p-2 rounded-md transition-colors ${answer.isUpvoted ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
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
                        onClick={() => handleVote('answer', answer.id, 'down')}
                        className={`p-1.5 sm:p-2 rounded-md transition-colors ${answer.isDownvoted ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        <ArrowDown size={16} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 order-1 sm:order-2">
                      {editingAnswer === answer.id ? (
                        <div className="space-y-3 sm:space-y-4">
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 sm:h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base"
                          />
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                            <button
                              onClick={() => setEditingAnswer(null)}
                              className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingAnswer(null)}
                              className="bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-sm sm:prose max-w-none mb-3 sm:mb-4">
                            <div className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{answer.content}</div>
                          </div>

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
                                <div className="text-xs sm:text-sm text-gray-500">
                                  {answer.createdAt}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2">
                              <button
                                onClick={() => setShowCommentForm({ ...showCommentForm, [answer.id]: !showCommentForm[answer.id] })}
                                className="text-gray-600 hover:text-blue-600 font-medium text-xs sm:text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              >
                                Reply
                              </button>

                              {canEdit(answer.author) && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingAnswer(answer.id);
                                      setEditedContent(answer.content);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  >
                                    <Edit3 size={12} className="sm:w-3.5 sm:h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm({ type: 'answer', id: answer.id })}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Comment Form */}
                          {showCommentForm[answer.id] && (
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <textarea
                                placeholder="Add a comment..."
                                value={newComment[answer.id] || ''}
                                onChange={(e) => setNewComment({ ...newComment, [answer.id]: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md h-12 sm:h-16 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-sm sm:text-base"
                              />
                              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2">
                                <button
                                  onClick={() => setShowCommentForm({ ...showCommentForm, [answer.id]: false })}
                                  className="px-3 py-1.5 text-gray-600 hover:text-gray-800 font-medium text-xs sm:text-sm rounded hover:bg-gray-100 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAddComment(answer.id)}
                                  disabled={!newComment[answer.id]?.trim()}
                                  className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-xs sm:text-sm"
                                >
                                  Comment
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Comments */}
                          {answer.comments.length > 0 && (
                            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                              {answer.comments.map((comment) => {
                                const commentAuthorAvatar = getUserAvatar(comment.author, comment.avatar);
                                return (
                                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-gray-700 mb-2 text-xs sm:text-sm leading-relaxed">{comment.content}</p>
                                    <div className="flex items-center gap-2">
                                      {commentAuthorAvatar.avatar ? (
                                        <img
                                          src={commentAuthorAvatar.avatar}
                                          alt={comment.author}
                                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className={`w-5 h-5 sm:w-6 sm:h-6 ${commentAuthorAvatar.color} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                                          {commentAuthorAvatar.initials}
                                        </div>
                                      )}
                                      <span className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{comment.author}</span>
                                      <span className="text-xs text-gray-500">{comment.createdAt}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;
