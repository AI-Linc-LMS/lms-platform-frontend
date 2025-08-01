import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Calendar,
  Filter,
  // Heart,
  Edit3,
  Trash2,
  Save,
  X,
  Menu,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  TrendingUp,
  Pin,
  Award,
  // Star,
  Eye,
  // BookOpen,
  // Zap
  Bold,
  Italic,
  Code,
  ImageIcon,
  Link,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo
} from 'lucide-react';

// Add sanitize-html for security
import sanitizeHtml from 'sanitize-html';

interface ThreadComment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  avatar?: string;
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

// Add sanitize options
const SANITIZE_OPTIONS = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img'
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'style', 'class'],
    pre: ['class', 'style'],
    code: ['class', 'style'],
    div: ['class', 'style'],
    '*': ['class', 'style']
  },
  allowedStyles: {
    '*': {
      'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'text-align': [/^left$/, /^right$/, /^center$/],
      'font-size': [/^\d+(?:px|em|%)$/],
      'margin': [/^\d+(?:px|em|%)$/],
      'padding': [/^\d+(?:px|em|%)$/],
      'max-width': [/^\d+(?:px|em|%)$/],
      'height': [/^auto$/, /^\d+(?:px|em|%)$/],
      'border-radius': [/^\d+(?:px|em|%)$/]
    }
  }
};

// Rich Text Editor Component
const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}> = ({ value, onChange, placeholder = "Start typing...", height = "h-32" }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = `<img src="${e.target?.result}" alt="Uploaded image" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 4px;" />`;
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertHTML', false, img);
          onChange(editorRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const insertCodeBlock = () => {
    const language = prompt('Enter programming language (optional):') || '';
    const code = prompt('Enter your code:');
    if (code) {
      const codeBlock = `<div style="margin: 10px 0;"><div style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px 4px 0 0; border-bottom: 1px solid #e9ecef; font-size: 12px; color: #6c757d; font-weight: 500;">${language || 'Code'}</div><pre style="background: #f8f9fa; padding: 12px; margin: 0; border-radius: 0 0 4px 4px; overflow-x: auto; border: 1px solid #e9ecef; border-top: none;"><code style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 14px; color: #212529; line-height: 1.4;">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></div>`;
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, codeBlock);
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const handleInput = () => {
    if (editorRef.current && !isComposing) {
      const content = editorRef.current.innerHTML;
      onChange(content === '<br>' ? '' : content);
    }
  };

  // Handle IME composition (for languages like Chinese, Japanese, Korean)
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    handleInput();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      document.execCommand('insertParagraph', false);
      e.preventDefault();
    }
  };

  // Handle paste to preserve formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    
    if (text) {
      // For plain text, wrap in paragraph tags if needed
      const content = e.clipboardData.types.includes('text/html') 
        ? text 
        : `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
        
      document.execCommand('insertHTML', false, content);
      handleInput();
    }
  };

  // Initialize and cleanup
  useEffect(() => {
    if (editorRef.current) {
      // Only update the innerHTML if the value has actually changed
      // and the editor doesn't have focus to prevent cursor jumping
      if (!editorRef.current.contains(document.activeElement)) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  return (
    <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* Toolbar */}
      <div className={`border-b border-gray-200 p-2 ${showToolbar ? 'block' : 'hidden sm:block'}`}>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => handleCommand('bold')}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('italic')}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={insertCodeBlock}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Code Block"
          >
            <Code size={16} />
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => handleCommand('insertUnorderedList')}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('insertOrderedList')}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('formatBlock', 'blockquote')}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Quote"
          >
            <Quote size={16} />
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={insertLink}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Insert Link"
          >
            <Link size={16} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Upload Image"
          >
            <ImageIcon size={16} />
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => handleCommand('undo')}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleCommand('redo')}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>
      </div>

      {/* Mobile toolbar toggle */}
      <div className="sm:hidden p-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowToolbar(!showToolbar)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <Edit3 size={14} />
          {showToolbar ? 'Hide' : 'Show'} formatting tools
          {showToolbar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={`w-full px-3 py-2 ${height} focus:outline-none overflow-y-auto text-sm sm:text-base`}
        style={{ minHeight: '80px' }}
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={!value ? placeholder : ''}
        suppressContentEditableWarning={true}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] {
          direction: ltr !important;
          text-align: left !important;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #6b7280;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 20px;
          margin: 10px 0;
        }
        [contenteditable] li {
          margin: 4px 0;
        }
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
        [contenteditable] strong {
          font-weight: bold;
        }
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        [contenteditable] pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        [contenteditable] p {
          margin: 0;
          min-height: 1.2em;
        }
        [contenteditable] p:empty::before {
          content: '';
          display: inline-block;
          min-width: 1px;
        }
        `
      }} />
    </div>
  );
};

