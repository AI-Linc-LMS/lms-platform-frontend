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
 * The gates, as one list that both the card and the column planner read.
 *
 * `countEligibilityGates` exists so the planner never has to keep its own copy of these eight
 * fields: a copy would drift, and a drifted estimate is how this page ended up unbalanced in the
 * first place.
 */
const GATES: Array<{
  key: string;
  labelKey: string;
  fallback: string;
  read: (job: JobV2) => string | null;
}> = [
  {
    key: "min_10th",
    labelKey: "jobsV2.form.min10th",
    fallback: "Minimum 10th %",
    read: (job) => percent(job.min_10th_percentage),
  },
  {
    key: "min_12th",
    labelKey: "jobsV2.form.min12th",
    fallback: "Minimum 12th %",
    read: (job) => percent(job.min_12th_percentage),
  },
  {
    key: "min_graduation",
    labelKey: "jobsV2.form.minGraduation",
    fallback: "Minimum graduation %",
    read: (job) => percent(job.min_graduation_percentage),
  },
  // Passout year appears ONCE, here — not once as a hero pill and again as a SectionCard.
  {
    key: "passout",
    labelKey: "jobsV2.form.passoutYear",
    fallback: "Applicable passout year",
    read: (job) => formatJobPassoutYear(job.applicable_passout_year),
  },
  {
    key: "education",
    labelKey: "jobsV2.form.educationLevel",
    fallback: "Education",
    read: (job) => job.education ?? null,
  },
  {
    key: "ug",
    labelKey: "jobsV2.form.ug",
    fallback: "UG requirements",
    read: (job) => job.ug_requirements ?? null,
  },
  {
    key: "pg",
    labelKey: "jobsV2.form.pg",
    fallback: "PG requirements",
    read: (job) => job.pg_requirements ?? null,
  },
  {
    key: "experience",
    labelKey: "jobsV2.form.experience",
    fallback: "Years of experience",
    read: (job) => job.years_of_experience ?? null,
  },
];

/** How many gates this posting actually sets. 0 means the section is one quiet line. */
export function countEligibilityGates(job: JobV2): number {
  return GATES.filter((gate) => {
    const value = gate.read(job);
    return value != null && String(value).trim() !== "";
  }).length;
}

/**
 * All three percentages the create form collects and the detail page rendered NOWHERE, so an
 * admin could not verify the gates they had set without reopening the edit form.
 *
 * The card carries no title of its own: the page draws a `SectionHeader` above it, and a second
 * "Eligibility" inside the card was the same word twice, 28px apart. With no gates at all there
 * is no card either — a bordered box whose whole content is "no gates" cost this column 148px
 * and was a third of the imbalance on a scraped posting.
 */
export function EligibilityPanel({ job }: { job: JobV2 }) {
  const { t } = useTranslation("common");

  const rows: DefinitionRow[] = GATES.map((gate) => ({
    key: gate.key,
    label: t(gate.labelKey, gate.fallback),
    value: gate.read(job),
  }));

  const anyGate = countEligibilityGates(job) > 0;

  if (!anyGate) {
    return (
      <Typography data-quiet-section="" sx={{ ...TYPE.micro, mb: 2 }}>
        {t(
          "jobsV2.detail.noGates",
          "No eligibility gates. Everyone in the audience can apply.",
        )}
      </Typography>
    );
  }

  return (
    <JCard sx={{ mb: 2 }}>
      <Typography sx={{ ...TYPE.small, mb: 1.5 }}>
        {t("jobsV2.detail.eligibilityHint", "A learner must clear every gate below to apply.")}
      </Typography>
      <DefinitionList
        layout="columns"
        items={rows}
        emptyText={t("jobsV2.detail.nothingRecorded", "Nothing recorded here yet.")}
      />
    </JCard>
  );
}
