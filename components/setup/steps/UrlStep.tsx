"use client";

import { WizardData } from "@/lib/setup/wizardData";
import { WizardState } from "@/lib/services/wizard.service";

interface Props {
  state: WizardState;
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

export function UrlStep({ state, data, onChange }: Props) {
  const url = data.url || {};
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Your AI Linc subdomain
        </p>
        <p className="mt-3 text-lg font-mono text-[var(--primary-700,#1e3a8a)]">
          {state.subdomain}.ailinc.com
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Assigned by your AI Linc super-admin. This URL is permanent.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Bring your own domain (optional)
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Point a domain you own at AI Linc. You can do this now or anytime
          later from Settings → Domain.
        </p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-gray-700">
            Custom domain
          </span>
          <input
            type="text"
            placeholder="learn.your-org.com"
            value={url.custom_domain || ""}
            onChange={(e) =>
              onChange({
                url: { ...url, custom_domain: e.target.value.trim() },
              })
            }
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--primary-500,#2356d6)] focus:ring-1 focus:ring-[var(--primary-500,#2356d6)]"
          />
        </label>
        {url.custom_domain ? (
          <div className="mt-4 rounded-lg bg-white border border-gray-200 p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-800">DNS instructions</p>
            <p className="mt-1">
              Add a CNAME record pointing{" "}
              <code className="rounded bg-gray-100 px-1">{url.custom_domain}</code>{" "}
              → <code className="rounded bg-gray-100 px-1">tenants.ailinc.com</code>.
              We&apos;ll auto-provision an SSL certificate once DNS resolves.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
