import React, { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/courses-content/courseContentApis';
import { submitContent } from "../../../../../services/courses-content/submitApis";
import { useNavigate } from "react-router-dom";

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

interface UserAnswer {
  questionIndex: number;
  selectedOption: string | null;
  isCorrect: boolean;
  questionId: number;
}

interface QuizCardProps {
  contentId: number;
  courseId: number;
  isSidebarContentOpen: boolean;
  quizData?: QuizData;
  onSubmission?: (contentId: number) => void;
  onReset?: (contentId: number) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({
  contentId,
  courseId,
  isSidebarContentOpen,
  quizData: injectedData,
  onSubmission,
  onReset
}) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formattedTime, setFormattedTime] = useState("00:00");
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const { data: fetchedData, isLoading, error } = useQuery<QuizData>({
    queryKey: ['quiz', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId && !injectedData,
  });

  console.log("quiz Data", fetchedData);

  // Use either injected data or fetched data
  const data = injectedData || fetchedData;
  const optionLetters = ['A', 'B', 'C', 'D'];

  console.log("userAnswers", userAnswers);
  useEffect(() => {
    if (data?.details?.mcqs) {
      setTotalQuestions(data.details.mcqs.length);
      // Initialize user answers array
      setUserAnswers(data.details.mcqs.map((_, index) => ({
        questionId: data.details.mcqs[index].id,
        isCorrect: false,
        questionIndex: index,
        selectedOption: null,
      })));
    }
  }, [data]);

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

  const updateUserAnswer = (index: number, option: string, isCorrect: boolean) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index] = {
      ...updatedAnswers[index],
      selectedOption: option,
      isCorrect
    };
    setUserAnswers(updatedAnswers);
  };

  const handleOptionSelect = (option: string) => {
    if (!submitted) {
      setSelectedOption(option);

      // Update userAnswers state
      const updatedAnswers = [...userAnswers];
      updatedAnswers[currentQuestionIndex] = {
        ...updatedAnswers[currentQuestionIndex],
        selectedOption: option
      };
      setUserAnswers(updatedAnswers);
    }
  };

  const handleNext = () => {
    // Mark as submitted internally to track answers
    setSubmitted(true);
    setTotalSubmissions(prev => prev + 1);

    const isCorrect = selectedOption === currentQuestion.correct_option;

    // Update userAnswers state with selection
    updateUserAnswer(currentQuestionIndex, selectedOption!, isCorrect);

    // Notify parent component about submission
    if (onSubmission) {
      onSubmission(contentId);
    }

    // Move to next question or finish quiz
    if (currentQuestionIndex < mcqs.length - 1) {
      navigateToNext();
    } else {
      finishQuiz();
    }
  };

  const navigateToNext = () => {
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setSelectedOption(userAnswers[nextIndex].selectedOption);
    setSubmitted(false);
  };

  const finishQuiz = async () => {
    // Calculate total score when quiz is completed
    const response = await submitContent(1, courseId, contentId, "Quiz", { userAnswers });
    console.log("response", response);
    if (response === 201) {
      const totalCorrect = userAnswers.filter(answer => answer.isCorrect).length;
      setScore(totalCorrect);
      setQuizCompleted(true);
    } else {
      console.log("error", response);
    }
  };

  const resetQuiz = () => {
    navigate(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScore(0);
    setQuizCompleted(false);
    setTotalSubmissions(0);
    setIsReviewing(false);

    // Reset userAnswers
    setUserAnswers(mcqs.map((_, index) => ({
      questionId: mcqs[index].id,
      questionIndex: index,
      selectedOption: null,
      isCorrect: false
    })));

    // Notify parent component about reset
    if (onReset) {
      onReset(contentId);
    }
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setSelectedOption(userAnswers[index].selectedOption);
    setSubmitted(!!userAnswers[index].selectedOption);
  };

  const handleBack = () => {
    if (isReviewing) {
      setIsReviewing(false);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(userAnswers[currentQuestionIndex - 1].selectedOption);
      setSubmitted(!!userAnswers[currentQuestionIndex - 1].selectedOption);
    }
  };

  const reviewAnswers = () => {
    setIsReviewing(true);
  };

  const getQuestionButtonStyle = (index: number) => {
    const answer = userAnswers[index];

    if (index === currentQuestionIndex && !isReviewing) {
      return "bg-blue-50 border-[#007B9F] text-[#255C79]";
    }

    // Show correct/incorrect colors only after quiz is completed
    if (quizCompleted) {
      if (answer.selectedOption) {
        return answer.isCorrect
          ? "bg-green-100 border-green-500 text-green-700"
          : "bg-red-100 border-red-500 text-red-700";
      }
    } else {
      // During the quiz, just show #2A8CB0 color for answered questions
      if (answer.selectedOption) {
        return "bg-[#2A8CB0] border-[#2A8CB0] text-white";
      }
    }

    return "bg-white border-gray-300 text-gray-600";
  };

  if (quizCompleted) {
    return (
      <div className="p-8 bg-white rounded-lg shadow">
        <div className="flex flex-col">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#255C79] mb-2">Your Quiz Review</h2>
            <div className="text-sm text-gray-500 flex gap-2 mb-6">
              <span>Your Score: {score}</span>
              <span>|</span>
              <span>{totalQuestions} Questions</span>
            </div>

            {/* Question blocks shown only in sidebar, not in main review area */}
            {!isReviewing && (
              <div className="grid grid-cols-6 gap-2 mb-8">
                {mcqs.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsReviewing(true);
                      navigateToQuestion(index);
                    }}
                    className={`py-2 rounded-md border text-sm ${getQuestionButtonStyle(index)}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {renderReviewContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 ml-2">
      {/* Left Panel */}
      {!isSidebarContentOpen && renderSidebar()}

      {/* Right Panel */}
      <div className={`${isSidebarContentOpen ? "w-full" : "w-2/3"} `}>
        {isSidebarContentOpen && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[#255C79] mb-1">
              {data.content_title}
            </h2>
            <div className="text-xs text-gray-500 flex gap-2 mb-3">
              <span>{mcqs.length} Marks</span>
              <span>|</span>
              <span>{totalQuestions} Questions</span>
              <span>|</span>
              <span>{totalSubmissions} Submissions</span>
            </div>
          </div>
        )}

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

            return (
              <div
                key={idx}
                onClick={() => handleOptionSelect(optionLetter)}
                className={`cursor-pointer border rounded-lg p-4 transition ${isSelected
                    ? "border-[#255C79] bg-blue-50"
                    : "bg-white border-gray-200"
                  }`}
              >
                <span className="font-medium mr-2">{optionLetter}.</span> {option}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          {currentQuestionIndex > 0 && (
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-[#255C79] text-[#255C79] rounded-md text-sm font-medium hover:bg-blue-50"
            >
              Back
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className={`px-4 py-2 rounded-md text-sm font-medium ml-auto ${selectedOption === null
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-[#255C79] text-white hover:bg-[#1a4a5f]"
              }`}
          >
            {currentQuestionIndex < mcqs.length - 1 ? "Next" : "Finish Quiz"}
          </button>
        </div>
      </div>
    </div>
  );

  function renderSidebar() {
    // Add a safety check for data
    if (!data) return null;

    return (
      <div className="w-1/3 ml-10">
        <div className="flex justify-between items-center text-sm text-gray-500 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {data.content_type} {data.id}
            </h2>
            <h2 className="text-md font-semibold text-gray-800 mb-2">
              {data.content_title}
            </h2>
            <div className="text-xs text-gray-500 flex gap-2 mb-2">
              <span>{mcqs.length} Marks</span>
              <span>|</span>
              <span>{totalQuestions} Questions</span>
              <span>|</span>
              <span>{totalSubmissions} Submissions</span>
            </div>
            <p className="text-xs text-gray-500">
              {data.details.instructions || "Solve real world questions and gain insight knowledge."}
            </p>
          </div>
          <span className="text-[14px]">⏱ {formattedTime}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {mcqs.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!submitted || currentQuestionIndex === index) {
                  navigateToQuestion(index);
                }
              }}
              className={`py-2 rounded-md border text-sm ${getQuestionButtonStyle(index)}`}
              disabled={submitted && currentQuestionIndex !== index && !userAnswers[index].selectedOption}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderReviewContent() {
    if (isReviewing) {
      return (
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Question {currentQuestionIndex + 1}</h3>
            <span className="text-xs bg-blue-100 text-[#255C79] px-2 py-1 rounded">
              {currentQuestion.difficulty_level}
            </span>
          </div>

          <h3 className="text-lg font-medium mb-6">
            {currentQuestion.question_text}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const optionLetter = optionLetters[idx];
              const isSelected = userAnswers[currentQuestionIndex].selectedOption === optionLetter;
              const isCorrect = optionLetter === currentQuestion.correct_option;

              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${isSelected && isCorrect
                      ? "border-green-600 bg-green-50"
                      : isSelected && !isCorrect
                        ? "border-red-600 bg-red-50"
                        : isCorrect
                          ? "border-green-600 bg-green-50"
                          : "bg-white border-gray-200"
                    }`}
                >
                  <span className="font-medium mr-2">{optionLetter}.</span> {option}
                  {isCorrect && <span className="ml-2 text-green-600">✓</span>}
                </div>
              );
            })}
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">
              {userAnswers[currentQuestionIndex].isCorrect ?
                <span className="text-green-600">Your response was correct!</span> :
                <span className="text-red-600">Your response was incorrect. The correct answer is {currentQuestion.correct_option}.</span>
              }
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-[#255C79] text-[#255C79] rounded-md text-sm font-medium hover:bg-blue-50"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (currentQuestionIndex < mcqs.length - 1) {
                  navigateToQuestion(currentQuestionIndex + 1);
                } else {
                  setIsReviewing(false);
                }
              }}
              className="px-4 py-2 bg-[#255C79] text-white rounded-md text-sm font-medium hover:bg-[#1a4a5f]"
            >
              {currentQuestionIndex < mcqs.length - 1 ? "Next" : "Done"}
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Quiz Result</h3>
          <p className="text-lg mb-6">
            Your score: <span className="font-bold">{score}/{mcqs.length}</span> ({Math.round((score / mcqs.length) * 100)}%)
          </p>
          <p className="text-sm text-gray-600 mb-8">
            Your submitted response was correct.
          </p>
          <div className="flex gap-4">
            <button
              onClick={reviewAnswers}
              className="px-4 py-2 border border-[#255C79] text-[#255C79] rounded-md text-sm font-medium hover:bg-blue-50"
            >
              Review
            </button>
            <button
              onClick={resetQuiz}
              className="px-4 py-2 bg-[#255C79] text-white rounded-md text-sm font-medium hover:bg-[#1a4a5f]"
            >
              Next
            </button>
          </div>
        </div>
      );
    }
  }
};

export default QuizCard;