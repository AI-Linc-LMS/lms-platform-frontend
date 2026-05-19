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
import { CourseLibraryStep } from "./steps/CourseLibraryStep";
import { ReviewStep } from "./steps/ReviewStep";
import { STEP_TITLES, TOTAL_WIZARD_STEPS, WizardData } from "@/lib/setup/wizardData";
import { wizardService, WizardState } from "@/lib/services/wizard.service";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

// Step indices are 1-based, descriptions are 0-based. Keep this list in
// lock-step with STEP_TITLES in lib/setup/wizardData.ts — the
// "Admin capabilities" step was removed because every tenant ships with the
// full admin capability set by default; admins can still refine permissions
// post-launch via Settings → Admin permissions.
const STEP_DESCRIPTIONS: string[] = [
  "Let's make sure we have your basics right before we customise the platform.",
  "Upload your logo and favicon. The dark-mode logo defaults to your light-mode upload if you skip it. You'll see a live preview on the right.",
  "Your LMS URL is permanent. Optionally connect a custom domain you already own.",
  "Pick a starting template, default colour mode, and a welcome message for your learners.",
  "Toggle the modules your learners and admins will see in the sidebar.",
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

  /**
   * For each blocking step, return the list of human-readable things still
   * missing. Empty list means "Continue is allowed". The list also drives
   * the helper message above the nav so users aren't left guessing why the
   * button is disabled — replaces the old "just disabled, no explanation"
   * UX that left people stuck on step 2 after uploading all three assets.
   */
  const missingForCurrentStep = useMemo<string[]>(() => {
    switch (step) {
      case 1: {
        const name = (
          data.welcome?.confirmed_org_name || state.organisation_name || ""
        ).trim();
        return name.length >= 2 ? [] : ["confirm your organisation name"];
      }
      case 2: {
        const missing: string[] = [];
        // Either logo slot is fine — uploads auto-mirror in BrandStep, so
        // the practical effect is "at least one logo somewhere".
        const hasAnyLogo =
          Boolean(data.brand?.light_logo_url) ||
          Boolean(data.brand?.dark_logo_url) ||
          // Fall back to the intake-form logo if the user kept it as-is.
          Boolean(state.logo_url);
        if (!hasAnyLogo) missing.push("upload a logo");
        if (!data.brand?.favicon_url) missing.push("upload a favicon");
        return missing;
      }
      case 5:
        return (data.features?.selected_feature_ids?.length || 0) > 0
          ? []
          : ["pick at least one feature module"];
      case 6:
        return data.course_library?.choice
          ? []
          : ["choose how to seed your course library"];
      default:
        return [];
    }
  }, [step, data, state.organisation_name, state.logo_url]);

  const canGoNext = missingForCurrentStep.length === 0;

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
      {step === 6 ? (
        <CourseLibraryStep data={data} onChange={updateData} />
      ) : null}
      {step === 7 ? (
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
      ) : missingForCurrentStep.length > 0 ? (
        // Tells the user EXACTLY what's missing to enable Continue, instead of
        // leaving them staring at a disabled button (step 2's old failure mode:
        // upload all three assets and still get blocked because the only check
        // was a `primary_color` boolean).
        <div
          className="mt-6 rounded-xl px-4 py-3"
          style={{
            border: "1px solid rgba(255, 209, 102, 0.28)",
            background: "rgba(255, 209, 102, 0.06)",
          }}
          role="status"
        >
          <p className="aw-mono text-[11px] uppercase tracking-[0.22em] text-[#ffd166]">
            Before you continue
          </p>
          <p className="aw-text-dim mt-1 text-[13px] leading-relaxed">
            Please{" "}
            {missingForCurrentStep.map((item, i) => (
              <span key={item}>
                <span className="text-text">{item}</span>
                {i < missingForCurrentStep.length - 1
                  ? i === missingForCurrentStep.length - 2
                    ? " and "
                    : ", "
                  : ""}
              </span>
            ))}
            .
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
