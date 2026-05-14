"use client";

import { WizardData } from "@/lib/setup/wizardData";
import { WizardState } from "@/lib/services/wizard.service";

interface Props {
  state: WizardState;
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

export function WelcomeStep({ state, data, onChange }: Props) {
  const welcome = data.welcome || {};
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          From your intake form
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-gray-500">Organisation</dt>
            <dd className="font-medium text-gray-900">
              {state.organisation_name}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Your URL</dt>
            <dd className="font-mono text-gray-900">
              {state.subdomain}.ailinc.com
            </dd>
          </div>
          {state.contact_email ? (
            <div className="col-span-2">
              <dt className="text-gray-500">Tenant admin</dt>
              <dd className="text-gray-900">{state.contact_email}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700">
            Confirm organisation name
          </span>
          <input
            type="text"
            value={welcome.confirmed_org_name ?? state.organisation_name}
            onChange={(e) =>
              onChange({
                welcome: { ...welcome, confirmed_org_name: e.target.value },
              })
            }
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--primary-500,#2356d6)] focus:ring-1 focus:ring-[var(--primary-500,#2356d6)]"
          />
        </label>

        <p className="text-sm text-gray-500">
          You can edit branding, modules, and team in the next steps. None of
          your choices are final until you launch.
        </p>
      </div>
    </div>
  );
}
