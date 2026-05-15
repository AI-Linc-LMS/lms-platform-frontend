"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WizardData } from "@/lib/setup/wizardData";
import { wizardService, type WizardState } from "@/lib/services/wizard.service";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
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

async function upload(file: File, kind: string): Promise<string | null> {
  try {
    const r = await wizardService.uploadAsset(file, kind);
    return r.url;
  } catch {
    return null;
  }
}

function AssetField({
  label,
  hint,
  kind,
  value,
  prefilled,
  onUploaded,
}: {
  label: string;
  hint?: string;
  kind: string;
  value?: string;
  /** True when the displayed value is the intake-form upload, not a user upload. */
  prefilled?: boolean;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="aw-label" style={{ marginBottom: 0 }}>
          {label}
        </p>
        {prefilled && value ? (
          <span
            className="aw-mono inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.22em]"
            style={{
              color: "#00e0ff",
              border: "1px solid rgba(0, 224, 255, 0.25)",
              background: "rgba(0, 224, 255, 0.05)",
            }}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            From application
          </span>
        ) : null}
      </div>
      {hint ? <p className="aw-help">{hint}</p> : null}
      <div className="mt-3 flex items-center gap-4">
        <div
          className="grid h-16 w-16 place-items-center overflow-hidden rounded-[14px]"
          style={{
            border: prefilled
              ? "1px solid rgba(0, 224, 255, 0.3)"
              : "1px solid rgba(255,255,255,0.08)",
            background: prefilled
              ? "rgba(0, 224, 255, 0.04)"
              : "rgba(255,255,255,0.02)",
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="aw-mono aw-text-mute text-[12px]">—</span>
          )}
        </div>
        <label className="aw-btn aw-btn-ghost cursor-pointer">
          {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              const url = await upload(f, kind);
              setBusy(false);
              if (url) onUploaded(url);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  fallback,
}: {
  label: string;
  value?: string;
  onChange: (hex: string) => void;
  fallback: string;
}) {
  const v = value || fallback;
  return (
    <div>
      <span className="aw-label">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="color"
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-[10px] bg-transparent"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <input
          type="text"
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="aw-input aw-mono"
          style={{ width: "9rem", textTransform: "uppercase" }}
        />
      </div>
    </div>
  );
}

export function BrandStep({ state, data, onChange }: Props) {
  const brand = data.brand || {};
  const set = (patch: Partial<WizardData["brand"]>) =>
    onChange({ brand: { ...brand, ...patch } });

  // Fall back to the logo the user uploaded during the intake form
  // (Client.app_logo_url, surfaced as state.logo_url) until they replace it.
  const lightLogoDisplay = brand.light_logo_url || state.logo_url || undefined;
  const lightLogoIsPrefilled =
    !brand.light_logo_url && Boolean(state.logo_url);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-8 md:grid-cols-[1.1fr,1fr]"
    >
      <motion.div variants={itemVariants} className="space-y-7">
        <AssetField
          label="Light-mode logo"
          hint="Used on the main app shell. PNG or SVG, transparent background works best."
          kind="light_logo"
          value={lightLogoDisplay}
          prefilled={lightLogoIsPrefilled}
          onUploaded={(url) => set({ light_logo_url: url })}
        />
        <AssetField
          label="Dark-mode logo"
          hint="Optional. Same as above but tuned for dark backgrounds."
          kind="dark_logo"
          value={brand.dark_logo_url}
          onUploaded={(url) => set({ dark_logo_url: url })}
        />
        <AssetField
          label="Favicon"
          hint="32×32 PNG or ICO. Shows in browser tabs."
          kind="favicon"
          value={brand.favicon_url}
          onUploaded={(url) => set({ favicon_url: url })}
        />
        <div className="grid grid-cols-2 gap-5">
          <ColorField
            label="Primary"
            value={brand.primary_color}
            onChange={(v) => set({ primary_color: v })}
            fallback="#2356d6"
          />
          <ColorField
            label="Accent"
            value={brand.accent_color}
            onChange={(v) => set({ accent_color: v })}
            fallback="#00e0ff"
          />
        </div>
      </motion.div>

      <motion.aside variants={itemVariants} className="aw-card aw-card-hover">
        <span className="aw-card-top-line" aria-hidden />
        <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
          Live preview
        </p>
        <div
          className="mt-5 overflow-hidden rounded-[14px]"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            className="h-[3px] w-full"
            style={{
              background: `linear-gradient(90deg, ${brand.primary_color || "#2356d6"}, ${brand.accent_color || "#00e0ff"})`,
            }}
          />
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              {lightLogoDisplay ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lightLogoDisplay}
                  alt=""
                  className="h-6 w-auto"
                />
              ) : (
                <span className="aw-text text-[13px] font-semibold">Logo</span>
              )}
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                background: brand.primary_color || "#2356d6",
                color: "#fff",
              }}
            >
              Get started
            </span>
          </div>
          <div className="space-y-2.5 p-4">
            <div className="h-2 w-3/4 rounded bg-white/[0.06]" />
            <div className="h-2 w-1/2 rounded bg-white/[0.06]" />
            <span
              className="mt-3 inline-block rounded px-2 py-1 text-[11px] font-semibold"
              style={{
                background: (brand.accent_color || "#00e0ff") + "26",
                color: brand.accent_color || "#00e0ff",
              }}
            >
              Accent badge
            </span>
          </div>
        </div>

        <p className="aw-help mt-5">
          Live preview updates as you type. Real preview after launch will
          inherit your template & welcome message too.
        </p>
      </motion.aside>
    </motion.div>
  );
}
