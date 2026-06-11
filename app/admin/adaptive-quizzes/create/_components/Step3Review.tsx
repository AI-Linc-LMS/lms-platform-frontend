"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { MCQReviewTable } from "@/components/admin/adaptive-quiz/MCQReviewTable";
import type { AdaptiveQuizDraft } from "@/lib/stores/adaptive-quiz-draft";

interface Step3ReviewProps {
  draft: AdaptiveQuizDraft;
  setDraft: (next: AdaptiveQuizDraft) => void;
}

export function Step3Review({ draft, setDraft }: Step3ReviewProps) {
  if (draft.mcqs.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: 3,
          textAlign: "center",
          bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
          border: "1px dashed color-mix(in srgb, var(--border-default, #e5e7eb) 90%, transparent)",
        }}
      >
        <Icon icon="mdi:robot-confused-outline" width={36} style={{ color: "#a855f7" }} />
        <Typography sx={{ fontWeight: 700, mt: 1 }}>
          Generate the bank first.
        </Typography>
        <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mt: 0.5 }}>
          Go back to <strong>Generate</strong> and click Start generation.
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.5 }}>
        Click any question to expand and edit. Use <strong>Regenerate with AI</strong> to replace a bad one without touching the others.
      </Typography>
      <MCQReviewTable
        mcqs={draft.mcqs}
        topic={draft.topic}
        onChange={(mcqs) => setDraft({ ...draft, mcqs })}
        enableRegenerate
      />
    </Box>
  );
}
