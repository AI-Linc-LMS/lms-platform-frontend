import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Users,
  Menu,
  Plus,
  Search,
  Filter,
  MessageCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Thread } from '../types';
import ThreadCard from '../components/ThreadCard';
import RichTextEditor from '../components/RichTextEditor';

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [threads, setThreads] = useState<Thread[]>(
    [
      {
        id: '1',
        title: 'How to implement async/await in JavaScript?',
        content: 'I\'m struggling with understanding async/await syntax. Can someone explain with examples?',
        author: 'John Doe',
        createdAt: '2024-01-15',
        upvotes: 15,
        downvotes: 2,
        tags: ['JavaScript', 'Async'],
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        isPinned: true,
        views: 234,
        badge: 'Expert',
        answers: [
          {
            id: 'a1',
            content: 'Async/await is syntactic sugar over Promises. Here\'s a simple example: async function fetchData() { const response = await fetch(url); return response.json(); }',
            author: 'Jane Smith',
            createdAt: '2024-01-15',
            upvotes: 8,
            downvotes: 0,
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            badge: 'Mentor',
            comments: [
              {
                id: '1',
                content: 'Great explanation! This really helped me understand.',
                author: 'Mike Wilson',
                createdAt: '2024-01-15',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                upvotes: 0,
                downvotes: 0
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
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        isSolved: true,
        views: 567,
        badge: 'Pro',
        answers: [
          {
            id: 'a2',
            content: 'I recommend following the atomic design pattern with clear separation of concerns.',
            author: 'David Chen',
            createdAt: '2024-01-14',
            upvotes: 12,
            downvotes: 0,
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
            badge: 'Senior',
            comments: []
          },
          {
            id: 'a3',
            content: 'Also consider using feature-based folder structure instead of type-based.',
            author: 'Emma Wilson',
            createdAt: '2024-01-14',
            upvotes: 8,
            downvotes: 1,
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
            comments: []
          }
        ]
      }
    ]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', tags: '' });
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'thread' | 'answer', id: string } | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<{ [key: string]: boolean }>({});

  const allTags = Array.from(new Set(threads.flatMap(thread => thread.tags)));

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || thread.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleThreadClick = (threadId: string) => {
    navigate(`/community/thread/${threadId}`);
  };

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
        return thread;
      })
    );
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

  const toggleBookmark = (threadId: string): void => {
    setIsBookmarked(prev => ({
      ...prev,
      [threadId]: !prev[threadId]
    }));
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
        tags: newThread.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        views: 0
      };
      setThreads(prevThreads => [thread, ...prevThreads]);
      setNewThread({ title: '', content: '', tags: '' });
      setShowNewThreadForm(false);
    }
  };

  const handleDeleteThread = (threadId: string): void => {
    setThreads(prevThreads => prevThreads.filter(thread => thread.id !== threadId));
    setShowDeleteConfirm(null);
  };

  const canEdit = (author: string): boolean => {
    return author === 'Current User';
  };

  useEffect(() => {
    setExpandedThreads(new Set());
    setShowMobileMenu(false);
    setShowMobileFilters(false);
  }, [location.pathname]);

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
                  onClick={() => {
                    if (showDeleteConfirm.type === 'thread') {
                      handleDeleteThread(showDeleteConfirm.id);
                    }
                    setShowDeleteConfirm(null);
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <Users className="text-white" size={16} />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Community</h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Menu size={18} />
              </button>

              <button
                onClick={() => setShowNewThreadForm(true)}
                className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <Plus size={16} />
                <span className="hidden xs:inline">New</span>
                <span className="hidden sm:inline">Thread</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="pb-3 sm:pb-4">
            {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="sm:hidden mb-4 p-3 bg-gray-50 rounded-lg">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="w-full flex items-center justify-between px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Filter size={16} />
                    Filters & Search
                  </span>
                  {showMobileFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            )}

            {/* Desktop Search */}
            <div className="hidden sm:flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* Mobile Search */}
            {(showMobileFilters && showMobileMenu) && (
              <div className="sm:hidden space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* New Thread Form */}
          {showNewThreadForm && (
            <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-white border border-gray-200 rounded-lg mx-1 sm:mx-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Start a new discussion</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="thread-title" className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    id="thread-title"
                    type="text"
                    placeholder="Thread title"
                    value={newThread.title}
                    onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <RichTextEditor
                    value={newThread.content}
                    onChange={(content) => setNewThread({ ...newThread, content })}
                    placeholder="What would you like to discuss? You can format text, add code snippets, and upload images..."
                    height="h-64 sm:h-96"
                  />
                </div>
                <div>
                  <label htmlFor="thread-tags" className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    id="thread-tags"
                    type="text"
                    placeholder="Add tags separated by commas (e.g. React, TypeScript, API)"
                    value={newThread.tags}
                    onChange={(e) => setNewThread({ ...newThread, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleCreateThread}
                    disabled={!newThread.title.trim() || !newThread.content.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create Thread
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewThreadForm(false)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                <MessageCircle size={14} className="sm:w-4 sm:h-4" />
                <span className="font-medium">{filteredThreads.length}</span>
                <span className="hidden xs:inline">discussions</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                <span className="font-medium">24</span>
                <span className="hidden xs:inline">active</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                <Users size={14} className="sm:w-4 sm:h-4" />
                <span className="font-medium">156</span>
                <span className="hidden xs:inline">members</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>Updated just now</span>
            </div>
          </div>
        </div>

        {/* Threads List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isExpanded={expandedThreads.has(thread.id)}
              isBookmarked={isBookmarked[thread.id] || false}
              onVote={handleVote}
              onToggleExpansion={toggleThreadExpansion}
              onToggleBookmark={toggleBookmark}
              onDeleteThread={(threadId) => setShowDeleteConfirm({ type: 'thread', id: threadId })}
              onThreadClick={handleThreadClick}
              onTagSelect={setSelectedTag}
              canEdit={canEdit}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;