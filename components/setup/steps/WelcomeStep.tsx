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
    <div className="space-y-7">
      <div className="aw-card">
        <span className="aw-card-top-line" aria-hidden />
        <p className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.3em]">
          From your intake form
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <dt className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.22em]">
              Organisation
            </dt>
            <dd className="aw-text mt-1.5 text-[15px]">
              {state.organisation_name}
            </dd>
          </div>
          <div>
            <dt className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.22em]">
              Your URL
            </dt>
            <dd className="aw-mono mt-1.5 text-[15px] text-[#00e0ff]">
              {state.subdomain}.ailinc.com
            </dd>
          </div>
          {state.contact_email ? (
            <div className="col-span-2">
              <dt className="aw-mono aw-text-mute text-[10px] uppercase tracking-[0.22em]">
                Tenant admin
              </dt>
              <dd className="aw-text mt-1.5 text-[15px]">
                {state.contact_email}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="space-y-5">
        <div>
          <label className="aw-label" htmlFor="confirm-org-name">
            Confirm organisation name
          </label>
          <input
            id="confirm-org-name"
            type="text"
            value={welcome.confirmed_org_name ?? state.organisation_name}
            onChange={(e) =>
              onChange({
                welcome: { ...welcome, confirmed_org_name: e.target.value },
              })
            }
            className="aw-input"
          />
        </div>

        <p className="aw-text-dim text-[13px] leading-[1.65]">
          You can edit branding, modules, and team in the next steps. None of
          your choices are final until you launch.
        </p>
      </div>
    </div>
  );
}
