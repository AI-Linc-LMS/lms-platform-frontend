"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { PooledQuestion } from "@/lib/services/ai-tutor.service";
import { PHONE } from "@/components/common/mobile/phone";
import { LogPanel, StreamLabel } from "./atmosphere";

type Attempt = { question: PooledQuestion; selected: string[]; is_correct: boolean };

/**
 * What the learner actually chose, in words.
 *
 * A bare "You picked B" is useless a day later: the letter means nothing without the option
 * list, and this is the one place the recap is meant to be readable on its own.
 */
function describePicked(attempt: Attempt): string {
  const options = attempt.question?.options ?? [];
  return (attempt.selected ?? [])
    .map((id) => {
      const match = options.find((o) => o.id === id);
      return match?.label ? `${id}. ${match.label}` : id;
    })
    .join("; ");
}

/**
 * The questions, and what the learner said to them.
 *
 * Kept apart from everything else on the page because it is the only part of a lesson with a
 * right answer. The old version listed them as rows in a neutral box, where a question they got
 * wrong looked exactly like a slide title.
 */
export function ChallengeLog({ attempts }: { attempts: Attempt[] }) {
  if (!attempts.length) return null;
  const right = attempts.filter((a) => a.is_correct).length;

  return (
    <Box>
      <StreamLabel icon="solar:star-bold-duotone" text="Challenge log" tone="#c2853a" />
      <LogPanel>
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {attempts.map((attempt, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                gap: 1.25,
                alignItems: "flex-start",
                pb: i === attempts.length - 1 ? 0 : 1.5,
                borderBottom: i === attempts.length - 1 ? "none" : "1px dashed",
                borderColor: "color-mix(in srgb, #c2853a 30%, transparent)",
              }}
            >
              <Icon
                icon={attempt.is_correct ? "solar:check-circle-bold" : "solar:close-circle-bold"}
                width={17}
                style={{
                  color: attempt.is_correct ? "#16a34a" : "#dc2626",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "0.9rem",
                    lineHeight: 1.55,
                    fontWeight: 500,
                    wordBreak: "break-word",
                  }}
                >
                  {attempt.question?.question ?? "That question is no longer available."}
                </Typography>
                {describePicked(attempt) ? (
                  <Typography
                    sx={{
                      fontSize: "0.82rem",
                      color: "var(--font-secondary)",
                      mt: 0.4,
                    }}
                  >
                    You picked {describePicked(attempt)}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 0.6,
            [PHONE]: { minHeight: 36 },
            borderRadius: 999,
            bgcolor: "color-mix(in srgb, #c2853a 16%, transparent)",
            border: "1px solid color-mix(in srgb, #c2853a 34%, transparent)",
          }}
        >
          <Icon icon="solar:medal-ribbon-bold" width={15} style={{ color: "#a16207" }} />
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#7c5410" }}>
            {right} of {attempts.length} correct
          </Typography>
        </Box>
      </LogPanel>
    </Box>
  );
}
