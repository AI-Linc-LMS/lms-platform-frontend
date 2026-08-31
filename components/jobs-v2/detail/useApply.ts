"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/common/Toast";
import {
  jobsV2Service,
  formatJobPassoutYear,
  type JobV2,
  type JobApplicationV2,
} from "@/lib/services/jobs-v2.service";

/**
 * Jobs v2 — **the one apply behaviour**.
 *
 * The shipped detail page had three CTAs and two behaviours, and two of the three recorded
 * nothing: the sidebar "Apply for this position" card was a bare `<a target="_blank">` and the
 * `/apply` route's "Open Application Link" was another one, so a learner could leave for an
 * employer's site with no application row written at all. After this hook there is exactly one
 * code path, and `ApplyCta` renders it in the header, the sidebar, the mobile bar and the
 * external-apply gate.
 *
 * Two ordering bugs die here:
 *
 * 1. **`window.open` runs FIRST, synchronously, inside the click handler.** The shipped code
 *    awaited the POST and only then opened the tab, which leaves the user-gesture task and gets
 *    the popup blocked — stranding the learner in front of a "Did you apply?" dialog for a tab
 *    that never opened. The POST still happens; it just happens second.
 * 2. **A blocked popup does not raise the dialog.** It renders an inline "your browser blocked
 *    the tab" link instead, so the learner is asked about something that actually happened.
 *
 * The service calls themselves are unchanged: `applyForJob(id, { external: true })` then
 * `confirmApplied(applicationId)`, same payloads, same endpoints (section 10.5).
 */

export type ApplyMode = "internal" | "external" | "applied" | "blocked";

/** Why the CTA is disabled. `null` when it is not. */
export interface ApplyBlock {
  /** The button's own label, e.g. "Applications closed". */
  label: string;
  /** The sentence a Tooltip and the touch helper text carry. */
  reason: string;
  /** A profile deep link when the learner can fix the block themselves. */
  fixHref?: string;
  fixLabel?: string;
}

export type ApplyNoticeKind = "popup-blocked" | "pending" | "no-withdraw" | null;

export interface ApplyState {
  job: JobV2 | null;
  mode: ApplyMode;
  /** The CTA verb. */
  label: string;
  icon: string;
  /** Internal applies are a navigation inside the app, so the CTA is a real link. */
  href: string | null;
  applying: boolean;
  block: ApplyBlock | null;
  /** The one click handler. Never async at its top — see the note above. */
  start: () => void;

  /** The "Did you apply?" dialog. */
  confirmOpen: boolean;
  confirmBusy: boolean;
  confirmYes: () => void;
  confirmLater: () => void;
  confirmNo: () => void;

  /** An honest inline message under the CTA. Never a toast-only failure. */
  notice: ApplyNoticeKind;
  noticeText: string | null;
  /** The link the learner can press when the browser swallowed the tab. */
  blockedUrl: string | null;
  dismissNotice: () => void;

  /** The application this flow created, when there is one. */
  applicationId: number | null;
}

export interface UseApplyOptions {
  /** Called after a state change the caller should refetch for (a confirmed application). */
  onChanged?: () => void;
}

/** The gates this job declares. We cannot know which one failed — the API sends one boolean. */
export function eligibilityCriteria(job: JobV2 | null, t: (k: string, o?: object) => string): string[] {
  if (!job) return [];
  const out: string[] = [];
  const passout = formatJobPassoutYear(job.applicable_passout_year);
  if (passout) out.push(t("jobsV2.apply.criterionPassout", { defaultValue: "Passout year {{value}}", value: passout }));
  if (job.min_10th_percentage != null)
    out.push(t("jobsV2.apply.criterion10th", { defaultValue: "At least {{value}}% in class 10", value: job.min_10th_percentage }));
  if (job.min_12th_percentage != null)
    out.push(t("jobsV2.apply.criterion12th", { defaultValue: "At least {{value}}% in class 12", value: job.min_12th_percentage }));
  if (job.min_graduation_percentage != null)
    out.push(
      t("jobsV2.apply.criterionGrad", {
        defaultValue: "At least {{value}}% in graduation",
        value: job.min_graduation_percentage,
      }),
    );
  if (job.college_mappings && job.college_mappings.length > 0)
    out.push(t("jobsV2.apply.criterionCollege", { defaultValue: "Specific colleges and batches" }));
  if (job.education) out.push(t("jobsV2.apply.criterionEducation", { defaultValue: "Education: {{value}}", value: job.education }));
  return out;
}

