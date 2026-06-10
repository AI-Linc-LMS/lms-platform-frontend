"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  ButtonBase,
  Container,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { adminAdaptiveQuizService } from "@/lib/services/admin/admin-adaptive-quiz.service";
import {
  emptyDraft,
  totalQuestions,
  type AdaptiveQuizDraft,
} from "@/lib/stores/adaptive-quiz-draft";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { Step1Configure } from "./_components/Step1Configure";
import { Step2Generate } from "./_components/Step2Generate";
import { Step3Review } from "./_components/Step3Review";
import { Step4Publish } from "./_components/Step4Publish";

const STEP_LABELS = ["Configure", "Generate", "Review", "Publish"];

export default function CreateAdaptiveQuizPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<AdaptiveQuizDraft>(emptyDraft());
  const [publishing, setPublishing] = useState(false);

  const total = totalQuestions(draft.matrix);

  // Per-step validation drives the Next/Publish button enabled state.
  const stepValid = useMemo(() => {
    switch (stepIndex) {
      case 0:
        return (
          draft.title.trim().length > 0 &&
          draft.topic.trim().length > 0 &&
          draft.sub_skills.length > 0 &&
          total > 0
        );
      case 1:
      case 2:
        // Phase C: the stub bridge fills the bank in one click; the real
        // Generate/Review steps in Phase E will validate the bank's contents.
        return draft.mcqs.length > 0;
      case 3:
        return draft.mcqs.length > 0;
      default:
        return false;
    }
  }, [stepIndex, draft, total]);

  async function handlePublish() {
    if (publishing) return;
    setPublishing(true);
    try {
      await adminAdaptiveQuizService.finalize({
        title: draft.title.trim(),
        instructions: draft.instructions.trim() || undefined,
        target_skills: draft.sub_skills,
        min_questions: draft.min_questions,
        max_questions: draft.max_questions,
        se_threshold: draft.se_threshold,
        hint_tokens: draft.hint_tokens,
        confidence_prompt_enabled: draft.confidence_prompt_enabled,
        mcqs: draft.mcqs,
      });
      showToast(`"${draft.title}" published.`, "success");
      router.push("/admin/adaptive-quizzes");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't publish.", "error");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <AdaptiveSectionShell>
          <AdaptiveSectionHero
            chapter="Create · Adaptive Engine"
            title="New adaptive quiz"
            subtitle="Four steps: configure the matrix, generate with AI, review and tweak, then publish to the tenant."
            icon="mdi:auto-fix"
            accent="indigo"
            rightSlot={
              <ButtonBase
                onClick={() => router.push("/admin/adaptive-quizzes")}
                sx={{
                  px: 2.25,
                  py: 1,
                  borderRadius: 999,
                  fontWeight: 700,
                  color: "text.secondary",
                  border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  fontSize: "0.82rem",
                }}
              >
                Cancel
              </ButtonBase>
            }
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Stepper activeStep={stepIndex} alternativeLabel>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent)",
              border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
              backdropFilter: "blur(18px) saturate(140%)",
            }}
          >
            {stepIndex === 0 && <Step1Configure draft={draft} setDraft={setDraft} />}
            {stepIndex === 1 && (
              <Step2Generate
                draft={draft}
                setDraft={setDraft}
                onComplete={() => setStepIndex(2)}
              />
            )}
            {stepIndex === 2 && <Step3Review draft={draft} setDraft={setDraft} />}
            {stepIndex === 3 && <Step4Publish draft={draft} />}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <ButtonBase
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              sx={{
                px: 2.5,
                py: 1.1,
                borderRadius: 999,
                fontWeight: 700,
                color: stepIndex === 0 ? "text.disabled" : "text.primary",
                border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 80%, transparent)",
                "&:disabled": { cursor: "not-allowed" },
              }}
            >
              ← Back
            </ButtonBase>
            {stepIndex < STEP_LABELS.length - 1 ? (
              <ButtonBase
                onClick={() => setStepIndex((i) => Math.min(STEP_LABELS.length - 1, i + 1))}
                disabled={!stepValid}
                sx={{
                  px: 3,
                  py: 1.2,
                  borderRadius: 999,
                  fontWeight: 800,
                  color: "white",
                  background: stepValid
                    ? "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)"
                    : "color-mix(in srgb, #6366f1 35%, transparent)",
                  fontSize: "0.92rem",
                  "&:hover": { transform: stepValid ? "translateY(-1px)" : "none" },
                  transition: "transform 120ms ease",
                  "&:disabled": { cursor: "not-allowed" },
                }}
              >
                Next →
              </ButtonBase>
            ) : (
              <ButtonBase
                onClick={() => void handlePublish()}
                disabled={!stepValid || publishing}
                sx={{
                  px: 3,
                  py: 1.2,
                  borderRadius: 999,
                  fontWeight: 800,
                  color: "white",
                  background: stepValid && !publishing
                    ? "linear-gradient(135deg, #10b981 0%, #6366f1 100%)"
                    : "color-mix(in srgb, #10b981 40%, transparent)",
                  fontSize: "0.92rem",
                  "&:hover": { transform: stepValid && !publishing ? "translateY(-1px)" : "none" },
                  transition: "transform 120ms ease",
                  "&:disabled": { cursor: "not-allowed" },
                }}
              >
                {publishing ? "Publishing…" : "Publish ✓"}
              </ButtonBase>
            )}
          </Box>
          </Box>
        </AdaptiveSectionShell>
      </Container>
    </MainLayout>
  );
}
