"use client";

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { TutorSurface } from "../shared/surfaces";
import type { TutorNote } from "@/lib/services/ai-tutor.service";

/**
 * The flashcards this lesson produced, presented as a deck you work through.
 *
 * The dashboard's `NotesPanel` shows every card the learner has ever kept, grouped by
 * topic, for browsing. This is a different job: one lesson's worth, immediately after it
 * ended, when the learner is still in the room mentally and testing themselves actually
 * lands. So it counts down through the deck one card at a time rather than listing them,
 * and it tracks what they got right — a list of questions with the answers underneath is
 * reference material, not recall practice.
 *
 * Self-graded on purpose. There is no way to mark a spoken-concept answer automatically,
 * and a fake grader is worse than an honest one.
 */

type Grade = "got" | "missed";

export function RecapFlashcards({ notes }: { notes: TutorNote[] }) {
  const cards = useMemo(() => notes.filter((n) => n.prompt?.trim() && n.answer?.trim()), [notes]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grades, setGrades] = useState<Record<number, Grade>>({});

  if (!cards.length) return null;

  const card = cards[Math.min(index, cards.length - 1)];
  const graded = Object.keys(grades).length;
  const got = Object.values(grades).filter((g) => g === "got").length;
  const done = graded >= cards.length;

  const advance = (grade: Grade) => {
    setGrades((prev) => ({ ...prev, [card.id]: grade }));
    setRevealed(false);
    // Stop at the end rather than wrapping: wrapping to card 1 after the last card reads
    // as the widget having lost your place.
    setIndex((i) => Math.min(i + 1, cards.length - 1));
  };

  const restart = () => {
    setGrades({});
    setRevealed(false);
    setIndex(0);
  };

  return (
    <TutorSurface padded={false}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: { xs: 2, md: 2.5 },
          py: 1.5,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Icon icon="solar:cards-bold-duotone" width={18} style={{ color: "var(--ai-violet)" }} />
        <Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>
          Card {Math.min(index + 1, cards.length)} of {cards.length}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {graded > 0 ? (
          <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)" }}>
            {got} of {graded} recalled
          </Typography>
        ) : null}
      </Box>

      {/* Progress through the deck. A 2px rule rather than a component, because it is
          reporting position, not inviting a click. */}
      <Box sx={{ height: 2, bgcolor: "var(--border-default)" }}>
        <Box
          sx={{
            height: 2,
            width: `${(graded / cards.length) * 100}%`,
            bgcolor: "var(--ai-violet)",
            transition: "width 220ms cubic-bezier(.175,.885,.32,1.1)",
          }}
        />
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 3, md: 3.5 } }}>
        {done ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: "1.6rem", fontWeight: 600, lineHeight: 1.2 }}>
              {got} of {cards.length}
            </Typography>
            <Typography sx={{ fontSize: "0.92rem", color: "var(--font-secondary)", mt: 0.5 }}>
              {got === cards.length
                ? "Every card recalled. That lesson stuck."
                : "The ones you missed are worth another pass."}
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={restart}
              sx={{
                mt: 2.25,
                px: 2.25,
                py: 1,
                borderRadius: "8px",
                border: "1px solid var(--border-default)",
                bgcolor: "var(--card-bg)",
                fontFamily: "inherit",
                fontSize: "0.88rem",
                fontWeight: 500,
                color: "var(--font-primary)",
                cursor: "pointer",
                transition: "border-color 160ms ease",
                "&:hover": { borderColor: "var(--ai-violet)" },
                "&:focus-visible": {
                  outline: "none",
                  boxShadow: "0 0 0 2px var(--card-bg), 0 0 0 4px var(--ai-violet)",
                },
              }}
            >
              Run the deck again
            </Box>
          </Box>
        ) : (
          <>
            <Typography
              sx={{
                fontSize: "0.74rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--font-secondary)",
                mb: 1,
                '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
              }}
            >
              {card.concept}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "1.05rem", md: "1.15rem" },
                fontWeight: 500,
                lineHeight: 1.45,
              }}
            >
              {card.prompt}
            </Typography>

            {/* Fixed-height answer well, so revealing does not shove the buttons down the
                page under a reaching cursor (DESIGN.md §6). */}
            <Box sx={{ minHeight: 92, mt: 2 }}>
              {revealed ? (
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    color: "var(--font-secondary)",
                    pl: 1.5,
                    borderLeft: "2px solid",
                    borderColor: "color-mix(in srgb, var(--ai-violet) 45%, transparent)",
                  }}
                >
                  {card.answer}
                </Typography>
              ) : (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setRevealed(true)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.85,
                    px: 2,
                    py: 1.1,
                    borderRadius: "8px",
                    border: "1px solid var(--border-default)",
                    bgcolor: "var(--card-bg)",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    color: "var(--ai-violet)",
                    cursor: "pointer",
                    transition: "border-color 160ms ease",
                    "&:hover": { borderColor: "var(--ai-violet)" },
                    "&:focus-visible": {
                      outline: "none",
                      boxShadow: "0 0 0 2px var(--card-bg), 0 0 0 4px var(--ai-violet)",
                    },
                  }}
                >
                  <Icon icon="solar:eye-bold" width={16} />
                  Show the answer
                </Box>
              )}
            </Box>

            {revealed ? (
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <GradeButton
                  icon="solar:close-circle-bold"
                  label="Did not know it"
                  colour="var(--font-secondary)"
                  onClick={() => advance("missed")}
                />
                <GradeButton
                  icon="solar:check-circle-bold"
                  label="I knew that"
                  colour="#16a34a"
                  onClick={() => advance("got")}
                />
              </Box>
            ) : null}
          </>
        )}
      </Box>
    </TutorSurface>
  );
}

function GradeButton({
  icon,
  label,
  colour,
  onClick,
}: {
  icon: string;
  label: string;
  colour: string;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.85,
        minHeight: 44,
        borderRadius: "8px",
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
        fontFamily: "inherit",
        fontSize: "0.9rem",
        fontWeight: 500,
        color: colour,
        cursor: "pointer",
        transition: "border-color 160ms ease",
        "&:hover": { borderColor: colour },
        "&:focus-visible": {
          outline: "none",
          boxShadow: "0 0 0 2px var(--card-bg), 0 0 0 4px var(--ai-violet)",
        },
      }}
    >
      <Icon icon={icon} width={16} />
      {label}
    </Box>
  );
}