export function useApply(job: JobV2 | null, options: UseApplyOptions = {}): ApplyState {
  const { onChanged } = options;
  const { t } = useTranslation("common");
  const router = useRouter();
  const { showToast } = useToast();

  const [applying, setApplying] = useState(false);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [notice, setNotice] = useState<ApplyNoticeKind>(null);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  const externalLink = job?.apply_link?.trim() || null;
  const hasApplied = Boolean(job?.has_applied);

  const block = useMemo<ApplyBlock | null>(() => {
    if (!job) return null;
    if (hasApplied) return null;
    if (job.eligible_to_apply === false) {
      const criteria = eligibilityCriteria(job, t as (k: string, o?: object) => string);
      return {
        label: t("jobsV2.notEligible"),
        reason: criteria.length
          ? t("jobsV2.apply.notEligibleWithCriteria", {
              defaultValue: "This role is limited to: {{criteria}}. Update your profile if any of these are out of date.",
              criteria: criteria.join(" · "),
            })
          : t("jobsV2.apply.notEligibleReason", {
              defaultValue:
                "Your profile does not meet this employer's targeting. Update your profile if any of it is out of date.",
            }),
        fixHref: "/profile",
        fixLabel: t("jobsV2.apply.updateProfile", { defaultValue: "Update your profile" }),
      };
    }
    if (job.status && job.status !== "active") {
      const byStatus: Record<string, string> = {
        inactive: t("jobsV2.apply.closedInactive", {
          defaultValue: "The employer has paused this posting, so applications are not being accepted.",
        }),
        on_hold: t("jobsV2.apply.closedOnHold", {
          defaultValue: "This role is on hold. The employer has not closed it, but it is not taking applications right now.",
        }),
        closed: t("jobsV2.apply.closedClosed", { defaultValue: "This role has closed and is no longer taking applications." }),
        completed: t("jobsV2.apply.closedCompleted", { defaultValue: "Hiring for this role is complete." }),
      };
      return {
        label: t("jobsV2.apply.closedLabel", { defaultValue: "Applications closed" }),
        reason:
          byStatus[job.status] ??
          t("jobsV2.apply.closedGeneric", { defaultValue: "This role is not accepting applications." }),
      };
    }
    return null;
  }, [job, hasApplied, t]);

  const mode: ApplyMode = hasApplied ? "applied" : block ? "blocked" : externalLink ? "external" : "internal";

  const label = hasApplied
    ? t("jobsV2.appStatus.applied")
    : block
      ? block.label
      : externalLink
        ? t("jobsV2.applyOnExternalLink")
        : t("jobsV2.apply");

  const icon = hasApplied
    ? "mdi:check-decagram"
    : externalLink
      ? "mdi:open-in-new"
      : // A navigation that stays inside the app. Never an external-link glyph.
        "mdi:arrow-right";

  const href = mode === "internal" && job ? `/jobs-v2/${job.id}/apply` : null;

  const start = useCallback(() => {
    if (!job || applying) return;
    if (hasApplied) return;
    // Belt and braces: the CTA is already disabled in these states.
    if (job.eligible_to_apply === false) return;
    if (job.status && job.status !== "active") return;

    const link = job.apply_link?.trim();
    if (!link) {
      router.push(`/jobs-v2/${job.id}/apply`);
      return;
    }

    // ---- 1. Open the employer's tab FIRST, synchronously, inside the gesture. --------
    const opened = typeof window === "undefined" ? null : window.open(link, "_blank", "noopener");
    if (!opened) {
      setBlockedUrl(link);
      setNotice("popup-blocked");
    } else {
      setBlockedUrl(null);
      setNotice(null);
    }

    // ---- 2. Then record it. -------------------------------------------------------
    setApplying(true);
    jobsV2Service
      .applyForJob(job.id, { external: true })
      .then((res) => {
        setApplicationId(res.id);
        // A blocked tab means the learner never saw the employer's form. Asking "did you
        // apply?" about a tab that never opened is the bug this branch exists to avoid.
        if (res.status === "applying" && opened) setConfirmOpen(true);
      })
      .catch((err: unknown) => {
        showToast((err as Error)?.message ?? t("jobsV2.apply.failed", { defaultValue: "Failed to apply" }), "error");
      })
      .finally(() => setApplying(false));
  }, [job, applying, hasApplied, router, showToast, t]);

  const confirmYes = useCallback(() => {
    if (applicationId == null) {
      setConfirmOpen(false);
      return;
    }
    setConfirmBusy(true);
    jobsV2Service
      .confirmApplied(applicationId)
      .then(() => {
        showToast(t("jobsV2.apply.confirmed", { defaultValue: "Application confirmed" }), "success");
        setNotice(null);
        onChanged?.();
      })
      .catch((err: unknown) => {
        showToast(
          (err as Error)?.message ?? t("jobsV2.apply.confirmFailed", { defaultValue: "Failed to confirm" }),
          "error",
        );
      })
      .finally(() => {
        setConfirmBusy(false);
        setConfirmOpen(false);
      });
  }, [applicationId, onChanged, showToast, t]);

  /** "Not yet — remind me". The record stays at `applying`; the Applied tab can correct it. */
  const confirmLater = useCallback(() => {
    setConfirmOpen(false);
    setNotice("pending");
  }, []);

  /**
   * "No, I changed my mind." There is no withdraw endpoint (spec Appendix B keeps one out of
   * scope), and section 10.5 forbids inventing one — so we say exactly what we can and cannot
   * do rather than pretending the record was cancelled.
   */
  const confirmNo = useCallback(() => {
    setConfirmOpen(false);
    setNotice("no-withdraw");
  }, []);

  const noticeText =
    notice === "popup-blocked"
      ? t("jobsV2.apply.popupBlocked", {
          defaultValue: "Your browser blocked the employer's tab. We saved your application — open it here.",
        })
      : notice === "pending"
        ? t("jobsV2.apply.pending", {
            defaultValue: "Saved as Applying. Confirm it from Your applications once you have finished on the employer's site.",
          })
        : notice === "no-withdraw"
          ? t("jobsV2.apply.noWithdraw", {
              defaultValue:
                "We could not withdraw it automatically. It stays as Applying — you can correct it from Your applications.",
            })
          : null;

  const dismissNotice = useCallback(() => {
    setNotice(null);
    setBlockedUrl(null);
  }, []);

  return {
    job,
    mode,
    label,
    icon,
    href,
    applying,
    block,
    start,
    confirmOpen,
    confirmBusy,
    confirmYes,
    confirmLater,
    confirmNo,
    notice,
    noticeText,
    blockedUrl,
    dismissNotice,
    applicationId,
  };
}

