"use client";

import { ReactNode } from "react";
import { STEP_TITLES, TOTAL_WIZARD_STEPS } from "@/lib/setup/wizardData";

interface WizardLayoutProps {
  step: number; // 1..8
  title: string;
  description?: string;
  children: ReactNode;
  saving?: boolean;
}

export function WizardLayout({
  step,
  title,
  description,
  children,
  saving,
}: WizardLayoutProps) {
  const progress = Math.round((step / TOTAL_WIZARD_STEPS) * 100);

  return (
    <>
      {/* Sticky header with progress bar */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          background: "rgba(5, 7, 15, 0.78)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-[clamp(20px,4vw,48px)] py-5">
          <div className="flex items-center gap-3">
            <span className="aw-kicker">Setup · {step.toString().padStart(2, "0")} / 0{TOTAL_WIZARD_STEPS}</span>
            <span className="aw-mono aw-text-dim hidden text-[11px] uppercase tracking-[0.22em] sm:inline">
              {STEP_TITLES[step - 1]}
            </span>
          </div>
          <div className="aw-mono flex items-center gap-3 text-[10px] uppercase tracking-[0.3em]">
            <span className={saving ? "text-[#00e0ff]" : "aw-text-mute"}>
              {saving ? "Saving…" : "Autosaved"}
            </span>
            <span className="aw-text-dim">{progress}%</span>
          </div>
        </div>
        <div className="aw-progress-track">
          <div className="aw-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Hero / step intro */}
      <section className="relative px-[clamp(20px,5vw,80px)] pt-[80px]">
        <div className="mx-auto max-w-[820px]">
          {/* Step segment bars (compact) */}
          <div className="mb-10 flex items-center gap-1.5">
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
          </div>

          <span className="aw-kicker mb-5">Step {step} · {STEP_TITLES[step - 1]}</span>
          <h1 className="aw-serif aw-text mt-4 text-[clamp(36px,5vw,64px)] leading-[1.04]">
            {title}
          </h1>
          {description ? (
            <p className="aw-text-dim mt-5 max-w-[640px] text-[15px] leading-[1.65]">
              {description}
            </p>
          ) : null}
        </div>
      </section>

      {/* Step content */}
      <main className="px-[clamp(20px,5vw,80px)] pb-24 pt-12">
        <div className="mx-auto max-w-[820px]">{children}</div>
      </main>
    </>
  );
}
