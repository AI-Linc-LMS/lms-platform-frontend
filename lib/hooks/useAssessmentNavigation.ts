"use client";

import { useCallback, startTransition } from "react";

interface UseAssessmentNavigationOptions {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  sections: Array<{ questions?: Array<any> }>;
  setCurrentSectionIndex: (index: number) => void;
  setCurrentQuestionIndex: (index: number) => void;
}

interface UseAssessmentNavigationReturn {
  handlePrevious: () => void;
  handleNext: () => void;
  currentSectionQuestionCount: number;
  isLastQuestion: boolean;
  totalQuestions: number;
}

export function useAssessmentNavigation({
  currentSectionIndex,
  currentQuestionIndex,
  sections,
  setCurrentSectionIndex,
  setCurrentQuestionIndex,
}: UseAssessmentNavigationOptions): UseAssessmentNavigationReturn {
  const currentSection = sections[currentSectionIndex] || null;
  const currentSectionQuestionCount = currentSection?.questions?.length || 0;

  const totalQuestions = sections.reduce(
    (sum, section) => sum + (section.questions?.length || 0),
    0
  );

  const isLastQuestion =
    currentSectionIndex === sections.length - 1 &&
    currentQuestionIndex === currentSectionQuestionCount - 1;

  const handlePrevious = useCallback(() => {
    // Use requestIdleCallback for truly non-blocking navigation
    const navigate = () => {
      startTransition(() => {
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(currentQuestionIndex - 1);
        } else if (currentSectionIndex > 0) {
          setCurrentSectionIndex(currentSectionIndex - 1);
          const prevSection = sections[currentSectionIndex - 1];
          setCurrentQuestionIndex((prevSection?.questions?.length || 1) - 1);
        }
      });
    };
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(navigate, { timeout: 30 });
    } else {
      setTimeout(navigate, 0);
    }
  }, [
    currentQuestionIndex,
    currentSectionIndex,
    sections,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
  ]);

  const handleNext = useCallback(() => {
    // Use requestIdleCallback for truly non-blocking navigation
    const navigate = () => {
      startTransition(() => {
        if (currentQuestionIndex < currentSectionQuestionCount - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else if (currentSectionIndex < sections.length - 1) {
          setCurrentSectionIndex(currentSectionIndex + 1);
          setCurrentQuestionIndex(0);
        }
      });
    };
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(navigate, { timeout: 30 });
    } else {
      setTimeout(navigate, 0);
    }
  }, [
    currentQuestionIndex,
    currentSectionIndex,
    currentSectionQuestionCount,
    sections,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
  ]);

  return {
    handlePrevious,
    handleNext,
    currentSectionQuestionCount,
    isLastQuestion,
    totalQuestions,
  };
}

