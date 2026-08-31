"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { J, R, TYPE, JCard, JButton, MicroRuleList, StatusPill } from "@/components/jobs-v2/ui";

export interface ApplySuccessProps {
  job: JobV2;
  /** The id the API returned. `null` only if the response omitted it. */
  applicationId: number | null;
  /** The resume that was actually sent. */
  resumeName: string | null;
  /** Opens `ResumeViewerModal` on the resume that was sent. */
  onPreviewResume?: () => void;
  answeredCount: number;
}

/**
 * **Success is a screen, not a toast.**
 *
 * The shipped flow fired `showToast("Application submitted successfully")` and immediately
 * pushed back to the job — so the only confirmation a learner ever got was a message that
 * faded while the page under it was being replaced, with no reference number, no record of
 * what was sent, and no way back to it.
 */
export function ApplySuccess({ job, applicationId, resumeName, onPreviewResume, answeredCount }: ApplySuccessProps) {
  const { t } = useTranslation("common");

  const nextSteps = [
    t("jobsV2.success.next1", {
      defaultValue: "{{company}} reviews applications and shortlists from them.",
      company: job.company_name,
    }),
    t("jobsV2.success.next2", {
      defaultValue: "Your status changes here as it moves — shortlisted, interview, outcome.",
    }),
    t("jobsV2.success.next3", {
      defaultValue: "You will not need to send anything again for this role.",
    }),
  ];

  return (
    <>
      <ModulePageHeader
        eyebrow={t("jobsV2.apply.eyebrow", { defaultValue: "01 · CAREER · APPLY" })}
        title={t("jobsV2.success.title", { defaultValue: "Application sent" })}
        description={[job.job_title, job.company_name].filter(Boolean).join(" · ")}
        accent="azure"
        icon="mdi:check-decagram"
      />

      <JCard accent="azure" sx={{ maxWidth: 820, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box
            aria-hidden
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: R.inner,
              display: "grid",
              placeItems: "center",
              bgcolor: J.successBg,
              color: J.successFg,
              border: `1px solid ${J.successBd}`,
            }}
          >
            <IconWrapper icon="mdi:check-decagram" size={30} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography component="h2" sx={TYPE.h2}>
              {t("jobsV2.success.title", { defaultValue: "Application sent" })}
            </Typography>
            <Typography sx={{ ...TYPE.body, mt: 0.5 }}>
              {t("jobsV2.success.body", {
                defaultValue: "{{company}} has your application for {{title}}.",
                company: job.company_name,
                title: job.job_title,
              })}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.25, flexWrap: "wrap" }}>
              <StatusPill kind="application" value="applied" size="sm" />
              {applicationId != null && (
                <Typography sx={{ ...TYPE.mono, color: J.ink3 }}>
                  {t("jobsV2.success.reference", { defaultValue: "Reference" })} #{applicationId}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography sx={{ ...TYPE.label, mb: 1 }}>
            {t("jobsV2.success.whatNext", { defaultValue: "What happens next" })}
          </Typography>
          <MicroRuleList items={nextSteps} />
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: R.inner,
            border: `1px solid ${J.hairline}`,
            bgcolor: J.surface2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box aria-hidden sx={{ color: J.ink3, display: "inline-flex" }}>
            <IconWrapper icon="mdi:file-document-outline" size={22} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ ...TYPE.label, mb: 0.25 }}>
              {t("jobsV2.success.sent", { defaultValue: "What we sent" })}
            </Typography>
            <Typography sx={TYPE.bodyStrong}>
              {resumeName ?? t("jobsV2.success.resume", { defaultValue: "Your resume" })}
              {answeredCount > 0 &&
                ` · ${t("jobsV2.success.answers", {
                  defaultValue: "{{count}} answers",
                  count: answeredCount,
                })}`}
            </Typography>
          </Box>
          {onPreviewResume && (
            <JButton variant="secondary" size="sm" startIcon="mdi:eye-outline" onClick={onPreviewResume}>
              {t("jobsV2.apply.preview", { defaultValue: "Preview" })}
            </JButton>
          )}
        </Box>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.25,
          }}
        >
          <JButton
            variant="primary"
            tone="azure"
            href={applicationId != null ? `/jobs-v2/applications/${applicationId}` : "/jobs-v2?tab=applied"}
            startIcon="mdi:timeline-check-outline"
            fullWidth
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {t("jobsV2.success.track", { defaultValue: "Track your application" })}
          </JButton>
          <JButton
            variant="secondary"
            href="/jobs-v2"
            startIcon="mdi:briefcase-search"
            fullWidth
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {t("jobsV2.success.browseMore", { defaultValue: "Browse more roles" })}
          </JButton>
        </Box>
      </JCard>
    </>
  );
}
