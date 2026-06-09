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
        p: 2,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "min(560px, 100%)",
          borderRadius: 4,
          p: 3,
          pt: 3.25,
          overflow: "hidden",
          background: "var(--card-bg, #fff)",
          border: "1px solid color-mix(in srgb, #a855f7 28%, transparent)",
          boxShadow: "0 32px 70px rgba(15,12,41,0.45)",
        }}
      >
        <Box aria-hidden sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)" }} />
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
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: "0.86rem", color: "text.secondary", mb: 1.5 }}>
              {result.is_correct ? "Correct — " : "Not quite. "}
              {result.explanation}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
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
          </Box>
        )}
      </Box>
    </Box>
  );
}
