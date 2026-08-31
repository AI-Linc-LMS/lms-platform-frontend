"use client";

import { useCallback, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { resolveQuestionControl } from "@/lib/jobs-v2/questions";
import {
  J,
  JButton,
  JCheckGroup,
  JModal,
  JRadioGroup,
  JSelect,
  JSwitch,
  JTextArea,
  JTextField,
  R,
  TYPE,
  focusRing,
} from "@/components/jobs-v2/ui";

export type QuestionType = "text" | "textarea" | "choice" | "multichoice" | "yes_no";

const QUESTION_TYPES: { value: QuestionType; labelKey: string; fallback: string; icon: string }[] = [
  { value: "text", labelKey: "jobsV2.questionType.text", fallback: "Short text", icon: "mdi:format-text" },
  { value: "textarea", labelKey: "jobsV2.questionType.textarea", fallback: "Paragraph", icon: "mdi:text-box-outline" },
  { value: "choice", labelKey: "jobsV2.questionType.choice", fallback: "Single choice", icon: "mdi:radiobox-marked" },
  {
    value: "multichoice",
    labelKey: "jobsV2.questionType.multichoice",
    fallback: "Multiple choice",
    icon: "mdi:checkbox-multiple-marked-outline",
  },
  { value: "yes_no", labelKey: "jobsV2.questionType.yes_no", fallback: "Yes / No", icon: "mdi:toggle-switch-outline" },
];

const DEFAULT_OPTIONS = ["", "", "", ""];

/** The two types that carry an option list. Switching between them PRESERVES what was typed. */
const TAKES_OPTIONS = (type: QuestionType) => type === "choice" || type === "multichoice";

export interface ApplicationQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    question_text: string;
    question_type: QuestionType;
    is_required: boolean;
    order: number;
    options?: string[];
  }) => Promise<void>;
  /** The index within THIS job's selection, not the size of the global bank. */
  nextOrder: number;
}

