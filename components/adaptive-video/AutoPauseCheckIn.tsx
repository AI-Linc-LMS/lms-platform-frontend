"use client";

import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { AIPill } from "@/components/adaptive-quiz/shared/AIPill";
import type { CheckInMarker, CheckInResult } from "@/lib/services/adaptive-video.service";

interface Props {
  checkIn: CheckInMarker;
  onAnswer: (optionLetter: string, timeMs: number) => Promise<CheckInResult>;
  onContinue: () => void;
  onRewind: (toSeconds: number) => void;
}

const OPTIONS: { letter: string; key: keyof CheckInMarker }[] = [
  { letter: "A", key: "option_a" },
  { letter: "B", key: "option_b" },
  { letter: "C", key: "option_c" },
  { letter: "D", key: "option_d" },
];

/**
 * The auto-pause comprehension probe (spec §3.2d / §3.3b). Surfaces when playback
 * hits a check-in marker; the video stays paused until answered. Wrong answers get
 * an inline correction + an offer to rewind. Reuses the indigo companion palette.
 *
 * Layout note: this overlay lives inside the player box, which is a fixed 16/9
 * aspect-ratio element with `overflow: hidden`. A question that wraps to two lines
 * with four wrapping options and an explanation is TALLER than that box at ordinary
 * desktop widths - and because the card was centred, the overflow was clipped at
 * BOTH ends: the "Quick check" pill off the top and the Continue button off the
 * bottom. Worse, the card only grows once answered, so Continue was cut off exactly
 * when it became the thing to press.
 *
 * So the card is capped at the container height and split into a scrolling body and
 * a pinned footer. The actions can never be scrolled or clipped out of reach, and
 * long questions scroll inside the card instead of escaping it.
 */
export function AutoPauseCheckIn({ checkIn, onAnswer, onContinue, onRewind }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openedAt] = useState(() => Date.now());

  const submit = async (letter: string) => {
    if (result) return;
    setSelected(letter);
    setSubmitting(true);
    try {
      setResult(await onAnswer(letter, Date.now() - openedAt));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 12, 41, 0.82)",
        backdropFilter: "blur(6px)",
        zIndex: 20,
        p: { xs: 1, sm: 2 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "min(560px, 100%)",
          // Never taller than the player box, so centring cannot clip either end.
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRadius: 4,
          overflow: "hidden",
          background: "var(--card-bg, #fff)",
          border: "1px solid color-mix(in srgb, #a855f7 28%, transparent)",
          boxShadow: "0 32px 70px rgba(15,12,41,0.45)",
        }}
      >
        <Box aria-hidden sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, zIndex: 1,
          background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)" }} />

        {/* Scrolling body - everything that can grow with the question's length. */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 3, pt: 3.25, pb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
            <AIPill icon={<Icon icon="mdi:lightning-bolt" />}>Quick check</AIPill>
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
              auto · pauses video
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1.02rem", mb: 2 }}>
            {checkIn.question_text}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {OPTIONS.map(({ letter, key }) => {
              const isSelected = selected === letter;
              const isCorrect = result && result.correct_option.toUpperCase() === letter;
              const isWrongPick = result && isSelected && !result.is_correct;
              return (
                <Button
                  key={letter}
                  onClick={() => submit(letter)}
                  disabled={submitting || !!result}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    textAlign: "left",
                    borderRadius: 2,
                    px: 1.5,
                    py: 1.25,
                    border: "1px solid",
                    borderColor: isCorrect
                      ? "#16a34a"
                      : isWrongPick
                      ? "#dc2626"
                      : "color-mix(in srgb, #6366f1 22%, transparent)",
                    background: isCorrect
                      ? "color-mix(in srgb, #16a34a 12%, transparent)"
                      : isWrongPick
                      ? "color-mix(in srgb, #dc2626 10%, transparent)"
                      : "transparent",
                    color: "text.primary",
                  }}
                >
                  <Box component="span" sx={{ fontWeight: 800, mr: 1.25 }}>
                    {letter}
                  </Box>
                  {checkIn[key] as string}
                  {isCorrect && <Icon icon="mdi:check-circle" style={{ marginLeft: "auto", color: "#16a34a" }} />}
                </Button>
              );
            })}
          </Box>

          {result && (
            <Typography sx={{ fontSize: "0.86rem", color: "text.secondary", mt: 2 }}>
              {result.is_correct ? "Correct - " : "Not quite. "}
              {result.explanation}
            </Typography>
          )}
        </Box>

        {/* Pinned footer - the actions stay reachable however long the question is. */}
        {result && (
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              gap: 1,
              px: 3,
              py: 1.75,
              borderTop: "1px solid color-mix(in srgb, #6366f1 14%, transparent)",
              background: "var(--card-bg, #fff)",
            }}
          >
            {!result.is_correct && result.rewind_to_seconds != null && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Icon icon="mdi:rewind" />}
                onClick={() => onRewind(result.rewind_to_seconds as number)}
              >
                Rewind to the clip
              </Button>
            )}
            <Button variant="contained" size="small" onClick={onContinue} sx={{ ml: "auto" }}>
              Continue
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
