"use client";

import { Box } from "@mui/material";
import { memo, useCallback } from "react";
import { QuizOption } from "./QuizLayout";
import { AnswerOption } from "./AnswerOption";

interface AnswerOptionsListProps {
  options: QuizOption[];
  selectedAnswer?: string | number | string[];
  showCorrectAnswer: boolean;
  correctAnswerId?: string | number;
  isReadOnly: boolean;
  isSubmitting: boolean;
  onAnswerSelect: (answerId: string | number) => void;
  /** When true, reduce spacing so quiz fits without scroll */
  compact?: boolean;
  /** Multiple-select (MSQ): toggle each option; selectedAnswer is list of letters (any case). */
  multiSelect?: boolean;
}

function optionLetter(option: QuizOption): string {
  return String(option.value ?? option.id ?? "").toUpperCase();
}

export const AnswerOptionsList = memo(function AnswerOptionsList({
  options,
  selectedAnswer,
  showCorrectAnswer,
  correctAnswerId,
  isReadOnly,
  isSubmitting,
  onAnswerSelect,
  compact,
  multiSelect,
}: AnswerOptionsListProps) {
  const selectedSet = new Set(
    multiSelect
      ? Array.isArray(selectedAnswer)
        ? selectedAnswer.map((x) => String(x).toUpperCase())
        : selectedAnswer != null && selectedAnswer !== ""
          ? [String(selectedAnswer).toUpperCase()]
          : []
      : [],
  );
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 1.5 : 2.5,
        mt: compact ? 1.5 : 3,
      }}
    >
      {options.map((option) => {
        const letter = optionLetter(option);
        const isSelected = multiSelect
          ? selectedSet.has(letter)
          : String(selectedAnswer ?? "").toUpperCase() === letter;
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
            compact={compact}
          />
        );
      })}
    </Box>
  );
});

