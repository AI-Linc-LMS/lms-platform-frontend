"use client";

import { useState, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { QuizLayout } from "@/components/quiz/QuizLayout";
import { ContentDetails } from "@/lib/services/admin/admin-content-management.service";

interface QuizViewProps {
  content: ContentDetails;
}

export function QuizView({ content }: QuizViewProps) {
  const mcqs = content.content_details?.mcqs || [];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Transform MCQs to QuizLayout format
  const questions = useMemo(() => {
    return mcqs.map((mcq: any, index: number) => {
      // Map options array to QuizLayout format
      // Options are in array format: ["$5,377", "$6,639", "$4,739", "$5,739"]
      // Map them to A, B, C, D
      const optionLabels = ["A", "B", "C", "D"];
      const options = (mcq.options || []).map((optionText: string, optIndex: number) => ({
        id: optionLabels[optIndex] || String(optIndex),
        label: optionText,
        value: optionLabels[optIndex] || String(optIndex),
      }));

      return {
        id: mcq.id || index,
        question: mcq.question_text || "",
        options: options,
        answered: false, // Always false in read-only view
      };
    });
  }, [mcqs]);

  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // Get correct answer for current question
  const currentMcq = mcqs[currentQuestionIndex];
  const correctAnswerId = currentMcq?.correct_option || undefined;
  const explanation = currentMcq?.explanation || undefined;

  // No-op handlers since it's read-only
  const handleAnswerSelect = () => {
    // Read-only: do nothing
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionClick = (questionId: string | number) => {
    const index = questions.findIndex((q: { id: string | number }) => q.id === questionId);
    if (index !== -1) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleFinalSubmit = () => {
    // Read-only: do nothing
  };

  if (!currentQuestion || questions.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6">No quiz questions available</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
      }}
    >
      <QuizLayout
        currentQuestionIndex={currentQuestionIndex}
        currentQuestion={currentQuestion}
        selectedAnswer={undefined}
        questions={questions}
        totalQuestions={questions.length}
        onAnswerSelect={handleAnswerSelect}
        onNextQuestion={handleNextQuestion}
        onPreviousQuestion={handlePreviousQuestion}
        onFinalSubmit={handleFinalSubmit}
        onQuestionClick={handleQuestionClick}
        isReadOnly={true}
        showCorrectAnswer={true}
        correctAnswerId={correctAnswerId}
        explanation={explanation}
      />
    </Box>
  );
}
