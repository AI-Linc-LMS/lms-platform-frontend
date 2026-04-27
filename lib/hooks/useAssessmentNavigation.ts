"use client";

import { useCallback } from "react";

interface UseAssessmentNavigationOptions {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  sections: Array<{ questions?: Array<any> }>;
  setCurrentSectionIndex: (index: number) => void;
  setCurrentQuestionIndex: (index: number) => void;
  /** When false, block Previous from crossing into a lower section index (strict linear flow). Default true. */
  allowMovementAcrossSections?: boolean;
  /** When true, block Previous from leaving the first question of this section into the previous section (e.g. timed block already completed). */
  blockCrossSectionPrevious?: boolean;
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
  allowMovementAcrossSections = true,
  blockCrossSectionPrevious = false,
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
    // IMMEDIATE navigation - no delays
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      return;
    }
    if (currentSectionIndex > 0) {
      if (!allowMovementAcrossSections) {
        return;
      }
      if (blockCrossSectionPrevious) {
        return;
      }
      setCurrentSectionIndex(currentSectionIndex - 1);
      const prevSection = sections[currentSectionIndex - 1];
      setCurrentQuestionIndex((prevSection?.questions?.length || 1) - 1);
    }
  }, [
    allowMovementAcrossSections,
    blockCrossSectionPrevious,
    currentQuestionIndex,
    currentSectionIndex,
    sections,
    setCurrentSectionIndex,
    setCurrentQuestionIndex,
  ]);

  const handleNext = useCallback(() => {
    // IMMEDIATE navigation - no delays
    if (currentQuestionIndex < currentSectionQuestionCount - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
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

