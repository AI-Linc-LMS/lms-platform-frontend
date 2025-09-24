import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCourseContent,
  pastSubmissions,
} from "../../../../../services/enrolled-courses-content/courseContentApis";
import { useMediaQuery } from "../../../../../hooks/useMediaQuery";
import { submitContent } from "../../../../../services/enrolled-courses-content/submitApis";
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
  explanation: string;
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
  status: string;
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
  isVisible?: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({
  contentId,
  courseId,
  isSidebarContentOpen,
  quizData: injectedData,
  onSubmission,
  onStartNextQuiz,
  isVisible = true,
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formattedTime, setFormattedTime] = useState("00:00");
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [pastAttempts, setPastAttempts] = useState<any[]>([]);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [attemptSwitchLoading, setAttemptSwitchLoading] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const {
    data: fetchedData,
    isLoading,
    error,
  } = useQuery<QuizData>({
    queryKey: ["quiz", courseId, contentId],
    queryFn: () => getCourseContent(clientId, courseId, contentId),
    enabled: !!contentId && !!courseId && !injectedData,
    // Ensure fresh data when switching between content
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes but always refetch
  });

  useEffect(() => {
    //console.log("fetchedData", fetchedData?.status);
    if (fetchedData?.status === "complete") {
      setAlreadyCompleted(true);
    }
  }, [fetchedData]);

  // Use either injected data or fetched data
  const data = injectedData || fetchedData;
  const optionLetters = ["A", "B", "C", "D"];

  ////console.log("userAnswers", userAnswers);
  useEffect(() => {
    if (data?.details?.mcqs) {
      setTotalQuestions(data.details.mcqs.length);
      // Initialize user answers array
      setUserAnswers(
        data.details.mcqs.map((_, index) => ({
          questionId: data.details.mcqs[index].id,
          isCorrect: false,
          questionIndex: index,
          selectedOption: null,
        }))
      );
    }
  }, [data]);

  useEffect(() => {
    if (!isVisible || !data?.duration_in_minutes) return;
    let totalSeconds = data.duration_in_minutes * 60;
    const interval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds -= 1;
        const minutesLeft = Math.floor(totalSeconds / 60);
        const secondsLeft = totalSeconds % 60;
        setFormattedTime(
          `${minutesLeft.toString().padStart(2, "0")}:${secondsLeft
            .toString()
            .padStart(2, "0")}`
        );
      } else {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.duration_in_minutes, isVisible]);

  // Fetch past submissions after quiz is completed
  useEffect(() => {
    if (quizCompleted || alreadyCompleted) {
      setLoadingAttempts(true);
      pastSubmissions(clientId, courseId, contentId)
        .then((data) => {
          // Sort by created_at descending, take first 8
          const sorted = [...data].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          setTotalAttempts(sorted.length);
          setPastAttempts(sorted.slice(0, 8));
          setSelectedAttemptIndex(0); // latest
        })
        .catch(() => setPastAttempts([]))
        .finally(() => setLoadingAttempts(false));
    }
  }, [quizCompleted, alreadyCompleted, courseId, contentId]);

  // Use selected attempt's answers for review
  const reviewUserAnswers =
    quizCompleted || alreadyCompleted
      ? pastAttempts[selectedAttemptIndex]?.custom_dimension?.userAnswers
      : userAnswers;

  if (isLoading || (alreadyCompleted && loadingAttempts)) {
    return (
      <div className="rounded-lg shadow p-0 md:p-0 mb-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between w-full bg-transparent py-4 px-2 md:px-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-32 bg-gray-200 rounded" />
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="h-6 w-32 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-48 bg-gray-200 rounded" />
        </div>
        {/* Score and Next Challenge skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 py-6 md:py-8">
          <div className="relative bg-white/70 flex flex-row justify-between p-6 shadow overflow-hidden rounded-3xl">
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
              <div className="h-16 w-40 bg-gray-200 rounded" />
            </div>
            <div className="h-24 w-24 bg-gray-200 rounded-full" />
          </div>
          <div className="flex flex-row justify-between bg-gray-100 rounded-lg p-6 shadow">
            <div className="flex flex-col justify-between">
              <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
              <div className="h-10 w-32 bg-gray-200 rounded" />
            </div>
            <div className="h-24 w-24 bg-gray-200 rounded-full" />
          </div>
        </div>
        {/* Attempt Buttons skeleton */}
        <div className="flex gap-4 px-4 pt-6 pb-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-12 w-32 bg-gray-200 rounded" />
          ))}
        </div>
        {/* Review skeleton */}
        <div className="p-4 md:p-4 bg-white rounded-lg shadow mt-3">
          <div className="flex w-full">
            <div className="w-1/3 min-w-[120px] bg-white rounded-lg md:mr-8 p-4">
              <div className="h-6 w-2/3 bg-gray-200 rounded mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-8 w-full bg-gray-200 rounded" />
                ))}
              </div>
            </div>
            <div className="flex-1 bg-white rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div className="h-6 w-2/3 bg-gray-200 rounded mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-10 w-full bg-gray-200 rounded" />
                ))}
              </div>
              <div className="mb-4 bg-gray-100 rounded-lg h-10 w-full" />
              <div className="mb-4 p-4 bg-white border rounded-lg">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between mt-6">
                <div className="h-8 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
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

  const handleRetryQuiz = () => {
    setQuizCompleted(false);
    setAlreadyCompleted(false);
    setUserAnswers(
      data.details.mcqs.map((_, index) => ({
        questionId: data.details.mcqs[index].id,
        questionIndex: index,
        selectedOption: null,
        isCorrect: false,
      }))
    );
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
  };

  const mcqs = data.details.mcqs;
  const currentQuestion = mcqs[currentQuestionIndex];

  const updateUserAnswer = (
    index: number,
    option: string,
    isCorrect: boolean
  ) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index] = {
      ...updatedAnswers[index],
      selectedOption: option,
      isCorrect,
    };
    setUserAnswers(updatedAnswers);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correct_option;
    updateUserAnswer(currentQuestionIndex, option, isCorrect);
    ////console.log("option", option);
    // Update userAnswers state
  };

  const handleNext = () => {
    // Mark as submitted internally to track answers
    setSubmitted(true);
    setTotalSubmissions((prev) => prev + 1);

    const isCorrect = selectedOption === currentQuestion.correct_option;
    ////console.log("isCorrect", isCorrect);
    ////console.log("selectedOption", selectedOption);
    ////console.log("currentQuestion", currentQuestion);
    // Update userAnswers state with selection
    updateUserAnswer(currentQuestionIndex, selectedOption!, isCorrect);

    ////console.log("userAnswers", userAnswers);

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

  const handleFinish = () => {
    setSubmitted(true);
    setTotalSubmissions((prev) => prev + 1);
    ////console.log("selectedOption", selectedOption);
    ////console.log("currentQuestion", currentQuestion);
    const isCorrect = selectedOption === currentQuestion.correct_option;

    // Update userAnswers state with selection
    updateUserAnswer(currentQuestionIndex, selectedOption!, isCorrect);

    // Notify parent component about submission
    if (onSubmission) {
      onSubmission(contentId);
    }

    finishQuiz();
  };

  const navigateToNext = () => {
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    setSelectedOption(userAnswers[nextIndex].selectedOption);
    setSubmitted(false);
  };

  const finishQuiz = async () => {
    // Calculate total score when quiz is completed
    const response = await submitContent(
      clientId,
      courseId,
      contentId,
      "Quiz",
      {
        userAnswers,
      }
    );
    ////console.log("response", response);
    if (response === 201) {
      setQuizCompleted(true);
    } else {
      ////console.log("error", response);
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

  const getQuestionButtonStyle = (index: number) => {
    const answer = userAnswers[index];
    if (!answer) {
      // Return a default style if answer is undefined
      return "bg-white border-gray-300 text-gray-600";
    }
    if (index === currentQuestionIndex && !isReviewing) {
      return "bg-blue-50 border-[var(--secondary-400)] text-[var(--primary-500)]";
    }
    // Show correct/incorrect colors only after quiz is completed
    if (quizCompleted) {
      if (answer.selectedOption) {
        return answer.isCorrect
          ? "bg-green-100 border-green-500 text-green-700"
          : "bg-red-100 border-red-500 text-red-700";
      }
    } else {
      // During the quiz, just show var(--primary-400) color for answered questions
      if (answer.selectedOption) {
        return "bg-[var(--primary-400)] border-[var(--primary-400)] text-[var(--font-light)]";
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
              {data.details.instructions ||
                "Solve real world questions and gain insight knowledge."}
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
              className={`py-2 rounded-md border text-sm ${getQuestionButtonStyle(
                index
              )}`}
              disabled={
                submitted &&
                currentQuestionIndex !== index &&
                !userAnswers[index].selectedOption
              }
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderReviewContent(userAnswersArg = userAnswers) {
    return (
      <div className="flex w-full">
        {/* Left Sidebar: Question Numbers */}
        <div className="w-1/3 min-w-[120px] bg-white rounded-lg md:mr-8">
          <h3 className="text-2xl font-semibold mb-4 text-[var(--primary-500)]">
            Your Quiz Review
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {userAnswersArg.map((answer, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              let btnClass = "";
              if (answer.selectedOption) {
                btnClass = answer.isCorrect
                  ? "bg-green-100 border-green-500 text-green-700"
                  : "bg-red-100 border-red-500 text-red-700";
              } else {
                btnClass = "bg-gray-100 border-gray-300 text-gray-400";
              }
              if (isCurrent) {
                btnClass += " ring-2 ring-[var(--primary-500)]";
              }
              return (
                <button
                  key={idx}
                  onClick={() => navigateToQuestion(idx)}
                  className={`w-full py-2 rounded-md border text-sm font-semibold transition ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
        {/* Right Panel: Question Review */}
        <div className="flex-1 bg-white rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1}
            </span>
            <span className="text-xs bg-blue-100 text-[var(--primary-500)] px-2 py-1 rounded">
              {currentQuestion.difficulty_level}
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-4">
            {currentQuestion.question_text}
          </h3>
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-8`}
          >
            {currentQuestion.options.map((option, idx) => {
              const optionLetter = optionLetters[idx];
              const isSelected =
                userAnswersArg[currentQuestionIndex].selectedOption ===
                optionLetter;
              const isCorrect = optionLetter === currentQuestion.correct_option;
              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 md:p-4 text-sm md:text-base flex items-center ${
                    isSelected && isCorrect
                      ? "border-green-600 bg-green-50"
                      : isSelected && !isCorrect
                      ? "border-red-600 bg-red-50"
                      : isCorrect
                      ? "border-green-600 bg-green-50"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <span className="font-medium mr-2">{optionLetter}.</span>{" "}
                  {option}
                  {isCorrect && <span className="ml-2 text-green-600">✓</span>}
                  {isSelected && !isCorrect && (
                    <span className="ml-2 text-red-600">✗</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mb-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">
              {userAnswersArg[currentQuestionIndex].isCorrect ? (
                <span className="text-green-600">
                  Your response was correct!
                </span>
              ) : (
                <span className="text-red-600">
                  Your response was incorrect. The correct answer is{" "}
                  {currentQuestion.correct_option}.
                </span>
              )}
            </div>
          </div>
          {/* Explanation Section */}
          {currentQuestion.explanation && (
            <div className="mb-4 p-4 bg-white border rounded-lg">
              <div className="text-lg font-semibold text-gray-700 mb-1">
                Explanation
              </div>
              <div className="text-md text-gray-700">
                {currentQuestion.explanation}
              </div>
            </div>
          )}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              className="px-3 md:px-4 py-2 border border-[var(--primary-500)] text-[var(--primary-500)] rounded-md text-xs md:text-sm font-medium hover:bg-blue-50"
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
              className="px-3 md:px-4 py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-md text-xs md:text-sm font-medium hover:bg-[#1a4a5f]"
            >
              {currentQuestionIndex < mcqs.length - 1 ? "Next" : "Done"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handler for switching attempts
  const handleAttemptSwitch = (idx: number) => {
    setAttemptSwitchLoading(true);
    setTimeout(() => {
      setSelectedAttemptIndex(idx);
      setAttemptSwitchLoading(false);
    }, 300); // 300ms delay for loading effect
  };

  if (quizCompleted || alreadyCompleted) {
    // Calculate score for selected attempt
    const selectedAttemptUserAnswers = reviewUserAnswers || [];
    const selectedAttemptScore = selectedAttemptUserAnswers.filter(
      (a: any) => a.isCorrect
    ).length;
    const selectedAttemptTotal = selectedAttemptUserAnswers.length;

    return (
      <div className="mb-8">
        {alreadyCompleted && (
          <div className="flex items-center justify-between w-full bg-transparent py-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-[#222]">
                Quiz {data?.order || ""}
              </span>
              <span className="px-8 py-1 border border-gray-500 rounded-lg text-sm text-gray-500 ">
                {mcqs.length} Questions
              </span>
              <span className="px-8 py-1 border border-gray-500 rounded-lg text-sm text-gray-500 ">
                {totalAttempts} Submissions
              </span>
            </div>
            <button
              className="md:px-28 py-3 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg font-semibold text-base hover:bg-[#1a4a5f] transition"
              onClick={handleRetryQuiz}
            >
              Retry the Quiz
            </button>
          </div>
        )}
        {/* Top Banner */}
        {quizCompleted && (
          <div
            className="flex flex-col items-center justify-center py-8 px-4 md:px-0 w-full rounded-3xl"
            style={{
              backgroundImage: `url(${topbg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="flex flex-col items-center">
              <div>
                <img
                  src={tickicon}
                  alt="tickicon"
                  className="w-50 h-40"
                  loading="lazy"
                />
              </div>
              <h2 className="text-2xl font-bold text-[var(--font-light)] mb-2 ">
                Quiz Submitted Successfully
              </h2>
              <button className="mt-4 px-6 py-2 bg-white text-[var(--primary-500)] rounded-md font-medium text-sm md:text-base hover:bg-[#1a4a5f]">
                View Overall Results
              </button>
            </div>
          </div>
        )}

        {/* Second Row: Score and Next Challenge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 py-6 md:py-8">
          {/* Score Section */}
          <div className="relative bg-white/70 flex flex-row justify-between p-6 shadow overflow-hidden rounded-3xl">
            {/* Rotated background layer */}
            <div
              className="absolute -left-10 top-[-250px] w-[150%] h-[300%] rotate-[-25deg] z-0 rounded-3xl"
              style={{
                backgroundImage: `url(${leftbg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                opacity: 0.8, // Adjust this to control visibility
              }}
            ></div>

            {/*left Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="text-3xl font-semibold text-[var(--secondary-500)] mt-1">
                Your Score
              </div>

              <div className="md:text-8xl font-bold text-[var(--primary-400)]">
                {selectedAttemptScore}
                <span className="text-5xl text-[var(--secondary-500)]">
                  {" "}
                  out of {selectedAttemptTotal}
                </span>{" "}
              </div>
            </div>
            <div>
              <img
                src={trophy}
                alt="trophy"
                className="relative w-60 h-50 rotate-[-30deg] top-[60px] left-[50px]"
                loading="lazy"
              />
            </div>
          </div>

          {/* Next Challenge Section */}
          <div className="flex flex-row justify-between bg-[var(--primary-50)] rounded-lg p-6 shadow">
            <div className="flex flex-col justify-between">
              <div className="md:text-3xl font-semibold text-[var(--secondary-500)]">
                Ready for Your Next Challenge?
              </div>
              <button
                className="px-6 py-4 bg-[var(--primary-500)] text-[var(--font-light)] rounded-md font-medium text-sm md:text-base hover:bg-[#1a4a5f]"
                onClick={onStartNextQuiz}
              >
                Start Next Quiz
              </button>
            </div>
            <div>
              <img
                src={challenge}
                alt="trophy"
                className="relative w-70 h-50 left-[40px]"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Attempt Buttons */}
        <div className="flex gap-4 px-4 pt-6 pb-2">
          {loadingAttempts ? (
            <div className="text-gray-400 text-sm">Loading attempts...</div>
          ) : (
            pastAttempts.map((attempt, idx) => (
              <button
                key={attempt.id}
                onClick={() => handleAttemptSwitch(idx)}
                className={`border rounded-lg px-6 py-3 text-left transition font-semibold shadow-sm
                  ${
                    idx === selectedAttemptIndex
                      ? "border-blue-400 bg-blue-50 text-[var(--secondary-500)] ring-2 ring-blue-200"
                      : "border-gray-200 bg-white text-gray-500 hover:border-blue-300"
                  }
                `}
              >
                <div className="text-base font-semibold">Attempt {idx + 1}</div>
                <div className="text-xs text-gray-400">
                  Date: {new Date(attempt.created_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Existing Review/Result Section */}
        <div className="p-4 md:p-4 bg-white rounded-lg shadow mt-3">
          {attemptSwitchLoading ? (
            <div className="flex w-full animate-pulse">
              {/* Sidebar Skeleton */}
              <div className="w-1/3 min-w-[120px] bg-white rounded-lg md:mr-8 p-4">
                <div className="h-6 w-2/3 bg-gray-200 rounded mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="h-8 w-full bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
              {/* Main Content Skeleton */}
              <div className="flex-1 bg-white rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-2/3 bg-gray-200 rounded mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-8">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-10 w-full bg-gray-200 rounded"
                    />
                  ))}
                </div>
                <div className="mb-4 bg-gray-100 rounded-lg h-10 w-full" />
                <div className="mb-4 p-4 bg-white border rounded-lg">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                </div>
                <div className="flex justify-between mt-6">
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ) : (
            renderReviewContent(reviewUserAnswers)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? "flex flex-col w-full" : "flex gap-6 ml-2"}`}>
      {/* Left Panel - Hidden on mobile */}
      {!isSidebarContentOpen && !isMobile && renderSidebar()}

      {/* Right Panel */}
      <div
        className={`${
          isMobile ? "w-full pb-2" : isSidebarContentOpen ? "w-full" : "w-2/3"
        }`}
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--primary-500)] mb-1">
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
          <span className="text-xs bg-blue-100 text-[var(--primary-500)] px-2 py-1 rounded">
            {currentQuestion.difficulty_level}
          </span>
        </div>

        <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6 text-[var(--primary-500)]">
          {currentQuestion.question_text}
        </h3>

        <div
          className={`grid ${
            isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
          } gap-3 md:gap-4 mb-4 md:mb-6`}
        >
          {currentQuestion.options.map((option, idx) => {
            const optionLetter = optionLetters[idx];
            const isSelected = selectedOption === optionLetter;

            return (
              <div
                key={idx}
                onClick={() => handleOptionSelect(optionLetter)}
                className={`cursor-pointer border rounded-lg p-3 md:p-4 transition text-sm md:text-base ${
                  isSelected
                    ? "border-[var(--primary-500)] bg-blue-50"
                    : "bg-white border-gray-200"
                }`}
              >
                <span className="font-medium mr-2">{optionLetter}.</span>{" "}
                {option}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          {currentQuestionIndex > 0 && (
            <button
              onClick={handleBack}
              className="px-3 md:px-4 py-2 border border-[var(--primary-500)] text-[var(--primary-500)] rounded-md text-xs md:text-sm font-medium hover:bg-blue-50"
            >
              Back
            </button>
          )}

          {currentQuestionIndex < mcqs.length - 1 && (
            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium ml-auto ${
                selectedOption === null
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-[var(--primary-500)] text-[var(--font-light)] hover:bg-[#1a4a5f]"
              }`}
            >
              Next
            </button>
          )}

          {currentQuestionIndex === mcqs.length - 1 &&
            userAnswers.some((answer) => answer.selectedOption === null) && (
              <span className="ml-auto text-xs text-red-500 font-medium">
                Attempt all questions before finishing quiz
              </span>
            )}

          {currentQuestionIndex === mcqs.length - 1 &&
            userAnswers.every((answer) => answer.selectedOption !== null) && (
              <button
                onClick={handleFinish}
                disabled={selectedOption === null}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium ml-auto ${
                  selectedOption === null
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-[var(--primary-500)] text-[var(--font-light)] hover:bg-[#1a4a5f]"
                }`}
              >
                Finish Quiz
              </button>
            )}
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
