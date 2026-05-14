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
  const selected = new Set<number>(data.features?.selected_feature_ids || []);

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
    <div className="space-y-7">
      <p className="aw-text-dim text-[14px] leading-[1.65]">
        Pick the modules your tenants will see in the sidebar. You can change
        these anytime later in Settings.
      </p>

      {loading ? (
        <div className="aw-card aw-card-thin">
          <p className="aw-mono aw-text-mute text-[11px] uppercase tracking-[0.22em]">
            Loading available modules…
          </p>
        </div>
      ) : features.length === 0 ? (
        <div
          className="rounded-[14px] p-4"
          style={{
            border: "1px solid rgba(255, 198, 109, 0.3)",
            background: "rgba(255, 198, 109, 0.06)",
          }}
        >
          <p className="aw-mono text-[10px] uppercase tracking-[0.3em] text-[#ffc66d]">
            Modules unavailable
          </p>
          <p className="aw-text-dim mt-2 text-[13px] leading-relaxed">
            Couldn&apos;t load modules from the server. You can still launch
            and enable modules later from Settings.
          </p>
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
                className={`aw-option flex items-start gap-3 text-left ${
                  isOn ? "aw-option-active" : ""
                }`}
              >
                <div
                  className="mt-0.5 grid h-5 w-5 place-items-center rounded transition"
                  style={{
                    border: isOn
                      ? "1px solid #00e0ff"
                      : "1px solid rgba(255,255,255,0.18)",
                    background: isOn
                      ? "linear-gradient(135deg, #00e0ff, #2356d6)"
                      : "transparent",
                  }}
                >
                  {isOn ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#05070f"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : null}
                </div>
                <div>
                  <p className="aw-text text-[14px] font-semibold">{f.name}</p>
                  {FEATURE_DESCRIPTIONS[f.name] ? (
                    <p className="aw-text-mute mt-1 text-[12px] leading-relaxed">
                      {FEATURE_DESCRIPTIONS[f.name]}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
        {selected.size} of {features.length} modules selected
      </p>
    </div>
  );
}
