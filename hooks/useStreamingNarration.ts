"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adaptiveQuizService } from "@/lib/services/adaptive-quiz.service";
import type { AdaptiveAINarration } from "@/lib/types/adaptive-quiz";

type Section = "headline" | "per_question" | "misconceptions" | "remediation_path";

export type SectionStatus = "pending" | "loading" | "ready" | "failed";

export interface StreamingNarrationState {
  /** "" until the headline section lands, then the LLM's one-line read. */
  headline: string;
  score_summary: AdaptiveAINarration["score_summary"] | null;
  skill_mastery: AdaptiveAINarration["skill_mastery"];
  target_outcome: AdaptiveAINarration["target_outcome"];
  per_question: AdaptiveAINarration["per_question"];
  misconceptions: AdaptiveAINarration["misconceptions"];
  remediation_path: AdaptiveAINarration["remediation_path"];
  status: Record<Section, SectionStatus>;
  /** True once at least one section is ready — flips a skeleton off. */
  anySectionReady: boolean;
  /** True when every section is in a terminal state (ready or failed). */
  allDone: boolean;
  /** Re-fire one section — wired to the NarrationComposer's failed chip. */
  retrySection: (section: Section) => void;
}

interface HookOpts {
  sessionId: string;
  /** Cached narration from GET /sessions/<id>/ — used as warm seed; null if unavailable. */
  seed: AdaptiveAINarration | null;
  /** When false, the hook skips firing (e.g. feature disabled, session abandoned without responses). */
  enabled: boolean;
}

interface HeadlinePayload {
  headline: string;
  score_summary: AdaptiveAINarration["score_summary"];
  skill_mastery: AdaptiveAINarration["skill_mastery"];
  target_outcome: AdaptiveAINarration["target_outcome"];
}

/**
 * Fires the four narration sections in parallel and exposes a single state
 * object that grows as each lands. Order-independent: whichever section
 * resolves first flips `ready` for that slot and the UI hydrates immediately.
 *
 * Each section call is cheap on a re-mount (server returns cached value), so
 * tab back-and-forth doesn't re-hit OpenAI.
 */
