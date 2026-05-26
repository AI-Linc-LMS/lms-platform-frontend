"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WizardData } from "@/lib/setup/wizardData";
import { wizardService } from "@/lib/services/wizard.service";

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
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

// Mirror of the 5 light-only presets in backend client_theming/presets.py.
// Colour values come from the backend preset definitions so the mini-mockup
// matches what the deployed LMS renders. If a backend preset changes, mirror here.
type PresetId = NonNullable<WizardData["theme"]>["preset_id"];

interface PresetMeta {
  id: NonNullable<PresetId>;
  label: string;
  tagline: string;
  /** Swatches used to paint the mini browser-mockup preview. */
  swatches: {
    nav: string;
    active: string;
    primary: string;
    surface: string;
    text: string;
    textMute: string;
  };
}

const PRESETS: PresetMeta[] = [
  {
    id: "default",
    label: "Default · Blue Slate",
    tagline: "Balanced blues — professional and calm.",
    swatches: {
      nav: "#d7eff6",
      active: "#12293a",
      primary: "#255c79",
      surface: "#ffffff",
      text: "#0f2b46",
      textMute: "#6c757d",
    },
  },
  {
    id: "azure_bolt",
    label: "Azure Bolt",
    tagline: "Deep navy rail and electric sky blue.",
    swatches: {
      nav: "#e0f2fe",
      active: "#164e63",
      primary: "#0ea5e9",
      surface: "#ffffff",
      text: "#0c4a6e",
      textMute: "#64748b",
    },
  },
  {
    id: "sakura_day",
    label: "Sakura Day",
    tagline: "Soft rose tint with clean bright surfaces.",
    swatches: {
      nav: "#fff7f8",
      active: "#fecdd3",
      primary: "#e11d48",
      surface: "#ffffff",
      text: "#7a1230",
      textMute: "#9f1239",
    },
  },
  {
    id: "sky_paper",
    label: "Sky Paper",
    tagline: "Bright sky blues on a paper-like base.",
    swatches: {
      nav: "#f8fcff",
      active: "#bae6fd",
      primary: "#0ea5e9",
      surface: "#ffffff",
      text: "#0c4a6e",
      textMute: "#64748b",
    },
  },
  {
    id: "mono_minimal",
    label: "Mono Minimal",
    tagline: "Neutral grayscale UI with subtle professional contrast.",
    swatches: {
      nav: "#f8fafc",
      active: "#cbd5e1",
      primary: "#64748b",
      surface: "#ffffff",
      text: "#0f172a",
      textMute: "#475569",
    },
  },
];

