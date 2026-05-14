"use client";

import { useState } from "react";
import { WizardData } from "@/lib/setup/wizardData";
import { wizardService } from "@/lib/services/wizard.service";

interface Props {
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
  onUploaded,
}: {
  label: string;
  hint?: string;
  kind: string;
  value?: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
      <div className="mt-2 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={label}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>
        <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
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
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        <input
          type="color"
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-gray-300 bg-white"
        />
        <input
          type="text"
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="block w-32 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase shadow-sm focus:border-[var(--primary-500,#2356d6)] focus:ring-1 focus:ring-[var(--primary-500,#2356d6)]"
        />
      </div>
    </label>
  );
}

export function BrandStep({ data, onChange }: Props) {
  const brand = data.brand || {};
  const set = (patch: Partial<WizardData["brand"]>) =>
    onChange({ brand: { ...brand, ...patch } });

  return (
    <div className="grid gap-8 md:grid-cols-[1.1fr,1fr]">
      <div className="space-y-6">
        <AssetField
          label="Light-mode logo"
          hint="Used on the main app shell. PNG or SVG, transparent background works best."
          kind="light_logo"
          value={brand.light_logo_url}
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
        <div className="grid grid-cols-2 gap-4">
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
      </div>

      <aside className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Live preview
        </p>
        <div
          className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          style={{
            borderTopColor: brand.primary_color || "#2356d6",
            borderTopWidth: 3,
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {brand.light_logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.light_logo_url}
                  alt=""
                  className="h-6 w-auto"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-700">
                  Logo
                </span>
              )}
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ background: brand.primary_color || "#2356d6" }}
            >
              Get started
            </span>
          </div>
          <div className="space-y-2 p-4">
            <div className="h-2 w-3/4 rounded bg-gray-100" />
            <div className="h-2 w-1/2 rounded bg-gray-100" />
            <div
              className="mt-3 inline-block rounded px-2 py-1 text-xs font-medium"
              style={{
                background: (brand.accent_color || "#00e0ff") + "20",
                color: brand.accent_color || "#00e0ff",
              }}
            >
              Accent badge
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
