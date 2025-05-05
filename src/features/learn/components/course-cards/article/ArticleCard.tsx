import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/courses-content/courseContentApis';
import FloatingAIButton from "../../floating-ai-button/FloatingAIButton";
import { useMediaQuery } from "../../../../../hooks/useMediaQuery";

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

const ArticleCard: React.FC<ArticleCardProps> = ({ contentId, courseId, onMarkComplete }) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { data: articleData, isLoading, error } = useQuery<ArticleData>({
    queryKey: ['article', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
  });

  console.log('Article Data:', articleData);
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
    <div className="max-w-4xl mx-auto p-3 md:p-6 bg-white rounded-lg shadow-sm">
      <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex justify-between items-center'} mb-6`}>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold capitalize text-gray-800 mb-2">
            {articleData.content_title}
          </h1>
          <div className="flex items-center gap-4 text-xs md:text-sm text-gray-500">
            <span>⏱ {articleData.duration_in_minutes} min</span>
            <span>•</span>
            <span>📚 {articleData.details.difficulty_level}</span>
          </div>
        </div>
        <button
          onClick={handleMarkComplete}
          disabled={isCompleted}
          className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium ${
            isCompleted
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#255C79] text-white hover:bg-[#1a4a5f]'
          } ${isMobile ? 'self-start' : ''}`}
        >
          {isCompleted ? 'Completed' : 'Mark as Complete'}
        </button>
      </div>

      <div className="prose max-w-none text-sm md:text-lg prose-headings:text-lg md:prose-headings:text-xl prose-p:text-sm md:prose-p:text-base">
        <div dangerouslySetInnerHTML={{ __html: articleData.details.content }} />
      </div>

      {/* Floating Ask AI Button */}
      <FloatingAIButton
        onClick={() => console.log("Floating AI Button clicked")}
      />
    </div>
  );
};

export default ArticleCard;
