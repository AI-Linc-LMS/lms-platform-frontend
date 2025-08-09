import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { Thread, Answer } from '../types';
import ThreadHeader from '../components/ThreadHeader';
import AnswerForm from '../components/AnswerForm';
import AnswerCard from '../components/AnswerCard';

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'answer' | 'comment', id: string } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // Increment view count when component mounts
    if (thread) {
      setThread(prev => ({ ...prev, views: (prev.views || 0) + 1 }));
    }
  }, [threadId]);

  const getParticipants = (): string[] => {
    const participants = new Set<string>();
    participants.add(thread.author);
    thread.answers.forEach(answer => {
      participants.add(answer.author);
      answer.comments?.forEach(comment => participants.add(comment.author));
    });
    return Array.from(participants).slice(0, 8);
  };

  const handleVoteThread = (type: 'up' | 'down') => {
    setThread(prev => ({
      ...prev,
      upvotes: type === 'up' ? prev.upvotes + 1 : prev.upvotes,
      downvotes: type === 'down' ? prev.downvotes + 1 : prev.downvotes,
      isUpvoted: type === 'up' ? true : prev.isUpvoted,
      isDownvoted: type === 'down' ? true : prev.isDownvoted
    }));
  };

  const handleVoteAnswer = (answerId: string, type: 'up' | 'down') => {
    setThread(prev => ({
      ...prev,
      answers: prev.answers.map(answer =>
        answer.id === answerId
          ? {
            ...answer,
            upvotes: type === 'up' ? answer.upvotes + 1 : answer.upvotes,
            downvotes: type === 'down' ? answer.downvotes + 1 : answer.downvotes,
            isUpvoted: type === 'up' ? true : answer.isUpvoted,
            isDownvoted: type === 'down' ? true : answer.isDownvoted
          }
          : answer
      )
    }));
  };

  const handleAddAnswer = async (content: string) => {
    const answer: Answer = {
      id: Date.now().toString(),
      content,
      author: 'Current User',
      createdAt: new Date().toISOString().split('T')[0],
      upvotes: 0,
      downvotes: 0,
      comments: [],
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    };

    setThread(prev => ({
      ...prev,
      answers: [...prev.answers, answer]
    }));

    // Scroll to the new answer
    setTimeout(() => {
      document.getElementById(answer.id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleEditAnswer = (answerId: string, content: string) => {
    setThread(prev => ({
      ...prev,
      answers: prev.answers.map(answer =>
        answer.id === answerId ? { ...answer, content } : answer
      )
    }));
  };

  const handleDeleteAnswer = (answerId: string) => {
    setThread(prev => ({
      ...prev,
      answers: prev.answers.filter(answer => answer.id !== answerId)
    }));
    setShowDeleteConfirm(null);
  };

  const handleAddComment = (answerId: string, content: string) => {
    const comment = {
      id: Date.now().toString(),
      content,
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
  };

  const handleBackToCommunity = () => {
    navigate('/community');
  };

  const canEdit = (author: string) => author === 'Current User';

  if (!thread) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
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
      </div>
    );
  }

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
                  onClick={() => {
                    if (showDeleteConfirm.type === 'answer') {
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
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Thread Header */}
        <ThreadHeader
          thread={thread}
          isBookmarked={isBookmarked}
          onVote={handleVoteThread}
          onToggleBookmark={() => setIsBookmarked(!isBookmarked)}
          participants={participants}
        />

        {/* Answers Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              <span className="sm:hidden">{thread.answers.length} Replies</span>
              <span className="hidden sm:inline">{thread.answers.length} Answers</span>
            </h2>
          </div>

          {/* Add Answer Form */}
          <AnswerForm onSubmit={handleAddAnswer} />

          {/* Answers List */}
          {thread.answers.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              onVote={(answerId, type) => handleVoteAnswer(answerId, type)}
              onEdit={handleEditAnswer}
              onDelete={(answerId) => setShowDeleteConfirm({ type: 'answer', id: answerId })}
              onAddComment={handleAddComment}
              canEdit={canEdit}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;
