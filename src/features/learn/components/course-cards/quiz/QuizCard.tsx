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
    queryKey: ["quiz", contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId && !injectedData,
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
      pastSubmissions(1, courseId, contentId)
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
    const response = await submitContent(1, courseId, contentId, "Quiz", {
      userAnswers,
    });
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
      <div className="flex flex-col lg:flex-row w-full gap-3 md:gap-4 lg:gap-6">
        {/* Left Sidebar: Question Numbers */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg">
          <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-3 md:mb-4 text-[#255C79] px-2 lg:px-0">
            Your Quiz Review
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-4 gap-2 px-2 lg:px-0">
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
                btnClass += " ring-2 ring-[#255C79]";
              }
              return (
                <button
                  key={idx}
                  onClick={() => navigateToQuestion(idx)}
                  className={`w-full py-2 md:py-2.5 rounded-md border text-xs md:text-sm font-semibold transition ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right Panel: Question Review */}
        <div className="flex-1 bg-white rounded-lg p-3 md:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2 sm:gap-0">
            <span className="text-sm md:text-base text-gray-500">
              Question {currentQuestionIndex + 1}
            </span>
            <span className="text-xs md:text-sm bg-blue-100 text-[#255C79] px-2 py-1 rounded">
              {currentQuestion.difficulty_level}
            </span>
          </div>
          
          <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 lg:mb-6 leading-tight">
            {currentQuestion.question_text}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6 lg:mb-8">
            {currentQuestion.options.map((option, idx) => {
              const optionLetter = optionLetters[idx];
              const isSelected =
                userAnswersArg[currentQuestionIndex].selectedOption ===
                optionLetter;
              const isCorrect = optionLetter === currentQuestion.correct_option;
              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-2 md:p-3 lg:p-4 text-sm md:text-base flex items-center ${
                    isSelected && isCorrect
                      ? "border-green-600 bg-green-50"
                      : isSelected && !isCorrect
                      ? "border-red-600 bg-red-50"
                      : isCorrect
                      ? "border-green-600 bg-green-50"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <span className="font-medium mr-2">{optionLetter}.</span>
                  <span className="flex-1">{option}</span>
                  {isCorrect && <span className="ml-2 text-green-600 text-lg">✓</span>}
                  {isSelected && !isCorrect && (
                    <span className="ml-2 text-red-600 text-lg">✗</span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mb-3 md:mb-4 bg-gray-50 rounded-lg p-2 md:p-3">
            <div className="text-sm md:text-base font-medium text-gray-700">
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
            <div className="mb-3 md:mb-4 p-2 md:p-3 lg:p-4 bg-white border rounded-lg">
              <div className="text-sm md:text-base lg:text-lg font-semibold text-gray-700 mb-1 md:mb-2">
                Explanation
              </div>
              <div className="text-sm md:text-base text-gray-700 leading-relaxed">
                {currentQuestion.explanation}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 mt-4 md:mt-6">
            <button
              onClick={handleBack}
              className="px-3 md:px-4 py-2 border border-[#255C79] text-[#255C79] rounded-md text-xs md:text-sm font-medium hover:bg-blue-50 transition"
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
              className="px-3 md:px-4 py-2 bg-[#255C79] text-white rounded-md text-xs md:text-sm font-medium hover:bg-[#1a4a5f] transition"
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
          <div className="flex flex-col gap-3 md:gap-4 px-3 md:px-0 py-3 md:py-4">
            <div className="flex flex-col gap-3">
              <span className="text-xl md:text-2xl lg:text-3xl font-bold text-[#222]">
                Quiz {data?.order || ""}
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 md:px-6 lg:px-8 py-1 border border-gray-500 rounded-lg text-xs md:text-sm text-gray-500">
                  {mcqs.length} Questions
                </span>
                <span className="px-3 md:px-6 lg:px-8 py-1 border border-gray-500 rounded-lg text-xs md:text-sm text-gray-500">
                  {totalAttempts} Submissions
                </span>
              </div>
            </div>
            <button
              className="w-full md:w-auto px-4 md:px-8 lg:px-28 py-3 bg-[#255C79] text-white rounded-lg font-semibold text-sm md:text-base hover:bg-[#1a4a5f] transition"
              onClick={handleRetryQuiz}
            >
              Retry the Quiz
            </button>
          </div>
        )}

        {/* Top Banner */}
        {quizCompleted && (
          <div
            className="flex flex-col items-center justify-center py-4 md:py-6 lg:py-8 px-3 md:px-4 w-full rounded-xl md:rounded-2xl lg:rounded-3xl mx-auto"
            style={{
              backgroundImage: `url(${topbg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 md:mb-4">
                <img
                  src={tickicon}
                  alt="tickicon"
                  className="w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40"
                  loading="lazy"
                />
              </div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-3 md:mb-4 px-2">
                Quiz Submitted Successfully
              </h2>
              <button className="px-4 md:px-6 py-2 bg-white text-[#255C79] rounded-md font-medium text-sm md:text-base hover:bg-gray-100 transition">
                View Overall Results
              </button>
            </div>
          </div>
        )}

        {/* Second Row: Score and Next Challenge */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6 lg:gap-8 py-4 md:py-6 lg:py-8 px-3 md:px-0">
          {/* Score Section */}
          <div className="relative bg-white/70 flex flex-col justify-between p-4 md:p-6 shadow overflow-hidden rounded-xl md:rounded-2xl lg:rounded-3xl min-h-[180px] md:min-h-[220px] lg:min-h-[250px]">
            {/* Rotated background layer */}
            <div
              className="absolute -left-8 md:-left-10 top-[-150px] md:top-[-200px] lg:top-[-250px] w-[130%] md:w-[150%] h-[200%] md:h-[250%] lg:h-[300%] rotate-[-20deg] md:rotate-[-25deg] z-0 rounded-2xl md:rounded-3xl"
              style={{
                backgroundImage: `url(${leftbg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                opacity: 0.8,
              }}
            ></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-[#12293A] mb-3 md:mb-4">
                Your Score
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-end gap-1 md:gap-2">
                <span className="text-3xl md:text-5xl lg:text-7xl xl:text-8xl font-bold text-[#2A8CB0] leading-none">
                  {selectedAttemptScore}
                </span>
                <span className="text-lg md:text-2xl lg:text-4xl xl:text-5xl text-[#12293A] leading-none">
                  out of {selectedAttemptTotal}
                </span>
              </div>
            </div>

            {/* Trophy Image */}
            <div className="absolute bottom-0 right-0 md:relative md:bottom-auto md:right-auto z-10 flex justify-end items-end">
              <img
                src={trophy}
                alt="trophy"
                className="w-20 h-20 md:w-32 md:h-32 lg:w-48 lg:h-48 xl:w-60 xl:h-50 rotate-[-10deg] md:rotate-[-15deg] lg:rotate-[-30deg] translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4 lg:translate-x-8 lg:translate-y-8 xl:translate-x-12 xl:translate-y-16"
                loading="lazy"
              />
            </div>
          </div>

          {/* Next Challenge Section */}
          <div className="relative bg-[#D7EFF6] flex flex-row justify-between p-4 md:p-6 shadow overflow-hidden rounded-xl md:rounded-2xl lg:rounded-3xl min-h-[180px] md:min-h-[220px] lg:min-h-[250px]">
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-[#12293A] leading-tight mb-4 md:mb-6">
                Ready for Your Next Challenge?
              </div>
              <button
                className="w-full md:w-auto px-4 md:px-6 py-3 md:py-4 bg-[#255C79] text-white rounded-md font-medium text-sm md:text-base hover:bg-[#1a4a5f] transition"
                onClick={onStartNextQuiz}
              >
                Start Next Quiz
              </button>
            </div>
            
            {/* Challenge Image */}
            <div className="hidden md:flex absolute bottom-0 right-0 md:relative md:bottom-auto md:right-auto justify-end items-end">
              <img
              src={challenge}
              alt="challenge"
              className="w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 object-contain"
              loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Attempt Buttons */}
        <div className="px-3 md:px-0 pt-4 md:pt-6 pb-2">
          {loadingAttempts ? (
            <div className="text-gray-400 text-sm px-2">Loading attempts...</div>
          ) : (
            <div className="flex gap-2 md:gap-3 lg:gap-4 overflow-x-auto scrollbar-hide pb-2">
              {pastAttempts.map((attempt, idx) => (
                <button
                  key={attempt.id}
                  onClick={() => handleAttemptSwitch(idx)}
                  className={`border rounded-lg px-3 md:px-4 lg:px-6 py-2 md:py-3 text-left transition font-semibold shadow-sm flex-shrink-0 min-w-[100px] md:min-w-[120px]
                    ${
                      idx === selectedAttemptIndex
                        ? "border-blue-400 bg-blue-50 text-[#12293A] ring-2 ring-blue-200"
                        : "border-gray-200 bg-white text-gray-500 hover:border-blue-300"
                    }
                  `}
                >
                  <div className="text-xs md:text-sm lg:text-base font-semibold">
                    Attempt {idx + 1}
                  </div>
                  <div className="text-xs text-gray-400 hidden md:block">
                    {new Date(attempt.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Review/Result Section */}
        <div className="p-2 md:p-3 lg:p-4 bg-white rounded-lg shadow mt-3 mx-3 md:mx-0">
          {attemptSwitchLoading ? (
            <div className="flex flex-col lg:flex-row w-full animate-pulse gap-3 md:gap-4">
              {/* Sidebar Skeleton */}
              <div className="w-full lg:w-1/3 bg-white rounded-lg p-3 md:p-4">
                <div className="h-4 md:h-5 lg:h-6 w-3/4 bg-gray-200 rounded mb-3 md:mb-4" />
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="h-6 md:h-7 lg:h-8 w-full bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
              
              {/* Main Content Skeleton */}
              <div className="flex-1 bg-white rounded-lg p-3 md:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                  <div className="h-3 md:h-4 w-20 md:w-24 bg-gray-200 rounded" />
                  <div className="h-3 md:h-4 w-12 md:w-16 bg-gray-200 rounded" />
                </div>
                <div className="h-4 md:h-5 lg:h-6 w-full md:w-2/3 bg-gray-200 rounded mb-4 md:mb-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4 mb-6 md:mb-8">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-8 md:h-9 lg:h-10 w-full bg-gray-200 rounded" />
                  ))}
                </div>
                
                <div className="mb-3 md:mb-4 bg-gray-100 rounded-lg h-6 md:h-8 lg:h-10 w-full" />
                
                <div className="mb-3 md:mb-4 p-2 md:p-3 lg:p-4 bg-white border rounded-lg">
                  <div className="h-3 md:h-4 w-16 md:w-20 lg:w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-3 md:h-4 w-full md:w-2/3 bg-gray-200 rounded" />
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between gap-2 mt-4 md:mt-6">
                  <div className="h-6 md:h-7 lg:h-8 w-16 md:w-20 lg:w-24 bg-gray-200 rounded" />
                  <div className="h-6 md:h-7 lg:h-8 w-16 md:w-20 lg:w-24 bg-gray-200 rounded" />
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
                    ? "border-[#255C79] bg-blue-50"
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
              className="px-3 md:px-4 py-2 border border-[#255C79] text-[#255C79] rounded-md text-xs md:text-sm font-medium hover:bg-blue-50"
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
                  : "bg-[#255C79] text-white hover:bg-[#1a4a5f]"
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
                    : "bg-[#255C79] text-white hover:bg-[#1a4a5f]"
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
