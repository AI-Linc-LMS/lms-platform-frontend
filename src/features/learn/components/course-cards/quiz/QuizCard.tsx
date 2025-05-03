import React, { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/courses-content/courseContentApis';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  marks: number;
}

interface QuizData {
  id: number;
  title: string;
  questions: QuizQuestion[];
  duration: string;
  marks: number;
}

interface QuizCardProps {
  contentId: number;
  courseId: number;
  isSidebarContentOpen: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ contentId, courseId, isSidebarContentOpen }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formattedTime, setFormattedTime] = useState("00:00");

  const { data, isLoading, error } = useQuery<QuizData>({
    queryKey: ['quiz', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId,
  });

  useEffect(() => {
    if (data?.duration) {
      const [minutes] = data.duration.split(' ');
      const totalSeconds = parseInt(minutes) * 60;
      const minutesLeft = Math.floor(totalSeconds / 60);
      const secondsLeft = totalSeconds % 60;
      setFormattedTime(`${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`);
    }
  }, [data?.duration]);

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
        Error loading quiz. Please try again later.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-500 p-4">
        No quiz data available.
      </div>
    );
  }

  const currentQuestion = data.questions[currentQuestionIndex];

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < data.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setSubmitted(false);
    }
  };

  return (
    <div className="flex gap-6 ml-2">
      {/* Left Panel */}
      {!isSidebarContentOpen && (
        <div className="w-1/3 ml-10">
          <div className="flex justify-between items-center text-sm text-gray-500 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Quiz {data.id}
              </h2>
              <h2 className="text-md font-semibold text-gray-800 mb-2">
                {data.title}
              </h2>
              <p className="text-xs text-gray-500">
                Solve real world questions and gain Insight knowledge.
              </p>
            </div>
            <span className="text-[14px]">⏱ {formattedTime}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {data.questions.map((question, index) => (
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
            const isCorrect = submitted && idx === currentQuestion.correctAnswer;

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

        {submitted && (
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Explanation:
            </div>
            <div className="text-sm text-gray-600">
              {currentQuestion.explanation}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null || submitted}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedOption === null || submitted
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-[#255C79] text-white hover:bg-[#1a4a5f]"
            }`}
          >
            Submit
          </button>

          {submitted && currentQuestionIndex < data.questions.length - 1 && (
            <button
              onClick={handleNextQuestion}
              className="px-4 py-2 bg-[#255C79] text-white rounded-md text-sm font-medium hover:bg-[#1a4a5f]"
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCard;