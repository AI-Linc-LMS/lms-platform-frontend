"use client";

import { useState } from "react";
import { Box, Dialog, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { PooledQuestion, QuizGradeResult } from "@/lib/services/ai-tutor.service";

/**
 * The mid-lesson check.
 *
 * The tutor keeps talking while this is open: the instructions tell it to say one short
 * line and then go quiet, because the learner is reading. Muting the tutor here would make
 * the quiz feel like a context switch rather than part of the conversation.
 *
 * Note there is no correct answer in the props. The pool the browser holds carries
 * questions and options only; grading happens server-side against the question id, so the
 * answer key is never sitting in the network tab before the learner answers.
 */
export function QuizOverlay({
  question,
  onAnswer,
  onClose,
}: {
  question: PooledQuestion | null;
  onAnswer: (questionId: number, selected: string[]) => Promise<QuizGradeResult | null>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<QuizGradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const multi = question?.style === "multiple";

  const toggle = (id: string) => {
    if (result) return;
    setSelected((prev) =>
      multi
        ? prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id]
        : [id]
    );
  };

  const submit = async () => {
    if (!question || !selected.length || submitting) return;
    setSubmitting(true);
    const graded = await onAnswer(question.id, selected);
    setResult(graded);
    setSubmitting(false);
  };

  const close = () => {
    setSelected([]);
    setResult(null);
    onClose();
  };

  if (!question) return null;

  return (
    <Dialog
      open
      onClose={result ? close : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--border-default)",
          boxShadow: "none",
        },
      }}
    >
      <Box sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Icon
            icon="solar:question-square-bold-duotone"
            width={18}
            height={18}
            style={{ color: "var(--ai-violet)" }}
          />
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--font-tertiary)",
            }}
          >
            Quick check
          </Typography>
        </Box>

        <Typography sx={{ fontSize: "1.05rem", fontWeight: 500, lineHeight: 1.45, mb: 2.5 }}>
          {question.question}
        </Typography>

        {question.image ? (
          <Box
            component="img"
            src={question.image}
            alt={question.image_alt}
            sx={{ width: "100%", borderRadius: "10px", mb: 2 }}
          />
        ) : null}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {question.options
            .filter((option) => option.label)
            .map((option) => {
              const picked = selected.includes(option.id);
              const isCorrect = result?.correct?.includes(option.id);
              const isWrongPick = result && picked && !isCorrect;
              return (
                <Box
                  key={option.id}
                  component="button"
                  type="button"
                  onClick={() => toggle(option.id)}
                  disabled={Boolean(result)}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.25,
                    textAlign: "left",
                    p: 1.5,
                    borderRadius: "10px",
                    fontFamily: "inherit",
                    cursor: result ? "default" : "pointer",
                    border: "1px solid",
                    transition: "border-color 160ms ease",
                    borderColor: isCorrect
                      ? "#16a34a"
                      : isWrongPick
                        ? "#dc2626"
                        : picked
                          ? "var(--ai-violet)"
                          : "var(--border-default)",
                    bgcolor: isCorrect
                      ? "rgba(22,163,74,0.06)"
                      : isWrongPick
                        ? "rgba(220,38,38,0.05)"
                        : picked
                          ? "color-mix(in srgb, var(--ai-violet) 6%, transparent)"
                          : "var(--card-bg)",
                    "&:focus-visible": {
                      outline: "none",
                      boxShadow: "0 0 0 2px var(--canvas), 0 0 0 4px var(--ai-violet)",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--font-tertiary)",
                      minWidth: 16,
                    }}
                  >
                    {option.id}
                  </Typography>
                  <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.45 }}>
                    {option.label}
                  </Typography>
                </Box>
              );
            })}
        </Box>

        {result ? (
          <Box
            sx={{
              mt: 2.5,
              p: 2,
              borderRadius: "10px",
              bgcolor: "var(--surface, #f9fafb)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, mb: 0.5 }}>
              {result.is_correct ? "That's right." : "Not quite."}
            </Typography>
            {result.explanation ? (
              <Typography
                sx={{ fontSize: "0.86rem", color: "var(--font-secondary)", lineHeight: 1.5 }}
              >
                {result.explanation}
              </Typography>
            ) : null}
            <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)", mt: 1 }}>
              Your tutor has seen this and will pick it up.
            </Typography>
          </Box>
        ) : null}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2.5 }}>
          <Box
            component="button"
            type="button"
            onClick={result ? close : submit}
            disabled={!result && (!selected.length || submitting)}
            sx={{
              px: 2.5,
              py: 1.1,
              borderRadius: "8px",
              border: "none",
              fontFamily: "inherit",
              fontSize: "0.88rem",
              fontWeight: 500,
              color: "#fff",
              bgcolor: "var(--ai-violet)",
              cursor: "pointer",
              opacity: !result && (!selected.length || submitting) ? 0.45 : 1,
              "&:focus-visible": {
                outline: "none",
                boxShadow: "0 0 0 2px var(--canvas), 0 0 0 4px var(--ai-violet)",
              },
            }}
          >
            {result ? "Back to the lesson" : submitting ? "Checking…" : "Check my answer"}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
