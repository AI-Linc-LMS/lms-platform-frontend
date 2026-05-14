"use client";

import { motion } from "framer-motion";
import { WizardData } from "@/lib/setup/wizardData";
import { WizardState } from "@/lib/services/wizard.service";

interface Props {
  state: WizardState;
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function WelcomeStep({ state, data, onChange }: Props) {
  const welcome = data.welcome || {};
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="aw-card aw-card-hover">
        <span className="aw-card-top-line" aria-hidden />
        <p className="aw-kicker-sm">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "#00e0ff" }}
          />
          From your intake form
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <dt className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.22em]">
              Organisation
            </dt>
            <dd className="aw-text mt-1.5 text-[16px] font-medium">
              {state.organisation_name}
            </dd>
          </div>
          <div>
            <dt className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.22em]">
              Your URL
            </dt>
            <dd className="aw-mono mt-1.5 text-[15px] text-[#00e0ff]">
              {state.subdomain}.ailinc.com
            </dd>
          </div>
          {state.contact_email ? (
            <div className="col-span-2">
              <dt className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.22em]">
                Tenant admin
              </dt>
              <dd className="aw-text mt-1.5 text-[15px]">
                {state.contact_email}
              </dd>
            </div>
          ) : null}
        </dl>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-5">
        <div>
          <label className="aw-label" htmlFor="confirm-org-name">
            Confirm organisation name
          </label>
          <input
            id="confirm-org-name"
            type="text"
            value={welcome.confirmed_org_name ?? state.organisation_name}
            onChange={(e) =>
              onChange({
                welcome: { ...welcome, confirmed_org_name: e.target.value },
              })
            }
            className="aw-input"
          />
          <p className="aw-help">
            This is how your name will appear across the platform. You can
            tweak it later in Settings.
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="aw-tip">
        <p className="aw-kicker-sm">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Tip
        </p>
        <p className="aw-text-dim mt-2 text-[13px] leading-relaxed">
          You can revisit and change every choice from{" "}
          <span className="aw-text">Settings → Branding & Modules</span> after
          launch. Nothing is final until you ship.
        </p>
      </motion.div>
    </motion.div>
  );
}
