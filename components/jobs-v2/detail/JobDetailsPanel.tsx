"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { formatJobPassoutYear, type JobV2 } from "@/lib/services/jobs-v2.service";
import {
  applyDomain,
  deadlineLabel,
  formatCount,
  formatDate,
  formatEmploymentType,
  formatSalary,
  formatWorkMode,
} from "@/lib/jobs-v2/format";
import {
  J,
  R,
  TYPE,
  JCard,
  JButton,
  MicroRuleList,
  DefinitionList,
  Notice,
  type DefinitionItem,
} from "@/components/jobs-v2/ui";
import { Prose } from "./StructuredDescription";

/* `DefinitionList` and `DefinitionItem` now live in the kit (`ui/Surfaces.tsx`). The admin
 * detail page had written a second one; there is one component with two layouts. */

/* ==========================================================================
 * Role snapshot — the chipped-metadata block whose shape Indian students recognise.
 *
 * **The missing-field rule, and its one deliberate asymmetry.** On a card a missing field is
 * omitted: no dash, no "Not specified", no empty slot, because a row of placeholders costs a
 * line each and teaches the eye nothing. In a label/value block the labels ARE the structure, so
 * a silently absent row makes the reader wonder whether we failed to load it.
 *
 * So exactly one row opts in: **salary**, which is a free-text field the enrichment fills only
 * when the posting states it, and which most of our rows do not carry. "Not disclosed" is a fact
 * about the posting. Everything else is omitted when absent — an unstated experience range is
 * not "not disclosed", it is *absent*, and printing a row for it would imply we asked.
 * ======================================================================== */

export interface JobDetailsPanelProps {
  job: JobV2;
  /** Two at `md+` inside the wide pane; one in the narrow page rail. */
  columns?: 1 | 2;
  /** The attached JD renders as a row inside the snapshot when this is true. */
  includeJd?: boolean;
  /**
   * `false` when a `SectionHeader` on the canvas already names the block — the pane's layout.
   * The sidebar card keeps its own title, because there is no canvas beside it to put one on.
   */
  showHeading?: boolean;
  sx?: SxProps<Theme>;
}

export function JobDetailsPanel({
  job,
  columns = 1,
  includeJd = false,
  showHeading = true,
  sx,
}: JobDetailsPanelProps) {
  const { t } = useTranslation("common");
  const passout = formatJobPassoutYear(job.applicable_passout_year);
  const deadline = deadlineLabel(job.application_deadline);
  const notDisclosed = t("jobsV2.detail.notDisclosed", { defaultValue: "Not disclosed" }) as string;

  const items: DefinitionItem[] = [];
  const push = (key: string, label: string, value: ReactNode, icon?: string, tone?: string) => {
    if (value === null || value === undefined || value === "") return;
    items.push({ key, label, value, icon, tone });
  };

  push(
    "roleCategory",
    t("jobsV2.detail.roleCategory", { defaultValue: "Role category" }) as string,
    job.role_category,
    "mdi:shape-outline",
  );
  push(
    "department",
    t("jobsV2.detail.department", { defaultValue: "Department" }) as string,
    job.department,
    "mdi:sitemap-outline",
  );
  push(
    "industry",
    t("jobsV2.detail.industry", { defaultValue: "Industry" }) as string,
    job.industry_type,
    "mdi:domain",
  );
  push(
    "employment",
    t("jobsV2.detail.employmentType", { defaultValue: "Employment type" }) as string,
    formatEmploymentType(job.employment_type),
    "mdi:briefcase-outline",
  );
  // Never inferred from a location. An unstated mode is simply absent.
  push(
    "workMode",
    t("jobsV2.detail.workMode", { defaultValue: "Work mode" }) as string,
    formatWorkMode(job.work_mode),
    "mdi:home-city-outline",
  );
  push(
    "education",
    t("jobsV2.detail.education", { defaultValue: "Education" }) as string,
    job.education,
    "mdi:school-outline",
  );
  push(
    "ug",
    t("jobsV2.detail.ugRequirements", { defaultValue: "UG" }) as string,
    job.ug_requirements,
    "mdi:school-outline",
  );
  push(
    "pg",
    t("jobsV2.detail.pgRequirements", { defaultValue: "PG" }) as string,
    job.pg_requirements,
    "mdi:school-outline",
  );
  push(
    "passout",
    t("jobsV2.detail.passout", { defaultValue: "Applicable passout year" }) as string,
    passout,
    "mdi:calendar-account-outline",
  );
  if (job.number_of_openings != null && job.number_of_openings > 0) {
    push(
      "openings",
      t("jobsV2.detail.openings", { defaultValue: "Openings" }) as string,
      formatCount(job.number_of_openings),
      "mdi:account-multiple-outline",
    );
  }
  if (deadline) {
    push(
      "deadline",
      t("jobsV2.detail.closingDate", { defaultValue: "Closing date" }) as string,
      formatDate(job.application_deadline),
      "mdi:calendar-clock-outline",
      deadline.urgency === "urgent" || deadline.urgency === "past"
        ? J.dangerFg
        : deadline.urgency === "soon"
          ? J.warnFg
          : undefined,
    );
  }

  /**
   * The one row that states its own absence, and the only place the string "Not disclosed"
   * appears in this module. Rendered verbatim as the admin or the posting typed it — we never
   * parse it, never convert a currency, and never build a range facet over it.
   */
  items.push({
    key: "salary",
    label: t("jobsV2.detail.salary", { defaultValue: "Salary" }) as string,
    value: formatSalary(job.salary),
    icon: "mdi:cash-multiple",
    emptyValue: notDisclosed,
  });

  const jdRow = includeJd && job.jd_file_url ? <AttachedJdRow url={job.jd_file_url} /> : null;

  return (
    <JCard sx={sx} data-tour-id="jobs-role-snapshot">
      {showHeading && (
        <Typography component="h2" sx={{ ...TYPE.h3, mb: 1 }}>
          {t("jobsV2.detail.roleSnapshot", { defaultValue: "Role snapshot" })}
        </Typography>
      )}
      <DefinitionList items={items} columns={columns} />
      {jdRow && <Box sx={{ mt: 1.5 }}>{jdRow}</Box>}
    </JCard>
  );
}

