import { useEffect, useRef } from "react";
import { assessmentService } from "@/lib/services/assessment.service";
import { AssessmentMetadata } from "@/lib/services/assessment.service";

interface UseAutoSaveOptions {
  enabled: boolean;
  slug: string;
  responses: Record<string, Record<string, any>>;
  metadata: AssessmentMetadata;
  interval?: number; // in milliseconds
}

export function useAutoSave({
  enabled,
  slug,
  responses,
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

        // Save responses
        await assessmentService.saveSubmission(slug, responses, metadata);
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
  }, [enabled, slug, responses, metadata, interval]);

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

