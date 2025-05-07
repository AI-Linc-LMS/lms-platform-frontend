import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/courses-content/courseContentApis';
import { submitContent } from '../../../../../services/courses-content/submitApis';
import FloatingAIButton from "../../floating-ai-button/FloatingAIButton";
import completedIcon from "../../../../../commonComponents/icons/sidebarIcon/completedIcon.png";
import { useNavigate } from 'react-router-dom';

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
  marks?: number; // Add marks if available
}

interface ArticleData {
  id: number;
  content_title: string;
  content_type: string;
  duration_in_minutes: number;
  order: number;
  details: ArticleDetails;
  marks?: number; 
  status: string; 
}

const ArticleCard: React.FC<ArticleCardProps> = ({ contentId, courseId, onMarkComplete }) => {
  const navigate = useNavigate();

  const { data: articleData, isLoading, error } = useQuery<ArticleData>({
    queryKey: ['article', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
  });
  console.log("articleData", articleData);

  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (articleData && typeof articleData.status === 'string') {
      setIsCompleted(articleData.status === 'complete');
    }
  }, [articleData]);

  console.log("isCompleted", isCompleted);
  const handleMarkComplete = async () => {
    try {
      console.log("mark complete");
      const res = await submitContent(1, courseId, contentId, 'Article', {});
      
      console.log("res", res);
      setIsCompleted(!isCompleted);
      onMarkComplete();
      navigate(0);
    } catch (err) {
      console.log(err);
      // handle error
    }
  };

  if (isLoading || error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-7 w-64 bg-gray-200 rounded mb-2"></div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-40 w-full bg-gray-100 rounded mb-4"></div>
        <div className="flex justify-end mt-8">
          <div className="h-12 w-56 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!articleData) {
    return <div className="flex justify-center items-center h-64">Article not found</div>;
  }

  // Use marks from details or articleData, fallback to 0
  const marks = articleData.details.marks ?? articleData.marks ?? 0;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm relative pb-10">
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
        <div className="flex flex-col items-end">
          <span className="text-lg text-semibold text-[#007B9F] bg-[#EFF9FC] px-2 py-1 rounded-md">{marks} Marks</span>
        </div>
      </div>

      <div className="prose max-w-none text-lg">
        <div dangerouslySetInnerHTML={{ __html: articleData.details.content }} />
      </div>

      {/* Floating Ask AI Button */}
      <FloatingAIButton
        onClick={() => console.log("Floating AI Button clicked")}
      />

      {!isCompleted &&
        <div className="flex justify-end mt-8">
          <button
            onClick={handleMarkComplete}
            className={`
            flex items-center gap-2
            px-6 py-6
            rounded-3xl
            text-base font-medium
            bg-[#12293A] text-white
            transition
          `}
            style={{ minWidth: 220, justifyContent: 'center' }}
          >
            <span>
              Mark as completed
            </span>
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full`}
            >
              <img
                src={completedIcon}
                alt="check"
                className={`w-6 h-6`}
              />
            </span>
          </button>
        </div>
      }
    </div>
  );
};

export default ArticleCard;
