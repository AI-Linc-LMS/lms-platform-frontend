"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, ButtonBase, Container, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { KpiRail } from "@/components/scorecard/shared";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import { SourceAttemptBreadcrumb } from "@/components/adaptive-quiz/shared/SourceAttemptBreadcrumb";
import { useToast } from "@/components/common/Toast";
import { adaptiveQuizService } from "@/lib/services/adaptive-quiz.service";
import { useAdaptiveFeatureGuard } from "@/hooks/useAdaptiveFeatureGuard";
import { useStreamingNarration } from "@/hooks/useStreamingNarration";
import { ResultStrip } from "@/components/adaptive-quiz/results/ResultStrip";
import { SkillMasteryHeatmap } from "@/components/adaptive-quiz/results/SkillMasteryHeatmap";
import { RemediationPathCard } from "@/components/adaptive-quiz/results/RemediationPathCard";
import { MisconceptionCallout } from "@/components/adaptive-quiz/results/MisconceptionCallout";
import { PerQuestionBreakdown } from "@/components/adaptive-quiz/results/PerQuestionBreakdown";
import { NarrationComposer } from "@/components/adaptive-quiz/results/NarrationComposer";
import { TargetOutcomeBanner } from "@/components/adaptive-quiz/results/TargetOutcomeBanner";
import {
  QuizResultSkeleton,
  SkillMasterySkeleton,
  RemediationSkeleton,
  MisconceptionSkeleton,
  PerQuestionSkeleton,
} from "@/components/adaptive-quiz/results/ResultSkeletons";
import type { AdaptiveSessionDetail } from "@/lib/types/adaptive-quiz";

/** Pull DRF's ``response.data.detail`` from an axios error if present —
 *  otherwise fall through to the standard Error.message — otherwise the
 *  caller's fallback string. */
function extractBackendMessage(e: unknown, fallback: string): string {
  if (e && typeof e === "object") {
    const maybeAxios = e as { response?: { data?: { detail?: unknown } }; message?: string };
    const detail = maybeAxios.response?.data?.detail;
    if (typeof detail === "string" && detail.trim().length > 0) return detail;
    if (typeof maybeAxios.message === "string" && maybeAxios.message.length > 0) return maybeAxios.message;
  }
  return fallback;
}

export default function AdaptiveQuizResultsPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const featureOn = useAdaptiveFeatureGuard();
  const { showToast } = useToast();
  const [session, setSession] = useState<AdaptiveSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingRequiz, setStartingRequiz] = useState(false);

  async function handleStartPath() {
    if (startingRequiz) return;
    setStartingRequiz(true);
    try {
      const res = await adaptiveQuizService.spawnRequiz(params.sessionId);
      router.push(`/adaptive-quizzes/session/${res.session_id}`);
    } catch (e) {
      // Surface the backend's `detail` (e.g. "There are no MCQs tagged with X…")
      // via toast instead of a generic "Request failed 400" — the results page
      // is already past its early-return error gate, so a toast is the right
      // surface for transient action failures.
      const message = extractBackendMessage(e, "Couldn't start the re-quiz right now.");
      showToast(message, "error");
    } finally {
      setStartingRequiz(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const detail = await adaptiveQuizService.getSession(params.sessionId);
        if (!cancelled) setSession(detail);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load results.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.sessionId]);

  const mcqDirectory = useMemo(() => {
    if (!session) return {};
    const out: Record<number, { question_text: string; options: Array<{ id: string; value: string }>; correct_option: string }> = {};
    for (const r of session.responses) {
      const d = r.mcq_detail;
      if (!d) continue;
      out[r.mcq] = {
        question_text: d.question_text,
        options: d.options,
        correct_option: d.correct_option,
      };
    }
    return out;
  }, [session]);

  // Local score — computed from session.responses so the KpiRail shows real
  // numbers immediately, before the AI narration's headline section streams in.
  // Must live above every early return so React's hook count stays stable.
  const localScore = useMemo(() => {
    const responses = session?.responses ?? [];
    const total = responses.length;
    const correct = responses.filter((r) => r.is_correct).length;
    const time_total_ms = responses.reduce((sum, r) => sum + (r.time_ms || 0), 0);
    return {
      correct,
      total,
      accuracy: total > 0 ? correct / total : 0,
      time_total_ms,
    };
  }, [session]);

  const narration = useStreamingNarration({
    sessionId: params.sessionId,
    seed: session?.ai_narration ?? null,
    enabled: !!session && session.responses.length > 0 && featureOn,
  });

  if (!featureOn) {
    return (
      <MainLayout>
        <Container sx={{ py: 8 }}>
          <Typography>Adaptive quiz is not enabled for this organisation.</Typography>
        </Container>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
          <AdaptiveSectionShell>
            <QuizResultSkeleton />
          </AdaptiveSectionShell>
        </Container>
      </MainLayout>
    );
  }

  if (error || !session) {
    return (
      <MainLayout>
        <Container sx={{ py: 8 }}>
          <Typography sx={{ color: "#ef4444", textAlign: "center", fontWeight: 700 }}>
            {error ?? "Results unavailable."}
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  if (session.responses.length === 0) {
    return (
      <MainLayout>
        <Container sx={{ py: 8, textAlign: "center" }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
            This session ended before any questions were answered.
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            Start a fresh attempt to see the adaptive engine in action.
          </Typography>
        </Container>
      </MainLayout>
    );
  }

  const perQuestionReady = narration.status.per_question === "ready";
  const misconceptionsReady = narration.status.misconceptions === "ready";
  const remediationReady = narration.status.remediation_path === "ready";
  const skillMasteryReady = narration.skill_mastery.length > 0;

  // A section is "generating" while still pending/loading — show a shimmer placeholder for it
  // so the page reads as actively building, not broken/empty. (skill mastery rides the
  // headline payload, so its skeleton tracks the headline status.)
  const generating = (s: "headline" | "per_question" | "misconceptions" | "remediation_path") =>
    narration.status[s] === "pending" || narration.status[s] === "loading";
  const skillGen = !skillMasteryReady && generating("headline");
  const remediationGen = !remediationReady && generating("remediation_path");
  const misconceptionGen = !misconceptionsReady && generating("misconceptions");
  const perQuestionGen = !perQuestionReady && generating("per_question");
  // Some section failed terminally (after its auto-retry). Keep the composer's
  // per-section retry visible so the component isn't silently missing.
  const hasFailedSection = Object.values(narration.status).some((s) => s === "failed");

  // `localScore` is computed above the early returns (Rules of Hooks).
  // Prefer the AI's score_summary when it arrives; fall back to the local
  // read so the KpiRail shows real numbers from the first paint.
  const score = narration.score_summary ?? localScore;
  const accuracyPct = Math.round(score.accuracy * 100);
  const timeMinutes = Math.max(1, Math.round(score.time_total_ms / 60000));

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <AdaptiveSectionShell>
          {session.source_attempt && (
            <Box sx={{ mb: 2 }}>
              <SourceAttemptBreadcrumb source={session.source_attempt} />
            </Box>
          )}
          <AdaptiveSectionHero
            chapter={session.source_attempt ? "Re-quiz · Diagnostic" : "Results · Diagnostic"}
            title={session.config.quiz_title}
            subtitle="A read of your performance across each sub-skill — with named misconceptions and a 15-minute path to close the biggest gap."
            icon="mdi:chart-bell-curve-cumulative"
            accent="pink"
            rightSlot={
              <ButtonBase
                onClick={() => router.push("/adaptive-quizzes")}
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
                ← Back to library
              </ButtonBase>
            }
          />

          <KpiRail
            items={[
              { value: `${accuracyPct}%`, label: "Accuracy", accent: "#10b981", numeric: false },
              { value: score.correct, label: "Correct", accent: "#10b981" },
              { value: score.total - score.correct, label: "Incorrect", accent: "#ef4444" },
              { value: session.hints_used, label: "Hints used", accent: "#a855f7" },
              { value: `${timeMinutes}m`, label: "Total time", accent: "#6366f1", numeric: false },
            ]}
          />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Single AnimatePresence wraps the whole streaming stack so framer
                can sequence enter/exit cleanly without sibling AP blocks racing
                each other under a `layout` parent — that race was the source of
                the "Cannot read properties of null (reading 'removeChild')"
                runtime error during section landings. */}
            <AnimatePresence initial={false}>
              {(!narration.allDone || hasFailedSection) && (
                <NarrationComposer
                  key="composer"
                  status={narration.status}
                  onRetry={(s) => narration.retrySection(s)}
                />
              )}

              {narration.target_outcome && (
                <RevealBlock key="outcome">
                  <TargetOutcomeBanner outcome={narration.target_outcome} />
                </RevealBlock>
              )}

              <RevealBlock key="strip">
                <ResultStrip
                  narration={{
                    headline: narration.headline || "",
                    score_summary: score,
                    skill_mastery: narration.skill_mastery,
                    target_outcome: narration.target_outcome,
                    misconceptions: narration.misconceptions,
                    per_question: narration.per_question,
                    remediation_path: narration.remediation_path,
                  }}
                  hintsUsed={session.hints_used}
                />
              </RevealBlock>

              {(skillMasteryReady || remediationReady || skillGen || remediationGen) && (
                <RevealBlock key="grid">
                  <Box
                    sx={{
                      display: "grid",
                      // Few skills → stack full-width (skill mastery strip over the path) so a short
                      // skill list never leaves a tall empty column beside the remediation path.
                      gridTemplateColumns:
                        skillMasteryReady && (narration.skill_mastery?.length ?? 0) <= 3
                          ? "1fr"
                          : { xs: "1fr", lg: "minmax(0, 1.4fr) minmax(0, 1fr)" },
                      gap: 2.5,
                      alignItems: "flex-start",
                    }}
                  >
                    {skillMasteryReady ? (
                      <SkillMasteryHeatmap skills={narration.skill_mastery} />
                    ) : skillGen ? (
                      <SkillMasterySkeleton />
                    ) : null}
                    {remediationReady ? (
                      <RemediationPathCard
                        steps={narration.remediation_path}
                        sessionId={params.sessionId}
                        onStartPath={() => void handleStartPath()}
                      />
                    ) : remediationGen ? (
                      <RemediationSkeleton />
                    ) : null}
                  </Box>
                </RevealBlock>
              )}

              {misconceptionsReady && narration.misconceptions.length > 0 ? (
                <RevealBlock key="misc">
                  <MisconceptionCallout
                    misconceptions={narration.misconceptions}
                    responses={session.responses}
                  />
                </RevealBlock>
              ) : misconceptionGen ? (
                <RevealBlock key="misc-skel">
                  <MisconceptionSkeleton />
                </RevealBlock>
              ) : null}

              {perQuestionReady ? (
                <RevealBlock key="per-q">
                  <PerQuestionBreakdown
                    responses={session.responses}
                    narration={{
                      headline: narration.headline || "",
                      score_summary: score,
                      skill_mastery: narration.skill_mastery,
                      target_outcome: narration.target_outcome,
                      misconceptions: narration.misconceptions,
                      per_question: narration.per_question,
                      remediation_path: narration.remediation_path,
                    }}
                    mcqDirectory={mcqDirectory}
                  />
                </RevealBlock>
              ) : perQuestionGen ? (
                <RevealBlock key="per-q-skel">
                  <PerQuestionSkeleton rows={Math.min(session.responses.length || 4, 6)} />
                </RevealBlock>
              ) : null}
            </AnimatePresence>
          </Box>
        </AdaptiveSectionShell>
      </Container>
    </MainLayout>
  );
}

/**
 * Smoothly fades a section into view as it streams in. Used inside the page's
 * single `AnimatePresence` so each AI section reveals calmly without
 * triggering a `removeChild` race during exit.
 *
 * Note on `exit`: we deliberately only tween opacity, not height/margin.
 * Height tweens on exit are what cause the DOM child to outlive its React
 * parent and break unmount under framer-motion 12 + React 19.
 */
function RevealBlock({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
