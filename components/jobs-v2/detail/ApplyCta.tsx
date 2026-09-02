"use client";

import { useRouter } from "next/navigation";
import { Box, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { HeaderActionButton } from "@/components/common/ModulePageHeader";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JButton, JModal, J, R, TYPE, StatusPill } from "@/components/jobs-v2/ui";
import type { ApplyState } from "./useApply";

/**
 * **One CTA component, one behaviour.** It is rendered in the hero action, the sidebar apply
 * card, the mobile sticky bar and the external-apply gate, and every one of them is bound to
 * the same `useApply(job)` state — so there is no longer a "real" apply and two decorative
 * links that record nothing.
 *
 * The placement only changes the chrome:
 *   - `header`  — a `HeaderActionButton` so it reads on the dark hero.
 *   - `heroBar` — the pane's sticky bar: a compact primary, no notice (the bar renders its own).
 *   - `panel`   — the sidebar card's full-width primary.
 *   - `bar`     — the mobile sticky bar's full-width primary.
 *   - `inline`  — the gate screens.
 *
 * **The button says where it goes.** Every placement except `header` prints the destination host
 * ("greenhouse.io") in `TYPE.micro` directly beneath an external apply. An apply is an outbound
 * jump to a stranger's ATS, and a student who lands somewhere they did not expect blames us, not
 * the employer. `apply.destination` is `null` for an internal apply and for a link we could not
 * parse — we never print a destination we did not resolve.
 */
export type ApplyCtaPlacement = "header" | "heroBar" | "panel" | "bar" | "inline";