export function useStreamingNarration({ sessionId, seed, enabled }: HookOpts): StreamingNarrationState {
  const [headline, setHeadline] = useState(seed?.headline ?? "");
  const [scoreSummary, setScoreSummary] = useState<AdaptiveAINarration["score_summary"] | null>(seed?.score_summary ?? null);
  const [skillMastery, setSkillMastery] = useState<AdaptiveAINarration["skill_mastery"]>(seed?.skill_mastery ?? []);
  const [targetOutcome, setTargetOutcome] = useState<AdaptiveAINarration["target_outcome"]>(seed?.target_outcome ?? null);
  const [perQuestion, setPerQuestion] = useState<AdaptiveAINarration["per_question"]>(seed?.per_question ?? []);
  const [misconceptions, setMisconceptions] = useState<AdaptiveAINarration["misconceptions"]>(seed?.misconceptions ?? []);
  const [remediation, setRemediation] = useState<AdaptiveAINarration["remediation_path"]>(seed?.remediation_path ?? []);

  // Seed status from whatever's cached.
  const [status, setStatus] = useState<Record<Section, SectionStatus>>({
    headline: seed?.headline ? "ready" : "pending",
    per_question: seed?.per_question?.length ? "ready" : "pending",
    misconceptions: seed?.misconceptions ? "ready" : "pending",
    remediation_path: seed?.remediation_path?.length ? "ready" : "pending",
  });

  // StrictMode double-mounts — guard the parallel fan-out so we don't fire 8 OpenAI calls.
  const startedRef = useRef(false);
  // Track which sections are mid-flight so retry can't double-fire.
  const inflightRef = useRef<Set<Section>>(new Set());
  // Sections we've already auto-retried once after a failure (transient LLM/parse
  // hiccups are common; a single silent retry recovers most without the user
  // seeing a missing component).
  const autoRetriedRef = useRef<Set<Section>>(new Set());
  // Pending auto-retry timers + a mounted flag, so a retry can't fire a (money-costing)
  // POST after navigation, and a status mirror so a delayed retry doesn't clobber a
  // section a manual retry already resolved.
  const retryTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const mountedRef = useRef(true);
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    const timers = retryTimersRef.current;
    return () => {
      mountedRef.current = false;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const runSection = useCallback(
    async (section: Section) => {
      if (!sessionId) return;
      if (inflightRef.current.has(section)) return;
      inflightRef.current.add(section);
      setStatus((s) => ({ ...s, [section]: "loading" }));
      try {
        const value = await adaptiveQuizService.generateNarrationSection<unknown>(sessionId, section);
        if (section === "headline") {
          const v = value as HeadlinePayload;
          setHeadline(v.headline);
          setScoreSummary(v.score_summary);
          setSkillMastery(v.skill_mastery);
          setTargetOutcome(v.target_outcome ?? null);
        } else if (section === "per_question") {
          setPerQuestion((value as AdaptiveAINarration["per_question"]) ?? []);
        } else if (section === "misconceptions") {
          setMisconceptions((value as AdaptiveAINarration["misconceptions"]) ?? []);
        } else if (section === "remediation_path") {
          setRemediation((value as AdaptiveAINarration["remediation_path"]) ?? []);
        }
        setStatus((s) => ({ ...s, [section]: "ready" }));
      } catch {
        setStatus((s) => ({ ...s, [section]: "failed" }));
        // Auto-retry once after a short backoff so a transient failure doesn't
        // leave the section silently missing from the results page. Tracked + guarded
        // so it can't fire after unmount or re-run a section a manual retry resolved.
        if (!autoRetriedRef.current.has(section)) {
          autoRetriedRef.current.add(section);
          const id = setTimeout(() => {
            retryTimersRef.current.delete(id);
            if (mountedRef.current && statusRef.current[section] === "failed") {
              void runSection(section);
            }
          }, 1800);
          retryTimersRef.current.add(id);
        }
      } finally {
        inflightRef.current.delete(section);
      }
    },
    [sessionId],
  );

  useEffect(() => {
    if (!enabled || startedRef.current || !sessionId) return;
    startedRef.current = true;

    // Hydrate local state + status map from the seed. The `useState`
    // initializers above only see the seed value at *first mount* — but on
    // this page `seed` is null until the session GET resolves, by which
    // point those initializers have already fired with empty defaults.
    //
    // Without this hydration step the fan-out below would re-issue an API
    // call for every section that was already cached server-side, which is
    // exactly what made revisited results look like they were re-generating.
    const cached: Record<Section, boolean> = {
      headline: !!seed?.headline,
      per_question: !!seed?.per_question?.length,
      misconceptions: !!seed?.misconceptions,
      remediation_path: !!seed?.remediation_path?.length,
    };
    if (seed) {
      if (cached.headline) {
        setHeadline(seed.headline);
        setScoreSummary(seed.score_summary);
        setSkillMastery(seed.skill_mastery);
        setTargetOutcome(seed.target_outcome ?? null);
      }
      if (cached.per_question) setPerQuestion(seed.per_question);
      if (cached.misconceptions) setMisconceptions(seed.misconceptions);
      if (cached.remediation_path) setRemediation(seed.remediation_path);
      setStatus((prev) => ({
        headline: cached.headline ? "ready" : prev.headline,
        per_question: cached.per_question ? "ready" : prev.per_question,
        misconceptions: cached.misconceptions ? "ready" : prev.misconceptions,
        remediation_path: cached.remediation_path ? "ready" : prev.remediation_path,
      }));
    }

    // Fire only the sections that genuinely weren't on the seed. Read from
    // `cached` (closed over the freshly-resolved seed) — not from `status`,
    // which is the stale closure that caused the bug.
    const toRun: Section[] = (["headline", "per_question", "misconceptions", "remediation_path"] as Section[]).filter(
      (s) => !cached[s],
    );
    if (toRun.length === 0) return;
    void Promise.allSettled(toRun.map((s) => runSection(s)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId]);

  const retrySection = useCallback(
    (section: Section) => {
      void runSection(section);
    },
    [runSection],
  );

  const anySectionReady = Object.values(status).some((s) => s === "ready");
  const allDone = Object.values(status).every((s) => s === "ready" || s === "failed");

  return {
    headline,
    score_summary: scoreSummary,
    skill_mastery: skillMastery,
    target_outcome: targetOutcome,
    per_question: perQuestion,
    misconceptions,
    remediation_path: remediation,
    status,
    anySectionReady,
    allDone,
    retrySection,
  };
}
