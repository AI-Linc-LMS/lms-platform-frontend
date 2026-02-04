import { useEffect, useRef } from "react";
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
}

export function useAutoSave({
  enabled,
  slug,
  responses,
  sections,
  metadata,
  interval = 30000, // 30 seconds default
}: UseAutoSaveOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const save = async () => {
      try {
        // Check if there are responses to save
        const hasResponses = Object.keys(responses).some(
          (sectionType) =>
            responses[sectionType] &&
            Object.keys(responses[sectionType]).length > 0
        );

        if (!hasResponses) return;

        // Check if responses have changed since last save
        const responsesString = JSON.stringify(responses);
        if (responsesString === lastSaveRef.current) return;

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
        const { quizSectionId, codingProblemSectionId } = formatAssessmentResponses(
          responses,
          sections,
          getCodeFromSession
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
        };

        // Save responses
        await assessmentService.saveSubmission(slug, requestBody);
        lastSaveRef.current = responsesString;
      } catch (error) {
        // Silently fail - don't disrupt user experience
      }
    };

    // Initial save after 5 seconds
    const initialTimeout = setTimeout(() => {
      save();
    }, 5000);

    // Set up periodic auto-save
    intervalRef.current = setInterval(() => {
      save();
    }, interval);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, slug, responses, sections, metadata, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}

