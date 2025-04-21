import React, { useState, useEffect } from "react";
import { QuizQuestion } from "../../../../../commonComponents/sidebar/courseSidebar/component/data/mockQuizData";

interface QuizCardProps {
  quizData: QuizQuestion;
  onNext: () => void;
  nextTitle: string;
  questionNumber: number;
  totalQuestions: number;
  initialTimeSeconds?: number; // Optional prop to specify timer length
}

const QuizCard: React.FC<QuizCardProps> = ({
  quizData,
  onNext,
  nextTitle,
  questionNumber,
  totalQuestions,
  initialTimeSeconds = 5 * 60, // default 5 minutes
}) => {
  // Hooks
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeSeconds);

  // Countdown effect
  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) {
      // auto-submit when timer reaches zero
      setSubmitted(true);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, submitted]);

  // Format mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const handleSubmit = () => setSubmitted(true);

  const handleNext = () => {
    onNext();
    setSubmitted(false);
    setSelectedOption(null);
    setTimeLeft(initialTimeSeconds); // reset timer
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col">
      {/* Header: question X of Y, Next button above timer */}
      <div className="flex justify-between items-start mb-4">
        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-500">
          {`Question ${questionNumber} of ${totalQuestions}`}
        </span>
        <div className="flex flex-col items-end">
          {submitted && (
            <button
              onClick={handleNext}
              className="mb-2 px-4 py-1 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              {nextTitle}
            </button>
          )}
          <span className="text-sm text-gray-500">⏱ {formattedTime}</span>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-1">Quiz Section</h2>
      <p className="text-sm text-gray-500 mb-6">
        Attempting this quiz will unlock the next module. Good luck!!
      </p>

      {/* Question + marks */}
      <h3 className="text-md font-medium mb-2">Question {quizData.id}</h3>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-md text-gray-700">{quizData.question}</h3>
        <span className="text-xs bg-blue-100 text-[#255C79] px-2 py-1 rounded">
          {quizData.marks} marks
        </span>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {quizData.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = submitted && idx === quizData.correctAnswer;
          return (
            <div
              key={idx}
              onClick={() => !submitted && setSelectedOption(idx)}
              className={[
                "cursor-pointer border rounded-lg p-4",
                isSelected
                  ? "border-[#255C79] bg-blue-50 border-3"
                  : "border-gray-200 bg-white",
                isCorrect ? "border-green-600" : "",
              ].join(" ")}
            >
              {option}
            </div>
          );
        })}
      </div>

      {/* Submit or Explanation */}
      {!submitted ? (
        <div className="flex w-full">
          <div className="flex-1" />
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="px-30 py-3 bg-[#255C79] text-white rounded-lg"
          >
            Submit
          </button>
        </div>
      ) : (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
          <p
            className={`font-medium mb-3 ${
              selectedOption === quizData.correctAnswer
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {selectedOption === quizData.correctAnswer
              ? "Your submitted response was correct."
              : "Your submitted response was incorrect."}
          </p>

          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">Explanation</span>
          </div>

          <p className="text-gray-600">{quizData.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuizCard;
