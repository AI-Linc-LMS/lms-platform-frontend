"use client";

import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { formatJobPassoutYear } from "@/lib/services/jobs-v2.service";
import { JCard, TYPE, DefinitionList, type DefinitionItem } from "@/components/jobs-v2/ui";

/**
 * `DefinitionList` is a kit primitive (`ui/Surfaces.tsx`); the admin cards render its
 * `columns` layout. `DefinitionRow` stays as the local alias the two admin call sites use.
 */
export type DefinitionRow = DefinitionItem;

const percent = (value: number | null | undefined) =>
  value == null ? null : `${value}%`;

/**
 * All three percentages the create form collects and the detail page rendered NOWHERE, so an
 * admin could not verify the gates they had set without reopening the edit form.
 */
export function EligibilityPanel({ job }: { job: JobV2 }) {
  const { t } = useTranslation("common");
  const passout = formatJobPassoutYear(job.applicable_passout_year);

  const rows: DefinitionRow[] = [
    {
      key: "min_10th",
      label: t("jobsV2.form.min10th", "Minimum 10th %"),
      value: percent(job.min_10th_percentage),
    },
    {
      key: "min_12th",
      label: t("jobsV2.form.min12th", "Minimum 12th %"),
      value: percent(job.min_12th_percentage),
    },
    {
      key: "min_graduation",
      label: t("jobsV2.form.minGraduation", "Minimum graduation %"),
      value: percent(job.min_graduation_percentage),
    },
    // Passout year appears ONCE, here — not once as a hero pill and again as a SectionCard.
    { key: "passout", label: t("jobsV2.form.passoutYear", "Applicable passout year"), value: passout },
    { key: "education", label: t("jobsV2.form.educationLevel", "Education"), value: job.education ?? null },
    { key: "ug", label: t("jobsV2.form.ug", "UG requirements"), value: job.ug_requirements ?? null },
    { key: "pg", label: t("jobsV2.form.pg", "PG requirements"), value: job.pg_requirements ?? null },
    {
      key: "experience",
      label: t("jobsV2.form.experience", "Years of experience"),
      value: job.years_of_experience ?? null,
    },
  ];

  const anyGate = rows.some((row) => row.value);

  return (
    <JCard sx={{ mb: 2 }}>
      <Typography sx={{ ...TYPE.h3, mb: 0.5 }}>
        {t("jobsV2.detail.eligibility", "Eligibility")}
      </Typography>
      <Typography sx={{ ...TYPE.small, mb: 1.5 }}>
        {anyGate
          ? t("jobsV2.detail.eligibilityHint", "A learner must clear every gate below to apply.")
          : t(
              "jobsV2.detail.noGates",
              "No eligibility gates. Everyone in the audience above can apply.",
            )}
      </Typography>
      <DefinitionList
        layout="columns"
        items={rows}
        emptyText={t("jobsV2.detail.nothingRecorded", "Nothing recorded here yet.")}
      />
    </JCard>
  );
}
