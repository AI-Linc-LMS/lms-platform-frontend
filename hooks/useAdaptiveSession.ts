"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adaptiveQuizService } from "@/lib/services/adaptive-quiz.service";
import { notifyContentCompleted } from "@/lib/streak/streakCelebration";
import { celebrateXp } from "@/lib/xp/xpCelebration";
import type {
  AdaptiveQuestion,
  AdaptiveSessionDetail,
  ConfidenceLevel,
  SubmitAnswerResponse,
} from "@/lib/types/adaptive-quiz";

interface UseAdaptiveSessionOptions {
  sessionId: string;
}

interface UseAdaptiveSessionReturn {
  loading: boolean;
  error: string | null;
  session: AdaptiveSessionDetail | null;

  currentQuestion: AdaptiveQuestion | null;
  questionStartedAt: number;
  /** Absolute epoch ms (client clock) when the current question's server clock started — anchors
   *  the live timer/points so they reflect server time and survive leave/resume. */
  questionStartMs: number;
  resetForNextQuestion: () => void;
  selectedOption: string | null;
  setSelectedOption: (id: string | null) => void;
  confidence: ConfidenceLevel | null;
  setConfidence: (c: ConfidenceLevel | null) => void;

  /** Per-skill {previous, current} theta — drives the SkillConfidenceCard ghost markers. */
  thetaHistory: Record<string, number>;

  hintTeaser: string;
  hintRevealed: string | null;
  askingHint: boolean;
  askHint: () => Promise<void>;
  hintsRemaining: number;

  submit: () => Promise<SubmitAnswerResponse | null>;
  endEarly: () => Promise<void>;
  submitting: boolean;
  abandoning: boolean;

  /** ✓/✗ flash from the most recent answer; null until first answer. */
  lastAnswerCorrect: boolean | null;

  /** Running points banked this sitting (sum of per-question earned). */
  sessionPoints: number;
  /** Latest per-question reward — drives the "+N pts" burst. `id` bumps on every submit. */
  lastReward: { id: number; points: number; base: number } | null;
}

