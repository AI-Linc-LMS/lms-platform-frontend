"use client";

import { memo, useCallback } from "react";
import { Box } from "@mui/material";
import { AssessmentQuizLayout } from "@/components/assessment/AssessmentQuizLayout";
import { AssessmentCodingLayout } from "@/components/assessment/AssessmentCodingLayout";

const MemoizedQuizLayout = memo(AssessmentQuizLayout);
const MemoizedCodingLayout = memo(AssessmentCodingLayout);

interface AssessmentContentProps {
  slug: string;
  currentSection: any;
  sectionType: string;
  currentQuestionIndex: number;
  isTransitioning: boolean;
  // Quiz props
  currentQuizQuestion: any;
  currentAnswer: any;
  mappedQuizQuestions: any[];
  quizQuestions: any[];
  // Coding props
  currentCodingQuestion: any;
  currentCodingResponse: any;
  codingQuestions: any[];
  // Handlers
  onAnswerChange: (sectionType: string, questionId: string | number, answer: any) => void;
  onQuizAnswerSelect: (answerId: string | number) => void;
  onClearAnswer: () => void;
  onQuizQuestionClick: (questionId: string | number) => void;
  onCodingQuestionClick: (questionId: string | number) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
}

export function AssessmentContent({
  slug,
  currentSection,
  sectionType,
  currentQuestionIndex,
  isTransitioning,
  currentQuizQuestion,
  currentAnswer,
  mappedQuizQuestions,
  quizQuestions,
  currentCodingQuestion,
  currentCodingResponse,
  codingQuestions,
  onAnswerChange,
  onQuizAnswerSelect,
  onClearAnswer,
  onQuizQuestionClick,
  onCodingQuestionClick,
  onNextQuestion,
  onPreviousQuestion,
}: AssessmentContentProps) {
  const handleCodeChange = useCallback(
    (code: string, language: string) => {
      if (!currentCodingQuestion) return;
      onAnswerChange("coding", currentCodingQuestion.id, {
        code,
        language,
        ...(currentCodingResponse || {}),
      });
    },
    [currentCodingQuestion, currentCodingResponse, onAnswerChange]
  );

  const handleCodeSubmit = useCallback(
    (result: any) => {
      if (!currentCodingQuestion) return;
      onAnswerChange("coding", currentCodingQuestion.id, {
        code: result.best_code || currentCodingResponse?.code || "",
        language: currentCodingResponse?.language || "python",
        tc_passed: result.tc_passed ?? result.passed ?? 0,
        total_tc: result.total_tc ?? result.total_test_cases ?? 0,
        submitted: true,
      });
    },
    [currentCodingQuestion, currentCodingResponse, onAnswerChange]
  );

  if (!currentSection) return null;

  return (
    <Box
      sx={{
        position: "relative",
        opacity: isTransitioning ? 0.8 : 1,
        transition: "opacity 0.15s ease-out",
        willChange: isTransitioning ? "opacity" : "auto",
        transform: isTransitioning ? "translateX(4px)" : "translateX(0)",
      }}
    >
      {sectionType === "quiz" && currentQuizQuestion && (
        <MemoizedQuizLayout
          currentQuestionIndex={currentQuestionIndex}
          currentQuestion={currentQuizQuestion}
          selectedAnswer={currentAnswer}
          questions={mappedQuizQuestions}
          totalQuestions={quizQuestions.length}
          onAnswerSelect={onQuizAnswerSelect}
          onClearAnswer={onClearAnswer}
          onNextQuestion={onNextQuestion}
          onPreviousQuestion={onPreviousQuestion}
          onQuestionClick={onQuizQuestionClick}
        />
      )}

      {sectionType === "coding" && currentCodingQuestion && (
        <MemoizedCodingLayout
          key={`coding-${currentCodingQuestion.id}-${currentQuestionIndex}`}
          slug={slug}
          questionId={currentCodingQuestion.id}
          problemData={{
            details: currentCodingQuestion,
          }}
          initialCode={
            currentCodingResponse?.code ||
            currentCodingQuestion.template_code?.python ||
            currentCodingQuestion.template_code?.python3 ||
            ""
          }
          initialLanguage={currentCodingResponse?.language || "python"}
          questions={codingQuestions}
          totalQuestions={codingQuestions.length}
          currentQuestionIndex={currentQuestionIndex}
          onQuestionClick={onCodingQuestionClick}
          onNextQuestion={onNextQuestion}
          onPreviousQuestion={onPreviousQuestion}
          onCodeChange={handleCodeChange}
          onCodeSubmit={handleCodeSubmit}
        />
      )}
    </Box>
  );
}