export interface ApplyCtaProps {
  apply: ApplyState;
  placement?: ApplyCtaPlacement;
  /** Where "View your application" goes once the learner has applied. */
  appliedHref?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

export function ApplyCta({
  apply,
  placement = "panel",
  appliedHref = "/jobs-v2?tab=applied",
  fullWidth,
  sx,
  ...rest
}: ApplyCtaProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const wide = fullWidth ?? (placement === "panel" || placement === "bar");
  // The sticky bar has no room for the inline notice; `JobHeroBar` renders it on its own row.
  const showNotice = placement !== "heroBar";

  /* ---- already applied ------------------------------------------------ */
  if (apply.mode === "applied") {
    if (placement === "header") {
      return (
        <HeaderActionButton icon="mdi:file-document-check-outline" onClick={() => router.push(appliedHref)}>
          {t("jobsV2.apply.viewApplication", { defaultValue: "View your application" })}
        </HeaderActionButton>
      );
    }
    return (
      <Box {...rest} sx={sx}>
        <JButton
          variant="secondary"
          href={appliedHref}
          startIcon="mdi:file-document-check-outline"
          fullWidth={wide}
          size={placement === "bar" ? "lg" : "md"}
        >
          {t("jobsV2.apply.viewApplication", { defaultValue: "View your application" })}
        </JButton>
      </Box>
    );
  }

  /* ---- header: the on-dark pill --------------------------------------- */
  if (placement === "header") {
    const button = (
      <HeaderActionButton icon={apply.icon} onClick={apply.start} disabled={Boolean(apply.block) || apply.applying}>
        {apply.applying ? t("jobsV2.apply.applying", { defaultValue: "Applying…" }) : apply.label}
      </HeaderActionButton>
    );
    if (!apply.block) return button;
    // A disabled control must always say why. On the hero there is no room for helper text,
    // so the tooltip carries it and the sidebar card repeats it in full below `md`.
    return (
      <Tooltip title={apply.block.reason} arrow describeChild>
        <Box component="span" sx={{ display: "inline-flex" }}>
          {button}
        </Box>
      </Tooltip>
    );
  }

  /* ---- everywhere else ------------------------------------------------ */
  return (
    <Box {...rest} sx={[{ width: wide ? "100%" : "auto" }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <JButton
        variant="primary"
        tone="azure"
        size={placement === "bar" ? "lg" : "md"}
        startIcon={apply.icon}
        loading={apply.applying}
        fullWidth={wide}
        // Never both: an internal apply is a real <Link>, and an onClick that also pushed
        // would navigate twice.
        onClick={apply.href ? undefined : apply.start}
        href={apply.href ?? undefined}
        disabledReason={apply.block?.reason}
      >
        {apply.label}
      </JButton>
      {/* The destination, stated before the click rather than discovered after it. */}
      {apply.mode === "external" && apply.destination && (
        <Typography
          sx={{
            ...TYPE.micro,
            mt: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 0.375,
            justifyContent: wide ? "center" : "flex-end",
          }}
          title={apply.destination}
        >
          <IconWrapper icon="mdi:open-in-new" size={12} />
          {t("jobsV2.apply.destination", {
            defaultValue: "Opens {{domain}}",
            domain: apply.destination,
          })}
        </Typography>
      )}
      {apply.block?.fixHref && (
        <Box sx={{ mt: 1 }}>
          <JButton variant="quiet" href={apply.block.fixHref} startIcon="mdi:account-edit-outline">
            {apply.block.fixLabel}
          </JButton>
        </Box>
      )}
      {showNotice && <ApplyNotice apply={apply} />}
    </Box>
  );
}

/**
 * The honest inline message under the CTA: a blocked popup, a record left at `applying`, or the
 * fact that we have no withdraw endpoint to call. **None of these is reported by a toast alone**
 * (section 6): a toast that has already faded is not a report.
 */
export function ApplyNotice({ apply, sx }: { apply: ApplyState; sx?: SxProps<Theme> }) {
  const { t } = useTranslation("common");
  if (!apply.noticeText) return null;

  const danger = apply.notice === "popup-blocked";

  return (
    <Box
      role="status"
      sx={[
        {
          mt: 1.25,
          p: 1.25,
          borderRadius: R.inner,
          border: `1px solid ${danger ? J.warnBd : J.hairline}`,
          bgcolor: danger ? J.warnBg : J.surface2,
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box aria-hidden sx={{ color: danger ? J.warnFg : J.ink3, flexShrink: 0, mt: "1px" }}>
        <IconWrapper icon={danger ? "mdi:alert-outline" : "mdi:information-outline"} size={16} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ ...TYPE.small, color: danger ? J.warnFg : J.ink2 }}>{apply.noticeText}</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
          {apply.blockedUrl && (
            <JButton variant="quiet" size="sm" href={apply.blockedUrl} external startIcon="mdi:open-in-new">
              {t("jobsV2.apply.openApplication", { defaultValue: "Open the application" })}
            </JButton>
          )}
          {(apply.notice === "pending" || apply.notice === "no-withdraw") && (
            <JButton variant="quiet" size="sm" href="/jobs-v2?tab=applied" startIcon="mdi:format-list-checks">
              {t("jobsV2.apply.goToApplications", { defaultValue: "Your applications" })}
            </JButton>
          )}
          <JButton variant="quiet" size="sm" onClick={apply.dismissNotice}>
            {t("jobsV2.bulk.dismiss")}
          </JButton>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * **"Did you apply?" now has three answers, not two.**
 *
 * The shipped `ConfirmDialog` offered Yes / No, mapped `onClose` to "No", and neither answer
 * did anything for the learner: pressing Esc silently stranded the record at `applying` with no
 * surface anywhere that could correct it. Now:
 *
 *   - **Yes, I applied** confirms the record.
 *   - **Not yet — remind me** leaves it at `applying`, and the Applied tab surfaces and can
 *     correct it. `onClose` and `Esc` map here, and the dialog says so.
 *   - **No, I changed my mind** would call the cancel path; there is no withdraw endpoint yet
 *     (Appendix B), so it says exactly that rather than pretending.
 *
 * It is a `JModal size="sm"` with a three-button footer — the same shell `JConfirm` is built
 * from, which only knows two answers.
 */
export function ApplyDialogs({ apply }: { apply: ApplyState }) {
  const { t } = useTranslation("common");
  const job = apply.job;

  return (
    <JModal
      open={apply.confirmOpen}
      // Esc and the backdrop mean "not yet", and the body says so in as many words.
      onClose={apply.confirmLater}
      title={t("jobsV2.apply.didYouApplyTitle", { defaultValue: "Did you apply?" })}
      eyebrow={t("jobsV2.apply.didYouApplyEyebrow", { defaultValue: "One last thing" })}
      description={
        job
          ? t("jobsV2.apply.didYouApplyBody", {
              defaultValue: "Did you finish the application for {{title}} at {{company}}?",
              title: job.job_title,
              company: job.company_name,
            })
          : undefined
      }
      icon="mdi:help-circle-outline"
      size="sm"
      footer={
        <>
          <JButton variant="ghost" onClick={apply.confirmNo} disabled={apply.confirmBusy}>
            {t("jobsV2.apply.answerNo", { defaultValue: "No, I changed my mind" })}
          </JButton>
          <Box sx={{ display: "flex", gap: 1.25, flexDirection: { xs: "column-reverse", sm: "row" } }}>
            <JButton variant="secondary" onClick={apply.confirmLater} disabled={apply.confirmBusy}>
              {t("jobsV2.apply.answerLater", { defaultValue: "Not yet — remind me" })}
            </JButton>
            <JButton variant="primary" onClick={apply.confirmYes} loading={apply.confirmBusy} startIcon="mdi:check">
              {t("jobsV2.apply.answerYes", { defaultValue: "Yes, I applied" })}
            </JButton>
          </Box>
        </>
      }
    >
      <Typography sx={TYPE.body}>
        {t("jobsV2.apply.didYouApplyHelp", {
          defaultValue:
            "We saved this as Applying. Confirming it moves it to Applied so you and your placement team can track it. Closing this window keeps it at Applying — you can confirm it later from Your applications.",
        })}
      </Typography>
      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <StatusPill kind="application" value="applying" size="sm" />
        <Box aria-hidden sx={{ color: J.ink4, display: "inline-flex" }}>
          <IconWrapper icon="mdi:arrow-right" size={16} />
        </Box>
        <StatusPill kind="application" value="applied" size="sm" />
      </Box>
    </JModal>
  );
}