export function ThemeStep({ data, onChange }: Props) {
  const theme = data.theme || {};
  const set = (patch: Partial<WizardData["theme"]>) =>
    onChange({ theme: { ...theme, ...patch } });
  const [uploading, setUploading] = useState(false);
  // Default selection — first preset — set the first time the step renders.
  // Cleaner UX than "no theme picked" which then blocks Continue.
  const activePresetId: PresetId = theme.preset_id ?? "default";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <p className="aw-label">Starter theme</p>
        <p className="aw-help -mt-1 mb-3">
          Five light themes. Pick the closest match — you can fine-tune
          colours and per-section overrides post-launch in{" "}
          <span className="text-text">Settings → Branding</span>.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRESETS.map((preset) => {
            const active = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => set({ preset_id: preset.id })}
                className={`group relative overflow-hidden rounded-[14px] text-left transition-all hover:-translate-y-px ${
                  active ? "ring-2 ring-offset-2 ring-offset-transparent" : ""
                }`}
                style={{
                  border: active
                    ? "1px solid rgba(0, 224, 255, 0.55)"
                    : "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <PresetPreview preset={preset} />
                <div className="border-t border-themed p-3.5">
                  <p className="aw-text text-[13px] font-semibold">
                    {preset.label}
                  </p>
                  <p className="aw-text-mute mt-1 text-[11.5px] leading-relaxed">
                    {preset.tagline}
                  </p>
                </div>
                {active ? (
                  <span
                    aria-hidden
                    className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, #00e0ff 0%, #2356d6 100%)",
                      boxShadow: "0 0 0 3px rgba(0,224,255,0.15)",
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#05070f"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="aw-label" htmlFor="welcome-message">
          Welcome message
        </label>
        <p className="aw-help -mt-1 mb-2">
          Shown on the login screen and learner dashboard.
        </p>
        <textarea
          id="welcome-message"
          rows={3}
          maxLength={200}
          placeholder="Welcome to Acme Learning. Build real skills with AI tutors."
          value={theme.welcome_message || ""}
          onChange={(e) => set({ welcome_message: e.target.value })}
          className="aw-textarea"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <p className="aw-label">Hero image (optional)</p>
        <div className="mt-3 flex items-center gap-4">
          <div
            className="grid h-20 w-32 place-items-center overflow-hidden rounded-[14px]"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {theme.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={theme.hero_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="aw-mono aw-text-mute text-[11px] uppercase tracking-[0.22em]">
                No image
              </span>
            )}
          </div>
          <label className="aw-btn aw-btn-ghost cursor-pointer">
            {uploading
              ? "Uploading…"
              : theme.hero_image_url
                ? "Replace"
                : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploading(true);
                try {
                  const r = await wizardService.uploadAsset(f, "hero");
                  set({ hero_image_url: r.url });
                } catch {
                  /* ignore */
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Miniature browser-window mockup using the preset's actual swatches, so
 * users see what the LMS will roughly look like rather than abstract pills.
 * Tries to mimic the layout of the real platform: top nav bar with a logo
 * mark, sidebar with active + idle items, a main content area with a card
 * and primary CTA.
 */
function PresetPreview({ preset }: { preset: PresetMeta }) {
  const s = preset.swatches;
  const hairline = "rgba(0,0,0,0.05)";
  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden"
      style={{ background: s.surface }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: s.nav, borderBottom: `1px solid ${hairline}` }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="grid h-3 w-3 place-items-center rounded-[3px]"
            style={{ background: s.primary }}
          />
          <span
            className="block h-1.5 w-10 rounded"
            style={{ background: s.text, opacity: 0.7 }}
          />
        </div>
        <span
          className="block h-2 w-2 rounded-full"
          style={{ background: s.primary }}
        />
      </div>

      <div className="flex" style={{ height: "calc(100% - 22px)" }}>
        <div
          className="flex w-[22%] flex-col gap-1 px-1.5 py-2"
          style={{ background: s.nav, borderRight: `1px solid ${hairline}` }}
        >
          <div className="rounded-[3px] px-1.5 py-1" style={{ background: s.active }}>
            <span className="block h-1 w-full rounded" style={{ background: "#ffffff", opacity: 0.95 }} />
          </div>
          {[0.45, 0.35, 0.3, 0.4].map((opacity, i) => (
            <div key={i} className="px-1.5 py-1">
              <span className="block h-1 w-full rounded" style={{ background: s.text, opacity }} />
            </div>
          ))}
        </div>

        <div className="flex-1 p-2.5">
          <span className="block h-1.5 w-1/2 rounded" style={{ background: s.text, opacity: 0.85 }} />
          <span className="mt-1.5 block h-1 w-1/3 rounded" style={{ background: s.textMute, opacity: 0.7 }} />

          <div
            className="mt-2.5 rounded-[5px] p-2"
            style={{ background: "rgba(0,0,0,0.025)", border: `1px solid ${hairline}` }}
          >
            <span className="block h-1.5 w-2/3 rounded" style={{ background: s.text, opacity: 0.8 }} />
            <span className="mt-1.5 block h-1 w-full rounded" style={{ background: s.textMute, opacity: 0.55 }} />
            <span className="mt-1 block h-1 w-4/5 rounded" style={{ background: s.textMute, opacity: 0.55 }} />
            <div className="mt-2 inline-block rounded-[3px] px-2 py-1" style={{ background: s.primary }}>
              <span className="block h-1 w-7 rounded" style={{ background: "#ffffff", opacity: 0.95 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
