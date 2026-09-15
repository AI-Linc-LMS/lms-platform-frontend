"use client";

import { motion } from "framer-motion";
import { WizardData } from "@/lib/setup/wizardData";

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: i * 0.08,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

type Choice = NonNullable<WizardData["course_library"]>["choice"];

// "Import from AI Linc catalogue" is gone, along with the catalogue browser it opened. Launch
// copied each picked course in as a CLASSIC course, and the Features step can no longer switch on
// `course`, the key that shows classic courses: every copy landed in a tenant with no screen that
// lists it. SetupWizard also strips an "import" already saved in a draft.
const OPTIONS: {
  value: NonNullable<Choice>;
  label: string;
  desc: string;
}[] = [
  {
    value: "skip",
    label: "Skip for now",
    desc: "Launch with an empty library. Build courses anytime from Admin → Course Builder.",
  },
];

export function CourseLibraryStep({ data, onChange }: Props) {
  const lib = data.course_library || {};

  const setChoice = (choice: NonNullable<Choice>) =>
    onChange({ course_library: { ...lib, choice } });

  return (
    <div className="space-y-6">
      <p className="aw-text-dim text-[14px] leading-[1.65]">
        Your LMS launches with an empty course library. Importing ready-made
        courses from the AI Linc catalogue is unavailable while the catalogue
        moves to the new course format.
      </p>

      <div className="space-y-3">
        {OPTIONS.map((opt, i) => {
          const on = lib.choice === opt.value;
          return (
            <motion.button
              key={opt.value}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              type="button"
              onClick={() => setChoice(opt.value)}
              className={`aw-option flex w-full items-start gap-4 text-left transition-all ${
                on ? "aw-option-active" : ""
              }`}
            >
              <div
                className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full transition"
                style={{
                  border: on
                    ? "1px solid #00e0ff"
                    : "1px solid rgb(var(--aw-line) / var(--aw-line-2-alpha))",
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
              <div className="min-w-0 flex-1">
                <p className="aw-text text-[14px] font-semibold">{opt.label}</p>
                <p className="aw-text-mute mt-1.5 text-[12.5px] leading-relaxed">
                  {opt.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
