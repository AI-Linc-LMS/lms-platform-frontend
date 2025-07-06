import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  startAssessment,
  submitFinalAssessment,
  updateAfterEachQuestion,
} from "../../../services/assesment/assesmentApis";
import { getReferralCode, clearStoredReferralCode } from "../../../utils/referralUtils";

export interface Question {
  id: number;
  options_a: string;
  options_b: string;
  options_c: string;
  options_d: string;
  question_text: string;
  difficulty_level?: string;
  options?: string[];
}

export interface MCQQuestion {
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

export const useAssessment = (assessmentId?: string) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const currentAssessmentId = assessmentId || "ai-linc-scholarship-test";
  const [searchParams] = useSearchParams();
  
  // Capture referral code from URL parameters or localStorage
  const referralCode = getReferralCode(searchParams);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<QuizSectionResponse>({
    quizSectionId: [],
  });
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questionsData, setQuestionsData] = useState<Question[]>([]);
  const [assessmentResult, setAssessmentResult] = useState({
    score: 0,
    offered_scholarship_percentage: 0,
  });

  const {
    data: questions,
    isLoading: questionsLoading,
    error: questionsError,
  } = useQuery({
    queryKey: ["questionsData", currentAssessmentId],
    queryFn: () => startAssessment(1, currentAssessmentId),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  });

  const finalAssessmentId = questions?.slug ?? currentAssessmentId;

  const finalSubmitMutation = useMutation({
    mutationFn: (answers: QuizSectionResponse) =>
      submitFinalAssessment(clientId, finalAssessmentId, answers, referralCode || undefined),
    onSuccess: (data) => {
      console.log("Final assessment submitted successfully:", data);
      if (referralCode) {
        console.log("Assessment submitted with referral code:", referralCode);
        // Clear the referral code after successful submission
        clearStoredReferralCode();
      }
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
      setIsCompleted(true);
    },
  });

  const updateAnswerMutation = useMutation({
    mutationFn: (answers: QuizSectionResponse) =>
      updateAfterEachQuestion(clientId, finalAssessmentId, answers, referralCode || undefined),
    onSuccess: (data) => {
      console.log("Answer updated successfully:", data);
    },
    onError: (error) => {
      console.error("Error updating answer:", error);
    },
  });

  // Check if assessment is already submitted
  useEffect(() => {
    if (questions && questions.status === "submitted") {
      setIsCompleted(true);
    } else if (questions && questions.status === "in_progress") {
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
      setTimeRemaining(questions.remaining_time * 60);
      const mcqs = questions.quizSection[0].mcqs.map((q: MCQQuestion) => ({
        ...q,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
      }));
      setQuestionsData(mcqs);

      const sectionId = questions.quizSection[0].id;

      if (
        questions.responseSheet &&
        questions.responseSheet.quizSectionId &&
        questions.responseSheet.quizSectionId.length > 0
      ) {
        setUserAnswers(questions.responseSheet);

        const sectionResponse = questions.responseSheet.quizSectionId[0];
        if (sectionResponse && sectionResponse[sectionId]) {
          const answersObj = sectionResponse[sectionId];
          const answeredQuestions = Object.entries(answersObj)
            .filter(([, answer]) => answer && answer !== "")
            .map(([questionId]) => parseInt(questionId));

          if (answeredQuestions.length > 0) {
            const lastAnsweredQuestionId = Math.max(...answeredQuestions);
            const lastAnsweredIndex = mcqs.findIndex(
              (q: Question) => q.id === lastAnsweredQuestionId
            );

            if (lastAnsweredIndex < mcqs.length - 1) {
              setCurrentQuestionIndex(lastAnsweredIndex + 1);
            } else {
              setCurrentQuestionIndex(lastAnsweredIndex);
            }
          }
        }
      } else {
        const sectionResponse: SectionResponse = {
          [sectionId]: {},
        };
        mcqs.forEach((q: Question) => {
          sectionResponse[sectionId][q.id] = "";
        });
        setUserAnswers({ quizSectionId: [sectionResponse] });
        setCurrentQuestionIndex(0);
      }
    }
  }, [questions]);

  // Set selectedOption when question changes
  useEffect(() => {
    if (
      userAnswers.quizSectionId.length > 0 &&
      questions &&
      questionsData[currentQuestionIndex]
    ) {
      try {
        const sectionId = questions.quizSection[0].id;
        const questionId = questionsData[currentQuestionIndex].id;
        const answer = userAnswers.quizSectionId[0][sectionId][questionId];
        setSelectedOption(answer || null);
      } catch (error) {
        console.error("Error setting selected option:", error);
        setSelectedOption(null);
      }
    } else {
      setSelectedOption(null);
    }
  }, [currentQuestionIndex, userAnswers, questions, questionsData]);

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          finalSubmitMutation.mutate(userAnswers, {
            onSuccess: (data) => {
              console.log("Assessment auto-submitted successfully:", data);
              if (referralCode) {
                console.log("Assessment auto-submitted with referral code:", referralCode);
              }
              if (data) {
                setAssessmentResult({
                  score: data.score || 0,
                  offered_scholarship_percentage:
                    data.offered_scholarship_percentage || 0,
                });
              }
            },
            onError: (error) => {
              console.error("Error auto-submitting assessment:", error);
              setIsCompleted(true);
            },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, userAnswers, referralCode]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    updateAnswerMutation.mutate(userAnswers, {
      onSuccess: () => {
        console.log("Answer updated successfully after question change");
      },
      onError: (error) => {
        console.error("Error updating answer:", error);
      },
    });
    
    setUserAnswers((prev) => {
      if (!questions || !questionsData[currentQuestionIndex]) return prev;
      try {
        const sectionId = questions.quizSection[0].id;
        const questionId = questionsData[currentQuestionIndex].id;
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
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleFinishAssessment = () => {
    console.log("Submitted userAnswers:", userAnswers);
    if (referralCode) {
      console.log("Finishing assessment with referral code:", referralCode);
    }
    finalSubmitMutation.mutate(userAnswers, {
      onSuccess: () => {
        console.log("Final assessment submitted successfully");
        setIsCompleted(true);
      },
      onError: (error) => {
        console.error("Error submitting final assessment:", error);
        setIsCompleted(true);
      },
    });
  };

  const getQuestionButtonStyle = (index: number) => {
    if (!questions || userAnswers.quizSectionId.length === 0)
      return "bg-white border-gray-300 text-gray-600";
    try {
      const sectionId = questions.quizSection[0].id;
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

  const getAnsweredCount = () => {
    if (!questions || userAnswers.quizSectionId.length === 0) return 0;
    const sectionId = questions.quizSection[0].id;
    const answersObj = userAnswers.quizSectionId[0][sectionId];
    return Object.values(answersObj).filter((ans) => ans && ans !== "").length;
  };

  const getRemainingCount = () => {
    if (!questions || userAnswers.quizSectionId.length === 0)
      return questionsData.length;
    const sectionId = questions.quizSection[0].id;
    const answersObj = userAnswers.quizSectionId[0][sectionId];
    return Object.values(answersObj).filter((ans) => !ans || ans === "").length;
  };

  return {
    // State
    currentQuestionIndex,
    selectedOption,
    userAnswers,
    timeRemaining,
    isCompleted,
    questionsData,
    assessmentResult,
    questions,
    questionsLoading,
    questionsError,
    referralCode,

    // Actions
    handleOptionSelect,
    handleNext,
    handleBack,
    navigateToQuestion,
    handleFinishAssessment,

    // Utilities
    getQuestionButtonStyle,
    getAnsweredCount,
    getRemainingCount,
  };
};
