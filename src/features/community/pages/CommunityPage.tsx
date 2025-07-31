import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  User,
  Calendar,
  // Tag,
  Filter,
  // Send,
  Heart,
  Reply,
  MoreHorizontal,
  Edit3,
  Trash2,
  Save,
  X,
  List,
  GitBranch,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ThreadComment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
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
}

const CommunityPage: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([
    {
      id: '1',
      title: 'How to implement async/await in JavaScript?',
      content: 'I\'m struggling with understanding async/await syntax. Can someone explain with examples?',
      author: 'John Doe',
      createdAt: '2024-01-15',
      upvotes: 15,
      downvotes: 2,
      tags: ['JavaScript', 'Async'],
      answers: [
        {
          id: 'a1',
          content: 'Async/await is syntactic sugar over Promises. Here\'s a simple example: async function fetchData() { const response = await fetch(url); return response.json(); }',
          author: 'Jane Smith',
          createdAt: '2024-01-15',
          upvotes: 8,
          downvotes: 0,
          comments: [
            {
              id: 'c1',
              content: 'Great explanation! This really helped me understand.',
              author: 'Mike Wilson',
              createdAt: '2024-01-15'
            }
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'Best practices for React component structure?',
      content: 'What are the recommended patterns for organizing React components in a large application?',
      author: 'Sarah Johnson',
      createdAt: '2024-01-14',
      upvotes: 23,
      downvotes: 1,
      tags: ['React', 'Best Practices'],
      answers: []
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', tags: '' });
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [newAnswers, setNewAnswers] = useState<{ [key: string]: string }>({});
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [showCommentForm, setShowCommentForm] = useState<{ [key: string]: boolean }>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [editingThread, setEditingThread] = useState<string | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editedThreadData, setEditedThreadData] = useState({ title: '', content: '', tags: '' });
  const [editedAnswerContent, setEditedAnswerContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'thread' | 'answer', id: string } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'thread'>('list');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const allTags = Array.from(new Set(threads.flatMap(thread => thread.tags)));

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || thread.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleVote = (threadId: string, answerId: string | null, type: 'up' | 'down'): void => {
    setThreads(prevThreads =>
      prevThreads.map(thread => {
        if (thread.id === threadId && !answerId) {
          return {
            ...thread,
            upvotes: type === 'up' ? thread.upvotes + 1 : thread.upvotes,
            downvotes: type === 'down' ? thread.downvotes + 1 : thread.downvotes,
            isUpvoted: type === 'up' ? true : thread.isUpvoted,
            isDownvoted: type === 'down' ? true : thread.isDownvoted
          };
        }
        if (answerId) {
          return {
            ...thread,
            answers: thread.answers.map(answer =>
              answer.id === answerId ? {
                ...answer,
                upvotes: type === 'up' ? answer.upvotes + 1 : answer.upvotes,
                downvotes: type === 'down' ? answer.downvotes + 1 : answer.downvotes,
                isUpvoted: type === 'up' ? true : answer.isUpvoted,
                isDownvoted: type === 'down' ? true : answer.isDownvoted
              } : answer
            )
          };
        }
        return thread;
      })
    );
  };

  const handleCreateThread = (): void => {
    if (newThread.title && newThread.content) {
      const thread: Thread = {
        id: Date.now().toString(),
        title: newThread.title,
        content: newThread.content,
        author: 'Current User',
        createdAt: new Date().toISOString().split('T')[0],
        upvotes: 0,
        downvotes: 0,
        answers: [],
        tags: newThread.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      setThreads([thread, ...threads]);
      setNewThread({ title: '', content: '', tags: '' });
      setShowNewThreadForm(false);
    }
  };

  const handleAddAnswer = (threadId: string): void => {
    const answerContent = newAnswers[threadId];
    if (answerContent) {
      const answer: Answer = {
        id: Date.now().toString(),
        content: answerContent,
        author: 'Current User',
        createdAt: new Date().toISOString().split('T')[0],
        upvotes: 0,
        downvotes: 0,
        comments: []
      };

      setThreads(prevThreads =>
        prevThreads.map(thread =>
          thread.id === threadId
            ? { ...thread, answers: [...thread.answers, answer] }
            : thread
        )
      );

      setNewAnswers({ ...newAnswers, [threadId]: '' });
    }
  };

  const handleAddComment = (answerId: string): void => {
    const commentContent = newComments[answerId];
    if (commentContent.trim()) {
      const newComment: ThreadComment = {
        id: Date.now().toString(),
        content: commentContent,
        author: 'Current User',
        createdAt: new Date().toISOString().split('T')[0]
      };

      setThreads(prevThreads =>
        prevThreads.map(thread => ({
          ...thread,
          answers: thread.answers.map(answer =>
            answer.id === answerId
              ? { ...answer, comments: [...answer.comments, newComment] }
              : answer
          )
        }))
      );

      setNewComments({ ...newComments, [answerId]: '' });
      setShowCommentForm({ ...showCommentForm, [answerId]: false });
    }
  };

  const toggleCommentForm = (answerId: string): void => {
    setShowCommentForm(prev => ({
      ...prev,
      [answerId]: !prev[answerId]
    }));
  };

  const toggleCommentsExpansion = (answerId: string): void => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(answerId)) {
      newExpanded.delete(answerId);
    } else {
      newExpanded.add(answerId);
    }
    setExpandedComments(newExpanded);
  };

  const toggleThreadExpansion = (threadId: string): void => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  const handleEditThread = (thread: Thread): void => {
    setEditingThread(thread.id);
    setEditedThreadData({
      title: thread.title,
      content: thread.content,
      tags: thread.tags.join(', ')
    });
  };

  const handleSaveThreadEdit = (): void => {
    if (editingThread && editedThreadData.title && editedThreadData.content) {
      setThreads(prevThreads =>
        prevThreads.map(thread =>
          thread.id === editingThread
            ? {
              ...thread,
              title: editedThreadData.title,
              content: editedThreadData.content,
              tags: editedThreadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            }
            : thread
        )
      );
      setEditingThread(null);
      setEditedThreadData({ title: '', content: '', tags: '' });
    }
  };

  const handleDeleteThread = (threadId: string): void => {
    setThreads(prevThreads => prevThreads.filter(thread => thread.id !== threadId));
    setShowDeleteConfirm(null);
  };

  const handleEditAnswer = (answer: Answer): void => {
    setEditingAnswer(answer.id);
    setEditedAnswerContent(answer.content);
  };

  const handleSaveAnswerEdit = (): void => {
    if (editingAnswer && editedAnswerContent) {
      setThreads(prevThreads =>
        prevThreads.map(thread => ({
          ...thread,
          answers: thread.answers.map(answer =>
            answer.id === editingAnswer
              ? { ...answer, content: editedAnswerContent }
              : answer
          )
        }))
      );
      setEditingAnswer(null);
      setEditedAnswerContent('');
    }
  };

  const handleDeleteAnswer = (answerId: string): void => {
    setThreads(prevThreads =>
      prevThreads.map(thread => ({
        ...thread,
        answers: thread.answers.filter(answer => answer.id !== answerId)
      }))
    );
    setShowDeleteConfirm(null);
  };

  const canEdit = (author: string): boolean => {
    return author === 'Current User'; // In real app, compare with actual current user
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl mx-4">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Trash2 size={20} className="text-red-600 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Delete {showDeleteConfirm.type}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Are you sure you want to delete this {showDeleteConfirm.type}? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'thread') {
                      handleDeleteThread(showDeleteConfirm.id);
                    } else {
                      handleDeleteAnswer(showDeleteConfirm.id);
                    }
                  }}
                  className="w-full sm:flex-1 bg-red-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="w-full sm:flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Community Forum</h1>
              <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Ask questions, share knowledge, and connect</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              
              {/* Desktop View Mode Toggle */}
              <div className="hidden sm:flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List size={16} />
                  List
                </button>
                <button
                  onClick={() => setViewMode('thread')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${
                    viewMode === 'thread' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <GitBranch size={16} />
                  Thread
                </button>
              </div>
              
              <button
                onClick={() => setShowNewThreadForm(true)}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New Post</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="sm:hidden mb-3 bg-gray-50 rounded-lg p-3 border border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => {
                      setViewMode('list');
                      setShowMobileMenu(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600'
                    }`}
                  >
                    <List size={16} />
                    List View
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('thread');
                      setShowMobileMenu(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                      viewMode === 'thread' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600'
                    }`}
                  >
                    <GitBranch size={16} />
                    Thread View
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowMobileFilters(!showMobileFilters);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Filter size={16} />
                    Filters & Search
                  </span>
                  {showMobileFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Search and Filter - Desktop */}
          <div className="hidden sm:flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white min-w-[140px] text-sm"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Search and Filter */}
          {(showMobileFilters || showMobileMenu) && (
            <div className="sm:hidden space-y-3 mb-4 animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-sm"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* New Thread Form */}
          {showNewThreadForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 shadow-sm animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                Create a new post
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm sm:text-base"
                />
                <textarea
                  placeholder="What's on your mind?"
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg h-20 sm:h-24 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm sm:text-base"
                />
                <input
                  type="text"
                  placeholder="Tags (separated by commas)"
                  value={newThread.tags}
                  onChange={(e) => setNewThread({ ...newThread, tags: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base"
                />
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleCreateThread}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                  >
                    Post
                  </button>
                  <button
                    onClick={() => setShowNewThreadForm(false)}
                    className="w-full sm:w-auto bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Threads List */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className={viewMode === 'thread' ? 'space-y-2' : 'space-y-3 sm:space-y-4'}>
          {filteredThreads.map((thread) => (
            <div key={thread.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${
              viewMode === 'thread' ? 'relative overflow-hidden' : ''
            }`}>
              {/* Thread Hierarchy Lines */}
              {viewMode === 'thread' && (
                <div className="hidden sm:block">
                  {/* Main thread line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-blue-100"></div>
                  {/* Thread indicator dot */}
                  <div className="absolute left-3 top-6 w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>
                </div>
              )}
              
              <div className="p-3 sm:p-4">
                <div className="flex gap-2 sm:gap-3">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-[40px] sm:min-w-[48px]">
                    <button
                      onClick={() => handleVote(thread.id, null, 'up')}
                      className={`p-1.5 sm:p-1 rounded-lg hover:bg-gray-100 transition-all duration-200 touch-manipulation ${
                        thread.isUpvoted ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-orange-500'
                      }`}
                    >
                      <ArrowUp size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <span className={`text-xs sm:text-sm font-bold px-1 py-0.5 rounded ${
                      thread.upvotes - thread.downvotes > 0 ? 'text-orange-600 bg-orange-50' : 
                      thread.upvotes - thread.downvotes < 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                    }`}>
                      {thread.upvotes - thread.downvotes}
                    </span>
                    <button
                      onClick={() => handleVote(thread.id, null, 'down')}
                      className={`p-1.5 sm:p-1 rounded-lg hover:bg-gray-100 transition-all duration-200 touch-manipulation ${
                        thread.isDownvoted ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500'
                      }`}
                    >
                      <ArrowDown size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingThread === thread.id ? (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <input
                          type="text"
                          value={editedThreadData.title}
                          onChange={(e) => setEditedThreadData({ ...editedThreadData, title: e.target.value })}
                          className="w-full p-2 sm:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-sm sm:text-base"
                        />
                        <textarea
                          value={editedThreadData.content}
                          onChange={(e) => setEditedThreadData({ ...editedThreadData, content: e.target.value })}
                          className="w-full p-2 sm:p-2 border border-gray-300 rounded h-16 sm:h-20 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-sm sm:text-base"
                        />
                        <input
                          type="text"
                          value={editedThreadData.tags}
                          onChange={(e) => setEditedThreadData({ ...editedThreadData, tags: e.target.value })}
                          className="w-full p-2 sm:p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm sm:text-base"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={handleSaveThreadEdit}
                            className="w-full sm:w-auto bg-green-600 text-white px-3 py-2 sm:py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1 touch-manipulation"
                          >
                            <Save size={14} />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingThread(null)}
                            className="w-full sm:w-auto bg-gray-200 text-gray-700 px-3 py-2 sm:py-1 rounded text-sm hover:bg-gray-300 transition-colors flex items-center justify-center gap-1 touch-manipulation"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg hover:text-blue-600 cursor-pointer leading-tight pr-2 transition-colors duration-200">
                            {thread.title}
                          </h3>
                          {canEdit(thread.author) && (
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleEditThread(thread)}
                                className="text-gray-400 hover:text-blue-600 p-1.5 sm:p-1 rounded-lg hover:bg-gray-100 touch-manipulation transition-all duration-200"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({ type: 'thread', id: thread.id })}
                                className="text-gray-400 hover:text-red-600 p-1.5 sm:p-1 rounded-lg hover:bg-red-50 touch-manipulation transition-all duration-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-3 text-sm leading-relaxed">{thread.content}</p>
                      </>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {thread.tags.map(tag => (
                        <span key={tag} className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium hover:from-blue-100 hover:to-indigo-100 cursor-pointer touch-manipulation transition-all duration-200 border border-blue-200">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Meta and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 group">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span className="font-medium truncate">{thread.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{thread.createdAt}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleThreadExpansion(thread.id)}
                        className={`flex items-center gap-1.5 text-gray-500 hover:text-blue-600 font-medium self-start sm:self-auto touch-manipulation p-1.5 -m-1 rounded-lg transition-all duration-200 ${
                          expandedThreads.has(thread.id) ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                        }`}
                      >
                        <MessageCircle size={14} />
                        <span>{thread.answers.length} replies</span>
                        {expandedThreads.has(thread.id) ? 
                          <ChevronUp size={12} className="transition-transform duration-200" /> : 
                          <ChevronDown size={12} className="transition-transform duration-200" />
                        }
                      </button>
                    </div>

                    {/* Answers Section */}
                    {expandedThreads.has(thread.id) && (
                      <div className="mt-4 border-t border-gray-100 pt-4 animate-in slide-in-from-top-4 duration-300">
                        {/* Add Answer Form */}
                        <div className="mb-4 bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-lg border border-gray-200">
                          <textarea
                            placeholder="Add a reply..."
                            value={newAnswers[thread.id] || ''}
                            onChange={(e) => setNewAnswers({ ...newAnswers, [thread.id]: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg h-16 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-white text-sm transition-all duration-200"
                          />
                          <button
                            onClick={() => handleAddAnswer(thread.id)}
                            disabled={!newAnswers[thread.id]?.trim()}
                            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Answers List */}
                        <div className="space-y-3">
                          {thread.answers.map((answer, answerIndex) => (
                            <div key={answer.id} className={`bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg p-3 border-l-3 border-blue-300 hover:border-blue-400 transition-all duration-200 ${
                              viewMode === 'thread' ? 'relative sm:ml-8' : ''
                            }`}>
                              {/* Answer Thread Lines */}
                              {viewMode === 'thread' && (
                                <>
                                  {/* Horizontal connector */}
                                  <div className="hidden sm:block absolute -left-11 top-6 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-blue-400"></div>
                                  {/* Vertical continuation line */}
                                  {answerIndex < thread.answers.length - 1 && (
                                    <div className="hidden sm:block absolute -left-11 top-6 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-blue-100"></div>
                                  )}
                                  {/* Answer indicator dot */}
                                  <div className="hidden sm:block absolute -left-12 top-5 w-2 h-2 bg-blue-400 rounded-full shadow-sm"></div>
                                </>
                              )}

                              <div className="flex gap-2 sm:gap-3">
                                {/* Answer Votes */}
                                <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-[28px] sm:min-w-[32px]">
                                  <button
                                    onClick={() => handleVote(thread.id, answer.id, 'up')}
                                    className={`p-1 sm:p-0.5 rounded-lg hover:bg-white/70 transition-all duration-200 touch-manipulation ${
                                      answer.isUpvoted ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-orange-500'
                                    }`}
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                                    answer.upvotes - answer.downvotes > 0 ? 'text-orange-600 bg-orange-50' : 
                                    answer.upvotes - answer.downvotes < 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-500'
                                  }`}>
                                    {answer.upvotes - answer.downvotes}
                                  </span>
                                  <button
                                    onClick={() => handleVote(thread.id, answer.id, 'down')}
                                    className={`p-1 sm:p-0.5 rounded-lg hover:bg-white/70 transition-all duration-200 touch-manipulation ${
                                      answer.isDownvoted ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500'
                                    }`}
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                </div>

                                {/* Answer Content */}
                                <div className="flex-1 min-w-0">
                                  {editingAnswer === answer.id ? (
                                    <div className="space-y-2 animate-in fade-in duration-300">
                                      <textarea
                                        value={editedAnswerContent}
                                        onChange={(e) => setEditedAnswerContent(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded h-16 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-white text-sm"
                                      />
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                          onClick={handleSaveAnswerEdit}
                                          className="w-full sm:w-auto bg-green-600 text-white px-2 py-2 sm:py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center justify-center gap-1 touch-manipulation"
                                        >
                                          <Save size={12} />
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingAnswer(null)}
                                          className="w-full sm:w-auto bg-gray-200 text-gray-700 px-2 py-2 sm:py-1 rounded text-xs hover:bg-gray-300 transition-colors flex items-center justify-center gap-1 touch-manipulation"
                                        >
                                          <X size={12} />
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start justify-between mb-2 group">
                                        <p className="text-gray-700 text-sm leading-relaxed pr-2">{answer.content}</p>
                                        {canEdit(answer.author) && (
                                          <div className="flex items-center gap-1 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                              onClick={() => handleEditAnswer(answer)}
                                              className="text-gray-400 hover:text-blue-600 p-1 sm:p-0.5 rounded-lg hover:bg-white/70 touch-manipulation transition-all duration-200"
                                            >
                                              <Edit3 size={12} />
                                            </button>
                                            <button
                                              onClick={() => setShowDeleteConfirm({ type: 'answer', id: answer.id })}
                                              className="text-gray-400 hover:text-red-600 p-1 sm:p-0.5 rounded-lg hover:bg-red-50 touch-manipulation transition-all duration-200"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}

                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium truncate bg-white/60 px-2 py-0.5 rounded-full">{answer.author}</span>
                                      <span className="hidden sm:inline">•</span>
                                      <span>{answer.createdAt}</span>
                                    </div>
                                    <div className="flex items-center gap-3 self-start sm:self-auto">
                                      <button
                                        onClick={() => toggleCommentsExpansion(answer.id)}
                                        className={`hover:text-blue-600 font-medium touch-manipulation p-1 -m-1 rounded-lg transition-all duration-200 flex items-center gap-1 ${
                                          expandedComments.has(answer.id) ? 'bg-blue-50 text-blue-600' : 'hover:bg-white/70'
                                        }`}
                                      >
                                        <MessageCircle size={12} />
                                        <span>{answer.comments.length} comments</span>
                                        {expandedComments.has(answer.id) ? 
                                          <ChevronUp size={10} /> : 
                                          <ChevronDown size={10} />
                                        }
                                      </button>
                                      <button
                                        onClick={() => toggleCommentForm(answer.id)}
                                        className={`hover:text-blue-600 font-medium touch-manipulation p-1 -m-1 rounded-lg transition-all duration-200 ${
                                          showCommentForm[answer.id] ? 'bg-blue-50 text-blue-600' : 'hover:bg-white/70'
                                        }`}
                                      >
                                        reply
                                      </button>
                                    </div>
                                  </div>

                                  {/* Comment Form */}
                                  {showCommentForm[answer.id] && (
                                    <div className="mb-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-in slide-in-from-top-2 duration-200">
                                      <textarea
                                        placeholder="Write a comment..."
                                        value={newComments[answer.id] || ''}
                                        onChange={(e) => setNewComments({ ...newComments, [answer.id]: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg h-12 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-sm transition-all duration-200"
                                      />
                                      <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                        <button
                                          onClick={() => handleAddComment(answer.id)}
                                          disabled={!newComments[answer.id]?.trim()}
                                          className="w-full sm:w-auto bg-blue-600 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation"
                                        >
                                          Comment
                                        </button>
                                        <button
                                          onClick={() => toggleCommentForm(answer.id)}
                                          className="w-full sm:w-auto bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs hover:bg-gray-300 transition-all duration-200 touch-manipulation"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Comments Section */}
                                  {expandedComments.has(answer.id) && answer.comments.length > 0 && (
                                    <div className="mt-3 space-y-2 pl-3 sm:pl-4 border-l-2 border-gray-200 animate-in slide-in-from-top-2 duration-300">
                                      {answer.comments.map((comment: ThreadComment, commentIndex) => (
                                        <div key={comment.id} className={`bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${
                                          viewMode === 'thread' ? 'relative sm:ml-3' : ''
                                        }`}>
                                          {/* Comment Thread Lines */}
                                          {viewMode === 'thread' && (
                                            <>
                                              {/* Horizontal connector */}
                                              <div className="hidden sm:block absolute -left-6 top-4 w-3 h-0.5 bg-gray-300"></div>
                                              {/* Vertical continuation line */}
                                              {commentIndex < answer.comments.length - 1 && (
                                                <div className="hidden sm:block absolute -left-6 top-4 bottom-0 w-0.5 bg-gray-200"></div>
                                              )}
                                              {/* Comment indicator dot */}
                                              <div className="hidden sm:block absolute -left-7 top-3.5 w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                            </>
                                          )}
                                          
                                          <p className="text-gray-700 text-sm mb-2 leading-relaxed">{comment.content}</p>
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium truncate bg-gray-50 px-2 py-0.5 rounded-full">{comment.author}</span>
                                              <span className="hidden sm:inline">•</span>
                                              <span>{comment.createdAt}</span>
                                            </div>
                                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                              <button className="hover:text-red-500 p-1 -m-1 rounded-lg hover:bg-red-50 touch-manipulation transition-all duration-200">
                                                <Heart size={12} />
                                              </button>
                                              <button className="hover:text-blue-600 p-1 -m-1 rounded-lg hover:bg-blue-50 touch-manipulation transition-all duration-200">
                                                <Reply size={12} />
                                              </button>
                                              <button className="hover:text-gray-700 p-1 -m-1 rounded-lg hover:bg-gray-100 touch-manipulation transition-all duration-200">
                                                <MoreHorizontal size={12} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;