"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WizardLayout } from "./WizardLayout";
import { WizardNav } from "./WizardNav";
import { WelcomeStep } from "./steps/WelcomeStep";
import { BrandStep } from "./steps/BrandStep";
import { UrlStep } from "./steps/UrlStep";
import { ThemeStep } from "./steps/ThemeStep";
import { FeaturesStep } from "./steps/FeaturesStep";
import { AdminCapsStep } from "./steps/AdminCapsStep";
import { CourseLibraryStep } from "./steps/CourseLibraryStep";
import { ReviewStep } from "./steps/ReviewStep";
import { STEP_TITLES, TOTAL_WIZARD_STEPS, WizardData } from "@/lib/setup/wizardData";
import { wizardService, WizardState } from "@/lib/services/wizard.service";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

const STEP_DESCRIPTIONS: string[] = [
  "Let's make sure we have your basics right before we customise the platform.",
  "Upload your logos and pick colours that match your brand. You'll see a live preview on the right.",
  "Your LMS URL is permanent. Optionally connect a custom domain you already own.",
  "Pick a starting template, default colour mode, and a welcome message for your learners.",
  "Toggle the modules your learners and admins will see in the sidebar.",
  "Decide what your tenant admins are allowed to do day-to-day.",
  "Choose how your course library is seeded. You can always add more later.",
  "Final check before going live.",
];

interface Props {
  initialState: WizardState;
}

export function SetupWizard({ initialState }: Props) {
  const router = useRouter();
  const { refreshClientInfo } = useClientInfo();
  const [state, setState] = useState<WizardState>(initialState);
  const [data, setData] = useState<WizardData>(
    (initialState.wizard_state as WizardData) || {}
  );
  const [step, setStep] = useState<number>(
    Math.max(1, Math.min(initialState.setup_step || 1, TOTAL_WIZARD_STEPS))
  );
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Debounced autosave
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const persist = async (override?: {
    nextData?: WizardData;
    nextStep?: number;
  }) => {
    const payload = {
      wizard_state: override?.nextData ?? data,
      setup_step: override?.nextStep ?? step,
    };
    setSaving(true);
    try {
      const updated = await wizardService.saveState(payload);
      setState(updated);
      dirtyRef.current = false;
    } catch {
      /* leave dirty for retry */
    } finally {
      setSaving(false);
    }
  };

  // Schedule debounced save when data changes
  useEffect(() => {
    if (!dirtyRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persist();
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const updateData = (patch: Partial<WizardData>) => {
    dirtyRef.current = true;
    setData((prev) => ({ ...prev, ...patch }));
  };

  const goNext = async () => {
    if (step < TOTAL_WIZARD_STEPS) {
      const nextStep = step + 1;
      setStep(nextStep);
      await persist({ nextStep });
      return;
    }
    // Final step → launch
    await onLaunch();
  };

  const goBack = () => {
    if (step > 1) {
      const nextStep = step - 1;
      setStep(nextStep);
      void persist({ nextStep });
    }
  };

  const jumpTo = (target: number) => {
    if (target < 1 || target > TOTAL_WIZARD_STEPS) return;
    setStep(target);
    void persist({ nextStep: target });
  };

  const onLaunch = async () => {
    setLaunching(true);
    setLaunchError(null);
    try {
      await wizardService.launch(data);
      await refreshClientInfo();
      router.replace("/admin/dashboard");
    } catch (err: any) {
      setLaunchError(
        err?.response?.data?.detail ||
          err?.message ||
          "We couldn't launch your LMS. Please try again."
      );
    } finally {
      setLaunching(false);
    }
  };

  const canGoNext = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(
          (data.welcome?.confirmed_org_name || state.organisation_name || "")
            .trim().length >= 2
        );
      case 2:
        // Require at least a primary colour or logo to move on
        return Boolean(
          data.brand?.primary_color || data.brand?.light_logo_url
        );
      case 5:
        return (data.features?.selected_feature_ids?.length || 0) > 0;
      case 7:
        return Boolean(data.course_library?.choice);
      default:
        return true;
    }
  }, [step, data, state.organisation_name]);

  return (
    <WizardLayout
      step={step}
      title={STEP_TITLES[step - 1]}
      description={STEP_DESCRIPTIONS[step - 1]}
      saving={saving}
      onJumpToStep={jumpTo}
    >
      {step === 1 ? (
        <WelcomeStep state={state} data={data} onChange={updateData} />
      ) : null}
      {step === 2 ? (
        <BrandStep state={state} data={data} onChange={updateData} />
      ) : null}
      {step === 3 ? <UrlStep state={state} data={data} onChange={updateData} /> : null}
      {step === 4 ? <ThemeStep data={data} onChange={updateData} /> : null}
      {step === 5 ? <FeaturesStep data={data} onChange={updateData} /> : null}
      {step === 6 ? <AdminCapsStep data={data} onChange={updateData} /> : null}
      {step === 7 ? <CourseLibraryStep data={data} onChange={updateData} /> : null}
      {step === 8 ? (
        <ReviewStep state={state} data={data} onJumpToStep={jumpTo} />
      ) : null}

      {launchError ? (
        <div
          className="mt-6 rounded-xl px-4 py-3"
          style={{
            border: "1px solid rgba(248, 113, 113, 0.3)",
            background: "rgba(248, 113, 113, 0.08)",
          }}
        >
          <p className="aw-mono text-[11px] uppercase tracking-[0.22em] text-[#ff8a8a]">
            Launch failed
          </p>
          <p className="aw-text-dim mt-1 text-[13px] leading-relaxed">
            {launchError}
          </p>
        </div>
      ) : null}

      <WizardNav
        step={step}
        canGoBack={step > 1 && !launching}
        canGoNext={canGoNext}
        onBack={goBack}
        onNext={goNext}
        nextLoading={launching}
      />
    </WizardLayout>
  );
}
