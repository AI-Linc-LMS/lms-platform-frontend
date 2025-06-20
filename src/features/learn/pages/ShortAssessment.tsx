import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  startAssessment,
  submitFinalAssessment,
  updateAfterEachQuestion,
} from "../../../services/assesment/assesmentApis";

interface Question {
  id: number;
  options_a: string;
  options_b: string;
  options_c: string;
  options_d: string;
  question_text: string;
  difficulty_level?: string;
  options?: string[];
}

interface MCQQuestion {
  id: number;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  question_text: string;
  difficulty_level?: string;
}

export interface QuizSectionResponse {
  quizSectionId: SectionResponse[];
}

interface SectionResponse {
  [sectionId: number]: {
    [questionId: number]: string; // selected option like "A"
  };
}

const ShortAssessment: React.FC = () => {

  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<QuizSectionResponse>({
    quizSectionId: [],
  });
  const [timeRemaining, setTimeRemaining] = useState(300); // 30 minutes in seconds
  const [isCompleted, setIsCompleted] = useState(false);
  const [questionsData, setQuestionsData] = useState<Question[]>([]);
  const [assessmentResult, setAssessmentResult] = useState({
    score: 0,
    offered_scholarship_percentage: 0,
  });

  const optionLetters = ["A", "B", "C", "D"];
  const {
    data: questions,
    isLoading: questionsLoading,
    error: questionsError,
  } = useQuery({
    queryKey: ["questionsData"],
    queryFn: () => startAssessment(1, "ai-linc-scholarship-test"),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Data is always considered stale, so it will refetch
    gcTime: 0,
  });
  
  const assessmentId = questions?.slug ?? "ai-linc-scholarship-test";

  // Check if assessment is already submitted
  useEffect(() => {
    if (questions && questions.status === "submitted") {
      setIsCompleted(true);
    } else if (questions && questions.status === "in_progress") {
      // Assessment is in progress, show questions
      setIsCompleted(false);
    }
  }, [questions]);

  // Prepare questionsData and initialize userAnswers
  useEffect(() => {
    if (
      questions &&
      questions.quizSection &&
      questions.quizSection.length > 0
    ) {
      // Use remaining_time from API response (in minutes) and convert to seconds
      setTimeRemaining(questions.remaining_time * 60);
      // Prepare options array for each question
      const mcqs = questions.quizSection[0].mcqs.map((q: MCQQuestion) => ({
        ...q,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
      }));
      setQuestionsData(mcqs);
      //console.log("Questions Data:", mcqs);

      // Initialize userAnswers - use responseSheet from API if available, otherwise initialize empty
      const sectionId = questions.quizSection[0].id;

      if (
        questions.responseSheet &&
        questions.responseSheet.quizSectionId &&
        questions.responseSheet.quizSectionId.length > 0
      ) {
        // Use existing response sheet from API
        setUserAnswers(questions.responseSheet);
      } else {
        // Initialize empty response sheet
        const sectionResponse: SectionResponse = {
          [sectionId]: {},
        };
        mcqs.forEach((q: Question) => {
          sectionResponse[sectionId][q.id] = ""; // No answer selected initially
        });
        setUserAnswers({ quizSectionId: [sectionResponse] });
        //console.log("Initialized empty response sheet");
      }
    }
  }, [questions]);

  const currentQuestion = questionsData[currentQuestionIndex];

  // Set selectedOption when question changes
  useEffect(() => {
    if (userAnswers.quizSectionId.length > 0 && questions && currentQuestion) {
      try {
        const sectionId = questions.quizSection[0].id;
        // Map currentQuestionIndex (0-based) to question ID (1-based)
        const questionId = currentQuestion.id;
        const answer = userAnswers.quizSectionId[0][sectionId][questionId];
        setSelectedOption(answer || null);
      } catch (error) {
        console.error("Error setting selected option:", error);
        setSelectedOption(null);
      }
    } else {
      setSelectedOption(null);
    }
  }, [currentQuestionIndex, userAnswers, questions, currentQuestion?.id]);

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when timer expires
          finalSubmitMutation.mutate(userAnswers, {
            onSuccess: (data) => {
              console.log("Assessment auto-submitted successfully:", data);
              // Set the assessment result from API response
              if (data) {
                setAssessmentResult({
                  score: data.score || 0,
                  offered_scholarship_percentage:
                    data.offered_scholarship_percentage || 0,
                });
              }
              // Assessment result will be set by finalSubmitMutation
            },
            onError: (error) => {
              console.error("Error auto-submitting assessment:", error);
              setIsCompleted(true); // Still show completed even if API fails
            },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, userAnswers]);

  const finalSubmitMutation = useMutation({
    mutationFn: (answers: QuizSectionResponse) =>
      submitFinalAssessment(clientId, assessmentId, answers),
    onSuccess: (data) => {
      console.log("Final assessment submitted successfully:", data);
      // Set the assessment result from API response
      if (data) {
        setAssessmentResult({
          score: data.score || 0,
          offered_scholarship_percentage:
            data.offered_scholarship_percentage || 0,
        });
      }
      setIsCompleted(true);
    },
    onError: (error) => {
      console.error("Error submitting final assessment:", error);
      setIsCompleted(true); // Still show completed even if API fails
    },
  });

  // Mutation for updating after each question
  const updateAnswerMutation = useMutation({
    mutationFn: (answers: QuizSectionResponse) =>
      updateAfterEachQuestion(clientId, assessmentId, answers),
    onSuccess: (data) => {
      console.log("Answer updated successfully:", data);
    },
    onError: (error) => {
      console.error("Error updating answer:", error);
    },
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setUserAnswers((prev) => {
      if (!questions || !currentQuestion) return prev;
      try {
        const sectionId = questions.quizSection[0].id;
        // Use the actual question ID (1-based) from currentQuestion
        const questionId = currentQuestion.id;
        const updatedSection = { ...prev.quizSectionId[0] };
        updatedSection[sectionId] = {
          ...updatedSection[sectionId],
          [questionId]: option,
        };
        return { quizSectionId: [updatedSection] };
      } catch (error) {
        console.error("Error updating user answers:", error);
        return prev;
      }
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questionsData.length - 1) {
      // Update backend with current answers before moving to next question
      updateAnswerMutation.mutate(userAnswers, {
        onSuccess: () => {
          console.log("Answer updated successfully after question change");
          // Only move to next question after successful API call
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        },
        onError: (error) => {
          console.error("Error updating answer:", error);
          // Still move to next question even if API fails
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        },
      });
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleFinishAssessment = () => {
    // Log the response
    console.log("Submitted userAnswers:", userAnswers);
    finalSubmitMutation.mutate(userAnswers, {
      onSuccess: () => {
        console.log("Final assessment submitted successfully");
        setIsCompleted(true);
      },
      onError: (error) => {
        console.error("Error submitting final assessment:", error);
        setIsCompleted(true); // Still show completed even if API fails
      },
    });
  };

  // Helper for question button style
  const getQuestionButtonStyle = (index: number) => {
    if (!questions || userAnswers.quizSectionId.length === 0)
      return "bg-white border-gray-300 text-gray-600";
    try {
      const sectionId = questions.quizSection[0].id;
      // Get the question at the given index and use its ID (1-based)
      const question = questionsData[index];
      if (!question) return "bg-white border-gray-300 text-gray-600";

      const answer = userAnswers.quizSectionId[0][sectionId][question.id];
      console.log(
        `Button style for index ${index}, question ID ${question.id}, answer: ${answer}`
      );

      if (index === currentQuestionIndex) {
        return "bg-blue-50 border-[#007B9F] text-[#255C79]";
      }
      if (answer && answer !== "") {
        return "bg-[#2A8CB0] border-[#2A8CB0] text-white";
      }
      return "bg-white border-gray-300 text-gray-600";
    } catch (error) {
      console.error("Error getting question button style:", error);
      return "bg-white border-gray-300 text-gray-600";
    }
  };

  if (questionsLoading) {
    return <div>Loading questions...</div>;
  }
  if (questionsError) {
    return <div>Error loading questions: {questionsError.message}</div>;
  }
  // submiited section

  if (isCompleted) {
    // Use assessment result from API response
    const score = questions?.score || assessmentResult.score;
    const scholarshipPercentage =
      questions?.offered_scholarship_percentage ||
      assessmentResult.offered_scholarship_percentage;

    return (
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Left Panel - Score Display */}
            <div className="flex-1 bg-gradient-to-br from-[#B8E6F0] to-[#E0F4F8] rounded-2xl p-6 sm:p-8 relative overflow-hidden mb-4 md:mb-0">
              <div className="relative z-10">
                <p className="text-[#255C79] text-base sm:text-lg mb-2">
                  You have scored
                </p>
                <div className="flex items-baseline mb-4">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#255C79]">
                    {score}
                  </span>
                  <span className="text-2xl sm:text-3xl md:text-4xl text-[#255C79] ml-2">
                    /100
                  </span>
                </div>
                {score < 50 && (
                  <div className="flex items-center gap-2 text-[#255C79]">
                    <span className="text-xl sm:text-2xl">🎉</span>
                    <p className="text-base sm:text-lg font-medium">
                      Excellent your assessment is completed!{" "}
                      <span className="font-bold">Congratulations!</span>
                    </p>
                  </div>
                )}
                {score >= 50 && (
                  <div className="flex items-center gap-2 text-[#255C79]">
                    <span className="text-xl sm:text-2xl">⭐</span>
                    <p className="text-base sm:text-lg font-medium">
                      Outstanding! You aced it with top marks! 💯🎉
                    </p>
                  </div>
                )}
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full -translate-y-8 sm:-translate-y-16 translate-x-8 sm:translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full translate-y-6 sm:translate-y-12 -translate-x-6 sm:-translate-x-12"></div>
            </div>
            {/* Right Panel - Scholarship Eligibility */}
            <div className="w-full md:w-80 bg-gradient-to-br from-[#255C79] to-[#1a4a5f] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl sm:text-2xl">👋</span>
                  <p className="text-base sm:text-lg">
                    Hey, You are eligible for a
                  </p>
                </div>
                <div className="text-center mb-6">
                  <div className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2">
                    {scholarshipPercentage}%
                  </div>
                  <div className="text-lg sm:text-xl font-semibold">
                    Scholarship
                  </div>
                </div>
                <button
                  onClick={() => navigate("/courses")}
                  className="w-full bg-white text-[#255C79] py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  Redeem Now
                </button>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/10 rounded-full -translate-y-6 sm:-translate-y-12 translate-x-6 sm:translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full translate-y-8 sm:translate-y-16 -translate-x-8 sm:-translate-x-16"></div>
            </div>
          </div>
          {/* Bottom notification */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              Need time to decide ? Don't worry, you can redeem later as well
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <button
              onClick={() => navigate("/assessment")}
              className="flex items-center text-[#255C79] hover:text-[#1a4a5f] mb-2 sm:mb-0"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Back
            </button>
            <div className="text-left sm:text-center w-full sm:w-auto">
              <h1 className="text-base sm:text-lg font-semibold text-gray-800">
                {"Assessment"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Solve real world questions and gain insight knowledge.
              </p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="text-xs sm:text-sm text-gray-500">
                Time Remaining
              </div>
              <div className="text-base sm:text-lg font-semibold text-[#255C79]">
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Left Sidebar - Question Navigation */}
          <div className="w-full md:w-1/4 bg-white rounded-lg p-4 sm:p-6 shadow-sm h-fit mb-4 md:mb-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
              Questions
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-3 gap-2">
              {questionsData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => navigateToQuestion(index)}
                  className={`py-2 px-2 sm:px-3 rounded-md border text-xs sm:text-sm font-medium transition ${getQuestionButtonStyle(
                    index
                  )}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <div>Total Questions: {questionsData.length}</div>
                <div>
                  Answered:{" "}
                  {(() => {
                    if (!questions || userAnswers.quizSectionId.length === 0)
                      return 0;
                    const sectionId = questions.quizSection[0].id;
                    const answersObj = userAnswers.quizSectionId[0][sectionId];
                    return Object.values(answersObj).filter(
                      (ans) => ans && ans !== ""
                    ).length;
                  })()}
                </div>
                <div>
                  Remaining:{" "}
                  {(() => {
                    if (!questions || userAnswers.quizSectionId.length === 0)
                      return questionsData.length;
                    const sectionId = questions.quizSection[0].id;
                    const answersObj = userAnswers.quizSectionId[0][sectionId];
                    return Object.values(answersObj).filter(
                      (ans) => !ans || ans === ""
                    ).length;
                  })()}
                </div>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4 gap-2 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-500">
                  Question {currentQuestionIndex + 1} of {questionsData.length}
                </span>
                <span className="text-xs bg-blue-100 text-[#255C79] px-2 py-1 rounded">
                  {currentQuestion?.difficulty_level || ""}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
                {currentQuestion?.question_text}
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {currentQuestion?.options?.map((option, idx) => {
                  const optionLetter = optionLetters[idx];
                  const isSelected = selectedOption === optionLetter;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleOptionSelect(optionLetter)}
                      className={`cursor-pointer border rounded-lg p-3 sm:p-4 transition ${
                        isSelected
                          ? "border-[#255C79] bg-blue-50"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="font-medium mr-2 sm:mr-3 text-[#255C79]">
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
            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 sm:pt-6 border-t border-gray-200 gap-2 sm:gap-0">
              <button
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                className={`w-full sm:w-auto px-4 py-2 rounded-md font-medium transition ${
                  currentQuestionIndex === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border border-[#255C79] text-[#255C79] hover:bg-blue-50"
                }`}
              >
                Previous
              </button>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                {currentQuestionIndex < questionsData.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!selectedOption}
                    className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition ${"bg-[#255C79] text-white hover:bg-[#1a4a5f]"}`}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleFinishAssessment}
                    className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition ${"bg-green-600 text-white hover:bg-green-700"}`}
                  >
                    Finish Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortAssessment;
