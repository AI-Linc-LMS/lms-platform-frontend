"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MergedSectionWithTimer = {
  time_limit_seconds?: number | null;
  time_limit_minutes?: number | null;
};

function sectionLimitSeconds(
  section: MergedSectionWithTimer | null | undefined,
): number | null {
  if (!section) return null;
  const sec = section.time_limit_seconds;
  if (sec != null && Number(sec) > 0) return Math.floor(Number(sec));
  const min = section.time_limit_minutes;
  if (min != null && Number(min) > 0) return Math.round(Number(min) * 60);
  return null;
}

/**
 * Optional per-section countdown. When it hits zero, `onSectionTimeUp` runs once per effect cycle.
 */
export function useSectionAssessmentTimers(options: {
  enabled: boolean;
  sections: MergedSectionWithTimer[];
  currentSectionIndex: number;
  onSectionTimeUp: () => void;
}) {
  const { enabled, sections, currentSectionIndex, onSectionTimeUp } = options;
  const onUpRef = useRef(onSectionTimeUp);
  onUpRef.current = onSectionTimeUp;

  const limit = sectionLimitSeconds(sections[currentSectionIndex]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const genRef = useRef(0);

  useEffect(() => {
    if (!enabled || limit == null) {
      setRemaining(null);
      return;
    }

    const gen = ++genRef.current;
    let r = limit;
    setRemaining(r);

    const id = window.setInterval(() => {
      if (genRef.current !== gen) {
        window.clearInterval(id);
        return;
      }
      r -= 1;
      setRemaining(r);
      if (r <= 0) {
        window.clearInterval(id);
        if (genRef.current === gen) {
          onUpRef.current();
        }
      }
    }, 1000);

    return () => {
      genRef.current += 1;
      window.clearInterval(id);
    };
  }, [enabled, limit, currentSectionIndex]);

  const formatSectionTime = useCallback(() => {
    if (remaining == null || limit == null) return null;
    const m = Math.floor(Math.max(0, remaining) / 60);
    const s = Math.max(0, remaining) % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remaining, limit]);

  return {
    sectionRemainingSeconds: remaining,
    sectionLimitSeconds: limit,
    sectionTimerLabel: formatSectionTime(),
    hasSectionLimit: limit != null,
  };
}