/* ==========================================================================
 * Resolving the learner's own application for a job.
 *
 * `JobV2` carries `has_applied` as a bare boolean and no application id, so the shipped
 * "Applied" state was a dead end: it told a learner they had applied and gave them nowhere to
 * go. There is no per-application GET endpoint (section 10.5 keeps the service read-only), so
 * we use the one that exists — `getMyApplications()` — and find the row. That also gives us the
 * learner's REAL current status ("Shortlisted"), not the flat "Applied" the boolean implies.
 * ======================================================================== */

export interface JobApplicationLink {
  loading: boolean;
  application: JobApplicationV2 | null;
  /** Where "View your application" points. Falls back to the Applied tab, never nowhere. */
  href: string;
}

export function useApplicationForJob(jobId: number | null, enabled: boolean): JobApplicationLink {
  // Keyed by the job it was loaded for, so a route change never shows the previous job's
  // application for a frame — and so nothing has to be cleared on the way out.
  const [loaded, setLoaded] = useState<{ jobId: number; application: JobApplicationV2 | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const active = enabled && Boolean(jobId);

  const load = useCallback(
    async (targetId: number, isCancelled: () => boolean) => {
      setLoading(true);
      try {
        const res = await jobsV2Service.getMyApplications();
        if (isCancelled()) return;
        setLoaded({ jobId: targetId, application: res.results.find((a) => a.job === targetId) ?? null });
      } catch {
        // A failure here must not break the page: the link falls back to the Applied tab,
        // which lists every application. It never renders a broken destination.
        if (isCancelled()) return;
        setLoaded({ jobId: targetId, application: null });
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!active || !jobId) return;
    let cancelled = false;
    void load(jobId, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [jobId, active, load]);

  const application = active && loaded?.jobId === jobId ? loaded.application : null;

  return {
    loading: active && loading,
    application,
    href: application ? `/jobs-v2/applications/${application.id}` : "/jobs-v2?tab=applied",
  };
}