// Helper component to display rich content
const RichContentDisplay: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        wordBreak: 'break-word',
      }}
    />
  );
};

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
              id: 'c1',
              content: 'Great explanation! This really helped me understand.',
              author: 'Mike Wilson',
              createdAt: '2024-01-15',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
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
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', tags: '' });
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [newAnswers, setNewAnswers] = useState<{ [key: string]: string }>({});
  const [editingThread, setEditingThread] = useState<string | null>(null);
  const [editedThreadData, setEditedThreadData] = useState({ title: '', content: '', tags: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'thread' | 'answer', id: string } | null>(null);
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
      // Sanitize the HTML content
      const sanitizedContent = sanitizeHtml(newThread.content, SANITIZE_OPTIONS);
      
      const thread: Thread = {
        id: Date.now().toString(),
        title: newThread.title,
        content: sanitizedContent,
        author: 'Current User',
        createdAt: new Date().toISOString().split('T')[0],
        upvotes: 0,
        downvotes: 0,
        answers: [],
        tags: newThread.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', // Default avatar
        views: 0
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

  // Helper function to generate user avatar with fallback
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

  // Helper function to get thread participants (unique answerers)
  const getThreadParticipants = (thread: Thread) => {
    const participants = new Set();
    participants.add(thread.author);
    thread.answers.forEach(answer => participants.add(answer.author));
    return Array.from(participants).slice(0, 4);
  };

  // Helper function to get user badge color
  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'Expert': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'Mentor': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'Pro': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'Senior': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleThreadClick = (threadId: string) => {
    // Use replace: false to ensure proper history management
    navigate(`/community/thread/${threadId}`, { replace: false });
  };

  // Add a method to handle back navigation if needed

  useEffect(() => {
    // Reset any expanded states when returning to community page
    setExpandedThreads(new Set());
    setShowMobileMenu(false);
    setShowMobileFilters(false);
    setEditingThread(null);
    setShowNewThreadForm(false);
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
                    } else {
                      handleDeleteAnswer(showDeleteConfirm.id);
                    }
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
                  <div className="prose prose-sm max-w-none mb-2">
                    <p className="text-gray-600 text-sm">
                      Format your content using the toolbar below. You can:
                    </p>
                    <ul className="text-gray-600 text-sm list-disc pl-5">
                      <li>Add code snippets with syntax highlighting</li>
                      <li>Upload and embed images</li>
                      <li>Format text with bold, italic, and lists</li>
                      <li>Add links and quotes</li>
                    </ul>
                  </div>
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
                  {allTags.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Popular tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {allTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const currentTags = new Set(newThread.tags.split(',').map(t => t.trim()).filter(t => t));
                              currentTags.add(tag);
                              setNewThread({ ...newThread, tags: Array.from(currentTags).join(', ') });
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 cursor-pointer transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
          {filteredThreads.map((thread) => {
            const authorAvatar = getUserAvatar(thread.author, thread.avatar);
            const participants = getThreadParticipants(thread);

            return (
              <div key={thread.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow mx-1 sm:mx-0">
                {/* Thread Status */}
                {(thread.isPinned || thread.isSolved) && (
                  <div className="px-3 sm:px-6 py-2 border-b border-gray-100 flex items-center gap-2">
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

                <div className="p-3 sm:p-6">
                  <div className="flex gap-2 sm:gap-4">
                    {/* Vote Section */}
                    <div className="flex flex-col items-center gap-1 min-w-[50px] sm:min-w-[60px]" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleVote(thread.id, null, 'up')}
                        className={`p-1.5 sm:p-2 rounded-md transition-colors ${thread.isUpvoted ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                          }`}
                      >
                        <ArrowUp size={16} className="sm:w-4 sm:h-4" />
                      </button>
                      <span className={`text-xs sm:text-sm font-semibold px-1.5 sm:px-2 py-1 rounded ${thread.upvotes - thread.downvotes > 0 ? 'text-orange-600' :
                        thread.upvotes - thread.downvotes < 0 ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                        {thread.upvotes - thread.downvotes}
                      </span>
                      <button
                        onClick={() => handleVote(thread.id, null, 'down')}
                        className={`p-1.5 sm:p-2 rounded-md transition-colors ${thread.isDownvoted ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                      >
                        <ArrowDown size={16} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleThreadClick(thread.id)}>
                      {editingThread === thread.id ? (
                        <div className="space-y-3 sm:space-y-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editedThreadData.title}
                            onChange={(e) => setEditedThreadData({ ...editedThreadData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                          />
                          <textarea
                            value={editedThreadData.content}
                            onChange={(e) => setEditedThreadData({ ...editedThreadData, content: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md h-20 sm:h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm sm:text-base"
                          />
                          <input
                            type="text"
                            value={editedThreadData.tags}
                            onChange={(e) => setEditedThreadData({ ...editedThreadData, tags: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                          />
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={handleSaveThreadEdit}
                              className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1 justify-center"
                            >
                              <Save size={14} />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingThread(null)}
                              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-1 justify-center"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2 sm:mb-3">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 pr-2">
                              {thread.title}
                            </h3>
                            {canEdit(thread.author) && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleEditThread(thread)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <Edit3 size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm({ type: 'thread', id: thread.id })}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <RichContentDisplay 
                            content={thread.content.length > 150 
                              ? `${thread.content.substring(0, 150)}...` 
                              : thread.content
                            }
                            className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base"
                          />

                        </>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4" onClick={(e) => e.stopPropagation()}>
                        {thread.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 cursor-pointer transition-colors">
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
                                alt={thread.author}
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-6 h-6 sm:w-8 sm:h-8 ${authorAvatar.color} rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium`}>
                                {authorAvatar.initials}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 text-xs sm:text-sm">{thread.author}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2">
                                <Calendar size={8} className="sm:w-2.5 sm:h-2.5" />
                                <span className="truncate max-w-[80px] sm:max-w-none">{thread.createdAt}</span>
                                {thread.views && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <Eye size={8} className="sm:w-2.5 sm:h-2.5" />
                                    <span className="hidden xs:inline">{thread.views}</span>
                                    <span className="xs:hidden">{thread.views}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                          {/* Participants */}
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              {participants.slice(0, 3).map((participant) => {
                                const participantName = participant as string;
                                const participantData = getUserAvatar(participantName);
                                const participantAnswer = thread.answers.find(a => a.author === participantName);
                                return (
                                  <div key={participantName} className="relative">
                                    {participantAnswer?.avatar ? (
                                      <img
                                        src={participantAnswer.avatar}
                                        alt={participantName}
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white object-cover"
                                        title={participantName}
                                      />
                                    ) : (
                                      <div
                                        className={`w-5 h-5 sm:w-6 sm:h-6 ${participantData.color} rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium`}
                                        title={participantName}
                                      >
                                        {participantData.initials}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {participants.length > 3 && (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                                  +{participants.length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500">
                              <span className="sm:hidden">{thread.answers.length}</span>
                              <span className="hidden sm:inline">{thread.answers.length} replies</span>
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleThreadExpansion(thread.id);
                            }}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${expandedThreads.has(thread.id)
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            <MessageCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                            <span className="hidden xs:inline">Quick</span>
                            <span className="hidden sm:inline">View</span>
                            {expandedThreads.has(thread.id) ?
                              <ChevronUp size={12} className="sm:w-3.5 sm:h-3.5" /> :
                              <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Quick Preview */}
                      {expandedThreads.has(thread.id) && (
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <span className="text-xs sm:text-sm text-gray-600">Quick preview</span>
                            <button
                              onClick={() => handleThreadClick(thread.id)}
                              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <span className="hidden sm:inline">View full discussion →</span>
                              <span className="sm:hidden">View full →</span>
                            </button>
                          </div>

                          {/* Add Answer */}
                          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <div className="mb-2">
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Your reply</label>
                              <RichTextEditor
                                value={newAnswers[thread.id] || ''}
                                onChange={(content) => setNewAnswers({ ...newAnswers, [thread.id]: content })}
                                placeholder="Share your knowledge with code examples and images..."
                                height="h-24 sm:h-28"
                              />
                            </div>
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleAddAnswer(thread.id)}
                                disabled={!newAnswers[thread.id]?.trim()}
                                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-xs sm:text-sm"
                              >
                                Reply
                              </button>
                            </div>
                          </div>

                          {/* Preview Answers */}
                          <div className="space-y-3 sm:space-y-4">
                            {thread.answers.slice(0, 2).map((answer) => {
                              const answerAuthorAvatar = getUserAvatar(answer.author, answer.avatar);
                              return (
                                <div key={answer.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                                  <div className="flex gap-2 sm:gap-3">
                                    <div className="flex flex-col items-center gap-1">
                                      <button
                                        onClick={() => handleVote(thread.id, answer.id, 'up')}
                                        className={`p-1 rounded transition-colors ${answer.isUpvoted ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'
                                          }`}
                                      >
                                        <ArrowUp size={12} className="sm:w-3.5 sm:h-3.5" />
                                      </button>
                                      <span className="text-xs font-medium text-gray-600">{answer.upvotes - answer.downvotes}</span>
                                      <button
                                        onClick={() => handleVote(thread.id, answer.id, 'down')}
                                        className={`p-1 rounded transition-colors ${answer.isDownvoted ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
                                          }`}
                                      >
                                        <ArrowDown size={12} className="sm:w-3.5 sm:h-3.5" />
                                      </button>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div 
                                        className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ 
                                          __html: answer.content.length > 120 
                                            ? `${answer.content.substring(0, 120)}...` 
                                            : answer.content 
                                        }}
                                      />

                                      <div className="flex items-center gap-2 flex-wrap">
                                        {answerAuthorAvatar.avatar ? (
                                          <img
                                            src={answerAuthorAvatar.avatar}
                                            alt={answer.author}
                                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className={`w-5 h-5 sm:w-6 sm:h-6 ${answerAuthorAvatar.color} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                                            {answerAuthorAvatar.initials}
                                          </div>
                                        )}
                                        <span className="font-medium text-gray-900 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{answer.author}</span>
                                        <span className="text-xs text-gray-500">{answer.createdAt}</span>
                                        {answer.badge && (
                                          <span className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full ${getBadgeColor(answer.badge)}`}>
                                            {answer.badge}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {thread.answers.length > 2 && (
                              <div className="text-center">
                                <button
                                  onClick={() => handleThreadClick(thread.id)}
                                  className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
                                >
                                  <span className="hidden sm:inline">View {thread.answers.length - 2} more replies →</span>
                                  <span className="sm:hidden">View {thread.answers.length - 2} more →</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
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

export default CommunityPage;