import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  User,
  Calendar,
  Tag,
  Filter,
  Send,
  Heart,
  Reply,
  MoreHorizontal,
  Edit3,
  Trash2,
  Save,
  X
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Delete {showDeleteConfirm.type}</h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to delete this {showDeleteConfirm.type}? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'thread') {
                      handleDeleteThread(showDeleteConfirm.id);
                    } else {
                      handleDeleteAnswer(showDeleteConfirm.id);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-semibold"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-xl rounded-2xl">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6" >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Community Forum
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Ask questions, share knowledge, and connect with peers</p>
            </div>
            <button
              onClick={() => setShowNewThreadForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl font-semibold text-lg"
            >
              <Plus size={24} />
              <span>New Thread</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search threads, topics, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-4 text-gray-400" size={20} />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm min-w-[160px]"
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* New Thread Form */}
          {showNewThreadForm && (
            <div className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl mb-6 border border-gray-200 shadow-2xl animate-in slide-in-from-top duration-500">
              <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Plus size={20} className="text-white" />
                </div>
                What's on your mind?
              </h3>
              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="What's your question or topic?"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-xl font-medium bg-gray-50/50"
                />
                <textarea
                  placeholder="Share more details, context, or what you've tried so far..."
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  className="w-full p-5 border-2 border-gray-200 rounded-2xl h-40 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none text-lg bg-gray-50/50"
                />
                <input
                  type="text"
                  placeholder="Add relevant tags (e.g., JavaScript, React, CSS, Python)..."
                  value={newThread.tags}
                  onChange={(e) => setNewThread({ ...newThread, tags: e.target.value })}
                  className="w-full p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg bg-gray-50/50"
                />
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleCreateThread}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-10 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-bold text-lg"
                  >
                    Post Thread
                  </button>
                  <button
                    onClick={() => setShowNewThreadForm(false)}
                    className="bg-gray-200 text-gray-700 px-10 py-4 rounded-2xl hover:bg-gray-300 transition-all duration-300 font-bold text-lg"
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-8">
          {filteredThreads.map(thread => (
            <div key={thread.id} className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden group hover:border-blue-200">
              <div className="p-10">
                <div className="flex gap-8">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-gray-50 to-gray-100 p-6 rounded-3xl border border-gray-200 shadow-inner">
                    <button
                      onClick={() => handleVote(thread.id, null, 'up')}
                      className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${thread.isUpvoted
                          ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-xl'
                          : 'text-gray-400 hover:text-green-500 hover:bg-green-50 hover:shadow-lg'
                        }`}
                    >
                      <ArrowUp size={28} />
                    </button>
                    <span className="font-bold text-2xl text-gray-700 bg-white px-4 py-2 rounded-xl shadow-md">
                      {thread.upvotes - thread.downvotes}
                    </span>
                    <button
                      onClick={() => handleVote(thread.id, null, 'down')}
                      className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${thread.isDownvoted
                          ? 'text-white bg-gradient-to-r from-red-500 to-rose-600 shadow-xl'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-lg'
                        }`}
                    >
                      <ArrowDown size={28} />
                    </button>
                  </div>

                  {/* Thread Content */}
                  <div className="flex-1">
                    {editingThread === thread.id ? (
                      <div className="space-y-4 mb-6">
                        <input
                          type="text"
                          value={editedThreadData.title}
                          onChange={(e) => setEditedThreadData({ ...editedThreadData, title: e.target.value })}
                          className="w-full p-4 border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-xl font-medium"
                        />
                        <textarea
                          value={editedThreadData.content}
                          onChange={(e) => setEditedThreadData({ ...editedThreadData, content: e.target.value })}
                          className="w-full p-4 border-2 border-blue-300 rounded-xl h-32 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none text-lg"
                        />
                        <input
                          type="text"
                          value={editedThreadData.tags}
                          onChange={(e) => setEditedThreadData({ ...editedThreadData, tags: e.target.value })}
                          className="w-full p-4 border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={handleSaveThreadEdit}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold flex items-center gap-2"
                          >
                            <Save size={16} />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingThread(null)}
                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold flex items-center gap-2"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors duration-300 cursor-pointer flex-1">
                            {thread.title}
                          </h3>
                          {canEdit(thread.author) && (
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleEditThread(thread)}
                                className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-all duration-300"
                                title="Edit thread"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm({ type: 'thread', id: thread.id })}
                                className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-all duration-300"
                                title="Delete thread"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">{thread.content}</p>
                      </>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      {thread.tags.map(tag => (
                        <span key={tag} className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 border border-blue-200 hover:from-blue-200 hover:to-purple-200 transition-all duration-300 cursor-pointer">
                          <Tag size={14} />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Thread Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <User size={14} className="text-white" />
                          </div>
                          <span className="font-medium">{thread.author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{thread.createdAt}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleThreadExpansion(thread.id)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all duration-300 font-semibold"
                      >
                        <MessageCircle size={18} />
                        <span>{thread.answers.length} answers</span>
                      </button>
                    </div>

                    {/* Answers Section */}
                    {expandedThreads.has(thread.id) && (
                      <div className="border-t border-gray-200 pt-10 mt-10 animate-in slide-in-from-top duration-500">
                        {/* Add Answer Form */}
                        <div className="mb-10 bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-3xl border-2 border-green-200 shadow-lg">
                          <h4 className="font-bold text-gray-800 mb-6 text-2xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <Send size={16} className="text-white" />
                            </div>
                            Share your knowledge
                          </h4>
                          <textarea
                            placeholder="Write a detailed answer that helps others..."
                            value={newAnswers[thread.id] || ''}
                            onChange={(e) => setNewAnswers({ ...newAnswers, [thread.id]: e.target.value })}
                            className="w-full p-6 border-2 border-gray-200 rounded-2xl h-32 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 resize-none text-lg bg-white/80"
                          />
                          <button
                            onClick={() => handleAddAnswer(thread.id)}
                            className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-bold text-lg"
                          >
                            Post Answer
                          </button>
                        </div>

                        {/* Answers List */}
                        <div className="space-y-8">
                          {thread.answers.map(answer => (
                            <div key={answer.id} className="bg-gradient-to-r from-gray-50 to-slate-50 p-8 rounded-3xl border-2 border-gray-200 hover:shadow-xl transition-all duration-300">
                              <div className="flex gap-6">
                                <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-md">
                                  <button
                                    onClick={() => handleVote(thread.id, answer.id, 'up')}
                                    className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${answer.isUpvoted
                                        ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg'
                                        : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                                      }`}
                                  >
                                    <ArrowUp size={20} />
                                  </button>
                                  <span className="text-lg font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                                    {answer.upvotes - answer.downvotes}
                                  </span>
                                  <button
                                    onClick={() => handleVote(thread.id, answer.id, 'down')}
                                    className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${answer.isDownvoted
                                        ? 'text-white bg-gradient-to-r from-red-500 to-rose-600 shadow-lg'
                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                      }`}
                                  >
                                    <ArrowDown size={20} />
                                  </button>
                                </div>

                                <div className="flex-1">
                                  {editingAnswer === answer.id ? (
                                    <div className="space-y-4 mb-6">
                                      <textarea
                                        value={editedAnswerContent}
                                        onChange={(e) => setEditedAnswerContent(e.target.value)}
                                        className="w-full p-4 border-2 border-blue-300 rounded-xl h-32 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none text-lg"
                                      />
                                      <div className="flex gap-3">
                                        <button
                                          onClick={handleSaveAnswerEdit}
                                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold flex items-center gap-2"
                                        >
                                          <Save size={16} />
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingAnswer(null)}
                                          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold flex items-center gap-2"
                                        >
                                          <X size={16} />
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start justify-between mb-6">
                                        <p className="text-gray-700 text-xl leading-relaxed flex-1">{answer.content}</p>
                                        {canEdit(answer.author) && (
                                          <div className="flex items-center gap-2 ml-4">
                                            <button
                                              onClick={() => handleEditAnswer(answer)}
                                              className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-all duration-300"
                                              title="Edit answer"
                                            >
                                              <Edit3 size={14} />
                                            </button>
                                            <button
                                              onClick={() => setShowDeleteConfirm({ type: 'answer', id: answer.id })}
                                              className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-all duration-300"
                                              title="Delete answer"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}

                                  <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                          <User size={14} className="text-white" />
                                        </div>
                                        <span className="font-semibold text-gray-700">{answer.author}</span>
                                      </div>
                                      <span>•</span>
                                      <span className="text-gray-500">{answer.createdAt}</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => toggleCommentsExpansion(answer.id)}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all duration-300 font-semibold"
                                      >
                                        <MessageCircle size={16} />
                                        <span>{answer.comments.length} comments</span>
                                      </button>
                                      <button
                                        onClick={() => toggleCommentForm(answer.id)}
                                        className="flex items-center gap-2 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl transition-all duration-300 font-semibold"
                                      >
                                        <Reply size={16} />
                                        <span>Reply</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Comment Form */}
                                  {showCommentForm[answer.id] && (
                                    <div className="mb-6 bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-lg animate-in slide-in-from-top duration-300">
                                      <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                          <User size={16} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                          <textarea
                                            placeholder="Write a comment..."
                                            value={newComments[answer.id] || ''}
                                            onChange={(e) => setNewComments({ ...newComments, [answer.id]: e.target.value })}
                                            className="w-full p-4 border-2 border-gray-200 rounded-xl h-20 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none bg-gray-50"
                                          />
                                          <div className="flex gap-3 mt-4">
                                            <button
                                              onClick={() => handleAddComment(answer.id)}
                                              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold flex items-center gap-2"
                                            >
                                              <Send size={16} />
                                              Comment
                                            </button>
                                            <button
                                              onClick={() => toggleCommentForm(answer.id)}
                                              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Comments Section */}
                                  {expandedComments.has(answer.id) && answer.comments.length > 0 && (
                                    <div className="mt-8 space-y-4 pl-6 border-l-4 border-gradient-to-b from-blue-300 to-purple-300 bg-white/60 p-6 rounded-r-2xl animate-in slide-in-from-left duration-500">
                                      <h5 className="font-bold text-gray-700 mb-6 text-lg uppercase tracking-wide flex items-center gap-2">
                                        <MessageCircle size={18} />
                                        Comments ({answer.comments.length})
                                      </h5>
                                      {answer.comments.map((comment: ThreadComment) => (
                                        <div key={comment.id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
                                          <div className="flex gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                              <User size={16} className="text-white" />
                                            </div>
                                            <div className="flex-1">
                                              <p className="text-gray-700 mb-3 text-lg leading-relaxed">{comment.content}</p>
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                  <span className="font-semibold text-gray-700">{comment.author}</span>
                                                  <span>•</span>
                                                  <span>{comment.createdAt}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <button className="text-gray-400 hover:text-red-500 transition-colors duration-300 p-2 rounded-lg hover:bg-red-50">
                                                    <Heart size={16} />
                                                  </button>
                                                  <button className="text-gray-400 hover:text-blue-500 transition-colors duration-300 p-2 rounded-lg hover:bg-blue-50">
                                                    <Reply size={16} />
                                                  </button>
                                                  <button className="text-gray-400 hover:text-gray-600 transition-colors duration-300 p-2 rounded-lg hover:bg-gray-50">
                                                    <MoreHorizontal size={16} />
                                                  </button>
                                                </div>
                                              </div>
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