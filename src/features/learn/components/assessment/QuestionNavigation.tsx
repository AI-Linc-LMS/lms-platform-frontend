import React from "react";
import { Question } from "../../hooks/useAssessment";

interface QuestionNavigationProps {
  questionsData: Question[];
  navigateToQuestion: (index: number) => void;
  getQuestionButtonStyle: (index: number) => string;
  getAnsweredCount: () => number;
  getRemainingCount: () => number;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  questionsData,
  navigateToQuestion,
  getQuestionButtonStyle,
  getAnsweredCount,
  getRemainingCount,
}) => {
  return (
    <div className="w-full bg-white rounded-lg p-4 sm:p-6 shadow-sm h-fit mb-4 lg:mb-0">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
        Questions
      </h3>
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {questionsData.map((_, index) => (
          <button
            key={index}
            onClick={() => navigateToQuestion(index)}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md border text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 ${getQuestionButtonStyle(
              index
            )}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
          <div>Total Questions: {questionsData.length}</div>
          <div>Answered: {getAnsweredCount()}</div>
          <div>Remaining: {getRemainingCount()}</div>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigation; 