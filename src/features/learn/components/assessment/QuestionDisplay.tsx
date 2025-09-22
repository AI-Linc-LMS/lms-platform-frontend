import React from "react";
import { Question } from "../../hooks/useAssessment";

interface QuestionDisplayProps {
  currentQuestion: Question;
  currentQuestionIndex: number;
  totalQuestions: number;
  selectedOption: string | null;
  handleOptionSelect: (option: string) => void;
}

const optionLetters = ["A", "B", "C", "D"];

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  selectedOption,
  handleOptionSelect,
}) => {
  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4 gap-2 sm:gap-0">
        <span className="text-xs sm:text-sm text-gray-500">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
        <span className="text-xs bg-blue-100 text-[var(--default-primary)] px-2 py-1 rounded">
          {currentQuestion?.difficulty_level || ""}
        </span>
      </div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
        {currentQuestion?.question_text}
      </h2>
      <div className="space-y-2 sm:space-y-3">
        {currentQuestion?.options?.map((option: string, idx: number) => {
          const optionLetter = optionLetters[idx];
          const isSelected = selectedOption === optionLetter;
          return (
            <div
              key={idx}
              onClick={() => handleOptionSelect(optionLetter)}
              className={`cursor-pointer border rounded-lg p-3 sm:p-4 transition ${
                isSelected
                  ? "border-[var(--default-primary)] bg-blue-50"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <span className="font-medium mr-2 sm:mr-3 text-[var(--default-primary)]">
                  {optionLetter}.
                </span>
                <span className="text-gray-800 text-sm sm:text-base">
                  {option}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionDisplay;
