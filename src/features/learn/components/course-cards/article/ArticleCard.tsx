import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/courses-content/courseContentApis';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FloatingAIButton from "../../floating-ai-button/FloatingAIButton";

interface ArticleCardProps {
  contentId: number;
  courseId: number;
  onMarkComplete: () => void;
}

interface ArticleDetails {
  id: number;
  title: string;
  content: string;
  difficulty_level: string;
}

interface ArticleData {
  id: number;
  content_title: string;
  content_type: string;
  duration_in_minutes: number;
  order: number;
  details: ArticleDetails;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ contentId, courseId, onMarkComplete }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const { data: articleData, isLoading, error } = useQuery<ArticleData>({
    queryKey: ['article', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
  });

  const handleMarkComplete = () => {
    setIsCompleted(true);
    onMarkComplete();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">Error loading article</div>;
  }

  if (!articleData) {
    return <div className="flex justify-center items-center h-64">Article not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold capitalize text-gray-800 mb-2">
            {articleData.content_title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>⏱ {articleData.duration_in_minutes} min</span>
            <span>•</span>
            <span>📚 {articleData.details.difficulty_level}</span>
          </div>
        </div>
        <button
          onClick={handleMarkComplete}
          disabled={isCompleted}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isCompleted
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#255C79] text-white hover:bg-[#1a4a5f]'
          }`}
        >
          {isCompleted ? 'Completed' : 'Mark as Complete'}
        </button>
      </div>

      <div className="prose max-w-none text-lg">
        <ReactMarkdown>{articleData.details.content}</ReactMarkdown>
      </div>

      {/* Floating Ask AI Button */}
      <FloatingAIButton
        onClick={() => console.log("Floating AI Button clicked")}
      />
    </div>
  );
};

export default ArticleCard;
