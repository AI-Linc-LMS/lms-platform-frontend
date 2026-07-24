"use client";

import { Box } from "@mui/material";
import { memo, useCallback, useMemo, useRef } from "react";
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

// Per-option wrapper carries a stable onClick (option.id closed over the parent ref) so
// the memoized AnswerOption underneath is not invalidated by inline arrow recreation.
interface OptionRowProps {
  option: QuizOption;
  isSelected: boolean;
  isCorrect: boolean;
  isWrongSelection: boolean;
  isReadOnly: boolean;
  isSubmitting: boolean;
  compact?: boolean;
  onSelectRef: React.MutableRefObject<(id: string | number) => void>;
}

const OptionRow = memo(function OptionRow({
  option,
  isSelected,
  isCorrect,
  isWrongSelection,
  isReadOnly,
  isSubmitting,
  compact,
  onSelectRef,
}: OptionRowProps) {
  const handleSelect = useCallback(() => {
    onSelectRef.current(option.id);
  }, [option.id, onSelectRef]);

  return (
    <AnswerOption
      option={option}
      isSelected={isSelected}
      isCorrect={isCorrect}
      isWrongSelection={isWrongSelection}
      isReadOnly={isReadOnly}
      isSubmitting={isSubmitting}
      onSelect={handleSelect}
      compact={compact}
    />
  );
});

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
  // Hold onAnswerSelect in a ref so OptionRow's per-option handler stays stable across
  // parent renders. AnswerOption is memoized - recreating `onSelect` per render defeated
  // it and re-rendered every option on each click.
  const onAnswerSelectRef = useRef(onAnswerSelect);
  onAnswerSelectRef.current = onAnswerSelect;

  const selectedSet = useMemo(
    () =>
      new Set(
        multiSelect
          ? Array.isArray(selectedAnswer)
            ? selectedAnswer.map((x) => String(x).toUpperCase())
            : selectedAnswer != null && selectedAnswer !== ""
              ? [String(selectedAnswer).toUpperCase()]
              : []
          : [],
      ),
    [multiSelect, selectedAnswer],
  );
  const selectedSingle = useMemo(
    () => String(selectedAnswer ?? "").toUpperCase(),
    [selectedAnswer],
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
          : selectedSingle === letter;
        const isCorrect = showCorrectAnswer && correctAnswerId === option.id;
        const isWrongSelection = isSelected && !isCorrect && showCorrectAnswer;

        return (
          <OptionRow
            key={option.id}
            option={option}
            isSelected={isSelected}
            isCorrect={isCorrect}
            isWrongSelection={isWrongSelection}
            isReadOnly={isReadOnly}
            isSubmitting={isSubmitting}
            onSelectRef={onAnswerSelectRef}
            compact={compact}
          />
        );
      })}
    </Box>
  );
});

