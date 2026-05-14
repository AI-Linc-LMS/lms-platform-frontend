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
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
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
              className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                on
                  ? "border-[var(--primary-500,#2356d6)] bg-[var(--primary-50,#eff6ff)]"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div
                className={`mt-1 grid h-5 w-5 place-items-center rounded-full border ${
                  on
                    ? "border-[var(--primary-500,#2356d6)] bg-[var(--primary-500,#2356d6)]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {on ? (
                  <span className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {opt.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
