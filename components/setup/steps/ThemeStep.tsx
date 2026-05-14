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
        <p className="aw-label">Template</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TEMPLATES.map((t) => {
            const active = theme.template === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => set({ template: t.value })}
                className={`aw-option text-left ${active ? "aw-option-active" : ""}`}
              >
                <p className="aw-text text-[14px] font-semibold">{t.label}</p>
                <p className="aw-text-mute mt-1.5 text-[11px] leading-relaxed">
                  {t.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="aw-label">Default mode</p>
        <div
          className="inline-flex rounded-full p-1"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {(["light", "dark"] as const).map((mode) => {
            const active = (theme.default_mode || "light") === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => set({ default_mode: mode })}
                className="aw-mono px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.22em] transition-colors"
                style={{
                  color: active ? "#05070f" : "rgb(154,163,192)",
                  background: active
                    ? "linear-gradient(90deg, #2356d6 0%, #00e0ff 100%)"
                    : "transparent",
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      <div>
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
      </div>

      <div>
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
