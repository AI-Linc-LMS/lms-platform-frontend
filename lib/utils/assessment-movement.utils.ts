import type { SectionMovementPolicy } from "@/lib/services/assessment.service";

export function effectiveMovementPolicy(
  sectionPolicy: SectionMovementPolicy | null | undefined,
  assessmentDefault: SectionMovementPolicy | undefined,
): SectionMovementPolicy {
  return (sectionPolicy ?? assessmentDefault ?? "free") as SectionMovementPolicy;
}

/** Whether the Previous control may move the learner backward (within or across sections). */
export function canUsePreviousNavigation(
  policy: SectionMovementPolicy,
  currentSectionIndex: number,
  currentQuestionIndex: number,
  lockedPastSections: ReadonlySet<number>,
): boolean {
  if (currentQuestionIndex === 0 && currentSectionIndex === 0) return false;
  if (policy === "free") return true;
  if (currentQuestionIndex > 0) return true;
  const prevSection = currentSectionIndex - 1;
  if (policy === "forward_only" || policy === "sequential_questions_only") {
    return false;
  }
  if (policy === "locked_after_leave") {
    return !lockedPastSections.has(prevSection);
  }
  return true;
}

/** Section tab jumps: enforce forward-only or locked-past rules. */
export function canJumpToSectionTab(
  policy: SectionMovementPolicy,
  targetIndex: number,
  currentIndex: number,
  lockedPastSections: ReadonlySet<number>,
): boolean {
  if (targetIndex === currentIndex) return true;
  if (policy === "free") return true;
  if (policy === "forward_only" || policy === "sequential_questions_only") {
    return targetIndex > currentIndex;
  }
  if (policy === "locked_after_leave") {
    if (targetIndex >= currentIndex) return true;
    for (let i = targetIndex; i < currentIndex; i++) {
      if (lockedPastSections.has(i)) return false;
    }
    return true;
  }
  return true;
}
