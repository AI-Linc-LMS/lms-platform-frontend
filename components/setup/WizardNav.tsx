"use client";

import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative mt-16 pt-7"
      style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
    >
      {/* Aurora line on the top border */}
      <div
        className="aw-aurora"
        style={{ top: 0, animationDuration: "8s" }}
        aria-hidden
      />

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack || step <= 1}
          className="aw-btn aw-btn-ghost group"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            aria-hidden="true"
            className="transition-transform group-hover:-translate-x-0.5"
          >
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

        {/* Center: mini step indicator */}
        <div className="aw-mono hidden text-[10px] uppercase tracking-[0.32em] text-[rgba(255,255,255,0.2)] sm:block">
          {step.toString().padStart(2, "0")} ·· {TOTAL_WIZARD_STEPS.toString().padStart(2, "0")}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || nextLoading}
          className={`aw-btn aw-btn-primary group ${
            isFinal ? "aw-bracket" : ""
          }`}
        >
          {nextLoading ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
          ) : null}
          <span>{nextLabel || (isFinal ? "Launch My LMS" : "Continue")}</span>
          {!isFinal ? (
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M5 12l4 4L19 6"
                stroke="currentColor"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Below: keyboard hint */}
      <p
        className="aw-mono mt-5 text-center text-[10px] uppercase tracking-[0.32em] text-[rgba(255,255,255,0.16)]"
        aria-hidden
      >
        Press{" "}
        <span className="text-[rgba(255,255,255,0.3)]">⏎</span> to{" "}
        {isFinal ? "launch" : "continue"}
      </p>
    </motion.div>
  );
}
