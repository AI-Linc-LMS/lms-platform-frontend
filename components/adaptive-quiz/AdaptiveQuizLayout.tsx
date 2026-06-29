"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
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
import { LiveQuizPoints } from "./mid/LiveQuizPoints";
import { PointsRewardBurst } from "./mid/PointsRewardBurst";

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
  const [started, setStarted] = useState(false);

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

  // Begin gate — show the full quiz surface (timer / skill confidence / AI tutor) right away,
  // but keep the first question hidden behind a "ready when you are" gate in the question slot,
  // with the timer paused, until the learner begins. A resumed session (answers already in)
  // skips the gate entirely.
  const notStarted = !started && session.question_count === 0;

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
      {/* Back leaves WITHOUT ending the session — the per-question clock keeps running server-side
          and reopening the quiz resumes from here (like the AI coding mentor). */}
      <Box
        component="button"
        onClick={() => router.back()}
        sx={{ all: "unset", cursor: "pointer", color: "#6366f1", fontWeight: 700, fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 0.5, mb: 1.5 }}
      >
        <Icon icon="mdi:arrow-left" width={16} /> Back · your timer keeps running
      </Box>
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
        theta={Number(session.ability_state[q.target_skill] ?? 0)}
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
            <LiveTimerRing key={`${q.mcq_id}-${notStarted ? "paused" : "run"}`} resetKey={q.mcq_id} running={!notStarted} startedAtMs={ctx.questionStartMs} />
            {/* Running total banked this quiz — always shown, ticks up on every correct answer. */}
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.5, py: 0.6, borderRadius: 999, bgcolor: "color-mix(in srgb, #7c3aed 12%, transparent)", color: "#6d28d9", fontSize: "0.82rem", fontWeight: 900 }}>
              <Icon icon="mdi:star-four-points" width={15} /> {ctx.sessionPoints}
              <Typography component="span" sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.85 }}>
                pts this quiz
              </Typography>
            </Box>
          </Box>
          {q.points && (
            <LiveQuizPoints
              key={`${q.mcq_id}-${notStarted ? "paused" : "run"}`}
              decay={q.points}
              running={!notStarted}
              hints={ctx.hintRevealed !== null ? 1 : 0}
              startedAtMs={ctx.questionStartMs}
            />
          )}
          <SkillConfidenceCard
            skills={skillRows}
            activeSkill={q.target_skill}
            nudge={nudgeCopy}
          />
        </Box>

        {/* CENTER — the begin gate (fresh session) sits in the question slot, then the question */}
        <Box sx={{ position: "relative" }}>
          <PointsRewardBurst reward={ctx.lastReward} />
          {notStarted ? (
            <BeginGate
              minQ={session.config.min_questions}
              maxQ={session.config.max_questions}
              onBegin={() => { ctx.resetForNextQuestion(); setStarted(true); }}
            />
          ) : (
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
          )}
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

/** "Ready when you are" gate — rendered in the question card's slot so the rest of the
 *  surface (timer, skill confidence, AI tutor) is previewable while the question stays
 *  hidden and the timer paused until the learner begins. */
function BeginGate({ minQ, maxQ, onBegin }: { minQ: number; maxQ: number; onBegin: () => void }) {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 4.5 },
        minHeight: { md: 460 },
        borderRadius: 4,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
        backdropFilter: "blur(18px) saturate(140%)",
        boxShadow: "0 1px 0 0 color-mix(in srgb, white 14%, transparent) inset, 0 24px 60px -32px rgba(99, 102, 241, 0.35)",
      }}
    >
      <Box sx={{ width: 64, height: 64, mb: 2, borderRadius: "50%", display: "grid", placeItems: "center", color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}>
        <Icon icon="mdi:lightning-bolt" width={30} />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "1.4rem" }}>Ready when you are</Typography>
      <Typography sx={{ color: "text.secondary", mt: 1, lineHeight: 1.6, maxWidth: 460 }}>
        {minQ === maxQ ? `${maxQ} questions` : `${minQ}–${maxQ} questions`} · difficulty adapts to
        each answer, and each one is worth more the faster you nail it. Your timer + points start
        when you click begin — take a breath first.
      </Typography>
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 2, px: 1.5, py: 0.6, borderRadius: 999, bgcolor: "color-mix(in srgb, #6366f1 10%, transparent)", color: "#6366f1", fontSize: "0.74rem", fontWeight: 800 }}>
        <Icon icon="mdi:timer-sand" width={14} /> Timer starts on “Begin”
      </Box>
      <Button
        variant="contained"
        onClick={onBegin}
        endIcon={<Icon icon="mdi:arrow-right" width={20} />}
        sx={{ mt: 2.5, px: 4, py: 1.2, borderRadius: 2.5, textTransform: "none", fontWeight: 800, fontSize: "0.95rem", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
      >
        Begin quiz
      </Button>
    </Box>
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
