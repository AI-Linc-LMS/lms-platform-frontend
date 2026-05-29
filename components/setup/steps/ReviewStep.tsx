"use client";

import { motion } from "framer-motion";
import { WizardData, STEP_TITLES } from "@/lib/setup/wizardData";
import { WizardState } from "@/lib/services/wizard.service";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

interface Props {
  state: WizardState;
  data: WizardData;
  onJumpToStep: (step: number) => void;
}

function Row({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-4"
      style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}
    >
      <div className="flex-1">
        <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
          {label}
        </p>
        <div className="aw-text mt-2 text-[14px] leading-[1.6]">
          {value || "—"}
        </div>
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="aw-mono text-[10px] uppercase tracking-[0.3em] text-[#00e0ff] transition-colors hover:text-white"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

export function ReviewStep({ state, data, onJumpToStep }: Props) {
  const featureCount = data.features?.selected_feature_ids?.length || 0;
  const importedCount = data.course_library?.selected_course_ids?.length || 0;
  // Pretty preset names mirror the wizard tiles in ThemeStep.tsx.
  const PRESET_LABEL: Record<string, string> = {
    default: "Default · Blue Slate",
    azure_bolt: "Azure Bolt",
    sakura_day: "Sakura Day",
    sky_paper: "Sky Paper",
    mono_minimal: "Mono Minimal",
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-7"
    >
      <motion.p
        variants={itemVariants}
        className="aw-text-dim text-[14px] leading-[1.65]"
      >
        Double-check everything below, then click{" "}
        <span className="aw-text font-semibold">Launch My LMS</span> to go live.
        You can change every choice from Settings afterwards.
      </motion.p>

      <motion.div variants={itemVariants} className="aw-card aw-card-hover">
        <span className="aw-card-top-line" aria-hidden />
        <div className="-my-1">
          <Row
            label={STEP_TITLES[0]}
            value={data.welcome?.confirmed_org_name || state.organisation_name}
            onEdit={() => onJumpToStep(1)}
          />
          <Row
            label={STEP_TITLES[1]}
            value={
              <div className="flex items-center gap-3">
                {data.brand?.light_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.brand.light_logo_url}
                    alt=""
                    className="h-6 w-auto"
                  />
                ) : null}
                <span className="aw-mono aw-text-mute text-[12px]">
                  Logo + favicon
                </span>
              </div>
            }
            onEdit={() => onJumpToStep(2)}
          />
          <Row
            label={STEP_TITLES[2]}
            value={
              <span className="aw-mono text-[13px]">
                {state.subdomain}.ailinc.com
                {data.url?.custom_domain ? ` · ${data.url.custom_domain}` : ""}
              </span>
            }
            onEdit={() => onJumpToStep(3)}
          />
          <Row
            label={STEP_TITLES[3]}
            value={
              <>
                <span>
                  {PRESET_LABEL[data.theme?.preset_id || ""] ||
                    "Default · Blue Slate"}
                </span>
                {data.theme?.welcome_message ? (
                  <p className="aw-text-mute mt-1.5 text-[12px] leading-relaxed">
                    “{data.theme.welcome_message}”
                  </p>
                ) : null}
              </>
            }
            onEdit={() => onJumpToStep(4)}
          />
          <Row
            label={STEP_TITLES[4]}
            value={`${featureCount} module${featureCount === 1 ? "" : "s"} enabled`}
            onEdit={() => onJumpToStep(5)}
          />
          <Row
            label={STEP_TITLES[5]}
            value={
              <>
                {data.course_library?.choice === "import" ? (
                  <>
                    <span>Import from AI Linc catalogue</span>
                    {importedCount > 0 ? (
                      <span className="aw-text-mute">
                        {" "}
                        · {importedCount} course
                        {importedCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </>
                ) : data.course_library?.choice === "skip" ? (
                  "Skip for now"
                ) : (
                  "—"
                )}
              </>
            }
            onEdit={() => onJumpToStep(6)}
          />
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="rounded-[14px] p-4"
        style={{
          border: "1px solid rgba(255, 198, 109, 0.3)",
          background: "rgba(255, 198, 109, 0.05)",
        }}
      >
        <p className="aw-mono text-[10px] uppercase tracking-[0.3em] text-[#ffc66d]">
          Heads up
        </p>
        <p className="aw-text-dim mt-2 text-[13px] leading-relaxed">
          Once launched, your tenant moves to{" "}
          <span className="aw-text font-semibold">live</span> and learners can
          sign in via{" "}
          <code className="aw-mono rounded bg-white/[0.06] px-1.5 py-0.5 text-[12px] text-[#ffc66d]">
            {state.subdomain}.ailinc.com
          </code>
          . You can edit branding, modules, and team anytime from Settings.
        </p>
      </motion.div>
    </motion.div>
  );
}
