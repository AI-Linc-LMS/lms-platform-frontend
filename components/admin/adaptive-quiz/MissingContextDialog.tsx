"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Typography } from "@mui/material";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import {
  readMissingContext,
  stemText,
  type MissingContextQuestion,
} from "@/lib/utils/missing-context";

/* ==========================================================================
 * "These questions seem to refer to a figure, table or code they don't include."
 *
 * Shown when the server refuses to publish questions whose stem points at something it does not
 * carry (code: "missing_context"). The check is right far more often than not, but it misfires on
 * some legitimate wording, so the author decides: go back and fix the questions, or save anyway,
 * which resends the same request with confirm_missing_context and is recorded on the server.
 *
 * Used by the quiz wizard, the quiz editor and the course builder's quiz editor.
 * ======================================================================== */

export interface MissingContextDialogProps {
  open: boolean;
  questions: MissingContextQuestion[];
  onGoBack: () => void;
  onSaveAnyway: () => void;
}

export function MissingContextDialog({ open, questions, onGoBack, onSaveAnyway }: MissingContextDialogProps) {
  const { t } = useTranslation("common");
  return (
    <ResponsiveDialog
      open={open}
      onClose={onGoBack}
      maxWidth="sm"
      title={t("adaptiveQuizMissingContext.title", "Check these questions")}
      description={t(
        "adaptiveQuizMissingContext.body",
        "These questions seem to refer to a figure, table or code they don't include. Learners can't answer them without it.",
      )}
      footer={
        <>
          <Button variant="outlined" onClick={onGoBack} sx={{ textTransform: "none", fontWeight: 700 }}>
            {t("adaptiveQuizMissingContext.goBack", "Go back and fix")}
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={onSaveAnyway}
            disableElevation
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {t("adaptiveQuizMissingContext.saveAnyway", "Save anyway")}
          </Button>
        </>
      }
      data-testid="missing-context-dialog"
    >
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.25 }}>
        {questions.map((q) => (
          <Box
            component="li"
            key={`${q.index}-${q.id ?? "new"}`}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid var(--border-default, #e5e7eb)",
              minWidth: 0,
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--font-secondary)" }}>
              {t("adaptiveQuizMissingContext.questionLabel", {
                n: q.index + 1,
                defaultValue: "Question {{n}}",
              })}
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, overflowWrap: "anywhere" }}>
              {stemText(q.question_text)}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: "0.8rem", color: "var(--font-secondary)", overflowWrap: "anywhere" }}>
              {q.reason}
            </Typography>
          </Box>
        ))}
      </Box>
    </ResponsiveDialog>
  );
}

/**
 * The save flow around the dialog. A page calls `intercept(error, saveAnyway)` in its catch block:
 * when the error is the missing-context refusal the dialog opens and `intercept` returns true
 * (the page shows no error toast); "Save anyway" then calls `saveAnyway`, which should resend the
 * same request with confirm_missing_context. Any other error returns false. A page that has
 * already read the questions (to renumber them, say) calls `open(questions, saveAnyway)` instead.
 */
export function useMissingContextConfirm() {
  const [questions, setQuestions] = useState<MissingContextQuestion[] | null>(null);
  const retry = useRef<(() => void) | null>(null);

  const open = useCallback((flagged: MissingContextQuestion[], saveAnyway: () => void) => {
    retry.current = saveAnyway;
    setQuestions(flagged);
  }, []);

  const intercept = useCallback(
    (err: unknown, saveAnyway: () => void): boolean => {
      const flagged = readMissingContext(err);
      if (!flagged) return false;
      open(flagged, saveAnyway);
      return true;
    },
    [open],
  );

  const dismiss = useCallback(() => {
    retry.current = null;
    setQuestions(null);
  }, []);

  const saveAnyway = useCallback(() => {
    const again = retry.current;
    retry.current = null;
    setQuestions(null);
    again?.();
  }, []);

  return {
    intercept,
    open,
    dismiss,
    dialogProps: {
      open: questions !== null,
      questions: questions ?? [],
      onGoBack: dismiss,
      onSaveAnyway: saveAnyway,
    },
  };
}
