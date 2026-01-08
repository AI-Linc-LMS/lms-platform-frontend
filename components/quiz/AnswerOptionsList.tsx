"use client";

import { Box } from "@mui/material";
import { memo, useCallback } from "react";
import { QuizOption } from "./QuizLayout";
import { AnswerOption } from "./AnswerOption";

interface AnswerOptionsListProps {
  options: QuizOption[];
  selectedAnswer?: string | number;
  showCorrectAnswer: boolean;
  correctAnswerId?: string | number;
  isReadOnly: boolean;
  isSubmitting: boolean;
  onAnswerSelect: (answerId: string | number) => void;
}

export const AnswerOptionsList = memo(function AnswerOptionsList({
  options,
  selectedAnswer,
  showCorrectAnswer,
  correctAnswerId,
  isReadOnly,
  isSubmitting,
  onAnswerSelect,
}: AnswerOptionsListProps) {
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
      {options.map((option) => {
        const isSelected = selectedAnswer === option.id;
        const isCorrect = showCorrectAnswer && correctAnswerId === option.id;
        const isWrongSelection = isSelected && !isCorrect && showCorrectAnswer;

        return (
          <AnswerOption
            key={option.id}
            option={option}
            isSelected={isSelected}
            isCorrect={isCorrect}
            isWrongSelection={isWrongSelection}
            isReadOnly={isReadOnly}
            isSubmitting={isSubmitting}
            onSelect={() => onAnswerSelect(option.id)}
          />
        );
      })}
    </Box>
  );
});