/* ==========================================================================
 * Requirements — the eligibility gates, as micro-rule bullets.
 *
 * `min_10th_percentage`, `min_12th_percentage` and `min_graduation_percentage` are collected by
 * the admin create form and were rendered NOWHERE, on either side of the module. A learner
 * could not see the bar they were being measured against.
 *
 * This survives alongside `EligibilityChecklist`: the checklist prints the student's own value
 * beside each requirement and needs a verdict to do it, while this list states the employer's
 * gates on their own and renders for a reader we know nothing about.
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
 * About {company} — exactly what we hold, and nothing else.
 *
 * We have `company_name`, `company_logo`, `company_info`, `department`, `industry_type` and the
 * apply destination domain. That is the panel.
 *
 * **Explicitly not shown:** a star rating, a review count, employee count, funding stage,
 * investor badges, "actively hiring", response-time claims. We have no AmbitionBox or Glassdoor
 * licence, no review corpus and no recruiter-side telemetry. Naukri gives ratings prime real
 * estate and an Indian student's eye goes there second; we cannot follow, and a fabricated 3.7
 * is the single most damaging thing that could go on this page.
 * ======================================================================== */

export function CompanyPanel({ job, sx }: { job: JobV2; sx?: SxProps<Theme> }) {
  const { t } = useTranslation("common");
  const domain = applyDomain(job.apply_link);
  const info = String(job.company_info ?? "").trim();

  if (!info && !domain) return null;

  return (
    <JCard sx={sx}>
      {info && <Prose text={info} />}
      {domain && (
        <Typography sx={{ ...TYPE.small, mt: info ? 1.5 : 0 }}>
          {t("jobsV2.detail.applicationsGoTo", {
            defaultValue: "Applications go to {{domain}}.",
            domain,
          })}
        </Typography>
      )}
    </JCard>
  );
}

/* ==========================================================================
 * The safety notice.
 *
 * In Naukri's spirit, and doubling as an honest explanation of the hand-off: an external apply
 * leaves our platform, and the student should know that before they click rather than after.
 * ======================================================================== */

export function SafetyNotice({ sx }: { sx?: SxProps<Theme> }) {
  const { t } = useTranslation("common");
  return (
    <Notice
      tone="quiet"
      icon="mdi:shield-check-outline"
      title={t("jobsV2.detail.safetyTitle", { defaultValue: "Applying is always free" }) as string}
      body={
        t("jobsV2.detail.safetyBody", {
          defaultValue:
            "AI Linc never asks for money for a job or an interview. You apply on the employer's own site — we do not collect a fee and we do not receive your application.",
        }) as string
      }
      sx={sx}
    />
  );
}

/* ==========================================================================
 * The attached JD.
 *
 * The file glyph sat on `var(--error-500)` — the app's ERROR red, used decoratively, so an
 * attached PDF read as a failed upload. It is `J.ink3` on the inert surface rung now.
 * ======================================================================== */

/** The compact row form, for use inside the Role snapshot card. */
export function AttachedJdRow({ url }: { url: string }) {
  const { t } = useTranslation("common");
  return (
    <JButton variant="secondary" href={url} external fullWidth startIcon="mdi:file-pdf-box">
      {t("jobsV2.detail.viewJd", { defaultValue: "View the PDF" })}
    </JButton>
  );
}

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
