import React from "react";
import { Quiz } from "./data/mockQuizData";
import defaultQuizIcon from "../../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import QuizBackButton from "../../../../assets/course_sidebar_assets/QuizBackButton.png";

interface QuizContentProps {
  quizzes: Quiz[];
  selectedQuizId: number;
  onSelect: (quizId: number) => void;
}

const QuizContent: React.FC<QuizContentProps> = ({
  quizzes,
  selectedQuizId,
  onSelect,
}) => {
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
                    {quiz.title}
                  </h3>
                  <div className="text-xs text-gray-500 flex gap-2 mt-1">
                    <span>{quiz.marks} Marks</span>
                    <span>|</span>
                    <span>{quiz.questions.length} Questions</span>
                    <span>|</span>
                    <span>{quiz.submissions.toLocaleString()} Submissions</span>
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
