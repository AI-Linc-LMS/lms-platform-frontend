import React, { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/courses-content/courseContentApis';

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

interface QuizData {
  id: number;
  content_type: string;
  content_title: string;
  duration_in_minutes: number;
  order: number;
  details: QuizDetails;
}

interface QuizCardProps {
  contentId: number;
  courseId: number;
  isSidebarContentOpen: boolean;
  quizData?: QuizData; // Optional prop for direct data injection
}

const QuizCard: React.FC<QuizCardProps> = ({ contentId, courseId, isSidebarContentOpen, quizData: injectedData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formattedTime, setFormattedTime] = useState("00:00");
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const { data: fetchedData, isLoading, error } = useQuery<QuizData>({
    queryKey: ['quiz', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId && !injectedData,
  });

  // Use either injected data or fetched data
  const data = injectedData || fetchedData;

  useEffect(() => {
    if (data?.duration_in_minutes) {
      const totalSeconds = data.duration_in_minutes * 60;
      const minutesLeft = Math.floor(totalSeconds / 60);
      const secondsLeft = totalSeconds % 60;
      setFormattedTime(`${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`);
    }
  }, [data?.duration_in_minutes]);

  if (isLoading && !injectedData) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6 mb-2"></div>
      </div>
    );
  }

  if ((error && !injectedData) || !data) {
    return (
      <div className="text-red-500 p-4">
        Error loading quiz. Please try again later.
      </div>
    );
  }

  const mcqs = data.details.mcqs;
  const currentQuestion = mcqs[currentQuestionIndex];
  const optionLetters = ['A', 'B', 'C', 'D'];

  const handleOptionSelect = (option: string) => {
    if (!submitted) {
      setSelectedOption(option);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (selectedOption === currentQuestion.correct_option) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < mcqs.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setSubmitted(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScore(0);
    setQuizCompleted(false);
  };

  if (quizCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-[#255C79] mb-4">Quiz Completed!</h2>
        <p className="text-lg mb-6">
          Your score: <span className="font-bold">{score}/{mcqs.length}</span> ({Math.round((score / mcqs.length) * 100)}%)
        </p>
        <button
          onClick={resetQuiz}
          className="px-4 py-2 bg-[#255C79] text-white rounded-md text-sm font-medium hover:bg-[#1a4a5f]"
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6 ml-2">
      {/* Left Panel */}
      {!isSidebarContentOpen && (
        <div className="w-1/3 ml-10">
          <div className="flex justify-between items-center text-sm text-gray-500 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {data.content_type} {data.id}
              </h2>
              <h2 className="text-md font-semibold text-gray-800 mb-2">
                {data.content_title}
              </h2>
              <p className="text-xs text-gray-500">
                {data.details.instructions || "Solve real world questions and gain insight knowledge."}
              </p>
            </div>
            <span className="text-[14px]">⏱ {formattedTime}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {mcqs.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!submitted || currentQuestionIndex === index) {
                    setCurrentQuestionIndex(index);
                    setSubmitted(false);
                    setSelectedOption(null);
                  }
                }}
                className={`py-2 rounded-md border text-sm ${
                  index === currentQuestionIndex
                    ? "bg-blue-50 border-[#007B9F] text-[#255C79]"
                    : "bg-white border-gray-300 text-gray-600"
                }`}
                disabled={submitted && currentQuestionIndex !== index}
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
            {currentQuestion.difficulty_level}
          </span>
        </div>

        <h3 className="text-lg font-semibold mb-6 text-[#255C79]">
          {currentQuestion.question_text}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {currentQuestion.options.map((option, idx) => {
            const optionLetter = optionLetters[idx];
            const isSelected = selectedOption === optionLetter;
            const isCorrect = submitted && optionLetter === currentQuestion.correct_option;

            return (
              <div
                key={idx}
                onClick={() => handleOptionSelect(optionLetter)}
                className={`cursor-pointer border rounded-lg p-4 transition ${
                  isSelected
                    ? "border-[#255C79] bg-blue-50"
                    : "bg-white border-gray-200"
                } ${submitted && isCorrect ? "border-green-600 bg-green-50" : ""} 
                  ${submitted && isSelected && !isCorrect ? "border-red-600 bg-red-50" : ""}`}
              >
                <span className="font-medium mr-2">{optionLetter}.</span> {option}
              </div>
            );
          })}
        </div>

        {submitted && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {selectedOption === currentQuestion.correct_option ? 
                <span className="text-green-600">Correct!</span> : 
                <span className="text-red-600">Incorrect. The correct answer is {currentQuestion.correct_option}.</span>
              }
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

          {submitted && (
            <button
              onClick={handleNextQuestion}
              className="px-4 py-2 bg-[#255C79] text-white rounded-md text-sm font-medium hover:bg-[#1a4a5f]"
            >
              {currentQuestionIndex < mcqs.length - 1 ? "Next Question" : "Finish Quiz"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizCard;