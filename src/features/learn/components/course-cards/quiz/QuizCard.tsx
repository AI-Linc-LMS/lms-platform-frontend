import React, { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { getCourseContent } from '../../../../../services/enrolled-courses-content/courseContentApis';
import { useMediaQuery } from '../../../../../hooks/useMediaQuery';
import { submitContent } from "../../../../../services/enrolled-courses-content/submitApis";
import { useNavigate } from "react-router-dom";
import topbg from "../../../../../commonComponents/icons/enrolled-courses/quiz/topbg.png";
import leftbg from "../../../../../commonComponents/icons/enrolled-courses/quiz/leftbg.png";
import tickicon from "../../../../../commonComponents/icons/enrolled-courses/quiz/doneicon.png";
import trophy from "../../../../../commonComponents/icons/enrolled-courses/quiz/trophy.png";
import challenge from "../../../../../commonComponents/icons/enrolled-courses/quiz/challenge.png";

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
  onStartNextQuiz?: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({
  contentId,
  courseId,
  isSidebarContentOpen,
  quizData: injectedData,
  onSubmission,
  onReset,
  onStartNextQuiz
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
  const isMobile = useMediaQuery("(max-width: 768px)");

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
      let totalSeconds = data.duration_in_minutes * 60;

      const interval = setInterval(() => {
        if (totalSeconds > 0) {
          totalSeconds -= 1;
          const minutesLeft = Math.floor(totalSeconds / 60);
          const secondsLeft = totalSeconds % 60;
          setFormattedTime(`${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`);
        } else {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
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
        <div className="border rounded-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base md:text-lg font-semibold">Question {currentQuestionIndex + 1}</h3>
            <span className="text-xs bg-blue-100 text-[#255C79] px-2 py-1 rounded">
              {currentQuestion.difficulty_level}
            </span>
          </div>

          <h3 className="text-lg font-medium mb-6">
            {currentQuestion.question_text}
          </h3>

          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3 md:gap-4 mb-4 md:mb-6`}>
            {currentQuestion.options.map((option, idx) => {
              const optionLetter = optionLetters[idx];
              const isSelected = userAnswers[currentQuestionIndex].selectedOption === optionLetter;
              const isCorrect = optionLetter === currentQuestion.correct_option;

              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 md:p-4 text-sm md:text-base ${isSelected && isCorrect
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
              className="px-3 md:px-4 py-2 border border-[#255C79] text-[#255C79] rounded-md text-xs md:text-sm font-medium hover:bg-blue-50"
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
              className="px-3 md:px-4 py-2 bg-[#255C79] text-white rounded-md text-xs md:text-sm font-medium hover:bg-[#1a4a5f]"
            >
              {currentQuestionIndex < mcqs.length - 1 ? "Next" : "Done"}
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center border rounded-lg p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold mb-4">Quiz Result</h3>
          <p className="text-base md:text-lg mb-4 md:mb-6">
            Your score: <span className="font-bold">{score}/{mcqs.length}</span> ({Math.round((score / mcqs.length) * 100)}%)
          </p>
          <p className="text-xs md:text-sm text-gray-600 mb-6 md:mb-8">
            Your submitted response was correct.
          </p>
          <div className="flex gap-4">
            <button
              onClick={reviewAnswers}
              className="px-3 md:px-4 py-2 border border-[#255C79] text-[#255C79] rounded-md text-xs md:text-sm font-medium hover:bg-blue-50"
            >
              Review
            </button>
            <button
              onClick={resetQuiz}
              className="px-3 md:px-4 py-2 bg-[#255C79] text-white rounded-md text-xs md:text-sm font-medium hover:bg-[#1a4a5f]"
            >
              Next
            </button>
          </div>
        </div>
      );
    }
  }

  if (quizCompleted) {
    return (
      <div className="rounded-lg shadow p-0 md:p-0 mb-8">
        {/* Top Banner */}
        <div
          className="flex flex-col items-center justify-center py-8 px-4 md:px-0 w-full rounded-3xl"
          style={{
            backgroundImage: `url(${topbg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="flex flex-col items-center">
            <div>
              <img src={tickicon} alt="tickicon" className="w-50 h-40" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 ">Quiz Submitted Successfully</h2>
            <button className="mt-4 px-6 py-2 bg-white text-[#255C79] rounded-md font-medium text-sm md:text-base hover:bg-[#1a4a5f]">View Overall Results</button>
          </div>
        </div>

        {/* Second Row: Score and Next Challenge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 py-6 md:py-8">
          {/* Score Section */}
          <div className="relative bg-white/70 flex flex-row justify-between rounded-lg p-6 shadow overflow-hidden rounded-3xl">
            {/* Rotated background layer */}
            <div
              className="absolute -left-10 -top-40 w-[150%] h-[300%] rotate-[-25deg] z-0 rounded-3xl"
              style={{
                backgroundImage: `url(${leftbg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.8, // Adjust this to control visibility
              }}
            ></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="text-3xl font-semibold text-[#12293A] mt-1">Your Score</div>

              <div className="md:text-8xl font-bold text-[#2A8CB0]">
                {score}
                <span className="text-5xl text-[#12293A]"> out of {mcqs.length}</span> </div>
            </div>
            <div>
              <img src={trophy} alt="trophy" className="relative w-60 h-50 rotate-[-30deg] top-[60px] left-[50px]" />
            </div>
          </div>

          {/* Next Challenge Section */}
          <div className="flex flex-row justify-between bg-[#D7EFF6] rounded-lg p-6 shadow">
            <div className="flex flex-col justify-between">
              <div className="md:text-3xl font-semibold text-[#12293A]">Ready for Your Next Challenge?</div>
              <button
                className="px-6 py-4 bg-[#255C79] text-white rounded-md font-medium text-sm md:text-base hover:bg-[#1a4a5f]"
                onClick={onStartNextQuiz}
              >
                Start Next Quiz
              </button>
            </div>
            <div>
              <img src={challenge} alt="trophy" className="relative w-70 h-50 left-[40px]" />
            </div>
          </div>
        </div>

        {/* Existing Review/Result Section */}
        <div className="p-4 md:p-8 bg-white rounded-lg shadow mt-6">
          <div className="flex flex-col">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-[#255C79] mb-2">Your Quiz Review</h2>
              <div className="text-xs md:text-sm text-gray-500 flex gap-2 mb-4 md:mb-6">
                <span>Your Score: {score}</span>
                <span>|</span>
                <span>{totalQuestions} Questions</span>
              </div>
              {/* Question blocks shown only in sidebar, not in main review area */}
              {!isReviewing && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-6 md:mb-8">
                  {mcqs.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsReviewing(true);
                        navigateToQuestion(index);
                      }}
                      className={`py-2 rounded-md border text-xs md:text-sm ${getQuestionButtonStyle(index)}`}
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
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'flex flex-col w-full' : 'flex gap-6 ml-2'}`}>
      {/* Left Panel - Hidden on mobile */}
      {!isSidebarContentOpen && !isMobile && renderSidebar()}

      {/* Right Panel */}
      <div className={`${isMobile ? "w-full pb-2" : (isSidebarContentOpen ? "w-full" : "w-2/3")}`}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#255C79] mb-1">
            {data.content_title}
          </h2>
          <div className="text-xs text-gray-500 flex flex-wrap gap-2 mb-3">
            <span>{mcqs.length} Marks</span>
            <span>|</span>
            <span>{totalQuestions} Questions</span>
            <span>|</span>
            <span>{totalSubmissions} Submissions</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-xs md:text-sm font-medium text-gray-700">
            Question {currentQuestionIndex + 1}
          </span>
          <span className="text-xs bg-blue-100 text-[#255C79] px-2 py-1 rounded">
            {currentQuestion.difficulty_level}
          </span>
        </div>

        <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 text-[#255C79]">
          {currentQuestion.question_text}
        </h3>

        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3 md:gap-4 mb-4 md:mb-6`}>
          {currentQuestion.options.map((option, idx) => {
            const optionLetter = optionLetters[idx];
            const isSelected = selectedOption === optionLetter;

            return (
              <div
                key={idx}
                onClick={() => handleOptionSelect(optionLetter)}
                className={`cursor-pointer border rounded-lg p-3 md:p-4 transition text-sm md:text-base ${isSelected
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
              className="px-3 md:px-4 py-2 border border-[#255C79] text-[#255C79] rounded-md text-xs md:text-sm font-medium hover:bg-blue-50"
            >
              Back
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={selectedOption === null}
            className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium ml-auto ${selectedOption === null
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-[#255C79] text-white hover:bg-[#1a4a5f]"
              }`}
          >
            {currentQuestionIndex < mcqs.length - 1 ? "Next" : "Finish Quiz"}
          </button>
        </div>

        {/* Timer */}
        <div className="mt-4 text-right text-sm text-gray-500">
          <span>Time Remaining: {formattedTime}</span>
        </div>
      </div>
    </div>
  );
};

export default QuizCard;