"use client";

import { ReactNode, useState } from "react";
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
  "30s",
  "2 min",
  "30s",
  "1 min",
  "1 min",
  "45s",
  "45s",
  "30s",
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
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <>
      {/* Background grid */}
      <div className="aw-grid-bg" aria-hidden />

      {/* Slim, single-row header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          background: "rgba(5, 7, 15, 0.72)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="aw-aurora" aria-hidden />
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-[clamp(20px,4vw,48px)] py-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: "#00e0ff",
                boxShadow: "0 0 8px rgba(0, 224, 255, 0.7)",
              }}
            />
            <span className="aw-mono text-[10px] uppercase tracking-[0.32em] text-[rgba(233,236,246,0.55)]">
              AI Linc
            </span>
            <span className="aw-mono text-[10px] uppercase tracking-[0.32em] text-[rgba(255,255,255,0.18)]">
              /
            </span>
            <span className="aw-mono text-[10px] uppercase tracking-[0.32em] text-[rgba(233,236,246,0.4)]">
              Setup
            </span>
          </div>

          <div className="aw-mono flex items-center gap-3 text-[10px] uppercase tracking-[0.3em]">
            <span
              className={
                saving
                  ? "aw-saving text-[#00e0ff]"
                  : "text-[rgba(233,236,246,0.4)]"
              }
            >
              {saving ? "Saving" : "Autosaved"}
            </span>
            <span className="text-[rgba(255,255,255,0.16)]">·</span>
            <span
              className="font-semibold"
              style={{
                background: "linear-gradient(90deg, #2356d6, #00e0ff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                letterSpacing: "0.2em",
              }}
            >
              {progress}%
            </span>
          </div>
        </div>
        <div
          className="aw-progress-track"
          style={{ height: "1px", background: "rgba(255,255,255,0.04)" }}
        >
          <div className="aw-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-[clamp(20px,5vw,80px)] pt-[clamp(64px,9vw,120px)]">
        {/* Serif step watermark — the visual anchor */}
        <span
          aria-hidden
          className="aw-watermark hidden lg:block"
          style={{
            right: "clamp(40px, 6vw, 120px)",
            top: "clamp(40px, 6vw, 80px)",
            fontSize: "clamp(220px, 26vw, 420px)",
          }}
        >
          {stepNumber}
        </span>

        <div className="relative mx-auto max-w-[820px]">
          {/* Step bars — primary step indicator */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3"
          >
            <div className="flex items-center gap-2">
              {Array.from({ length: TOTAL_WIZARD_STEPS }).map((_, i) => {
                const n = i + 1;
                const state =
                  n < step ? "done" : n === step ? "active" : "todo";
                const canJump = state === "done" && Boolean(onJumpToStep);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => canJump && onJumpToStep?.(n)}
                    onMouseEnter={() => setHoveredBar(n)}
                    onMouseLeave={() => setHoveredBar(null)}
                    disabled={!canJump && state !== "active"}
                    aria-label={`Step ${n} · ${STEP_TITLES[i]}`}
                    className={`aw-step-bar focus:outline-none ${
                      state === "done"
                        ? "aw-step-bar-done"
                        : state === "active"
                          ? "aw-step-bar-active"
                          : "aw-step-bar-todo"
                    }`}
                    style={{
                      cursor:
                        canJump || state === "active" ? "pointer" : "default",
                    }}
                  />
                );
              })}
            </div>
            {/* Label line below bars */}
            <div
              className="aw-mono mt-3 flex h-[14px] items-center text-[10px] uppercase tracking-[0.32em]"
              style={{ color: "rgba(233,236,246,0.4)" }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={`bar-label-${hoveredBar ?? step}`}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-3"
                >
                  <span
                    style={{
                      color:
                        hoveredBar && hoveredBar < step
                          ? "#00e0ff"
                          : hoveredBar === step || (!hoveredBar && step)
                            ? "rgba(233,236,246,0.7)"
                            : undefined,
                    }}
                  >
                    {(hoveredBar ?? step).toString().padStart(2, "0")}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.18)" }}>·</span>
                  <span>{STEP_TITLES[(hoveredBar ?? step) - 1]}</span>
                  {hoveredBar && hoveredBar < step ? (
                    <span style={{ color: "rgba(0,224,255,0.6)" }}>
                      · Click to revisit
                    </span>
                  ) : null}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`hero-${step}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12"
            >
              <p className="aw-mono text-[10px] uppercase tracking-[0.32em] text-[rgba(233,236,246,0.4)]">
                Step {stepNumber}{" "}
                <span className="text-[rgba(255,255,255,0.18)]">/</span>{" "}
                {totalNumber}
              </p>
              <h1 className="aw-serif aw-shimmer mt-3 text-[clamp(42px,6vw,80px)] leading-[0.98]">
                {title}
              </h1>
              {description ? (
                <p className="mt-6 max-w-[620px] text-[15px] leading-[1.7] text-[rgba(233,236,246,0.6)]">
                  {description}
                </p>
              ) : null}

              {/* Single thin meta line */}
              <div
                className="aw-mono mt-7 flex items-center gap-3 text-[10px] uppercase tracking-[0.32em]"
                style={{ color: "rgba(233,236,246,0.32)" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {STEP_HINTS[step - 1]}
                </span>
                <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
                <span>Changes save automatically</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Body */}
      <main className="relative px-[clamp(20px,5vw,80px)] pb-32 pt-14">
        <div className="mx-auto max-w-[820px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`body-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
