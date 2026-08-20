"use client";

import { useEffect, useState } from "react";
import { Box, Dialog, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { PooledQuestion, QuizGradeResult } from "@/lib/services/ai-tutor.service";
import {
  ROOM_BORDER,
  ROOM_GREEN,
  ROOM_INK,
  ROOM_PANEL,
  ROOM_RED,
  ROOM_TEXT,
  ROOM_TEXT_DIM,
  ROOM_TEXT_FAINT,
  ROOM_VIOLET,
  ROOM_VIOLET_SOLID,
  roomFocusRing,
} from "./roomTokens";

/**
 * The mid-lesson check.
 *
 * Dark, because it opens on top of the room. It used to inherit the light dialog styling and
 * arrived as a white sheet over a black screen, which read as a different application.
 *
 * The tutor keeps talking while this is open: the instructions tell it to say one short line
 * and then go quiet, because the learner is reading. Muting the tutor here would make the
 * quiz feel like a context switch rather than part of the conversation.
 *
 * After an answer is submitted the server grades it and the result is injected into the
 * conversation, so the tutor reacts out loud within a second or so. That reaction is echoed
 * live at the bottom of this dialog: without it the learner is being talked to by a voice
 * while staring at a modal that shows no sign of having heard them, and the "did it actually
 * see my answer" doubt is the whole thing this feature is selling.
 *
 * Note there is no correct answer in the props. The pool the browser holds carries questions
 * and options only; grading happens server-side against the question id, so the answer key is
 * never sitting in the network tab before the learner answers.
 */
export function QuizOverlay({
  question,
  onAnswer,
  onClose,
  tutorCaption = "",
  tutorSpeaking = false,
  tutorTurnId = 0,
}: {
  question: PooledQuestion | null;
  onAnswer: (questionId: number, selected: string[]) => Promise<QuizGradeResult | null>;
  onClose: () => void;
  /** The tutor's live transcript, so its reaction shows up here rather than only in audio. */
  tutorCaption?: string;
  tutorSpeaking?: boolean;
  /** Increments per spoken turn. Used to tell "has it spoken SINCE I answered". */
  tutorTurnId?: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<QuizGradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /**
   * Set when grading could not complete.
   *
   * Without this the dialog was a trap: `onAnswer` returns null on a network failure, `result`
   * stayed null, and with `onClose` wired to `result ? close : undefined` there was no backdrop
   * click, no Escape, and no visible explanation. The learner was stuck looking at a question
   * inside a paid session.
   */
  const [gradeError, setGradeError] = useState(false);
  /**
   * The tutor's turn number at the moment the answer was sent.
   *
   * The echo below only renders once the counter has moved past this, which is the only reliable
   * way to know the tutor is talking about THIS answer. Diffing the caption string could not
   * work, because `caption` is a sliding window and scrolls past any snapshot.
   */
  const [turnAtSubmit, setTurnAtSubmit] = useState(0);

  const multi = question?.style === "multiple";

  // A fresh question is a fresh attempt. Without this a second quiz opens already graded,
  // showing the previous question's verdict against the new question's options.
  useEffect(() => {
    setSelected([]);
    setResult(null);
    setSubmitting(false);
    setTurnAtSubmit(0);
    setGradeError(false);
  }, [question?.id]);

  const toggle = (id: string) => {
    if (result) return;
    setSelected((prev) =>
      multi ? (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]) : [id]
    );
  };

  const submit = async () => {
    if (!question || !selected.length || submitting) return;
    setSubmitting(true);
    setGradeError(false);
    setTurnAtSubmit(tutorTurnId);
    const graded = await onAnswer(question.id, selected);
    // A null grade is a failed round trip, not a wrong answer. Never render it as one.
    if (graded && graded.ok !== false) setResult(graded);
    else setGradeError(true);
    setSubmitting(false);
  };

  // Exit BEFORE unmount: rendering `open` hardcoded and unmounting the open
  // Dialog leaks MUI's body scroll-lock + aria-hidden (reproduced on the
  // adaptive intro modal — same pattern). Close first, notify on exited.
  const [closing, setClosing] = useState(false);
  const close = () => setClosing(true);
  const handleExited = () => {
    setSelected([]);
    setResult(null);
    setTurnAtSubmit(0);
    setGradeError(false);
    setClosing(false);
    onClose();
  };

  if (!question) return null;

  // What the tutor has said in a turn that STARTED after the answer went in.
  const reaction = result && tutorTurnId > turnAtSubmit ? tutorCaption.trim() : "";

  return (
    <Dialog
      open={!closing}
      // Always closable. A quiz the learner cannot leave is worse than a quiz they skip, and
      // they are paying by the minute while they look at it.
      onClose={close}
      TransitionProps={{ onExited: handleExited }}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: { sx: { bgcolor: "rgba(6,3,16,0.72)", backdropFilter: "blur(3px)" } },
      }}
      PaperProps={{
        sx: {
          borderRadius: "14px",
          border: `1px solid ${ROOM_BORDER}`,
          bgcolor: ROOM_PANEL,
          backgroundImage: "none",
          color: ROOM_TEXT,
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
            style={{ color: ROOM_VIOLET }}
          />
          <Typography
            sx={{
              fontSize: "0.74rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: ROOM_TEXT_DIM,
              '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
            }}
          >
            Quick check
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: "0.78rem", color: ROOM_TEXT_FAINT }}>
            {multi ? "Pick all that apply" : "Pick one"}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: { xs: "1.02rem", md: "1.08rem" },
            fontWeight: 500,
            lineHeight: 1.45,
            mb: 2.5,
          }}
        >
          {question.question}
        </Typography>

        {question.image ? (
          <Box
            component="img"
            src={question.image}
            alt={question.image_alt}
            sx={{ width: "100%", borderRadius: "10px", mb: 2, display: "block" }}
          />
        ) : null}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {question.options
            .filter((option) => option.label)
            .map((option) => {
              const picked = selected.includes(option.id);
              const isCorrect = result?.correct?.includes(option.id);
              const isWrongPick = result && picked && !isCorrect;
              const edge = isCorrect
                ? ROOM_GREEN
                : isWrongPick
                  ? ROOM_RED
                  : picked
                    ? ROOM_VIOLET
                    : "rgba(255,255,255,0.16)";
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
                    color: ROOM_TEXT,
                    cursor: result ? "default" : "pointer",
                    border: `1px solid ${edge}`,
                    transition: "border-color 160ms ease, background-color 160ms ease",
                    bgcolor: isCorrect
                      ? "rgba(74,222,128,0.12)"
                      : isWrongPick
                        ? "rgba(251,113,133,0.12)"
                        : picked
                          ? "rgba(168,85,247,0.16)"
                          : "rgba(255,255,255,0.04)",
                    "&:hover": result ? {} : { borderColor: ROOM_VIOLET },
                    "&:focus-visible": roomFocusRing,
                  }}
                >
                  {/* The option letter, so a spoken "the second one, B" lines up with what
                      is on screen. */}
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      flexShrink: 0,
                      borderRadius: multi ? "5px" : 9999,
                      display: "grid",
                      placeItems: "center",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      border: `1px solid ${edge}`,
                      color: picked || isCorrect ? ROOM_TEXT : ROOM_TEXT_DIM,
                      bgcolor: picked || isCorrect ? "rgba(255,255,255,0.1)" : "transparent",
                    }}
                  >
                    {option.id}
                  </Box>
                  <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.5, pt: 0.1 }}>
                    {option.label}
                  </Typography>
                </Box>
              );
            })}
        </Box>

        {gradeError ? (
          <Box
            sx={{
              mt: 2.5,
              p: 2,
              borderRadius: "10px",
              bgcolor: ROOM_INK,
              border: "1px solid rgba(251,191,36,0.34)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.85, mb: 0.5 }}>
              <Icon
                icon="solar:danger-triangle-bold"
                width={17}
                style={{ color: "#fbbf24" }}
              />
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 600, color: "#fbbf24" }}>
                Could not check that
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.88rem", color: ROOM_TEXT_DIM, lineHeight: 1.55 }}>
              Your answer did not reach us. Try again, or skip it and carry on with the lesson.
            </Typography>
          </Box>
        ) : null}

        {result ? (
          <Box
            sx={{
              mt: 2.5,
              p: 2,
              borderRadius: "10px",
              bgcolor: ROOM_INK,
              border: `1px solid ${result.is_correct ? "rgba(74,222,128,0.34)" : "rgba(251,113,133,0.34)"}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.85, mb: 0.5 }}>
              <Icon
                icon={
                  result.is_correct ? "solar:check-circle-bold" : "solar:close-circle-bold"
                }
                width={17}
                style={{ color: result.is_correct ? ROOM_GREEN : ROOM_RED }}
              />
              <Typography
                sx={{
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: result.is_correct ? ROOM_GREEN : ROOM_RED,
                }}
              >
                {result.is_correct ? "That's right." : "Not quite."}
              </Typography>
            </Box>
            {result.explanation ? (
              <Typography sx={{ fontSize: "0.88rem", color: ROOM_TEXT_DIM, lineHeight: 1.55 }}>
                {result.explanation}
              </Typography>
            ) : null}

            {/* The tutor reacting, live. */}
            <Box
              sx={{
                mt: 1.5,
                pt: 1.5,
                borderTop: `1px solid ${ROOM_BORDER}`,
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <Icon
                icon="solar:soundwave-bold"
                width={15}
                style={{ color: ROOM_VIOLET, marginTop: 3, flexShrink: 0 }}
              />
              <Typography
                sx={{
                  fontSize: "0.88rem",
                  lineHeight: 1.55,
                  color: reaction ? ROOM_TEXT : ROOM_TEXT_FAINT,
                  fontStyle: reaction ? "normal" : "italic",
                }}
              >
                {reaction ||
                  (result?.delivered === false
                    ? "Your tutor did not receive this one, so it will not comment on it."
                    : tutorSpeaking
                      ? "Your tutor is picking this up…"
                      : "Your tutor has your answer and will pick it up.")}
              </Typography>
            </Box>
          </Box>
        ) : null}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2.5 }}>
          {!result ? (
            <Box
              component="button"
              type="button"
              onClick={close}
              sx={{
                px: 2,
                py: 1.15,
                borderRadius: "8px",
                border: `1px solid ${ROOM_BORDER}`,
                bgcolor: "transparent",
                fontFamily: "inherit",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: ROOM_TEXT_DIM,
                cursor: "pointer",
                transition: "color 160ms ease, border-color 160ms ease",
                "&:hover": { color: ROOM_TEXT, borderColor: ROOM_TEXT_DIM },
                "&:focus-visible": roomFocusRing,
              }}
            >
              Skip
            </Box>
          ) : null}
          <Box
            component="button"
            type="button"
            onClick={result ? close : submit}
            disabled={!result && (!selected.length || submitting)}
            sx={{
              px: 2.5,
              py: 1.15,
              borderRadius: "8px",
              border: "none",
              fontFamily: "inherit",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#fff",
              bgcolor: ROOM_VIOLET_SOLID,
              cursor: !result && (!selected.length || submitting) ? "not-allowed" : "pointer",
              opacity: !result && (!selected.length || submitting) ? 0.45 : 1,
              transition: "filter 160ms ease",
              "&:hover:not(:disabled)": { filter: "brightness(1.12)" },
              "&:focus-visible": roomFocusRing,
            }}
          >
            {result
              ? "Back to the lesson"
              : submitting
                ? "Checking…"
                : gradeError
                  ? "Try again"
                  : "Check my answer"}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
