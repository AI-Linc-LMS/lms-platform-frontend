"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STEP_TITLES, TOTAL_WIZARD_STEPS } from "@/lib/setup/wizardData";

interface WizardLayoutProps {
  step: number; // 1..8
  title: string;
  description?: string;
  children: ReactNode;
  saving?: boolean;
  onJumpToStep?: (s: number) => void;
}

const STEP_HINTS = [
  "~30s",
  "~2m",
  "~30s",
  "~1m",
  "~1m",
  "~45s",
  "~45s",
  "~30s",
];

export function WizardLayout({
  step,
  title,
  description,
  children,
  saving,
  onJumpToStep,
}: WizardLayoutProps) {
  const progress = Math.round((step / TOTAL_WIZARD_STEPS) * 100);
  const stepNumber = step.toString().padStart(2, "0");
  const totalNumber = TOTAL_WIZARD_STEPS.toString().padStart(2, "0");

  // Marquee phrases — repeated twice for seamless loop
  const marqueePhrases = [
    "AI LINC · TENANT PROVISIONING",
    "LAUNCH SEQUENCE INITIATED",
    `STEP ${stepNumber} / ${totalNumber} · ${STEP_TITLES[step - 1].toUpperCase()}`,
    "BUILDING YOUR LMS",
    "EST. TOTAL TIME · 8 MINUTES",
  ];

  return (
    <>
      {/* Decorative grid backdrop */}
      <div className="aw-grid-bg" aria-hidden />

      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          background: "rgba(5, 7, 15, 0.78)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div className="aw-aurora" aria-hidden />
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-[clamp(20px,4vw,48px)] py-5">
          <div className="flex items-center gap-3">
            <span className="aw-kicker">
              <span className="aw-pulse-dot" aria-hidden />
              <span className="ml-2">AI LINC · SETUP</span>
            </span>
            <span className="aw-mono aw-text-dim hidden text-[11px] uppercase tracking-[0.22em] sm:inline">
              {stepNumber} / {totalNumber} · {STEP_TITLES[step - 1]}
            </span>
          </div>
          <div className="aw-mono flex items-center gap-3 text-[10px] uppercase tracking-[0.3em]">
            <span
              className={
                saving ? "aw-saving text-[#00e0ff]" : "aw-text-mute"
              }
            >
              {saving ? "Saving…" : "Autosaved"}
            </span>
            <span
              className="aw-text"
              style={{
                background: "linear-gradient(90deg, #2356d6, #00e0ff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {progress}%
            </span>
          </div>
        </div>
        <div className="aw-progress-track">
          <div
            className="aw-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step shortcuts row */}
        <div className="mx-auto max-w-[1180px] overflow-x-auto px-[clamp(20px,4vw,48px)] py-3 hide-scrollbar">
          <div className="flex items-center gap-1.5">
            {STEP_TITLES.map((label, i) => {
              const n = i + 1;
              const state =
                n < step ? "done" : n === step ? "active" : "todo";
              const canJump = state === "done" && Boolean(onJumpToStep);
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!canJump && state !== "active"}
                  onClick={() => canJump && onJumpToStep?.(n)}
                  className={`aw-shortcut ${
                    state === "done"
                      ? "aw-shortcut-done"
                      : state === "active"
                        ? "aw-shortcut-active"
                        : "aw-shortcut-todo"
                  }`}
                >
                  <span>{n.toString().padStart(2, "0")}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Marquee strip */}
      <div
        className="aw-marquee py-3"
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
          background: "rgba(0, 224, 255, 0.015)",
        }}
      >
        <div className="aw-marquee-track aw-mono text-[10px] uppercase tracking-[0.32em] text-[rgba(0,224,255,0.5)]">
          {[...marqueePhrases, ...marqueePhrases].map((phrase, i) => (
            <span key={i} className="inline-flex items-center px-8">
              <span>{phrase}</span>
              <span className="ml-8 text-[rgba(255,255,255,0.18)]">●</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero / step intro */}
      <section className="relative overflow-hidden px-[clamp(20px,5vw,80px)] pt-[80px]">
        {/* Massive serif step watermark on the right */}
        <span
          aria-hidden
          className="aw-watermark hidden lg:block"
          style={{ right: "clamp(-40px, -2vw, 40px)", top: "20px" }}
        >
          {stepNumber}
        </span>

        <div className="relative mx-auto max-w-[820px]">
          {/* Step segment bars */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 flex items-center gap-1.5"
          >
            {Array.from({ length: TOTAL_WIZARD_STEPS }).map((_, i) => {
              const n = i + 1;
              const state =
                n < step ? "done" : n === step ? "active" : "todo";
              return (
                <div
                  key={n}
                  className={`aw-step-bar ${
                    state === "done"
                      ? "aw-step-bar-done"
                      : state === "active"
                        ? "aw-step-bar-active"
                        : "aw-step-bar-todo"
                  }`}
                  title={STEP_TITLES[i]}
                />
              );
            })}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`hero-${step}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="aw-bracket inline-block">
                <span className="aw-kicker">
                  Step {step} · {STEP_TITLES[step - 1]}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <h1 className="aw-serif aw-shimmer mt-4 text-[clamp(36px,5.5vw,68px)] leading-[1.02]">
                  {title}
                </h1>
              </div>
              {description ? (
                <p className="aw-text-dim mt-5 max-w-[640px] text-[15px] leading-[1.65]">
                  {description}
                </p>
              ) : null}

              {/* Meta row */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="aw-kicker-sm">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Est. {STEP_HINTS[step - 1]}
                </span>
                <span className="aw-kicker-sm">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: "#00e0ff" }}
                  />
                  Autosaved
                </span>
                <span className="aw-kicker-sm">
                  <span className="aw-text">
                    {stepNumber}
                  </span>
                  <span className="aw-text-mute">/ {totalNumber}</span>
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Step content */}
      <main className="relative px-[clamp(20px,5vw,80px)] pb-32 pt-12">
        <div className="mx-auto max-w-[820px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`body-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.5,
                delay: 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom corner brand mark */}
      <div
        className="aw-mono pointer-events-none fixed bottom-5 left-5 z-20 text-[10px] uppercase tracking-[0.32em] text-[rgba(255,255,255,0.18)]"
        aria-hidden
      >
        AI LINC ·· LAUNCH SEQUENCE
      </div>
    </>
  );
}