export function ApplicationQuestionsModal({
  open,
  onClose,
  onSubmit,
  nextOrder,
}: ApplicationQuestionsModalProps) {
  const { t } = useTranslation("common");

  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const reset = useCallback(() => {
    setQuestionText("");
    setQuestionType("text");
    setIsRequired(false);
    setOptions(DEFAULT_OPTIONS);
    setSubmitError(null);
    setTouched(false);
  }, []);

  const dirty =
    questionText.trim().length > 0 || options.some((o) => o.trim().length > 0) || isRequired;

  const close = useCallback(() => {
    reset();
    setAddedCount(0);
    onClose();
  }, [onClose, reset]);

  /** Switching type keeps typed options whenever the NEW type also takes options. */
  const changeType = (next: QuestionType) => {
    setQuestionType(next);
    if (next === "yes_no") {
      setOptions([t("jobsV2.questions.yes") as string, t("jobsV2.questions.no") as string]);
      return;
    }
    if (TAKES_OPTIONS(next)) {
      setOptions((prev) => (prev.some((o) => o.trim()) ? prev : DEFAULT_OPTIONS));
    }
  };

  const needsOptions = TAKES_OPTIONS(questionType);
  const filledOptions = options.map((o) => o.trim()).filter(Boolean);

  // Live, field-level validation. Not a generic submit-time strip reading "Add at least 2
  // options" over four blank rows.
  const textError =
    touched && !questionText.trim()
      ? (t("jobsV2.questionModal.errorText", "Write the question a candidate will read") as string)
      : null;
  const optionsError =
    touched && needsOptions && filledOptions.length < 2
      ? (t("jobsV2.questionModal.errorOptions", "Give at least two real options") as string)
      : null;
  const duplicateOption = useMemo(() => {
    const seen = new Set<string>();
    for (const option of filledOptions) {
      const key = option.toLowerCase();
      if (seen.has(key)) return option;
      seen.add(key);
    }
    return null;
  }, [filledOptions]);

  const canSubmit =
    questionText.trim().length > 0 &&
    (!needsOptions || filledOptions.length >= 2) &&
    !duplicateOption;

  const updateOption = (index: number, value: string) =>
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

  const removeOption = (index: number) =>
    setOptions((prev) => prev.filter((_, i) => i !== index));

  // Remove stays enabled down to two NON-EMPTY options, so an admin who wants three real
  // options can clear the blanks and rebuild instead of editing around them.
  const canRemoveOption = filledOptions.length > 2 || options.length > 2;

  const submit = useCallback(
    async (andAnother: boolean) => {
      setTouched(true);
      if (!canSubmit) return;
      setSubmitError(null);
      setSubmitting(true);
      try {
        const payload: Parameters<typeof onSubmit>[0] = {
          question_text: questionText.trim(),
          question_type: questionType,
          is_required: isRequired,
          order: nextOrder + addedCount,
        };
        if (needsOptions) payload.options = filledOptions;
        else if (questionType === "yes_no") {
          payload.options = [
            t("jobsV2.questions.yes") as string,
            t("jobsV2.questions.no") as string,
          ];
        }
        await onSubmit(payload);
        if (andAnother) {
          setAddedCount((n) => n + 1);
          reset();
        } else {
          close();
        }
      } catch (err) {
        setSubmitError(
          (err as Error)?.message ??
            (t("jobsV2.questionModal.errorSave", "We could not save that question") as string),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      addedCount,
      canSubmit,
      close,
      filledOptions,
      isRequired,
      needsOptions,
      nextOrder,
      onSubmit,
      questionText,
      questionType,
      reset,
      t,
    ],
  );

  return (
    <JModal
      open={open}
      onClose={close}
      dirty={dirty && !submitting}
      size="md"
      mobile="fullscreen"
      icon="mdi:help-circle-outline"
      eyebrow={t("jobsV2.form.questions", "Application questions")}
      title={t("jobsV2.questionModal.title", "Add a question")}
      description={t(
        "jobsV2.questionModal.description",
        "It is added to this job and joins the shared bank for future jobs.",
      )}
      footer={
        <>
          <JButton variant="ghost" onClick={close} disabled={submitting}>
            {t("jobsV2.modal.cancel")}
          </JButton>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <JButton
              variant="secondary"
              onClick={() => void submit(true)}
              loading={submitting}
              disabled={!canSubmit}
              disabledReason={
                canSubmit
                  ? undefined
                  : (t(
                      "jobsV2.questionModal.completeFirst",
                      "Write the question, and give two real options if it needs them",
                    ) as string)
              }
            >
              {t("jobsV2.questionModal.saveAndAnother", "Save and add another")}
            </JButton>
            <JButton
              variant="primary"
              startIcon="mdi:check"
              onClick={() => void submit(false)}
              loading={submitting}
              disabled={!canSubmit}
              disabledReason={
                canSubmit
                  ? undefined
                  : (t(
                      "jobsV2.questionModal.completeFirst",
                      "Write the question, and give two real options if it needs them",
                    ) as string)
              }
            >
              {t("jobsV2.questionModal.save", "Save question")}
            </JButton>
          </Box>
        </>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {addedCount > 0 && (
          <Box
            role="status"
            sx={{
              p: 1.25,
              borderRadius: R.ctl,
              border: `1px solid ${J.successBd}`,
              bgcolor: J.successBg,
            }}
          >
            <Typography sx={{ ...TYPE.micro, color: J.successFg }}>
              {t("jobsV2.questionModal.addedCount", "{{count}} question(s) added to this job.", {
                count: addedCount,
              })}
            </Typography>
          </Box>
        )}

        <JTextArea
          id="question-text"
          label={t("jobsV2.questionModal.question", "Question")}
          required
          value={questionText}
          onChange={setQuestionText}
          onBlur={() => setTouched(true)}
          error={textError}
          rows={2}
          placeholder={t(
            "jobsV2.questionModal.questionPlaceholder",
            "e.g. What is your expected salary range?",
          )}
        />

        {/* A real radiogroup. The shipped type selector was five clickable Boxes, so it was
            entirely unreachable by keyboard. */}
        <JRadioGroup
          id="question-type"
          label={t("jobsV2.questionModal.type", "Answer type")}
          value={questionType}
          onChange={(value) => changeType(value as QuestionType)}
          orientation="horizontal"
          options={QUESTION_TYPES.map((type) => ({
            value: type.value,
            label: t(type.labelKey, type.fallback) as string,
          }))}
        />

        {needsOptions && (
          <Box>
            <Typography sx={{ ...TYPE.label, mb: 0.75 }}>
              {t("jobsV2.questionModal.options", "Options")}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {options.map((option, index) => (
                <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    aria-hidden
                    sx={{ ...TYPE.label, width: 18, flexShrink: 0, textAlign: "center" }}
                  >
                    {String.fromCharCode(65 + index)}
                  </Typography>
                  <JTextField
                    id={`question-option-${index}`}
                    label={t("jobsV2.questionModal.optionLabel", "Option {{letter}}", {
                      letter: String.fromCharCode(65 + index),
                    })}
                    value={option}
                    onChange={(value) => updateOption(index, value)}
                    placeholder={t("jobsV2.questionModal.optionPlaceholder", "Type an option")}
                    error={
                      duplicateOption &&
                      option.trim().toLowerCase() === duplicateOption.toLowerCase()
                        ? (t(
                            "jobsV2.questionModal.errorDuplicate",
                            "This option is already listed",
                          ) as string)
                        : null
                    }
                    sx={{
                      // The generated label duplicates the A./B. marker for sighted users.
                      "& label": { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" },
                    }}
                  />
                  <Box
                    component="button"
                    type="button"
                    aria-label={t("jobsV2.questionModal.removeOption", "Remove option {{letter}}", {
                      letter: String.fromCharCode(65 + index),
                    })}
                    onClick={() => removeOption(index)}
                    disabled={!canRemoveOption}
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      border: "none",
                      p: 0,
                      borderRadius: R.ctl,
                      bgcolor: "transparent",
                      color: canRemoveOption ? J.ink3 : J.ink4,
                      cursor: canRemoveOption ? "pointer" : "not-allowed",
                      "&:hover": canRemoveOption ? { bgcolor: J.surface2, color: J.dangerFg } : {},
                      ...focusRing,
                    }}
                  >
                    <IconWrapper icon="mdi:close" size={18} />
                  </Box>
                </Box>
              ))}
            </Box>
            {optionsError && (
              <Typography role="alert" sx={{ ...TYPE.small, color: J.dangerFg, mt: 0.75 }}>
                {optionsError}
              </Typography>
            )}
            <JButton
              variant="quiet"
              size="sm"
              startIcon="mdi:plus"
              onClick={() => setOptions((prev) => [...prev, ""])}
              sx={{ mt: 1, px: 0 }}
            >
              {t("jobsV2.questionModal.addOption", "Add an option")}
            </JButton>
          </Box>
        )}

        <JSwitch
          id="question-required"
          label={t("jobsV2.form.required", "Required")}
          checked={isRequired}
          onChange={setIsRequired}
          description={t(
            "jobsV2.questionModal.requiredHint",
            "A candidate cannot submit the application without answering.",
          )}
        />

        <QuestionPreview
          text={questionText}
          type={questionType}
          required={isRequired}
          options={filledOptions}
        />

        {/* True today, and an admin should know it before a typo becomes permanent. */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: R.ctl,
            border: `1px solid ${J.warnBd}`,
            bgcolor: J.warnBg,
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
          }}
        >
          <Box aria-hidden sx={{ color: J.warnFg, display: "inline-flex", mt: 0.1 }}>
            <IconWrapper icon="mdi:alert-outline" size={18} />
          </Box>
          <Typography sx={{ ...TYPE.small, color: J.warnFg }}>
            {t(
              "jobsV2.questionModal.permanentWarning",
              "This question joins the shared question bank and will be offered on future jobs. It cannot be edited or deleted yet.",
            )}
          </Typography>
        </Box>

        {submitError && (
          <Typography role="alert" sx={{ ...TYPE.small, color: J.dangerFg }}>
            {submitError}
          </Typography>
        )}
      </Box>
    </JModal>
  );
}

/**
 * The question exactly as the student's apply form will render it — through the SAME
 * `resolveQuestionControl`, so preview and reality cannot drift.
 */
function QuestionPreview({
  text,
  type,
  required,
  options,
}: {
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[];
}) {
  const { t } = useTranslation("common");
  const resolved = resolveQuestionControl({
    id: -1,
    question_text: text,
    question_type: type,
    is_required: required,
    order: 0,
    options,
  });

  const label = text.trim() || (t("jobsV2.questionModal.previewPlaceholder", "Your question") as string);
  const choiceOptions = resolved.options.map((option) => ({ value: option, label: option }));

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: R.card,
        border: `1px dashed ${J.hairline}`,
        bgcolor: J.surface2,
      }}
    >
      <Typography sx={{ ...TYPE.label, mb: 1.25 }}>
        {t("jobsV2.questionModal.preview", "How the candidate sees it")}
      </Typography>
      {resolved.control === "radio" && choiceOptions.length > 0 ? (
        <JRadioGroup
          id="question-preview"
          label={label}
          required={required}
          value=""
          onChange={() => undefined}
          options={choiceOptions}
          disabled
        />
      ) : resolved.control === "checkbox" && choiceOptions.length > 0 ? (
        <JCheckGroup
          id="question-preview"
          label={label}
          required={required}
          values={[]}
          onChange={() => undefined}
          options={choiceOptions}
          disabled
        />
      ) : resolved.control === "select" ? (
        <JSelect
          id="question-preview"
          label={label}
          required={required}
          value=""
          onChange={() => undefined}
          options={choiceOptions}
          disabled
          placeholder={t("jobsV2.questionModal.previewChoose", "Choose one")}
        />
      ) : resolved.control === "textarea" ? (
        <JTextArea
          id="question-preview"
          label={label}
          required={required}
          value=""
          onChange={() => undefined}
          rows={2}
          disabled
        />
      ) : (
        <JTextField
          id="question-preview"
          label={label}
          required={required}
          value=""
          onChange={() => undefined}
          disabled
        />
      )}
    </Box>
  );
}
