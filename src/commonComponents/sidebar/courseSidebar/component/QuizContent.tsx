import React from "react";
import { Quiz } from "./data/mockQuizData";
import defaultQuizIcon from "../../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import QuizBackButton from "../../../../assets/course_sidebar_assets/quizBackButton.png";
import { useQuery } from "@tanstack/react-query";
import { getCourseContent } from "../../../../services/courses-content/courseContentApis";

interface QuizContentProps {
  quizzes?: Quiz[]; // Make optional for backward compatibility
  selectedQuizId: number;
  onSelect: (quizId: number) => void;
  courseId?: number; // New prop for API integration
  clientId?: number; // New prop for API integration
}

// Interface for the API response data structure
interface MCQ {
  id: number;
  question_text: string;
  difficulty_level: string;
  options: string[];
  correct_option: string;
}

interface QuizDetails {
  id: number;
  title: string;
  instructions: string;
  durating_in_minutes: number;
  difficulty_level: string;
  mcqs: MCQ[];
}

// The API response structure
interface QuizApiResponse {
  id: number;
  content_type: string;
  content_title: string;
  duration_in_minutes: number;
  order: number;
  details: QuizDetails;
}

const QuizContent: React.FC<QuizContentProps> = ({
  quizzes: mockQuizzes,
  selectedQuizId,
  onSelect,
  courseId = 1, // Default to 1 if not provided
  clientId = 1, // Default to 1 if not provided
}) => {
  // Fetch quiz data from API if courseId is provided, otherwise use mock data
  const useApiData = !!courseId && !!selectedQuizId;
  
  const { data: apiQuizData, isLoading, error } = useQuery<QuizApiResponse>({
    queryKey: ['quiz', courseId, selectedQuizId],
    queryFn: () => getCourseContent(clientId, courseId, selectedQuizId),
    enabled: useApiData,
  });

  // If loading, show a loading state
  if (useApiData && isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-20 bg-gray-200 rounded w-full mb-2"></div>
      </div>
    );
  }

  // If error, show error state
  if (useApiData && error) {
    return (
      <div className="text-red-500 p-4">
        Failed to load quizzes. Please try again later.
      </div>
    );
  }

  // Use mock quizzes if no API data is available
  const quizzes = mockQuizzes || [];
  
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">
        Quizzes ({quizzes.length})
      </h2>
      <p className="text-[15px] text-gray-500 mb-4">
        Solve real-world problems and gain knowledge.
      </p>

      <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden">
        {quizzes.map((quiz, idx) => {
          const isSelected = quiz.id === selectedQuizId;
          const isLastItem = idx === quizzes.length - 1;
          
          // If this quiz is selected and we have API data, get the question count from API
          const questionCount = isSelected && apiQuizData?.details?.mcqs 
            ? apiQuizData.details.mcqs.length 
            : quiz.questions.length;
            
          // Use a placeholder submissions count based on API data if available
          const submissions = isSelected && apiQuizData 
            ? (apiQuizData.details.mcqs.length * 10) // Just a placeholder calculation
            : quiz.submissions;

          return (
            <div
              key={quiz.id}
              onClick={() => onSelect(quiz.id)}
              className={`cursor-pointer p-3 flex justify-between items-center transition ${
                isSelected ? "bg-blue-50 border-blue-300" : "hover:shadow"
              } ${!isLastItem ? "border-b border-gray-300" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  <img
                    src={defaultQuizIcon}
                    alt="Quiz Icon"
                    className="w-4 h-4"
                  />
                </span>
                <div>
                  <h3
                    className={`text-sm font-medium ${
                      isSelected ? "text-[#007B9F]" : "text-gray-800"
                    }`}
                  >
                    {isSelected && apiQuizData ? apiQuizData.details.title : quiz.title}
                  </h3>
                  <div className="text-xs text-gray-500 flex gap-2 mt-1">
                    <span>{quiz.marks} Marks</span>
                    <span>|</span>
                    <span>{questionCount} Questions</span>
                    <span>|</span>
                    <span>{submissions.toLocaleString()} Submissions</span>
                  </div>
                </div>
              </div>

              <div className="text-gray-400 text-sm">
                <img src={QuizBackButton} alt="Back to Quizzes" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizContent;
