"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatJobPassoutYear, type JobV2 } from "@/lib/services/jobs-v2.service";
import { formatDate, formatCount, formatEmploymentType, deadlineLabel } from "@/lib/jobs-v2/format";
import {
  J,
  R,
  TYPE,
  JCard,
  JButton,
  MicroRuleList,
  DefinitionList,
  type DefinitionItem,
} from "@/components/jobs-v2/ui";

/* `DefinitionList` and `DefinitionItem` now live in the kit (`ui/Surfaces.tsx`). The admin
 * detail page had written a second one; there is one component with two layouts. */

/* ==========================================================================
 * The "Job details" card.
 * ======================================================================== */

export function JobDetailsPanel({ job, sx }: { job: JobV2; sx?: SxProps<Theme> }) {
  const { t } = useTranslation("common");
  const passout = formatJobPassoutYear(job.applicable_passout_year);
  const deadline = deadlineLabel(job.application_deadline);

  const items: DefinitionItem[] = [];
  const push = (key: string, label: string, value: ReactNode, icon?: string, tone?: string) => {
    if (value === null || value === undefined || value === "") return;
    items.push({ key, label, value, icon, tone });
  };

  push("industry", t("jobsV2.detail.industry", { defaultValue: "Industry" }), job.industry_type, "mdi:domain");
  push("department", t("jobsV2.detail.department", { defaultValue: "Department" }), job.department, "mdi:sitemap-outline");
  push(
    "employment",
    t("jobsV2.detail.employmentType", { defaultValue: "Employment type" }),
    formatEmploymentType(job.employment_type),
    "mdi:briefcase-outline",
  );
  push(
    "roleCategory",
    t("jobsV2.detail.roleCategory", { defaultValue: "Role category" }),
    job.role_category,
    "mdi:shape-outline",
  );
  push("education", t("jobsV2.detail.education", { defaultValue: "Education" }), job.education, "mdi:school-outline");
  push("passout", t("jobsV2.detail.passout", { defaultValue: "Applicable passout year" }), passout, "mdi:calendar-account-outline");
  if (deadline) {
    push(
      "deadline",
      t("jobsV2.detail.closingDate", { defaultValue: "Closing date" }),
      formatDate(job.application_deadline),
      "mdi:calendar-clock-outline",
      deadline.urgency === "urgent" || deadline.urgency === "past"
        ? J.dangerFg
        : deadline.urgency === "soon"
          ? J.warnFg
          : undefined,
    );
  }
  if (job.number_of_openings != null && job.number_of_openings > 0) {
    push(
      "openings",
      t("jobsV2.detail.openings", { defaultValue: "Openings" }),
      formatCount(job.number_of_openings),
      "mdi:account-multiple-outline",
    );
  }

  if (items.length === 0) return null;

  return (
    <JCard sx={sx}>
      <Typography component="h2" sx={{ ...TYPE.h3, mb: 1 }}>
        {t("jobsV2.detail.jobDetails", { defaultValue: "Job details" })}
      </Typography>
      <DefinitionList items={items} />
    </JCard>
  );
}

/* ==========================================================================
 * Requirements — the eligibility gates, as micro-rule bullets.
 *
 * `min_10th_percentage`, `min_12th_percentage` and `min_graduation_percentage` are collected by
 * the admin create form and were rendered NOWHERE, on either side of the module. A learner
 * could not see the bar they were being measured against.
 * ======================================================================== */

/** Whether the job declares any gate at all — the section header is skipped when it does not. */
export function hasRequirements(job: JobV2): boolean {
  return Boolean(
    job.years_of_experience ||
      job.education ||
      formatJobPassoutYear(job.applicable_passout_year) ||
      job.min_10th_percentage != null ||
      job.min_12th_percentage != null ||
      job.min_graduation_percentage != null ||
      job.ug_requirements ||
      job.pg_requirements,
  );
}

export function RequirementsList({ job }: { job: JobV2 }) {
  const { t } = useTranslation("common");
  const passout = formatJobPassoutYear(job.applicable_passout_year);

  const items: ReactNode[] = [];
  if (job.years_of_experience)
    items.push(
      t("jobsV2.detail.reqExperience", { defaultValue: "Experience: {{value}}", value: job.years_of_experience }),
    );
  if (job.education)
    items.push(t("jobsV2.detail.reqEducation", { defaultValue: "Education: {{value}}", value: job.education }));
  if (passout) items.push(t("jobsV2.detail.reqPassout", { defaultValue: "Passout year: {{value}}", value: passout }));
  if (job.min_10th_percentage != null)
    items.push(t("jobsV2.detail.req10th", { defaultValue: "Class 10: at least {{value}}%", value: job.min_10th_percentage }));
  if (job.min_12th_percentage != null)
    items.push(t("jobsV2.detail.req12th", { defaultValue: "Class 12: at least {{value}}%", value: job.min_12th_percentage }));
  if (job.min_graduation_percentage != null)
    items.push(
      t("jobsV2.detail.reqGrad", {
        defaultValue: "Graduation: at least {{value}}%",
        value: job.min_graduation_percentage,
      }),
    );
  if (job.ug_requirements)
    items.push(t("jobsV2.detail.reqUg", { defaultValue: "UG: {{value}}", value: job.ug_requirements }));
  if (job.pg_requirements)
    items.push(t("jobsV2.detail.reqPg", { defaultValue: "PG: {{value}}", value: job.pg_requirements }));

  if (items.length === 0) return null;

  return <MicroRuleList items={items} />;
}

/* ==========================================================================
 * The attached JD.
 *
 * The file glyph sat on `var(--error-500)` — the app's ERROR red, used decoratively, so an
 * attached PDF read as a failed upload. It is `J.ink3` on the inert surface rung now.
 * ======================================================================== */

export function AttachedJdCard({ url, sx }: { url: string; sx?: SxProps<Theme> }) {
  const { t } = useTranslation("common");
  return (
    <JCard sx={sx}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 48,
            flexShrink: 0,
            borderRadius: R.ctl,
            display: "grid",
            placeItems: "center",
            bgcolor: J.surface2,
            border: `1px solid ${J.hairline}`,
            color: J.ink3,
          }}
        >
          <IconWrapper icon="mdi:file-pdf-box" size={22} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={TYPE.h4}>{t("jobsV2.detail.attachedJd", { defaultValue: "Attached job description" })}</Typography>
          <Typography sx={{ ...TYPE.small, mt: 0.25 }}>
            {t("jobsV2.detail.attachedJdHint", { defaultValue: "The employer's full PDF, opens in a new tab" })}
          </Typography>
        </Box>
      </Box>
      <JButton variant="secondary" href={url} external fullWidth startIcon="mdi:open-in-new">
        {t("jobsV2.detail.viewJd", { defaultValue: "View the PDF" })}
      </JButton>
    </JCard>
  );
}
