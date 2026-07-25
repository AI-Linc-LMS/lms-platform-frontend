"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { AdaptiveQuizDraft } from "@/lib/stores/adaptive-quiz-draft";
import { confidenceTier } from "@/lib/utils/adaptive-confidence";

interface Step4PublishProps {
  draft: AdaptiveQuizDraft;
}

function prettySkill(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Step4Publish({ draft }: Step4PublishProps) {
  const correctCount = draft.mcqs.filter((m) => Boolean(m.correct_option)).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.55 }}>
        Review the bundle below - once you click <strong>Publish</strong>, the engine starts
        serving these questions adaptively to learners on this tenant.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          p: 2,
          borderRadius: 3,
          bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
          border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 80%, transparent)",
        }}
      >
        <Field label="Title" value={draft.title || "-"} />
        <Field label="Topic" value={draft.topic || "-"} />
        <Field
          label="Sub-skills"
          value={
            draft.sub_skills.length === 0
              ? "auto-derived"
              : draft.sub_skills.map(prettySkill).join(", ")
          }
        />
        <Field label="Question bank" value={`${draft.mcqs.length} MCQs (${correctCount} answer-keyed)`} />
        <Field label="Question limits" value={`${draft.min_questions} – ${draft.max_questions} questions`} />
        <Field
          label="Confidence target"
          value={`${confidenceTier(draft.se_threshold).name} · ${confidenceTier(draft.se_threshold).typicalLength.toLowerCase()}`}
        />
        <Field label="Hint tokens" value={String(draft.hint_tokens)} />
        <Field label="Confidence prompt" value={draft.confidence_prompt_enabled ? "Enabled" : "Disabled"} />
      </Box>

      {/* Tiny preview of the first 3 MCQs */}
      {draft.mcqs.length > 0 && (
        <Box>
          <Typography
            sx={{
              fontSize: "0.66rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "text.secondary",
              mb: 1,
            }}
          >
            Preview · first {Math.min(3, draft.mcqs.length)} questions
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {draft.mcqs.slice(0, 3).map((m, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 50%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
                }}
              >
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                  Q{idx + 1}. {m.question_text}
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.5 }}>
                  Correct: <strong>{m.correct_option}</strong> · {m.difficulty_level}
                  {m.skills ? ` · ${m.skills}` : ""}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {draft.mcqs.length === 0 && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "color-mix(in srgb, #ef4444 8%, transparent)",
            border: "1px solid color-mix(in srgb, #ef4444 22%, transparent)",
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
          }}
        >
          <Icon icon="mdi:alert-circle-outline" width={18} style={{ color: "#ef4444", marginTop: 2 }} />
          <Typography sx={{ fontSize: "0.85rem", color: "#ef4444", lineHeight: 1.5 }}>
            No questions in the bank yet. Go back and generate them in Step 2.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: "0.66rem",
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, mt: 0.25 }}>{value}</Typography>
    </Box>
  );
}
