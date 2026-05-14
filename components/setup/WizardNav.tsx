"use client";

import { TOTAL_WIZARD_STEPS } from "@/lib/setup/wizardData";

interface WizardNavProps {
  step: number;
  canGoBack?: boolean;
  canGoNext?: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextLoading?: boolean;
}

export function WizardNav({
  step,
  canGoBack = true,
  canGoNext = true,
  onBack,
  onNext,
  nextLabel,
  nextLoading,
}: WizardNavProps) {
  const isFinal = step >= TOTAL_WIZARD_STEPS;
  return (
    <div
      className="mt-14 flex items-center justify-between pt-7"
      style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
    >
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack || step <= 1}
        className="aw-btn aw-btn-ghost"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            d="M19 12H5M11 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Back</span>
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || nextLoading}
        className="aw-btn aw-btn-primary"
      >
        {nextLoading ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#05070f] border-r-transparent" />
        ) : null}
        <span>{nextLabel || (isFinal ? "Launch My LMS" : "Continue")}</span>
        {!isFinal ? (
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </button>
    </div>
  );
}
