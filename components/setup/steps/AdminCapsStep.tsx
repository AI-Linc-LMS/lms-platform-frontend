"use client";

import { motion } from "framer-motion";
import { WizardData } from "@/lib/setup/wizardData";

const cardVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.06,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

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
    <div className="space-y-7">
      <p className="aw-text-dim text-[14px] leading-[1.65]">
        Choose what your tenant administrators can do. Enable just what your
        org needs — you can always change these later.
      </p>

      <div className="space-y-3">
        {TOGGLES.map((t, i) => {
          const on = Boolean(caps[t.key]);
          return (
            <motion.button
              key={t.key}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              type="button"
              onClick={() => set({ [t.key]: !on })}
              className={`aw-option aw-card-hover flex w-full items-start justify-between gap-4 text-left ${
                on ? "aw-option-active" : ""
              }`}
            >
              <div className="flex-1">
                <p className="aw-text text-[14px] font-semibold">{t.label}</p>
                <p className="aw-text-mute mt-1 text-[12px] leading-relaxed">
                  {t.desc}
                </p>
              </div>
              <div
                className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                style={{
                  background: on
                    ? "linear-gradient(90deg, #2356d6, #00e0ff)"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
                  style={{
                    left: on ? "1.25rem" : "0.125rem",
                    background: on ? "#05070f" : "rgba(255,255,255,0.7)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                  }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="aw-card aw-card-thin">
        <p className="aw-label mb-3">Analytics depth</p>
        <div
          className="inline-flex rounded-full p-1"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {(["basic", "advanced"] as const).map((d) => {
            const active = (caps.analytics_depth || "basic") === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => set({ analytics_depth: d })}
                className="aw-mono px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.22em] transition-colors"
                style={{
                  color: active ? "#05070f" : "rgb(154,163,192)",
                  background: active
                    ? "linear-gradient(90deg, #2356d6 0%, #00e0ff 100%)"
                    : "transparent",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
        <p className="aw-text-mute mt-3 text-[12px] leading-relaxed">
          Basic: progress, attempts, completion. Advanced adds funnels, cohort
          comparisons, and time-on-task.
        </p>
      </div>
    </div>
  );
}
