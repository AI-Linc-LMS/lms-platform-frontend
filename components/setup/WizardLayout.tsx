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
    <div className="min-h-screen bg-[var(--bg-page,#f8fafc)] text-[var(--font-primary,#0f172a)]">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Setup wizard
            </p>
            <p className="text-sm text-gray-700">
              Step {step} of {TOTAL_WIZARD_STEPS} ·{" "}
              <span className="font-medium">{STEP_TITLES[step - 1]}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {saving ? <span>Saving…</span> : <span>Autosaved</span>}
            <span className="font-mono">{progress}%</span>
          </div>
        </div>
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary-500,#2356d6)] to-[var(--accent-blue,#00e0ff)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {description}
          </p>
        ) : null}
        <div className="mt-10">{children}</div>
      </main>
    </div>
  );
}
