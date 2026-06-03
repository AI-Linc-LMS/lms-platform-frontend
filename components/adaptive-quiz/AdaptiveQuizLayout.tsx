"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { useAdaptiveSession } from "@/hooks/useAdaptiveSession";
import { AdaptiveSectionShell } from "./shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "./shared/AdaptiveSectionHero";
import { SourceAttemptBreadcrumb } from "./shared/SourceAttemptBreadcrumb";
import { DifficultyPulse } from "./mid/DifficultyPulse";
import { SkillConfidenceCard } from "./mid/SkillConfidenceCard";
import { QuestionCard } from "./mid/QuestionCard";
import { AITutorSidecar } from "./mid/AITutorSidecar";
import { QuizMetaStrip } from "./mid/QuizMetaStrip";
import { LiveTimerRing } from "./mid/LiveTimerRing";

interface AdaptiveQuizLayoutProps {
  sessionId: string;
}

/**
 * Top-level surface for an in-progress adaptive quiz session.
 *
 * The layout mirrors the mockup: two-column with the question + difficulty
 * pulse + meta strip in the center, the skill confidence card + live timer
 * on the left rail, and the AI tutor sidecar on the right rail.
 */
export function AdaptiveQuizLayout({ sessionId }: AdaptiveQuizLayoutProps) {
  const router = useRouter();
  const ctx = useAdaptiveSession({ sessionId });

  // When the session is finished (or has no pending question), redirect to
  // results. The push happens inside an effect — calling `router.replace`
  // during render mutates the Router store mid-render and yields React's
  // "Cannot update a component while rendering a different component" warning.
  const shouldRedirectToResults =
    !!ctx.session &&
    (ctx.session.status !== "active" || !ctx.currentQuestion);

  useEffect(() => {
    if (shouldRedirectToResults) {
      router.replace(`/adaptive-quizzes/session/${sessionId}/results`);
    }
  }, [shouldRedirectToResults, router, sessionId]);

  if (ctx.loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Typography sx={{ color: "text.secondary" }}>Loading your adaptive session…</Typography>
      </Box>
    );
  }

  if (ctx.error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography sx={{ color: "#ef4444", fontWeight: 700 }}>{ctx.error}</Typography>
      </Box>
    );
  }

  if (!ctx.session) {
    return null;
  }

  if (shouldRedirectToResults || !ctx.currentQuestion) {
    // Narrow `currentQuestion` for the renderer below — when this branch is
    // false TS already knows the session is active *and* a question is pinned.
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography sx={{ color: "text.secondary" }}>Wrapping up — bringing you to your results…</Typography>
      </Box>
    );
  }

  const q = ctx.currentQuestion;
  const session = ctx.session;

  // Build skill rows for the live confidence card.
  const skillRows = Object.entries(session.ability_state).map(([skill, theta]) => ({
    skill,
    theta: Number(theta),
    thetaPrev: ctx.thetaHistory[skill] ?? 0,
    se: session.se_state[skill] ?? 1,
  }));

  // Find the weakest target skill — the soft AI nudge.
  const weakest = [...skillRows].sort((a, b) => a.theta - b.theta)[0];
  const nudgeCopy = weakest
    ? `${prettySkill(weakest.skill)} is your weakest spot right now — the engine will keep probing here.`
    : undefined;

  const estimatedTotal = Math.round(
    (session.config.min_questions + session.config.max_questions) / 2,
  );

  const avgSe = skillRows.length ? skillRows.reduce((a, r) => a + r.se, 0) / skillRows.length : null;

  return (
    <AdaptiveSectionShell>
      <AdaptiveSectionHero
        chapter="Live · Adaptive Engine"
        title={session.config.quiz_title}
        subtitle="Difficulty and skill targeting adapt to every answer. The AI tutor on the right narrates each choice in real time."
        icon="mdi:tune-vertical"
        accent="indigo"
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {session.source_attempt && (
        <Box>
          <SourceAttemptBreadcrumb
            source={session.source_attempt}
            // Warn the student before navigating away from the live quiz —
            // an in-flight answer would be lost on the source results page.
            onBeforeNavigate={() => {
              const hasUnsubmittedSelection = ctx.selectedOption !== null;
              if (!hasUnsubmittedSelection) return true;
              return window.confirm(
                "You haven't submitted your current answer yet. Open the source attempt's results anyway?",
              );
            }}
          />
        </Box>
      )}
      <QuizMetaStrip
        quizTitle={session.config.quiz_title}
        answered={session.question_count}
        minQuestions={session.config.min_questions}
        maxQuestions={session.config.max_questions}
        avgSe={avgSe}
      />

      <DifficultyPulse
        predictedPCorrect={q.predicted_p_correct}
        targetSkill={q.target_skill}
        avgSe={avgSe}
        difficultyLabel={q.difficulty_label}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "260px minmax(0, 1fr) 320px" },
          gap: 2.5,
          alignItems: "flex-start",
        }}
      >
        {/* LEFT RAIL */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
              border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <LiveTimerRing resetKey={q.mcq_id} />
          </Box>
          <SkillConfidenceCard
            skills={skillRows}
            activeSkill={q.target_skill}
            nudge={nudgeCopy}
          />
        </Box>

        {/* CENTER — question */}
        <Box>
          <QuestionCard
            question={q}
            questionNumber={session.question_count + 1}
            estimatedTotal={estimatedTotal}
            selectedOption={ctx.selectedOption}
            onSelectOption={ctx.setSelectedOption}
            confidence={ctx.confidence}
            onConfidenceChange={ctx.setConfidence}
            confidencePromptEnabled={session.config.confidence_prompt_enabled}
            onSubmit={() => void ctx.submit()}
            submitting={ctx.submitting}
            hintTokensRemaining={ctx.hintsRemaining}
            onAskHint={() => void ctx.askHint()}
            showHint={ctx.hintRevealed !== null}
          />
        </Box>

        {/* RIGHT RAIL — AI tutor */}
        <Box>
          <AITutorSidecar
            hintTeaser={ctx.hintTeaser || defaultHintTeaser(q.target_skill)}
            hintRevealed={ctx.hintRevealed ?? undefined}
            hintLoading={ctx.askingHint}
            hintTokensRemaining={ctx.hintsRemaining}
            onAskHint={() => void ctx.askHint()}
            predictedPCorrect={q.predicted_p_correct}
            difficultyLabel={q.difficulty_label}
            targetSkill={q.target_skill}
            avgSe={avgSe}
          />
        </Box>
      </Box>
      </Box>
    </AdaptiveSectionShell>
  );
}

// Pre-spend nudge — generic enough to be safe without giving anything away,
// but it leans on the targeted skill so it's at least topic-aware. The real
// AI hint replaces this the moment the student spends a token.
function defaultHintTeaser(targetSkill: string): string {
  const skill = targetSkill?.trim();
  if (!skill) {
    return "Pause on the core concept the question is testing — what's the right framework to apply?";
  }
  const pretty = skill.replace(/_/g, " ");
  return `Spend a token to get a question-specific nudge from the AI tutor on ${pretty}.`;
}

function prettySkill(s: string): string {
  if (!s) return "General";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
