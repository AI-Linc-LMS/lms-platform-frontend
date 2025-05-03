import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/courses-content/courseContentApis';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FloatingAIButton from "../../floating-ai-button/FloatingAIButton";

interface ArticleData {
  id: number;
  title: string;
  content: string;
  duration_in_minutes: number;
  order: number;
}

interface ArticleCardProps {
  contentId: number;
  courseId: number;
  onMarkComplete: () => void;
}

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ contentId, courseId, onMarkComplete }) => {
  const { data, isLoading, error } = useQuery<ArticleData>({
    queryKey: ['article', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6 mb-2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading article. Please try again later.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-500 p-4">
        No article data available.
      </div>
    );
  }

  console.log('Article Data:', data);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{data.title}</h1>
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="mr-4">⏱ {data.duration_in_minutes} minutes</span>
          <span>Order: {data.order}</span>
        </div>

        <div className="prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: CodeProps) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {data.content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onMarkComplete}
          className="px-6 py-2 bg-[#255C79] text-white rounded-lg font-medium hover:bg-[#1a4a5f] transition-colors"
        >
          Mark as Complete
        </button>
      </div>

      {/* Floating Ask AI Button */}
      <FloatingAIButton
        onClick={() => console.log("Floating AI Button clicked")}
      />
    </div>
  );
};

export default ArticleCard;
