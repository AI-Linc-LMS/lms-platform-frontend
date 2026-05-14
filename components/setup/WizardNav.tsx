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
    <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack || step <= 1}
        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || nextLoading}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary-600,#1d4ed8)] to-[var(--accent-blue,#00e0ff)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextLoading ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
        ) : null}
        {nextLabel || (isFinal ? "Launch My LMS" : "Continue")}
        {!isFinal ? <span aria-hidden="true">→</span> : null}
      </button>
    </div>
  );
}
