"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  AssessmentNavigation,
  type AssessmentNavigationProps,
} from "./AssessmentNavigation";
import { getSectionTimeCapTotalSeconds } from "@/utils/assessment.utils";

interface LiveAssessmentNavigationProps
  extends Omit<AssessmentNavigationProps, "sectionTimeRemainingSeconds"> {
  /** Active when assessment is in progress; pauses the section ticker when false. */
  assessmentStarted: boolean;
  /** Called once per section when remaining seconds transitions to 0. */
  onSectionTimeExpire?: (isLastSection: boolean) => void;
}

function computeRemaining(
  cap: number | null,
  enteredAt: number,
  nowMs: number,
): number | null {
  if (cap == null || cap <= 0) return null;
  const elapsed = Math.floor((nowMs - enteredAt) / 1000);
  return Math.max(0, cap - elapsed);
}

function LiveAssessmentNavigationInner(props: LiveAssessmentNavigationProps) {
  const {
    assessmentStarted,
    onSectionTimeExpire,
    sections,
    currentSectionIndex,
    ...rest
  } = props;

  const cap = useMemo(() => {
    const sec = sections[currentSectionIndex];
    return sec ? getSectionTimeCapTotalSeconds(sec) : null;
  }, [sections, currentSectionIndex]);

  // Section-entered timestamp lives here so the parent page does not need to
  // own per-section timer state.
  const [sectionEnteredAtMs, setSectionEnteredAtMs] = useState<number>(() =>
    Date.now(),
  );
  useEffect(() => {
    setSectionEnteredAtMs(Date.now());
  }, [currentSectionIndex]);

  // Remaining seconds is state, updated by the 1Hz interval below. Computing
  // Date.now() inside an effect keeps the render pure (React Compiler).
  const [sectionTimeRemainingSeconds, setSectionTimeRemainingSeconds] =
    useState<number | null>(null);

  useEffect(() => {
    setSectionTimeRemainingSeconds(
      computeRemaining(cap, sectionEnteredAtMs, Date.now()),
    );
  }, [cap, sectionEnteredAtMs]);

  useEffect(() => {
    if (!assessmentStarted) return;
    if (cap == null || cap <= 0) return;
    const id = window.setInterval(() => {
      setSectionTimeRemainingSeconds(
        computeRemaining(cap, sectionEnteredAtMs, Date.now()),
      );
    }, 1000);
    return () => clearInterval(id);
  }, [assessmentStarted, cap, sectionEnteredAtMs]);

  // Fire onSectionTimeExpire once when remaining transitions to 0 within the active section.
  const prevRef = useRef<number | null>(null);
  useEffect(() => {
    prevRef.current = null;
  }, [currentSectionIndex]);

  useEffect(() => {
    if (!assessmentStarted) return;
    if (cap == null || cap <= 0) {
      prevRef.current = null;
      return;
    }
    if (sectionTimeRemainingSeconds === null) {
      prevRef.current = null;
      return;
    }
    const prev = prevRef.current;
    prevRef.current = sectionTimeRemainingSeconds;
    if (sectionTimeRemainingSeconds !== 0) return;
    if (prev === null || prev <= 0) return;
    onSectionTimeExpire?.(currentSectionIndex >= sections.length - 1);
  }, [
    assessmentStarted,
    cap,
    sectionTimeRemainingSeconds,
    currentSectionIndex,
    sections.length,
    onSectionTimeExpire,
  ]);

  return (
    <AssessmentNavigation
      {...rest}
      sections={sections}
      currentSectionIndex={currentSectionIndex}
      sectionTimeRemainingSeconds={sectionTimeRemainingSeconds}
    />
  );
}

export const LiveAssessmentNavigation = memo(LiveAssessmentNavigationInner);
