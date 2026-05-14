import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { assessmentService } from "@/lib/services/assessment.service";
import { AssessmentMetadata } from "@/lib/services/assessment.service";
import { formatAssessmentResponses } from "@/utils/assessment.utils";

interface UseAutoSaveOptions {
  enabled: boolean;
  slug: string;
  responses: Record<string, Record<string, any>>;
  sections: Array<{ id: number; section_type: string; questions: Array<{ id: number | string }> }>;
  metadata: AssessmentMetadata;
  interval?: number; // in milliseconds
  /** Keys from `timedSectionCompletionKey` — included in autosave payload. */
  timedSectionsCompleteRef?: MutableRefObject<Set<string>>;
  /**
   * Fired once when consecutive save failures cross the visibility threshold (default 2).
   * Use this to warn the learner that their answers aren't reaching the server so they
   * don't leave the page assuming they're saved.
   */
  onPersistentFailure?: (consecutiveFailures: number) => void;
  /** Fired once after a successful save that follows a persistent-failure notification. */
  onRecovery?: () => void;
}

export type AssessmentRemoteAutosaveState = {
  status: "idle" | "saving" | "saved" | "error";
  updatedAt: number | null;
  /** Increments while saves keep failing; resets to 0 on a successful save. */
  consecutiveFailures: number;
};

const PERSISTENT_FAILURE_THRESHOLD = 2;
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS = 30000;

export function useAutoSave({
  enabled,
  slug,
  responses,
  sections,
  metadata,
  interval = 30000, // 30 seconds default
  timedSectionsCompleteRef,
  onPersistentFailure,
  onRecovery,
}: UseAutoSaveOptions): { remoteAutosave: AssessmentRemoteAutosaveState } {
  const lastSaveRef = useRef<string>("");
  const [remoteAutosave, setRemoteAutosave] = useState<AssessmentRemoteAutosaveState>({
    status: "idle",
    updatedAt: null,
    consecutiveFailures: 0,
  });

  // Latest-value refs so the save() closure reads fresh data without re-running the effect
  // on every keystroke / option click. Without this, useEffect re-mounted on every response
  // change, constantly clearing the 5s initial-save timeout (so it never fired) and churning
  // the 30s interval — which froze the UI under heavy interaction.
  const responsesRef = useRef(responses);
  const sectionsRef = useRef(sections);
  const metadataRef = useRef(metadata);
  responsesRef.current = responses;
  sectionsRef.current = sections;
  metadataRef.current = metadata;

  // Callbacks via refs so changing them does not re-run the effect.
  const onPersistentFailureRef = useRef(onPersistentFailure);
  const onRecoveryRef = useRef(onRecovery);
  onPersistentFailureRef.current = onPersistentFailure;
  onRecoveryRef.current = onRecovery;

  useEffect(() => {
    if (!enabled) {
      setRemoteAutosave({ status: "idle", updatedAt: null, consecutiveFailures: 0 });
      return;
    }

    let cancelled = false;
    let nextTimeout: ReturnType<typeof setTimeout> | null = null;
    let consecutiveFailures = 0;
    let persistentFailureNotified = false;

    const scheduleNextSave = (delayMs: number) => {
      if (cancelled) return;
      if (nextTimeout) clearTimeout(nextTimeout);
      nextTimeout = setTimeout(() => {
        nextTimeout = null;
        void save();
      }, delayMs);
    };

    const save = async () => {
      if (cancelled) return;

      const responses = responsesRef.current;
      const sections = sectionsRef.current;
      const metadata = metadataRef.current;

      // Check if there are responses to save
      const hasResponses = Object.keys(responses).some(
        (sectionType) =>
          responses[sectionType] &&
          Object.keys(responses[sectionType]).length > 0
      );
      const hasTimedCompletion =
        (timedSectionsCompleteRef?.current?.size ?? 0) > 0;

      if (!hasResponses && !hasTimedCompletion) {
        scheduleNextSave(interval);
        return;
      }

      const timedFingerprint = timedSectionsCompleteRef?.current?.size
        ? [...timedSectionsCompleteRef.current].sort().join("|")
        : "";
      const responsesString = JSON.stringify(responses);
      const fingerprint = `${responsesString}::${timedFingerprint}`;
      if (fingerprint === lastSaveRef.current) {
        scheduleNextSave(interval);
        return;
      }

      setRemoteAutosave((prev) => ({
        ...prev,
        status: "saving",
        updatedAt: Date.now(),
      }));

      // Format responses - for attempted coding questions, prefer sessionStorage code
      const getCodeFromSession = (questionId: number | string) => {
        try {
          const key = `assessment_${slug}_coding_${questionId}`;
          const raw = typeof window !== "undefined" ? sessionStorage.getItem(key) : null;
          if (raw) {
            const parsed = JSON.parse(raw);
            const code = parsed?.code;
            return code != null ? String(code) : null;
          }
        } catch {
          // Ignore
        }
        return null;
      };
      const { quizSectionId, codingProblemSectionId, subjectiveQuestionSectionId } =
        formatAssessmentResponses(
          responses,
          sections,
          getCodeFromSession,
          timedSectionsCompleteRef?.current ?? null,
        );

      // Calculate total duration
      const totalDurationSeconds =
        (new Date().getTime() -
          new Date(metadata.timing.started_at).getTime()) /
        1000;

      // Prepare metadata for transcript
      const transcriptMetadata = {
        timing: {
          started_at: metadata.timing.started_at,
        },
        proctoring: {
          tab_switches: metadata.proctoring.tab_switches,
          face_violations: metadata.proctoring.face_violations,
          fullscreen_exits: metadata.proctoring.fullscreen_exits,
          total_violation_count: metadata.proctoring.total_violation_count,
          violation_threshold_reached: metadata.proctoring.violation_threshold_reached,
        },
      };

      // Prepare request body according to API format
      const requestBody = {
        metadata: {
          transcript: {
            logs: [],
            metadata: transcriptMetadata,
            total_duration_seconds: totalDurationSeconds,
          },
        },
        quizSectionId,
        codingProblemSectionId,
        subjectiveQuestionSectionId,
      };

      try {
        await assessmentService.saveSubmission(slug, requestBody);
        if (cancelled) return;
        lastSaveRef.current = fingerprint;

        const recovered = persistentFailureNotified;
        consecutiveFailures = 0;
        persistentFailureNotified = false;

        setRemoteAutosave({
          status: "saved",
          updatedAt: Date.now(),
          consecutiveFailures: 0,
        });

        if (recovered) onRecoveryRef.current?.();
        scheduleNextSave(interval);
      } catch {
        if (cancelled) return;
        consecutiveFailures += 1;

        setRemoteAutosave({
          status: "error",
          updatedAt: Date.now(),
          consecutiveFailures,
        });

        if (
          consecutiveFailures >= PERSISTENT_FAILURE_THRESHOLD &&
          !persistentFailureNotified
        ) {
          persistentFailureNotified = true;
          onPersistentFailureRef.current?.(consecutiveFailures);
        }

        // Exponential backoff: 2s, 4s, 8s, 16s, capped at 30s
        const backoffMs = Math.min(
          BACKOFF_BASE_MS * Math.pow(2, consecutiveFailures - 1),
          BACKOFF_MAX_MS,
        );
        scheduleNextSave(backoffMs);
      }
    };

    // Initial save after 5 seconds
    scheduleNextSave(5000);

    return () => {
      cancelled = true;
      if (nextTimeout) {
        clearTimeout(nextTimeout);
        nextTimeout = null;
      }
    };
  }, [enabled, slug, interval, timedSectionsCompleteRef]);

  return { remoteAutosave };
}