export function useAdaptiveSession({
  sessionId,
}: UseAdaptiveSessionOptions): UseAdaptiveSessionReturn {
  const [session, setSession] = useState<AdaptiveSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [lastReward, setLastReward] = useState<{ id: number; points: number; base: number } | null>(null);
  const rewardIdRef = useRef(0);
  // Per-question hint state. `hintTeaser` shows a generic pre-spend nudge;
  // `hintRevealed` is the full AI-generated paragraph (null until spent).
  const [hintTeaser, setHintTeaser] = useState<string>("");
  const [hintRevealed, setHintRevealed] = useState<string | null>(null);
  const [askingHint, setAskingHint] = useState(false);

  // Per-skill previous-theta for ghost markers. Keyed by skill.
  const [thetaHistory, setThetaHistory] = useState<Record<string, number>>({});

  const questionStartedAtRef = useRef<number>(Date.now());
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  // Client↔server clock offset captured at load (Date.now − server_now), so a question's server
  // served_at can be expressed on the client clock for the live timer — and the clock keeps running
  // across leave/resume, matching the server-side decay.
  const serverClockOffsetRef = useRef<number>(0);

  const resetForNextQuestion = useCallback(() => {
    setSelectedOption(null);
    setConfidence(null);
    // Per-question hint state — clear so the new question doesn't carry over
    // the previous question's hint copy.
    setHintRevealed(null);
    setHintTeaser("");
    const now = Date.now();
    questionStartedAtRef.current = now;
    setQuestionStartedAt(now);
  }, []);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await adaptiveQuizService.getSession(sessionId);
      setSession(detail);
      // Seed the running total + clock offset so a resumed session shows the right points and the
      // per-question timer reflects time already elapsed server-side.
      setSessionPoints(detail.points_so_far ?? 0);
      serverClockOffsetRef.current = detail.server_now ? Date.now() - Date.parse(detail.server_now) : 0;
      // Seed thetaHistory from the most-recent response so re-entry shows the right ghost.
      if (detail.responses.length > 1) {
        const prev = detail.responses[detail.responses.length - 2];
        setThetaHistory(prev.theta_after);
      } else {
        const baseline: Record<string, number> = {};
        for (const skill of Object.keys(detail.ability_state)) baseline[skill] = 0;
        setThetaHistory(baseline);
      }
      resetForNextQuestion();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId, resetForNextQuestion]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  // Server contract: ``pending_question`` is either ``null`` (no live question
  // — completed / abandoned / not yet pinned) or a full QuestionPayload with
  // ``options`` and ``question_text`` set. ``_pick_and_pin_next_question``
  // writes the full payload via ``asdict(payload)`` on every pin; abandon
  // nulls it. No half-empty intermediate shape is possible.
  const currentQuestion = session?.pending_question ?? null;
  const hintsRemaining = session
    ? Math.max(0, session.config.hint_tokens - session.hints_used)
    : 0;
  // Server-anchored start of the current question on the client clock (falls back to the client
  // mount time for legacy sessions pinned before served_at existed).
  const questionStartMs = currentQuestion?.served_at
    ? Date.parse(currentQuestion.served_at) + serverClockOffsetRef.current
    : questionStartedAt;

  const submit = useCallback(async (): Promise<SubmitAnswerResponse | null> => {
    if (!session || !currentQuestion || !selectedOption) return null;
    if (session.config.confidence_prompt_enabled && confidence === null) return null;
    setSubmitting(true);
    setError(null);
    try {
      const elapsedMs = Date.now() - questionStartedAtRef.current;
      const result = await adaptiveQuizService.submitAnswer(sessionId, {
        mcq_id: currentQuestion.mcq_id,
        selected_option: selectedOption,
        confidence: session.config.confidence_prompt_enabled ? confidence : null,
        time_ms: elapsedMs,
        // A revealed hint pauses the decay clock server-side — tell the backend it was used.
        hint_used: hintRevealed !== null,
      });
      setLastAnswerCorrect(result.is_correct);
      // Per-question points: bank the running total + fire the "+N pts" burst.
      rewardIdRef.current += 1;
      setLastReward({ id: rewardIdRef.current, points: result.points_earned ?? 0, base: result.points_base ?? 0 });
      setSessionPoints((p) => p + (result.points_earned ?? 0));
      // Capture previous theta map for ghost markers BEFORE we replace session state.
      setThetaHistory(session.ability_state);
      // Update the session with the new pending question and counters.
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ability_state: result.ability_state,
          se_state: result.se_state,
          question_count: result.progress.answered,
          pending_question: result.next_question,
          status: result.session_complete ? "completed" : prev.status,
        };
      });
      resetForNextQuestion();
      // Finishing the quiz counts as a completion — celebrate the session XP + streak.
      if (result.session_complete) {
        const totalXp = sessionPoints + (result.points_earned ?? 0);
        celebrateXp(totalXp);
        notifyContentCompleted();
      }
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit answer");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [session, currentQuestion, selectedOption, confidence, hintRevealed, sessionId, resetForNextQuestion]);

  const askHint = useCallback(async () => {
    if (!session || askingHint) return;
    if (hintsRemaining <= 0) return;
    setAskingHint(true);
    // Optimistic teaser so the sidecar shows "thinking…" copy immediately
    // instead of staying on the generic pre-spend teaser.
    setHintTeaser("Asking the AI tutor…");
    try {
      const res = await adaptiveQuizService.requestHint(sessionId);
      setHintRevealed(res.hint);
      if (res.teaser) setHintTeaser(res.teaser);
      setSession((prev) =>
        prev ? { ...prev, hints_used: prev.config.hint_tokens - res.hints_remaining } : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to request hint");
      setHintTeaser("");
    } finally {
      setAskingHint(false);
    }
  }, [session, hintsRemaining, sessionId, askingHint]);

  const endEarly = useCallback(async () => {
    if (!session) return;
    setAbandoning(true);
    try {
      await adaptiveQuizService.abandonSession(sessionId);
      await loadSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to end session");
    } finally {
      setAbandoning(false);
    }
  }, [session, sessionId, loadSession]);

  return useMemo(
    () => ({
      loading,
      error,
      session,
      currentQuestion,
      questionStartedAt,
      questionStartMs,
      resetForNextQuestion,
      selectedOption,
      setSelectedOption,
      confidence,
      setConfidence,
      thetaHistory,
      hintTeaser,
      hintRevealed,
      askingHint,
      askHint,
      hintsRemaining,
      submit,
      endEarly,
      submitting,
      abandoning,
      lastAnswerCorrect,
      sessionPoints,
      lastReward,
    }),
    [
      loading,
      error,
      session,
      currentQuestion,
      questionStartedAt,
      questionStartMs,
      resetForNextQuestion,
      selectedOption,
      confidence,
      thetaHistory,
      hintTeaser,
      hintRevealed,
      askingHint,
      askHint,
      hintsRemaining,
      submit,
      endEarly,
      submitting,
      abandoning,
      lastAnswerCorrect,
      sessionPoints,
      lastReward,
    ],
  );
}
