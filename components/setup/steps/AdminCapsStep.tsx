"use client";

import { WizardData } from "@/lib/setup/wizardData";

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

const TOGGLES: {
  key: keyof NonNullable<WizardData["admin_caps"]>;
  label: string;
  desc: string;
}[] = [
  {
    key: "bulk_import",
    label: "Bulk learner import",
    desc: "Allow admins to upload CSV files to add learners in bulk.",
  },
  {
    key: "ai_builder",
    label: "AI course builder",
    desc: "Generate course outlines and content with AI assistance.",
  },
  {
    key: "sub_admin_creation",
    label: "Sub-admins",
    desc: "Let primary admins create additional sub-admin accounts.",
  },
  {
    key: "api_access",
    label: "API access",
    desc: "Generate API keys for integrating with external systems.",
  },
];

export function AdminCapsStep({ data, onChange }: Props) {
  const caps = data.admin_caps || {};
  const set = (patch: Partial<WizardData["admin_caps"]>) =>
    onChange({ admin_caps: { ...caps, ...patch } });

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Choose what your tenant administrators can do. Enable just what your
        org needs — you can always change these later.
      </p>

      <div className="space-y-3">
        {TOGGLES.map((t) => {
          const on = Boolean(caps[t.key]);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => set({ [t.key]: !on })}
              className={`flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition ${
                on
                  ? "border-[var(--primary-500,#2356d6)] bg-[var(--primary-50,#eff6ff)]"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{t.desc}</p>
              </div>
              <div
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  on ? "bg-[var(--primary-500,#2356d6)]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                    on ? "left-5" : "left-0.5"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Analytics depth
        </p>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {(["basic", "advanced"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => set({ analytics_depth: d })}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                (caps.analytics_depth || "basic") === d
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600"
              }`}
            >
              {d === "basic" ? "Basic" : "Advanced"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Basic: progress, attempts, completion. Advanced adds funnels, cohort
          comparisons, and time-on-task.
        </p>
      </div>
    </div>
  );
}
