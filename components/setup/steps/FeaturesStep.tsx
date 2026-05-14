"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/services/api";
import { WizardData } from "@/lib/setup/wizardData";

interface Feature {
  id: number;
  name: string;
}

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  LMS: "Core learning management — courses, modules, lessons.",
  Assessment: "Quizzes, tests, and assignments.",
  "Live Class": "Real-time virtual classes with Zoom integration.",
  "Community Forum": "Learner-to-learner discussion threads.",
  "Mock Interview": "AI-driven mock interviews for prep.",
  Proctoring: "Browser-based proctoring for high-stakes exams.",
  "AI Tutor": "Per-lesson AI tutoring chat for learners.",
};

export function FeaturesStep({ data, onChange }: Props) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const selected = new Set<number>(
    data.features?.selected_feature_ids || []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<Feature[] | { features: Feature[] }>(
          "/accounts/features/"
        );
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.features || [];
        if (!cancelled) setFeatures(list);
      } catch {
        if (!cancelled) setFeatures([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({
      features: {
        ...(data.features || {}),
        selected_feature_ids: Array.from(next),
      },
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Pick the modules your tenants will see in the sidebar. You can change
        these anytime later in Settings.
      </p>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading available modules…
        </div>
      ) : features.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Couldn&apos;t load modules from the server. You can still launch and
          enable modules later from Settings.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((f) => {
            const isOn = selected.has(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggle(f.id)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  isOn
                    ? "border-[var(--primary-500,#2356d6)] bg-[var(--primary-50,#eff6ff)]"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div
                  className={`mt-0.5 grid h-5 w-5 place-items-center rounded border transition ${
                    isOn
                      ? "border-[var(--primary-500,#2356d6)] bg-[var(--primary-500,#2356d6)]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isOn ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {f.name}
                  </p>
                  {FEATURE_DESCRIPTIONS[f.name] ? (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {FEATURE_DESCRIPTIONS[f.name]}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-500">
        {selected.size} of {features.length} modules selected
      </p>
    </div>
  );
}
