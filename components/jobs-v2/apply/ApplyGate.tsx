"use client";

import { useTranslation } from "react-i18next";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { formatDate } from "@/lib/jobs-v2/format";
import { EmptyState, JButton } from "@/components/jobs-v2/ui";
import { EmptyJobsIllustration } from "@/components/jobs-v2/illustrations";
import { ApplyCta } from "@/components/jobs-v2/detail/ApplyCta";
import type { ApplyState } from "@/components/jobs-v2/detail/useApply";

/**
 * **The five interstitials, one component.**
 *
 * The apply route shipped five bare-text early returns, each with its own copy of the
 * `MainLayout` + `Box minHeight` + `maxWidth: 1100` + `py: 8` wrapper, and each with a
 * `<Button sx={{ backgroundColor: "var(--accent-indigo)" }}>` that had no `variant` and no
 * `color` — MUI's default text-button label on a solid indigo fill, a contrast failure repeated
 * four times. All five are typed variants of one component now, each a real `EmptyState` inside
 * the standard chrome.
 *
 * Every one of them ends somewhere. The `has_applied` gate in particular was a dead end: it
 * told the learner they had applied and offered only "Back to Job".
 */
export type ApplyGateVariant = "applied" | "external" | "closed" | "ineligible" | "notFound";

export interface ApplyGateProps {
  variant: ApplyGateVariant;
  job: JobV2 | null;
  /** Required for the `external` gate: the gate's primary IS the one apply behaviour. */
  apply?: ApplyState;
  /** Where "View your application" points. */
  appliedHref?: string;
  /** The learner's own application row, when we could resolve it. */
  appliedOn?: string | null;
  appliedStatusLabel?: string | null;
}

export function ApplyGate({
  variant,
  job,
  apply,
  appliedHref = "/jobs-v2?tab=applied",
  appliedOn,
  appliedStatusLabel,
}: ApplyGateProps) {
  const { t } = useTranslation("common");
  const backToJob = job ? `/jobs-v2/${job.id}` : "/jobs-v2";

  const back = (
    <JButton variant="ghost" href={backToJob} startIcon="mdi:arrow-left">
      {job
        ? t("jobsV2.gate.backToJob", { defaultValue: "Back to the job" })
        : t("jobsV2.backToJobs")}
    </JButton>
  );

  const content = () => {
    switch (variant) {
      case "applied": {
        const detail = [
          appliedOn ? t("jobsV2.gate.appliedOn", { defaultValue: "Sent {{date}}", date: appliedOn }) : null,
          appliedStatusLabel
            ? t("jobsV2.gate.appliedStatus", { defaultValue: "Currently {{status}}", status: appliedStatusLabel })
            : null,
        ].filter(Boolean);
        return {
          icon: "mdi:check-decagram",
          title: t("jobsV2.gate.appliedTitle", { defaultValue: "You already applied" }),
          body: detail.length
            ? `${t("jobsV2.gate.appliedBody", {
                defaultValue: "There is one application per role, so there is nothing more to send.",
              })} ${detail.join(" · ")}`
            : t("jobsV2.gate.appliedBody", {
                defaultValue: "There is one application per role, so there is nothing more to send.",
              }),
          primary: (
            <JButton variant="primary" tone="azure" href={appliedHref} startIcon="mdi:file-document-check-outline">
              {t("jobsV2.apply.viewApplication", { defaultValue: "View your application" })}
            </JButton>
          ),
          secondary: back,
        };
      }
      case "external":
        return {
          icon: "mdi:open-in-new",
          title: t("jobsV2.gate.externalTitle", {
            defaultValue: "This employer takes applications on their own site",
          }),
          body: t("jobsV2.gate.externalBody", {
            defaultValue:
              "We open their form in a new tab and record the application here, so it still shows up in your applications and your placement team can see it.",
          }),
          // The primary IS the one apply behaviour — never a bare <a target="_blank"> that
          // erases the learner's history.
          primary: apply ? <ApplyCta apply={apply} placement="inline" fullWidth={false} /> : null,
          secondary: back,
        };
      case "closed":
        return {
          icon: "mdi:lock-clock",
          title: t("jobsV2.apply.closedLabel", { defaultValue: "Applications closed" }),
          body:
            apply?.block?.reason ??
            t("jobsV2.apply.closedGeneric", { defaultValue: "This role is not accepting applications." }),
          primary: (
            <JButton variant="primary" tone="azure" href="/jobs-v2" startIcon="mdi:briefcase-search">
              {t("jobsV2.gate.browseSimilar", { defaultValue: "Browse similar roles" })}
            </JButton>
          ),
          secondary: back,
        };
      case "ineligible":
        return {
          icon: "mdi:account-alert",
          title: t("jobsV2.gate.ineligibleTitle", { defaultValue: "You are not eligible for this role" }),
          body:
            apply?.block?.reason ??
            t("jobsV2.apply.notEligibleReason", {
              defaultValue:
                "Your profile does not meet this employer's targeting. Update your profile if any of it is out of date.",
            }),
          primary: (
            <JButton variant="primary" tone="azure" href="/profile" startIcon="mdi:account-edit-outline">
              {t("jobsV2.apply.updateProfile", { defaultValue: "Update your profile" })}
            </JButton>
          ),
          secondary: back,
        };
      case "notFound":
      default:
        return {
          icon: undefined,
          title: t("jobsV2.detail.goneTitle", { defaultValue: "This role is no longer listed" }),
          body: t("jobsV2.detail.goneBody", {
            defaultValue: "The employer closed it, or the link is out of date. There are other openings on the board.",
          }),
          primary: (
            <JButton variant="primary" tone="azure" href="/jobs-v2" startIcon="mdi:briefcase-search">
              {t("jobsV2.empty.browseJobs")}
            </JButton>
          ),
          secondary: null,
        };
    }
  };

  const state = content();

  return (
    <>
      <ModulePageHeader
        eyebrow={t("jobsV2.apply.eyebrow", { defaultValue: "01 · CAREER · APPLY" })}
        title={job?.job_title ?? t("jobsV2.apply.title", { defaultValue: "Apply" })}
        description={job ? [job.company_name, job.location].filter(Boolean).join(" · ") : undefined}
        accent="azure"
        icon="mdi:send-outline"
      />
      <EmptyState
        variant="page"
        icon={state.icon}
        illustration={variant === "notFound" ? <EmptyJobsIllustration width={168} height={132} /> : undefined}
        title={state.title}
        body={state.body}
        primaryAction={state.primary}
        secondaryAction={state.secondary}
      />
    </>
  );
}

/** The date helper the `applied` gate uses, kept here so the route stays about fetching. */
export function appliedOnLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return formatDate(iso, { withTime: true });
}
