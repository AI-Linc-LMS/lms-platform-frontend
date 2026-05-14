"use client";

import { WizardData, STEP_TITLES } from "@/lib/setup/wizardData";
import { WizardState } from "@/lib/services/wizard.service";

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
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
          {label}
        </p>
        <div className="mt-1 text-sm text-gray-900">{value || "—"}</div>
      </div>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold uppercase tracking-widest text-[var(--primary-600,#1d4ed8)] hover:text-[var(--primary-700,#1e3a8a)]"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

export function ReviewStep({ state, data, onJumpToStep }: Props) {
  const featureCount = data.features?.selected_feature_ids?.length || 0;
  const capsOn = Object.entries(data.admin_caps || {})
    .filter(([k, v]) => k !== "analytics_depth" && v)
    .map(([k]) => k.replace(/_/g, " "));

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Double-check everything below, then click <strong>Launch My LMS</strong>{" "}
        to go live. You can change every choice from Settings afterwards.
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
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
              <span className="font-mono text-xs">
                {data.brand?.primary_color || "—"} ·{" "}
                {data.brand?.accent_color || "—"}
              </span>
            </div>
          }
          onEdit={() => onJumpToStep(2)}
        />
        <Row
          label={STEP_TITLES[2]}
          value={
            <span className="font-mono">
              {state.subdomain}.ailinc.com
              {data.url?.custom_domain
                ? ` · ${data.url.custom_domain}`
                : ""}
            </span>
          }
          onEdit={() => onJumpToStep(3)}
        />
        <Row
          label={STEP_TITLES[3]}
          value={
            <>
              {data.theme?.template || "Default"} ·{" "}
              {data.theme?.default_mode || "light"} mode
              {data.theme?.welcome_message ? (
                <p className="mt-1 text-xs text-gray-500">
                  &ldquo;{data.theme.welcome_message}&rdquo;
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
              <span className="capitalize">
                {data.admin_caps?.analytics_depth || "basic"} analytics
              </span>
              {capsOn.length ? (
                <span className="text-gray-500"> · {capsOn.join(", ")}</span>
              ) : null}
            </>
          }
          onEdit={() => onJumpToStep(6)}
        />
        <Row
          label={STEP_TITLES[6]}
          value={
            data.course_library?.choice === "import"
              ? "Import from AI Linc catalogue"
              : data.course_library?.choice === "build"
                ? "Build with AI"
                : data.course_library?.choice === "skip"
                  ? "Skip for now"
                  : "—"
          }
          onEdit={() => onJumpToStep(7)}
        />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Once launched, your tenant moves to <strong>live</strong> and learners
        can sign in via <code className="rounded bg-amber-100 px-1">{state.subdomain}.ailinc.com</code>.
        You can edit branding, modules, and team anytime from Settings.
      </div>
    </div>
  );
}
