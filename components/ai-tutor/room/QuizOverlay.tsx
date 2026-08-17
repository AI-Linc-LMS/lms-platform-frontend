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
}: {
  question: PooledQuestion | null;
  onAnswer: (questionId: number, selected: string[]) => Promise<QuizGradeResult | null>;
  onClose: () => void;
  /** The tutor's live transcript, so its reaction shows up here rather than only in audio. */
  tutorCaption?: string;
  tutorSpeaking?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<QuizGradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Captured at submit time so the echo only shows what the tutor said about THIS answer,
  // not whatever it happened to be mid-sentence about when the quiz opened.
  const [captionAtSubmit, setCaptionAtSubmit] = useState("");

  const multi = question?.style === "multiple";

  // A fresh question is a fresh attempt. Without this a second quiz opens already graded,
  // showing the previous question's verdict against the new question's options.
  useEffect(() => {
    setSelected([]);
    setResult(null);
    setSubmitting(false);
    setCaptionAtSubmit("");
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
    setCaptionAtSubmit(tutorCaption);
    const graded = await onAnswer(question.id, selected);
    setResult(graded);
    setSubmitting(false);
  };

  const close = () => {
    setSelected([]);
    setResult(null);
    setCaptionAtSubmit("");
    onClose();
  };

  if (!question) return null;

  // Anything the tutor has said since the answer went in. Empty until it starts reacting.
  const reaction =
    result && tutorCaption !== captionAtSubmit
      ? tutorCaption.startsWith(captionAtSubmit)
        ? tutorCaption.slice(captionAtSubmit.length).trim()
        : tutorCaption.trim()
      : "";

  return (
    <Dialog
      open
      onClose={result ? close : undefined}
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
                  (tutorSpeaking
                    ? "Your tutor is picking this up…"
                    : "Your tutor has your answer and will pick it up.")}
              </Typography>
            </Box>
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
            {result ? "Back to the lesson" : submitting ? "Checking…" : "Check my answer"}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
