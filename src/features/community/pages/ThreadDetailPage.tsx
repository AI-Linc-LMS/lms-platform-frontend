import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Calendar,
  Edit3,
  Trash2,
  Pin,
  Award,
  Eye,
  Share2,
  Bookmark,
  Flag,
  CheckCircle,
  AlertCircle,
  Bold,
  Italic,
  ChevronDown,
  ChevronUp,
  Code,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
  ImageIcon,
  Link,
  X,
  Copy,
  Check,
  MessageCircle,
  Info,
  Send
} from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

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

interface ImagePreview {
  src: string;
  alt: string;
}

// Helper function to copy text to clipboard
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Helper component for code blocks with syntax highlighting
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 bg-gray-800/50 hover:bg-gray-800/70 text-white rounded-md transition-colors"
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre className="!bg-gray-900 !p-4 !rounded-lg !mt-0">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

// Helper component for image preview
const ImagePreviewModal: React.FC<{
  image: ImagePreview | null;
  onClose: () => void;
}> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X size={24} />
        </button>
        <img
          src={image.src}
          alt={image.alt}
          className="w-full h-auto rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

// Enhanced RichContentDisplay component
const RichContentDisplay: React.FC<{
  content: string;
  className?: string;
}> = ({ content, className = '' }) => {
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Add click handlers for images
      const images = containerRef.current.getElementsByTagName('img');
      Array.from(images).forEach(img => {
        img.classList.add('cursor-zoom-in', 'hover:opacity-90', 'transition-opacity');
        img.addEventListener('click', () => {
          setImagePreview({ src: img.src, alt: img.alt });
        });
      });

      // Process code blocks
      const preElements = containerRef.current.getElementsByTagName('pre');
      Array.from(preElements).forEach(pre => {
        const code = pre.querySelector('code');
        if (code) {
          const language = code.className.replace('language-', '') || 'plaintext';
          const codeContent = code.textContent || '';
          const codeBlock = document.createElement('div');
          const root = createRoot(codeBlock);
          root.render(<CodeBlock code={codeContent} language={language} />);
          pre.parentNode?.replaceChild(codeBlock, pre);
        }
      });
    }
  }, [content]);

  return (
    <>
      <div
        ref={containerRef}
        className={`prose prose-sm max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <ImagePreviewModal
        image={imagePreview}
        onClose={() => setImagePreview(null)}
      />
    </>
  );
};

const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}> = ({ value, onChange, placeholder = "Start typing...", height = "h-32" }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [isComposing, setIsComposing] = useState(false);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content === '<br>' ? '' : content);
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

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      document.execCommand('insertParagraph', false);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    
    if (text) {
      const content = e.clipboardData.types.includes('text/html') 
        ? text 
        : text.split('\n').map(line => `<p>${line}</p>`).join('');
        
      document.execCommand('insertHTML', false, content);
      handleInput();
    }
  };

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
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
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
            onClick={() => handleCommand('formatBlock', '<blockquote>')}
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
          position: absolute;
        }
        [contenteditable] {
          position: relative;
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
          margin: 10px 0;
        }
        [contenteditable] pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 10px 0;
        }
        [contenteditable] p {
          margin: 0;
          min-height: 1.5em;
        }
        [contenteditable] p:empty:before {
          content: '';
          display: inline-block;
          min-width: 1px;
        }
        `
      }} />
    </div>
  );
};

const ThreadDetailPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();

  // Mock thread data - in real app, fetch from API
  const [thread, setThread] = useState<Thread>({
    id: '1',
    title: 'Building a Modern Web Application: Best Practices and Architecture',
    content: `
      <p>I'm working on a new web application and want to ensure I'm following the best practices for modern web development. Here are some specific areas I'd like to discuss:</p>
      
      <h3>1. Project Structure</h3>
      <p>Currently, I'm considering this structure:</p>
      
      <pre><code class="language-plaintext">
src/
  ├── components/
  │   ├── common/
  │   └── features/
  ├── hooks/
  ├── services/
  ├── utils/
  └── pages/
      </code></pre>
      
      <h3>2. State Management</h3>
      <p>I'm trying to decide between different state management approaches. Here's my current implementation:</p>
      
      <pre><code class="language-typescript">
// Global store setup
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

const initialState: AppState = {
  user: null,
  theme: 'light',
  notifications: []
};
      </code></pre>
      
      <h3>3. API Integration</h3>
      <p>For API calls, I've set up a custom hook:</p>
      
      <pre><code class="language-typescript">
const useApi = <T>(endpoint: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  // ... rest of the implementation
};
      </code></pre>
      
      <h3>4. UI Components</h3>
      <p>Here's a screenshot of my current component library:</p>
      <img src="https://images.unsplash.com/photo-1618788372246-79faff0c3742?w=800&auto=format&fit=crop" alt="UI Component Library Screenshot" />
      
      <p>What are your thoughts on these approaches? Are there any modern best practices I'm missing?</p>
    `,
    author: 'Sarah Chen',
    createdAt: '2024-01-15',
    upvotes: 45,
    downvotes: 2,
    tags: ['React', 'TypeScript', 'Architecture', 'Best Practices'],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isPinned: true,
    views: 1234,
    badge: 'Senior Developer',
    answers: [
      {
        id: 'a1',
        content: `
          <p>Great question! I'll address each point with some modern best practices:</p>

          <h4>1. Project Structure</h4>
          <p>Your structure is good, but I'd suggest a few additions:</p>

          <pre><code class="language-plaintext">
src/
  ├── components/
  │   ├── common/
  │   └── features/
  ├── hooks/
  ├── services/
  ├── utils/
  ├── pages/
  ├── types/        # TypeScript definitions
  ├── constants/    # App constants
  └── contexts/     # React contexts
          </code></pre>

          <h4>2. State Management</h4>
          <p>For modern React applications, consider using a combination of:</p>

          <pre><code class="language-typescript">
// Local state: useState for component-level state
const [isOpen, setIsOpen] = useState(false);

// Complex state: useReducer for feature-level state
const [state, dispatch] = useReducer(reducer, initialState);

// Global state: React Context for app-level state
export const AppContext = createContext<AppState>(initialState);
          </code></pre>

          <h4>3. API Integration</h4>
          <p>Here's an enhanced version of your API hook with better error handling and caching:</p>

          <pre><code class="language-typescript">
const useApi = <T>(endpoint: string, options = {}) => {
  const cache = useRef<Record<string, T>>({});
  const [state, setState] = useState({
    data: null as T | null,
    loading: true,
    error: null as Error | null
  });

  useEffect(() => {
    if (cache.current[endpoint]) {
      setState({
        data: cache.current[endpoint],
        loading: false,
        error: null
      });
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        cache.current[endpoint] = data;
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({ data: null, loading: false, error });
      }
    };

    fetchData();
  }, [endpoint]);

  return state;
};
          </code></pre>

          <h4>4. Component Architecture</h4>
          <p>Here's a diagram showing a recommended component architecture:</p>
          <img src="https://images.unsplash.com/photo-1618788372246-79faff0c3742?w=800&auto=format&fit=crop" alt="Component Architecture Diagram" />

          <p>Additional recommendations:</p>
          <ul>
            <li>Use TypeScript for better type safety and developer experience</li>
            <li>Implement proper error boundaries</li>
            <li>Set up comprehensive testing with React Testing Library</li>
            <li>Use CSS-in-JS or Tailwind CSS for styling</li>
          </ul>
        `,
        author: 'David Kim',
        createdAt: '2024-01-15',
        upvotes: 78,
        downvotes: 1,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        badge: 'Lead Developer',
        isAccepted: true,
        comments: [
          {
            id: 'c1',
            content: 'This is incredibly helpful! Could you elaborate more on error boundaries?',
            author: 'Emily Johnson',
            createdAt: '2024-01-15',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            upvotes: 12,
            downvotes: 0
          }
        ]
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
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  useEffect(() => {
    // Increment view count when component mounts
    if (thread) {
      setThread(prev => ({ ...prev, views: (prev.views || 0) + 1 }));
    }

    // Cleanup function to reset state when navigating away
    return () => {
      setNewAnswer('');
      setNewComment({});
      setShowCommentForm({});
      setEditingAnswer(null);
      setEditedContent('');
      setShowDeleteConfirm(null);
      setIsBookmarked(false);
    };
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
      setShowAnswerForm(false);
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
    // Navigate back to community immediately without state clearing
    navigate('/community');
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
              <RichContentDisplay
                content={thread.content}
                className="mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed text-gray-700"
              />

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
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <button
                onClick={() => setShowAnswerForm(!showAnswerForm)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                    <MessageCircle className="text-white" size={18} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Your Answer</h3>
                    <p className="text-sm text-gray-500">Share your knowledge with the community</p>
                  </div>
                </div>
                {showAnswerForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {/* Editor */}
            {showAnswerForm && (
              <div className="p-4 sm:p-6">
                <div className="prose prose-sm max-w-none mb-4">
                  <p className="text-gray-600 text-sm">
                    Format your answer using the toolbar below. You can:
                  </p>
                  <ul className="text-gray-600 text-sm list-disc pl-5">
                    <li>Add code snippets with syntax highlighting</li>
                    <li>Upload and embed images</li>
                    <li>Format text with bold, italic, and lists</li>
                    <li>Add links and quotes</li>
                  </ul>
                </div>

                <RichTextEditor
                  value={newAnswer}
                  onChange={setNewAnswer}
                  placeholder="Share your knowledge with code examples and images..."
                  height="h-64 sm:h-96"
                />

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Info size={16} />
                    <span>Your answer will be visible to the community</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setShowAnswerForm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddAnswer}
                      disabled={!newAnswer.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <Send size={16} />
                      Post Answer
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                            <div className="mt-3 sm:mt-4">
                              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="p-3 sm:p-4">
                                  <div className="prose prose-sm max-w-none mb-3">
                                    <p className="text-gray-600 text-sm">
                                      Add a comment to this answer. You can use formatting tools to include:
                                    </p>
                                    <ul className="text-gray-600 text-sm list-disc pl-5">
                                      <li>Code snippets</li>
                                      <li>Links and references</li>
                                      <li>Basic formatting</li>
                                    </ul>
                                  </div>

                                  <RichTextEditor
                                    value={newComment[answer.id] || ''}
                                    onChange={(content) => setNewComment({ ...newComment, [answer.id]: content })}
                                    placeholder="Add your comment..."
                                    height="h-32 sm:h-40"
                                  />

                                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-3">
                                    <button
                                      onClick={() => setShowCommentForm({ ...showCommentForm, [answer.id]: false })}
                                      className="px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium text-sm"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleAddComment(answer.id)}
                                      disabled={!newComment[answer.id]?.trim()}
                                      className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-1.5"
                                    >
                                      <MessageCircle size={14} />
                                      Add Comment
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Comments */}
                          {answer.comments.length > 0 && (
                            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                              {answer.comments.map((comment) => {
                                const commentAuthorAvatar = getUserAvatar(comment.author, comment.avatar);
                                return (
                                  <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                    <RichContentDisplay 
                                      content={comment.content}
                                      className="text-gray-700 mb-2 text-sm leading-relaxed"
                                    />
                                    <div className="flex items-center gap-2">
                                      {commentAuthorAvatar.avatar ? (
                                        <img
                                          src={commentAuthorAvatar.avatar}
                                          alt={comment.author}
                                          className="w-6 h-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className={`w-6 h-6 ${commentAuthorAvatar.color} rounded-full flex items-center justify-center text-white text-xs font-medium`}>
                                          {commentAuthorAvatar.initials}
                                        </div>
                                      )}
                                      <span className="font-medium text-gray-900 text-sm">{comment.author}</span>
                                      <span className="text-xs text-gray-500">{comment.createdAt}</span>
                                      
                                      {/* Vote buttons for comments */}
                                      <div className="flex items-center gap-1 ml-auto">
                                        <button
                                          onClick={() => handleVote('comment', comment.id, 'up')}
                                          className={`p-1 rounded transition-colors ${comment.isUpvoted ? 'text-orange-600 bg-orange-50' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'}`}
                                        >
                                          <ArrowUp size={14} />
                                        </button>
                                        <span className="text-xs font-medium text-gray-600">{comment.upvotes - comment.downvotes}</span>
                                        <button
                                          onClick={() => handleVote('comment', comment.id, 'down')}
                                          className={`p-1 rounded transition-colors ${comment.isDownvoted ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
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
