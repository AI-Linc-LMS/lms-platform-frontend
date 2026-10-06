"use client";

/**
 * The course's spoken level check.
 *
 * One interview, because that is what the data holds - and specifically it is the ENTRY gauge:
 * the server builds `board.interview.card` only from the node flagged `is_calibration_interview`
 * (adaptive_journey/journey/board.py:211-212). It is not a closing round, and this panel no
 * longer calls it one.
 *
 * Mid-course interview rounds are a separate piece of work. When they exist they will be real
 * steps on the spine, each with its own template - one template per node, because
 * `interview_node_complete` keys completion on the TEMPLATE, so two nodes sharing one would
 * both tick the moment either was sat.
 */

import { Box, Chip, CircularProgress, Stack, Typography, ButtonBase } from "@mui/material";
import { Icon } from "@iconify/react";
import { PHONE } from "@/components/common/mobile/phone";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";
import { useInterviewLaunch } from "../useInterviewLaunch";

export function InterviewPanel({ board, courseId }: { board: JourneyBoard; courseId: number }) {
  const card = board.interview.card;
  const { launch, busy } = useInterviewLaunch(courseId);
  if (!card) return null;

  const done = card.status === "done";
  const configured = card.configured && card.templateId != null;

  return (
    <Box>
      <Box
        sx={{
          p: { xs: 2.5, md: 3 }, borderRadius: 4, mb: 2.5, color: "white",
          // ONE backgroundImage, with both gradients layered, and an explicit colour under
          // them. Written as `background:` followed by `backgroundImage:` the second silently
          // REPLACED the first - `background` is a shorthand that sets background-image - so
          // the dark panel vanished and the white heading sat on a near-white page.
          backgroundColor: "#0b1f33",
          backgroundImage: "radial-gradient(90% 120% at 100% 0%, rgba(14,165,233,0.28) 0%, transparent 60%), linear-gradient(135deg, #0b1f33 0%, #10243d 55%, #16304f 100%)",
          [PHONE]: { p: 2 },
        }}
      >
        <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, letterSpacing: 0.9, color: "#7dd3fc", '[dir="rtl"] &': { letterSpacing: "normal" } }}>
          LEVEL CHECK
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.3rem", md: "1.6rem" }, mt: 0.5 }}>
          A spoken conversation that sizes where you are
        </Typography>
        <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.72)", mt: 0.75, lineHeight: 1.5, maxWidth: 640 }}>
          The interviewer asks, listens, and follows up on your answers rather than reading from
          a list. It sets the level your course starts at.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          {[card.topic, card.difficulty && `${card.difficulty} level`, "Voice conversation", "Adaptive follow-ups"]
            .filter(Boolean)
            .map((t) => (
              <Chip
                key={String(t)}
                label={String(t)}
                size="small"
                sx={{ fontWeight: 700, fontSize: "0.74rem", color: "#e0f2fe", bgcolor: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}
              />
            ))}
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 4, border: "1px solid #eef2f7", bgcolor: "#fff" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "center" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
              {card.title || "Mock interview"}
            </Typography>
            <Typography sx={{ fontSize: "0.84rem", color: "#64748b", mt: 0.5, lineHeight: 1.5 }}>
              {!configured
                ? "Your instructor is still setting this up."
                : done
                  ? `You have sat this interview. About ${card.durationMinutes ?? 10} minutes to take it again.`
                  : `About ${card.durationMinutes ?? 10} minutes, whenever you are ready.`}
            </Typography>
          </Box>
          {configured && (
            <ButtonBase
              disabled={busy}
              onClick={() => void launch(card.templateId, {
                topic: card.topic, difficulty: card.difficulty, durationMinutes: card.durationMinutes,
              })}
              sx={{
                flexShrink: 0, gap: 0.75, px: 2.5, py: 1.15, borderRadius: 2.5,
                fontWeight: 800, fontSize: "0.88rem", color: "white",
                background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
                "&.Mui-disabled": { opacity: 0.6, color: "white" },
                [PHONE]: { width: "100%", minHeight: 48 },
              }}
            >
              {busy ? <CircularProgress size={16} thickness={5} sx={{ color: "white" }} />
                    : <Icon icon="mdi:account-voice" width={18} />}
              {done ? "Take it again" : `Start ${card.durationMinutes ?? 10} min interview`}
            </ButtonBase>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
