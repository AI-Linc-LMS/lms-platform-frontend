import React, { useEffect, useState } from "react";
import { quizData } from "../../../../../commonComponents/sidebar/courseSidebar/component/data/mockQuizData";

interface QuizCardProps {
  quizId: number;
  isSidebarContentOpen: boolean;
  
}

const QuizCard: React.FC<QuizCardProps> = ({
  quizId,
  isSidebarContentOpen,
}) => {
  const quiz = quizData.find((q) => q.id === quizId)!;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    setSelectedOption(null);
    setCurrentQuestionIndex(0);
    setSubmitted(false);
  }, [quizId]);

  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins default

  const currentQuestion = quiz.questions[currentQuestionIndex];

  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) {
      setSubmitted(true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, submitted]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleNext = () => {
    setSubmitted(false);
    setSelectedOption(null);
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleFinishQuiz = () => {
    alert("Quiz Finished!"); // Replace this with your finish quiz logic
  };

  return (
    <div className="flex gap-6 ml-2">
      {/* Left Panel */}
      {!isSidebarContentOpen && (
        <div className="w-1/3 ml-10">
          <div className="flex justify-between items-center text-sm text-gray-500 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Quiz {quiz.id}
              </h2>
              <h2 className="text-md font-semibold text-gray-800 mb-2">
                {quiz.title}
              </h2>
              <p className="text-xs text-gray-500">
                Solve real world questions and gain Insight knowledge.
              </p>
            </div>
            <span className="text-[14px]">⏱ {formattedTime}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentQuestionIndex(index);
                  setSubmitted(false);
                  setSelectedOption(null);
                }}
                className={`py-2 rounded-md border text-sm ${
                  index === currentQuestionIndex
                    ? "bg-blue-50 border-[#007B9F] text-[#255C79]"
                    : "bg-white border-gray-300 text-gray-600"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Right Panel */}
      <div className={`${isSidebarContentOpen ? "w-full" : "w-2/3"} `}>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestionIndex + 1}
          </span>
          <span className="text-xs bg-blue-100 text-[#255C79] px-2 py-1 rounded">
            {currentQuestion.marks} marks
          </span>
        </div>

        <h3 className="text-lg font-semibold mb-6 text-[#255C79]">
          {currentQuestion.question}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect =
              submitted && idx === currentQuestion.correctAnswer;

            return (
              <div
                key={idx}
                onClick={() => !submitted && setSelectedOption(idx)}
                className={`cursor-pointer border rounded-lg p-4 transition ${
                  isSelected
                    ? "border-[#255C79] bg-blue-50"
                    : "bg-white border-gray-200"
                } ${submitted && isCorrect ? "border-green-600" : ""}`}
              >
                {option}
              </div>
            );
          })}
        </div>

        {!submitted ? (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null}
              className="bg-[#255C79] text-white px-6 py-2 rounded-lg cursor-pointer"
            >
              Submit
            </button>
          </div>
        ) : (
          <>
            <div
              className={`mb-4 text-sm font-medium ${
                selectedOption === currentQuestion.correctAnswer
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {selectedOption === currentQuestion.correctAnswer
                ? "Your submitted response was correct."
                : "Your submitted response was incorrect."}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">Explanation</p>
              <p className="text-gray-600">{currentQuestion.explanation}</p>
            </div>

            <div className="flex justify-end mt-4">
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="bg-gray-800 text-white px-6 py-2 rounded-lg cursor-pointer"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleFinishQuiz}
                  className="bg-gray-800 text-white px-6 py-2 rounded-lg cursor-pointer"
                >
                  Finish Quiz
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizCard;