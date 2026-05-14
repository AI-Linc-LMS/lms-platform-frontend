"use client";

import { useState } from "react";
import { WizardData } from "@/lib/setup/wizardData";
import { wizardService } from "@/lib/services/wizard.service";

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

const TEMPLATES: {
  value: NonNullable<WizardData["theme"]>["template"];
  label: string;
  desc: string;
}[] = [
  { value: "minimal", label: "Minimal", desc: "Clean, content-first." },
  { value: "academic", label: "Academic", desc: "Serif headlines, structured." },
  { value: "vibrant", label: "Vibrant", desc: "Bold gradients, energy." },
  { value: "corporate", label: "Corporate", desc: "Professional, restrained." },
];

export function ThemeStep({ data, onChange }: Props) {
  const theme = data.theme || {};
  const set = (patch: Partial<WizardData["theme"]>) =>
    onChange({ theme: { ...theme, ...patch } });
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Template</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set({ template: t.value })}
              className={`rounded-xl border p-4 text-left transition ${
                theme.template === t.value
                  ? "border-[var(--primary-500,#2356d6)] bg-[var(--primary-50,#eff6ff)]"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{t.label}</p>
              <p className="mt-1 text-xs text-gray-500">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Default mode</p>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {(["light", "dark"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set({ default_mode: mode })}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                (theme.default_mode || "light") === mode
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-600"
              }`}
            >
              {mode === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">
            Welcome message
          </span>
          <p className="text-xs text-gray-500">
            Shown on the login screen and learner dashboard.
          </p>
          <textarea
            rows={3}
            maxLength={200}
            placeholder="Welcome to Acme Learning. Build real skills with AI tutors."
            value={theme.welcome_message || ""}
            onChange={(e) => set({ welcome_message: e.target.value })}
            className="mt-1.5 block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--primary-500,#2356d6)] focus:ring-1 focus:ring-[var(--primary-500,#2356d6)]"
          />
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700">Hero image (optional)</p>
        <div className="mt-2 flex items-center gap-4">
          <div className="grid h-20 w-32 place-items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {theme.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={theme.hero_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400">No image</span>
            )}
          </div>
          <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
            {uploading ? "Uploading…" : theme.hero_image_url ? "Replace" : "Upload"}
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
      </div>
    </div>
  );
}
