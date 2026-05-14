"use client";

import { WizardData } from "@/lib/setup/wizardData";

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

const OPTIONS: {
  value: NonNullable<WizardData["course_library"]>["choice"];
  label: string;
  desc: string;
}[] = [
  {
    value: "import",
    label: "Import from AI Linc catalogue",
    desc: "Start with curated courses from 425+ titles. You can customise or remove them later.",
  },
  {
    value: "build",
    label: "Build with AI",
    desc: "Use the embedded AI course builder to create courses from prompts and rubrics.",
  },
  {
    value: "skip",
    label: "Skip for now",
    desc: "Launch with an empty library. Add courses anytime from the admin dashboard.",
  },
];

export function CourseLibraryStep({ data, onChange }: Props) {
  const lib = data.course_library || {};
  return (
    <div className="space-y-5">
      <p className="aw-text-dim text-[14px] leading-[1.65]">
        Choose how to populate your course library. You can switch approaches
        or mix and match anytime.
      </p>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const on = lib.choice === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                onChange({
                  course_library: { ...lib, choice: opt.value },
                })
              }
              className={`aw-option flex w-full items-start gap-4 text-left ${
                on ? "aw-option-active" : ""
              }`}
            >
              <div
                className="mt-1 grid h-5 w-5 place-items-center rounded-full transition"
                style={{
                  border: on
                    ? "1px solid #00e0ff"
                    : "1px solid rgba(255,255,255,0.18)",
                  background: on
                    ? "linear-gradient(135deg, #00e0ff, #2356d6)"
                    : "transparent",
                }}
              >
                {on ? (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: "#05070f" }}
                  />
                ) : null}
              </div>
              <div>
                <p className="aw-text text-[14px] font-semibold">{opt.label}</p>
                <p className="aw-text-mute mt-1 text-[12px] leading-relaxed">
                  {opt.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
