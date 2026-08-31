"use client";

import { Box, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { JobApplicationV2 } from "@/lib/services/jobs-v2.service";
import { humanizePipelineValue } from "@/lib/jobs-v2/status";
import { J, R, TYPE } from "@/components/jobs-v2/ui";

/* ==========================================================================
 * The interview pipeline — the part of an application that was invisible everywhere.
 *
 * `round_1`-`round_4`, `offered`, `drive`, `internal_shortlisting` and `shortlisted_by_hr` are
 * all on `JobApplicationV2` and none of them was ever rendered outside a modal of seven stacked
 * Selects. This file owns the pipeline's vocabulary (the option lists), its ORDER, and the
 * compact rail that shows the furthest stage reached.
 * ======================================================================== */

export type PipelineField =
  | "drive"
  | "internal_shortlisting"
  | "shortlisted_by_hr"
  | "round_1"
  | "round_2"
  | "round_3"
  | "round_4"
  | "offered";

export interface PipelineOption {
  value: string;
  label: string;
}

export const INTERNAL_SHORTLISTING_OPTIONS: PipelineOption[] = [
  { value: "", label: "-" },
  { value: "ops shortlisted", label: "Ops Shortlisted" },
  { value: "ops not shortlisted", label: "Ops Not Shortlisted" },
];

export const SHORTLISTED_BY_HR_OPTIONS: PipelineOption[] = [
  { value: "", label: "-" },
  { value: "hr selected", label: "HR Selected" },
  { value: "hr rejected", label: "HR Rejected" },
  { value: "in process", label: "In Process" },
];

export const ROUND_1_OPTIONS: PipelineOption[] = [
  { value: "", label: "-" },
  { value: "resume shortlisted", label: "Resume Shortlisted" },
  { value: "test select", label: "Test Select" },
  { value: "technical interview reject", label: "Technical Interview Reject" },
  { value: "test reject", label: "Test Reject" },
  { value: "resume not shortlisted", label: "Resume Not Shortlisted" },
  { value: "technical interview select", label: "Technical Interview Select" },
  { value: "candidate no show", label: "Candidate No Show" },
  { value: "screening round reject", label: "Screening Round Reject" },
  { value: "screening round select", label: "Screening Round Select" },
  { value: "gd round select", label: "GD Round Select" },
  { value: "gd round reject", label: "GD Round Reject" },
];

export const ROUND_2_3_4_OPTIONS: PipelineOption[] = [
  { value: "", label: "-" },
  { value: "resume shortlisted", label: "Resume Shortlisted" },
  { value: "test select", label: "Test Select" },
  { value: "technical interview reject", label: "Technical Interview Reject" },
  { value: "test reject", label: "Test Reject" },
  { value: "resume not shortlisted", label: "Resume Not Shortlisted" },
  { value: "technical interview select", label: "Technical Interview Select" },
  { value: "candidate no show", label: "Candidate No Show" },
  { value: "screen reject", label: "Screen Reject" },
  { value: "hr interview select", label: "HR Interview Select" },
  { value: "hr interview reject", label: "HR Interview Reject" },
  { value: "manager round select", label: "Manager Round Select" },
  { value: "manager round reject", label: "Manager Round Reject" },
  { value: "offer accepted", label: "Offer Accepted" },
  { value: "offer rejected", label: "Offer Rejected" },
];

export const OFFERED_OPTIONS: PipelineOption[] = [
  { value: "", label: "-" },
  { value: "offer accepted", label: "Offer Accepted" },
  { value: "offer rejected", label: "Offer Rejected" },
];

export interface PipelineStage {
  field: Exclude<PipelineField, "drive">;
  labelKey: string;
  fallback: string;
  options: PipelineOption[];
  /** What "advance this candidate one stage" writes into the field. */
  advanceValue: string;
}

/**
 * SIX segments. `drive` is a free-text drive NAME, not a stage, and `offered` is an OUTCOME
 * rather than a round — it is rendered as a trailing pill beside the rail so nothing is lost.
 */
export const PIPELINE_STAGES: PipelineStage[] = [
  {
    field: "internal_shortlisting",
    labelKey: "jobsV2.pipeline.internal",
    fallback: "Internal",
    options: INTERNAL_SHORTLISTING_OPTIONS,
    advanceValue: "ops shortlisted",
  },
  {
    field: "shortlisted_by_hr",
    labelKey: "jobsV2.pipeline.hr",
    fallback: "HR",
    options: SHORTLISTED_BY_HR_OPTIONS,
    advanceValue: "hr selected",
  },
  {
    field: "round_1",
    labelKey: "jobsV2.pipeline.round1",
    fallback: "Round 1",
    options: ROUND_1_OPTIONS,
    advanceValue: "test select",
  },
  {
    field: "round_2",
    labelKey: "jobsV2.pipeline.round2",
    fallback: "Round 2",
    options: ROUND_2_3_4_OPTIONS,
    advanceValue: "technical interview select",
  },
  {
    field: "round_3",
    labelKey: "jobsV2.pipeline.round3",
    fallback: "Round 3",
    options: ROUND_2_3_4_OPTIONS,
    advanceValue: "technical interview select",
  },
  {
    field: "round_4",
    labelKey: "jobsV2.pipeline.round4",
    fallback: "Round 4",
    options: ROUND_2_3_4_OPTIONS,
    advanceValue: "hr interview select",
  },
];

export const OFFERED_STAGE: PipelineStage = {
  field: "offered",
  labelKey: "jobsV2.pipeline.offered",
  fallback: "Offered",
  options: OFFERED_OPTIONS,
  advanceValue: "offer accepted",
};

const filled = (value: string | undefined | null) => Boolean(value && String(value).trim());

/** The index of the furthest stage that carries a value; -1 when the pipeline has not started. */
export function furthestStageIndex(app: JobApplicationV2): number {
  let index = -1;
  PIPELINE_STAGES.forEach((stage, i) => {
    if (filled(app[stage.field] as string | undefined)) index = i;
  });
  return index;
}

/**
 * The next stage to write when advancing, or `null` when the candidate is already at the end.
 * `offered` is the terminal stage, reached only after all six rail stages carry a value.
 */
export function nextStage(app: JobApplicationV2): PipelineStage | null {
  const index = furthestStageIndex(app);
  if (index < PIPELINE_STAGES.length - 1) return PIPELINE_STAGES[index + 1];
  if (!filled(app.offered)) return OFFERED_STAGE;
  return null;
}

/** The human label for a stored pipeline value, falling back to the raw value. */
export function optionLabel(options: PipelineOption[], value: string | undefined): string | null {
  if (!filled(value)) return null;
  // A value the option list does not know (the API is free to add one) is humanised by the same
  // formatter the learner's timeline uses, rather than dumped raw on one surface only.
  return options.find((o) => o.value === value)?.label ?? humanizePipelineValue(String(value));
}

export interface PipelineRailProps {
  app: JobApplicationV2;
  /** Below `md` the rail collapses to a single "Round 2 of 4" line. */
  compact?: boolean;
}

export function PipelineRail({ app, compact }: PipelineRailProps) {
  const { t } = useTranslation("common");
  const reached = furthestStageIndex(app);
  const offeredLabel = optionLabel(OFFERED_OPTIONS, app.offered);

  const currentLabel =
    reached === -1
      ? (t("jobsV2.pipeline.notStarted", "Not started") as string)
      : `${t(PIPELINE_STAGES[reached].labelKey, PIPELINE_STAGES[reached].fallback)} · ${
          optionLabel(
            PIPELINE_STAGES[reached].options,
            app[PIPELINE_STAGES[reached].field] as string | undefined,
          ) ?? ""
        }`;

  const railDescription = t(
    "jobsV2.pipeline.railLabel",
    "Pipeline: {{reached}} of {{total}} stages recorded. Furthest: {{current}}",
    {
      reached: reached + 1,
      total: PIPELINE_STAGES.length,
      current: currentLabel,
    },
  ) as string;

  if (compact) {
    return (
      <Typography sx={TYPE.micro} title={railDescription}>
        {currentLabel}
        {offeredLabel ? ` · ${offeredLabel}` : ""}
      </Typography>
    );
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Tooltip title={railDescription}>
        <Box
          role="img"
          aria-label={railDescription}
          sx={{ display: "flex", gap: 0.5, alignItems: "center", mb: 0.5 }}
        >
          {PIPELINE_STAGES.map((stage, index) => {
            const done = index <= reached;
            return (
              <Box
                key={stage.field}
                sx={{
                  width: 16,
                  height: 3,
                  borderRadius: R.pill,
                  bgcolor: done ? J.azure : J.hairlineStrong,
                }}
              />
            );
          })}
          {offeredLabel && (
            <Box
              sx={{
                width: 16,
                height: 3,
                borderRadius: R.pill,
                bgcolor: app.offered === "offer accepted" ? J.successFg : J.warnFg,
              }}
            />
          )}
        </Box>
      </Tooltip>
      <Typography sx={{ ...TYPE.micro, color: reached === -1 ? J.ink4 : J.ink2 }}>
        {currentLabel}
      </Typography>
      {offeredLabel && (
        <Typography sx={{ ...TYPE.micro, color: J.successFg }}>{offeredLabel}</Typography>
      )}
    </Box>
  );
}
