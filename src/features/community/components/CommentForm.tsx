import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, Info, Send } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content);
      setContent('');
      setShowForm(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <MessageCircle className="text-white" size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Your Comment</h3>
              <p className="text-sm text-gray-500">Share your knowledge with the community</p>
            </div>
          </div>
          {showForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Editor */}
      {showForm && (
        <div className="p-4 sm:p-6">
          <div className="prose prose-sm max-w-none mb-4">
            <p className="text-gray-600 text-sm">
              Format your comment using the toolbar below. You can:
            </p>
            <ul className="text-gray-600 text-sm list-disc pl-5">
              <li>Add code snippets with syntax highlighting</li>
              <li>Upload and embed images</li>
              <li>Format text with bold, italic, and lists</li>
              <li>Add links and quotes</li>
            </ul>
          </div>

          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Share your knowledge with code examples and images..."
            height="h-64 sm:h-96"
            darkMode={false}
          />

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Info size={16} />
              <span>Your comment will be visible to the community</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Post Comment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentForm;
