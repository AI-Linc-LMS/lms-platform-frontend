"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WizardData } from "@/lib/setup/wizardData";
import {
  wizardService,
  validateWizardAsset,
  extractWizardUploadError,
  WIZARD_IMAGE_ACCEPT,
} from "@/lib/services/wizard.service";

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
    tagline: "Balanced blues - professional and calm.",
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const theme = data.theme || {};
  const set = (patch: Partial<WizardData["theme"]>) =>
    onChange({ theme: { ...theme, ...patch } });
  const [uploading, setUploading] = useState(false);
  // Default selection - first preset - set the first time the step renders.
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
          Five light themes. Pick the closest match - you can fine-tune
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
        <WelcomeMessageCard
          value={theme.welcome_message || ""}
          onChange={(v) => set({ welcome_message: v })}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <HeroImageCard
          value={theme.hero_image_url}
          orgName={data.welcome?.confirmed_org_name || "Your organisation"}
          logoUrl={data.brand?.light_logo_url}
          uploading={uploading}
          uploadError={uploadError}
          onClear={() => set({ hero_image_url: undefined })}
          onPick={async (file) => {
            setUploadError(null);
            const validationError = validateWizardAsset(file, "image");
            if (validationError) {
              setUploadError(validationError);
              return;
            }
            setUploading(true);
            try {
              const r = await wizardService.uploadAsset(file, "hero");
              set({ hero_image_url: r.url });
            } catch (err) {
              setUploadError(extractWizardUploadError(err));
            } finally {
              setUploading(false);
            }
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────── Welcome message card ────────────────────────

const WELCOME_MAX = 200;

function WelcomeMessageCard({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const remaining = WELCOME_MAX - value.length;
  const filled = value.trim().length > 0;
  return (
    <section
      className="relative overflow-hidden rounded-[20px] p-6"
      style={{
        border: "1px solid rgb(var(--aw-line) / var(--aw-line-2-alpha))",
        // Theme-aware: bg-0 → bg-2 stops adapt automatically between light
        // and dark. Hardcoded `#ffffff` was making the card look stuck in
        // light mode on a dark canvas.
        background:
          "linear-gradient(135deg, rgb(var(--aw-bg-0)) 0%, rgb(var(--aw-bg-2)) 100%)",
        boxShadow:
          "0 1px 2px -1px rgba(11, 18, 38, 0.16), 0 8px 22px -14px rgba(11, 18, 38, 0.22)",
      }}
    >
      {/* Soft backdrop bubble in the top-right - matches the watermark vibe
          from the features cards without distracting from the textarea. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 z-0 h-44 w-44 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px]"
              style={{
                background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
                boxShadow: "0 6px 18px -8px #0ea5e9",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="aw-text text-[16px] font-bold tracking-tight">
                  Welcome message
                </h4>
                <OptionalPill />
              </div>
              <p className="aw-text-dim mt-1 text-[13px] leading-[1.55]">
                Shown on the login screen and the learner dashboard. One or two
                lines that explain who you are.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <textarea
            id="welcome-message"
            rows={3}
            maxLength={WELCOME_MAX}
            placeholder="Welcome to Acme Learning. Build real skills with AI tutors."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="aw-textarea w-full"
            style={{
              // Inputs use a slightly raised surface (bg-1) for separation
              // from the card; works in both themes since the token flips.
              background: "rgb(var(--aw-bg-1))",
              border: "1px solid rgb(var(--aw-line) / var(--aw-line-2-alpha))",
              borderRadius: 12,
              padding: "12px 14px",
              fontFamily: "inherit",
              fontSize: 14,
              lineHeight: 1.55,
              fontWeight: 500,
              color: "rgb(var(--aw-fg))",
              resize: "vertical",
              minHeight: 96,
            }}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="aw-text-dim text-[12px] font-medium">
              {filled
                ? "Looks good. You can tweak this from Settings → Branding later."
                : "Skip to use the AI Linc default."}
            </p>
            <span
              className="aw-mono text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{
                color:
                  remaining < 20
                    ? "#b45309"
                    : "rgb(var(--aw-fg-dim))",
              }}
            >
              {value.length} / {WELCOME_MAX}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────── Hero image card ────────────────────────

/**
 * Mirrors the platform's admin Branding section layout (BrandingSectionCard
 * + LoginHeroPreview): a header strip + a live mini-replica of the sign-in
 * screen + an asset control row underneath. The wizard version drops the
 * URL input (it uploads, doesn't accept hosted URLs) and uses the wizard's
 * own surface palette instead of MUI.
 */
function HeroImageCard({
  value,
  orgName,
  logoUrl,
  uploading,
  uploadError,
  onPick,
  onClear,
}: {
  value: string | undefined;
  orgName: string;
  logoUrl?: string;
  uploading: boolean;
  uploadError: string | null;
  onPick: (file: File) => Promise<void> | void;
  onClear: () => void;
}) {
  const hasImage = Boolean(value);
  return (
    <section
      className="overflow-hidden rounded-[20px]"
      style={{
        border: "1px solid rgb(var(--aw-line) / var(--aw-line-2-alpha))",
        // Theme-aware surface - flips between light + dark with the wizard.
        background: "rgb(var(--aw-bg-0))",
        boxShadow:
          "0 1px 2px -1px rgba(11, 18, 38, 0.18), 0 8px 22px -14px rgba(11, 18, 38, 0.22)",
      }}
    >
      {/* Header bar - same shape as BrandingSectionCard header */}
      <header
        className="flex items-center gap-3.5 border-b px-5 py-3.5"
        style={{
          borderColor: "rgb(var(--aw-line) / var(--aw-line-alpha))",
          // Azure-tinted top edge that fades into the card surface in both
          // themes (the `rgb(--aw-bg-0)` stop is white in light, near-black
          // in dark).
          background:
            "linear-gradient(180deg, rgba(14, 165, 233, 0.055) 0%, rgb(var(--aw-bg-0)) 100%)",
        }}
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px]"
          style={{
            background: "rgba(14, 165, 233, 0.12)",
            color: "#0284c7",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="aw-text text-[16px] font-bold leading-tight tracking-tight">
              Brand identity
            </h4>
            <OptionalPill />
          </div>
          <p className="aw-text-dim mt-0.5 text-[13px] leading-[1.45]">
            The sign-in hero image - shown next to the login form.
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="space-y-4 p-5">
        <LoginHeroMock
          imageUrl={value}
          orgName={orgName}
          logoUrl={logoUrl}
        />

        {/* Control row - label + status + actions */}
        <div className="rounded-[14px] border p-4"
          style={{
            borderColor: "rgb(var(--aw-line) / var(--aw-line-alpha))",
            background: "rgb(var(--aw-bg-2))",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: hasImage ? "#16a34a" : "rgb(var(--aw-line) / 0.32)",
                    boxShadow: hasImage
                      ? "0 0 0 3px rgba(22, 163, 74, 0.18)"
                      : "none",
                  }}
                />
                <p className="aw-text text-[13px] font-bold">
                  Login hero image
                </p>
                <span
                  className="aw-mono text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{
                    color: hasImage ? "#16a34a" : "rgb(var(--aw-fg-mute))",
                  }}
                >
                  {hasImage ? "Set" : "Not set"}
                </span>
              </div>
              <p className="aw-text-dim mt-1 text-[12.5px] leading-[1.55]">
                Background image on the right-hand panel of the sign-in
                screen. PNG, JPG, SVG, or WebP up to 4 MB - wide aspect like
                1600 × 900 works best.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <UploadPill
                hasImage={hasImage}
                uploading={uploading}
                onPick={onPick}
              />
              {hasImage && !uploading ? (
                <button
                  type="button"
                  onClick={onClear}
                  aria-label="Remove hero image"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors"
                  style={{
                    color: "rgb(var(--aw-fg-dim))",
                    background: "transparent",
                    border: "1px solid rgb(var(--aw-line) / 0.22)",
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {uploadError ? (
          <p
            role="alert"
            className="rounded-[10px] px-3 py-2 text-[13px] font-semibold"
            style={{
              color: "#991b1b",
              background: "rgba(220, 38, 38, 0.06)",
              border: "1px solid rgba(220, 38, 38, 0.18)",
            }}
          >
            {uploadError}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Mini replica of the actual sign-in screen, mirroring LoginHeroPreview from
 * the admin Branding page. Left half: the login form mockup (white panel
 * with field skeletons + sign-in button). Right half: the hero image set as
 * background, with the brand name + slogan overlaid. Empty state shows a
 * dashed placeholder where the image would go so the layout intent is clear.
 */
function LoginHeroMock({
  imageUrl,
  orgName,
  logoUrl,
}: {
  imageUrl?: string;
  orgName: string;
  logoUrl?: string;
}) {
  const hasImage = Boolean(imageUrl);
  // Colors inside the mock are locked to fixed light-theme values: the mock
  // represents the actual product sign-in screen, which is always a light
  // surface regardless of which mode the wizard renders in. Using
  // `var(--aw-fg)` etc. here would flip text to near-white in dark mode
  // and disappear against the white mock card.
  const mockInk = "#0b1226";
  const mockInkDim = "#475569";
  const mockLine = "rgba(11, 18, 38, 0.12)";
  const mockSurface = "#ffffff";
  const mockField = "rgba(11, 18, 38, 0.05)";
  const mockMutedBg = "#f1f5f9"; // bg-2 in light mode, hardcoded for dark
  return (
    <div
      className="relative overflow-hidden rounded-[14px]"
      style={{
        border: "1px solid rgb(var(--aw-line) / var(--aw-line-alpha))",
        background: mockMutedBg,
        height: 280,
        boxShadow:
          "0 1px 2px -1px rgba(11, 18, 38, 0.05), 0 12px 28px -16px rgba(11, 18, 38, 0.18)",
      }}
    >
      <div className="grid h-full grid-cols-2">
        {/* Left half - login form mockup */}
        <div className="relative flex items-center justify-center px-6 py-6">
          <div
            className="w-full max-w-[220px] rounded-[10px] p-4"
            style={{
              border: `1px solid ${mockLine}`,
              background: mockSurface,
              boxShadow:
                "0 1px 2px -1px rgba(11, 18, 38, 0.05), 0 10px 24px -14px rgba(11, 18, 38, 0.18)",
            }}
          >
            <p
              className="text-[13px] font-bold tracking-tight"
              style={{ color: mockInk }}
            >
              Sign in
            </p>
            <div className="mt-3 space-y-2">
              <div
                className="h-7 w-full rounded-md"
                style={{
                  background: mockField,
                  border: `1px solid ${mockLine}`,
                }}
              />
              <div
                className="h-7 w-full rounded-md"
                style={{
                  background: mockField,
                  border: `1px solid ${mockLine}`,
                }}
              />
              <div
                className="h-7 w-full rounded-md"
                style={{
                  background: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
                  boxShadow: "0 6px 18px -8px #0ea5e9",
                }}
              />
            </div>
          </div>
        </div>

        {/* Right half - hero image area. Empty state is signalled with a
            dashed inset border on the neutral surface; the brand overlay
            (logo + org name + slogan) stays present in both states because
            that's how the real sign-in screen always renders. */}
        <div className="relative overflow-hidden">
          {hasImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(11, 18, 38, 0.15) 0%, rgba(11, 18, 38, 0.45) 100%)",
                }}
              />
            </>
          ) : (
            <div
              aria-hidden
              className="absolute inset-3 rounded-[10px]"
              style={{
                border: `1.5px dashed ${mockLine}`,
                background: "rgba(11, 18, 38, 0.025)",
              }}
            />
          )}

          {/* Brand overlay - content is the same in both states; colors are
              locked to the mock palette (not wizard theme tokens) so it
              stays readable in dark mode. */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 px-5 text-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="max-h-9 max-w-[60%] object-contain"
                style={{
                  filter: hasImage
                    ? "drop-shadow(0 2px 8px rgba(0,0,0,0.4))"
                    : "none",
                }}
              />
            ) : (
              <span
                className="grid h-9 w-9 place-items-center rounded-[10px] text-[12px] font-bold"
                style={{
                  background: hasImage ? "rgba(255, 255, 255, 0.95)" : mockSurface,
                  color: "#0ea5e9",
                  boxShadow: hasImage
                    ? "0 6px 18px -6px rgba(0, 0, 0, 0.4)"
                    : "0 2px 6px -2px rgba(11, 18, 38, 0.1)",
                }}
              >
                {initials(orgName)}
              </span>
            )}
            <p
              className="max-w-full truncate text-[13px] font-bold tracking-tight"
              style={{
                color: hasImage ? "#ffffff" : mockInk,
                textShadow: hasImage ? "0 2px 6px rgba(0,0,0,0.5)" : "none",
              }}
            >
              {orgName}
            </p>
            <p
              className="max-w-full text-[10.5px] font-semibold leading-snug tracking-tight"
              style={{
                color: hasImage ? "rgba(255, 255, 255, 0.88)" : mockInkDim,
                textShadow: hasImage ? "0 2px 6px rgba(0,0,0,0.5)" : "none",
              }}
            >
              Changing the way the world learns
            </p>
            {!hasImage ? (
              <p
                className="aw-mono mt-2 text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{ color: mockInkDim }}
              >
                Upload to fill this panel
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Live-preview kicker */}
      <div
        className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5"
        style={{
          background: "rgba(11, 18, 38, 0.7)",
          backdropFilter: "blur(4px)",
        }}
      >
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: "#38bdf8",
            boxShadow: "0 0 6px #38bdf8",
          }}
        />
        <span
          className="aw-mono text-[8.5px] font-bold uppercase tracking-[0.22em]"
          style={{ color: "#ffffff" }}
        >
          Live preview
        </span>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "A"
  );
}

function UploadPill({
  hasImage,
  uploading,
  onPick,
}: {
  hasImage: boolean;
  uploading: boolean;
  onPick: (file: File) => Promise<void> | void;
}) {
  return (
    <label
      className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold transition-all"
      style={{
        color: "#ffffff",
        background: uploading
          ? "#0284c7"
          : "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
        boxShadow: uploading
          ? "0 4px 12px -4px rgba(2, 132, 199, 0.4)"
          : "0 8px 22px -10px #0ea5e9, inset 0 1px 0 0 #ffffff66",
        opacity: uploading ? 0.85 : 1,
      }}
    >
      {uploading ? (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent" />
      ) : (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      )}
      <span className="uppercase tracking-[0.16em]">
        {uploading ? "Uploading…" : hasImage ? "Replace" : "Upload image"}
      </span>
      <input
        type="file"
        accept={WIZARD_IMAGE_ACCEPT}
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onPick(f);
        }}
      />
    </label>
  );
}

function OptionalPill() {
  return (
    <span
      className="aw-mono inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]"
      style={{
        color: "rgb(var(--aw-fg-mute))",
        background: "rgb(var(--aw-line) / 0.05)",
        border: "1px solid rgb(var(--aw-line) / 0.16)",
      }}
    >
      Optional
    </span>
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
