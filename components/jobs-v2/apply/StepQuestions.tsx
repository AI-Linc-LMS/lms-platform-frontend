"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  resolveQuestionControl,
  answerValues,
  type AnswerErrors,
  type AnswerMap,
  type AnswerValue,
  type JobQuestion,
} from "@/lib/jobs-v2/questions";
import {
  TYPE,
  JCard,
  JTextField,
  JTextArea,
  JSelect,
  JRadioGroup,
  JCheckGroup,
  JDatePicker,
  RequiredLegend,
} from "@/components/jobs-v2/ui";

export interface StepQuestionsProps {
  questions: JobQuestion[];
  answers: AnswerMap;
  errors: AnswerErrors;
  onChange: (questionId: number, value: AnswerValue) => void;
}

/**
 * Step 1 — the employer's questions.
 *
 * Two shipped bugs die here:
 *
 * 1. **An unknown question type rendered nothing.** The form switched on three known types, so
 *    anything else showed a label, a red `*` and no control at all — a required question that
 *    could not be answered, with Next disabled forever. `resolveQuestionControl` always returns
 *    a control (its default branch is a textarea, and it logs).
 * 2. **Validation was a toast.** "Please answer all required questions" told you nothing about
 *    *which* one. Errors are field-level now: the control turns red, its message renders below
 *    with `role="alert"`, and `ApplyFlow` focuses the first one.
 */
export function StepQuestions({ questions, answers, errors, onChange }: StepQuestionsProps) {
  const { t } = useTranslation("common");
  const anyRequired = questions.some((q) => q.is_required);

  return (
    <JCard>
      <Typography component="h2" sx={{ ...TYPE.h3, mb: 0.5 }}>
        {t("jobsV2.apply.questionsTitle", { defaultValue: "The employer's questions" })}
      </Typography>
      <Typography sx={{ ...TYPE.small, mb: anyRequired ? 0.75 : 2 }}>
        {t("jobsV2.apply.questionsHint", {
          defaultValue: "Your answers go to the employer exactly as you write them.",
        })}
      </Typography>
      {/* The `*` on its own explains nothing. The legend is stated once, per form. */}
      {anyRequired && <RequiredLegend sx={{ mb: 2 }} />}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {questions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            value={answers[question.id]}
            error={errors[question.id] ?? null}
            onChange={(value) => onChange(question.id, value)}
          />
        ))}
      </Box>
    </JCard>
  );
}

function QuestionField({
  question,
  value,
  error,
  onChange,
}: {
  question: JobQuestion;
  value: AnswerValue | undefined;
  error: string | null;
  onChange: (value: AnswerValue) => void;
}) {
  const { t } = useTranslation("common");
  const resolved = resolveQuestionControl(question);
  const id = `apply-q-${question.id}`;
  const single = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  const many = answerValues(value);

  const shared = {
    id,
    label: question.question_text,
    required: question.is_required,
    error,
    helper: resolved.fallback
      ? t("jobsV2.apply.freeTextFallback", { defaultValue: "Answer in your own words." })
      : undefined,
  } as const;

  switch (resolved.control) {
    case "radio":
      return (
        <JRadioGroup
          {...shared}
          value={single}
          onChange={onChange}
          options={resolved.options.map((option) => ({ value: option, label: option }))}
          orientation={resolved.options.length <= 3 ? "horizontal" : "vertical"}
        />
      );
    case "checkbox":
      return (
        <JCheckGroup
          {...shared}
          values={many}
          onChange={onChange}
          options={resolved.options.map((option) => ({ value: option, label: option }))}
        />
      );
    case "select":
      return (
        <JSelect
          {...shared}
          value={single}
          onChange={onChange}
          placeholder={t("jobsV2.apply.chooseAnswer", { defaultValue: "Choose an answer" })}
          options={resolved.options.map((option) => ({ value: option, label: option }))}
        />
      );
    case "textarea":
      return (
        <JTextArea
          {...shared}
          value={single}
          onChange={onChange}
          rows={4}
          placeholder={t("jobsV2.apply.yourAnswer", { defaultValue: "Your answer" })}
        />
      );
    case "date":
      return <JDatePicker {...shared} value={single} onChange={onChange} />;
    case "number":
      return (
        <JTextField
          {...shared}
          type="number"
          inputMode="numeric"
          value={single}
          onChange={onChange}
          placeholder={t("jobsV2.apply.yourAnswer", { defaultValue: "Your answer" })}
        />
      );
    case "email":
      return (
        <JTextField
          {...shared}
          type="email"
          inputMode="email"
          value={single}
          onChange={onChange}
          placeholder={t("jobsV2.apply.yourAnswer", { defaultValue: "Your answer" })}
        />
      );
    case "url":
      return (
        <JTextField
          {...shared}
          type="url"
          inputMode="url"
          value={single}
          onChange={onChange}
          placeholder={t("jobsV2.apply.yourAnswer", { defaultValue: "Your answer" })}
        />
      );
    case "text":
    default:
      return (
        <JTextField
          {...shared}
          value={single}
          onChange={onChange}
          placeholder={t("jobsV2.apply.yourAnswer", { defaultValue: "Your answer" })}
        />
      );
  }
}
