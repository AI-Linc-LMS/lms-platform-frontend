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
    <div className="w-full md:w-1/4 bg-white rounded-lg p-4 sm:p-6 shadow-sm h-fit mb-4 md:mb-0">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
        Questions
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-3 gap-2">
        {questionsData.map((_, index) => (
          <button
            key={index}
            onClick={() => navigateToQuestion(index)}
            className={`py-2 px-2 sm:px-3 rounded-md border text-xs sm:text-sm font-medium transition ${getQuestionButtonStyle(
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