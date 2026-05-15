"use client";

import { motion } from "framer-motion";
import { WizardData } from "@/lib/setup/wizardData";
import { WizardState } from "@/lib/services/wizard.service";

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

interface Props {
  state: WizardState;
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

export function UrlStep({ state, data, onChange }: Props) {
  const url = data.url || {};
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="aw-card aw-card-hover">
        <span className="aw-card-top-line" aria-hidden />
        <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
          Your AI Linc subdomain
        </p>
        <p
          className="aw-mono mt-4 text-[clamp(20px,3vw,28px)]"
          style={{
            background: "linear-gradient(90deg, #2356d6 0%, #00e0ff 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {state.subdomain}.ailinc.com
        </p>
        <p className="aw-text-dim mt-3 text-[13px] leading-[1.65]">
          Assigned by your AI Linc super-admin. This URL is permanent.
        </p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-7"
        style={{
          border: "1px dashed rgba(255, 255, 255, 0.12)",
          background: "rgba(255, 255, 255, 0.015)",
        }}
      >
        <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
          Bring your own domain (optional)
        </p>
        <p className="aw-text-dim mt-3 text-[14px] leading-[1.65]">
          Point a domain you own at AI Linc. You can do this now or anytime
          later from Settings → Domain.
        </p>
        <div className="mt-5">
          <label className="aw-label" htmlFor="custom-domain">
            Custom domain
          </label>
          <input
            id="custom-domain"
            type="text"
            placeholder="learn.your-org.com"
            value={url.custom_domain || ""}
            onChange={(e) =>
              onChange({
                url: { ...url, custom_domain: e.target.value.trim() },
              })
            }
            className="aw-input"
          />
        </div>
        {url.custom_domain ? (
          <div
            className="mt-5 rounded-[14px] p-4"
            style={{
              border: "1px solid rgba(0, 224, 255, 0.18)",
              background: "rgba(0, 224, 255, 0.04)",
            }}
          >
            <p className="aw-mono text-[10px] uppercase tracking-[0.3em] text-[#00e0ff]">
              DNS instructions
            </p>
            <p className="aw-text-dim mt-2 text-[12px] leading-relaxed">
              Add a CNAME record pointing{" "}
              <code className="aw-mono rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-[rgb(var(--aw-fg))]">
                {url.custom_domain}
              </code>{" "}
              →{" "}
              <code className="aw-mono rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-[rgb(var(--aw-fg))]">
                tenants.ailinc.com
              </code>
              . We&apos;ll auto-provision an SSL certificate once DNS resolves.
            </p>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
