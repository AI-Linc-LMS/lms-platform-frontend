"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  HairlineStrip,
  J,
  R,
  TYPE,
  type StripItem,
} from "@/components/jobs-v2/ui";
import { APP_STATUS } from "@/lib/jobs-v2/status";
import { formatCount } from "@/lib/jobs-v2/format";
import type { JobApplicationV2 } from "@/lib/services/jobs-v2.service";

/**
 * The progression stages, in order. `applying` (started, never finished) and `rejected`
 * (terminal, and reachable from any stage) are outcomes rather than steps, so they are reported
 * beside the funnel instead of inside it.
 */
export const FUNNEL_ORDER = ["applied", "shortlisted", "interview_stage", "selected"] as const;
export type FunnelStage = (typeof FUNNEL_ORDER)[number];

export interface ApplicationsAggregate {
  /** Every application counted, whatever its state. */
  total: number;
  /** Started but never confirmed as submitted. */
  applying: number;
  /** How many applications got at least as far as each stage. */
  reached: Record<FunnelStage, number>;
  rejected: number;
  /** Whole days from `applied_at` to the first recorded movement, per application. */
  responseDays: number[];
}

export function emptyAggregate(): ApplicationsAggregate {
  return {
    total: 0,
    applying: 0,
    reached: { applied: 0, shortlisted: 0, interview_stage: 0, selected: 0 },
    rejected: 0,
    responseDays: [],
  };
}

const filled = (value?: string | null) => Boolean(value && value.trim());

/**
 * How far an application actually got.
 *
 * A current status alone cannot answer this: a rejected candidate may have been rejected after
 * round 3. The record carries `internal_shortlisting`, `shortlisted_by_hr`, `round_1..4` and
 * `offered`, so the furthest stage reached is **read**, never inferred from the status word.
 * That is why "Rejected" does not silently zero out the middle of the funnel.
 */
export function reachedStages(app: JobApplicationV2): Record<FunnelStage, boolean> {
  const status = app.status;
  const applied = status !== "applying";
  const shortlisted =
    applied &&
    (status === "shortlisted" ||
      status === "interview_stage" ||
      status === "selected" ||
      filled(app.internal_shortlisting) ||
      filled(app.shortlisted_by_hr));
  const interview =
    applied &&
    (status === "interview_stage" ||
      status === "selected" ||
      filled(app.round_1) ||
      filled(app.round_2) ||
      filled(app.round_3) ||
      filled(app.round_4) ||
      filled(app.drive));
  const selected = applied && (status === "selected" || filled(app.offered));
  return {
    applied,
    // A candidate at interview was shortlisted, whether or not the field was filled in.
    shortlisted: shortlisted || interview || selected,
    interview_stage: interview || selected,
    selected,
  };
}

const DAY = 24 * 60 * 60 * 1000;

/** Fold a set of applications into the numbers the report shows. */
export function aggregateApplications(apps: JobApplicationV2[]): ApplicationsAggregate {
  const out = emptyAggregate();
  for (const app of apps) {
    out.total += 1;
    if (app.status === "applying") out.applying += 1;
    if (app.status === "rejected") out.rejected += 1;
    const reached = reachedStages(app);
    for (const stage of FUNNEL_ORDER) if (reached[stage]) out.reached[stage] += 1;

    // "First response" = the first time anyone moved the record off `applied`. When nothing has
    // moved, there is no response to time, and the application is left out of the median
    // rather than counted as an instant one.
    const moved = app.status !== "applied" && app.status !== "applying";
    const from = app.applied_at ? new Date(app.applied_at).getTime() : NaN;
    const to = app.updated_at ? new Date(app.updated_at).getTime() : NaN;
    if (moved && !Number.isNaN(from) && !Number.isNaN(to) && to >= from) {
      out.responseDays.push(Math.max(0, Math.round((to - from) / DAY)));
    }
  }
  return out;
}

export function mergeAggregates(list: ApplicationsAggregate[]): ApplicationsAggregate {
  const out = emptyAggregate();
  for (const one of list) {
    out.total += one.total;
    out.applying += one.applying;
    out.rejected += one.rejected;
    for (const stage of FUNNEL_ORDER) out.reached[stage] += one.reached[stage];
    out.responseDays.push(...one.responseDays);
  }
  return out;
}

/** The median, or `null` when there is nothing to take a median of. Never 0-as-unknown. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export interface ReportFunnelProps {
  aggregate: ApplicationsAggregate;
  /** Names what the funnel is about: a single job, or the whole board. */
  scopeLabel: string;
  /** True while per-job application counts are still arriving. */
  partial?: boolean;
}

/**
 * The funnel. Four progression stages with stage-to-stage conversion, plus the two outcomes
 * that are not steps. Flex boxes and one proportional bar per cell — **no chart library**
 * (spec 10.4).
 */
export function ReportFunnel({ aggregate, scopeLabel, partial }: ReportFunnelProps) {
  const { t } = useTranslation("common");

  const stages = useMemo(
    () =>
      FUNNEL_ORDER.map((stage, index) => {
        const count = aggregate.reached[stage];
        const previous = index === 0 ? null : aggregate.reached[FUNNEL_ORDER[index - 1]];
        const conversion =
          previous === null || previous === 0 ? null : Math.round((count / previous) * 100);
        return {
          stage,
          count,
          conversion,
          share: aggregate.reached.applied > 0 ? count / aggregate.reached.applied : 0,
          tone: APP_STATUS[stage].fg,
        };
      }),
    [aggregate],
  );

  const items = useMemo<StripItem[]>(
    () =>
      stages.map(({ stage, count, conversion, tone }) => ({
        key: stage,
        label: t(APP_STATUS[stage].labelKey) as string,
        value: formatCount(count),
        tone,
        hint:
          conversion === null
            ? (t("jobsV2.reports.funnelStart", "Start of the funnel") as string)
            : (t("jobsV2.reports.conversion", "{{pct}}% from the step before", {
                pct: conversion,
              }) as string),
      })),
    [stages, t],
  );

  return (
    <Box
      component="section"
      aria-label={t("jobsV2.reports.funnelLabel", "Applicant funnel for {{scope}}", {
        scope: scopeLabel,
      }) as string}
    >
      <HairlineStrip items={items} />

      {/* The proportional bars sit in the SAME grid columns, so the shape of the funnel is
          readable without reading four numbers. */}
      <Box
        aria-hidden
        sx={{
          display: "grid",
          // The SAME responsive template HairlineStrip uses, so the bars stay under their
          // numbers when the strip rewraps at xs and sm.
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(3, minmax(0, 1fr))",
            md: `repeat(${FUNNEL_ORDER.length}, minmax(0, 1fr))`,
          },
          gap: 0,
          borderBottom: `1px solid ${J.hairline}`,
        }}
      >
        {stages.map(({ stage, share, tone }) => (
          <Box
            key={stage}
            sx={{
              px: 2,
              py: 1.5,
              borderInlineStart: `1px solid ${J.hairline}`,
              "&:first-of-type": { borderInlineStartColor: "transparent" },
            }}
          >
            <Box sx={{ height: 6, borderRadius: R.pill, bgcolor: J.surface3, overflow: "hidden" }}>
              <Box
                sx={{
                  height: "100%",
                  width: `${Math.round(share * 100)}%`,
                  bgcolor: tone,
                  transition: "width 220ms cubic-bezier(.16,1,.3,1)",
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, mt: 1.5 }}>
        <Typography sx={TYPE.small}>
          {t("jobsV2.reports.stillApplying", "{{n}} started but never submitted", {
            n: formatCount(aggregate.applying),
          })}
        </Typography>
        <Typography sx={TYPE.small}>
          {t("jobsV2.reports.rejectedCount", "{{n}} rejected at some stage", {
            n: formatCount(aggregate.rejected),
          })}
        </Typography>
        {partial && (
          <Typography sx={{ ...TYPE.small, color: J.warnFg }} role="status">
            {t("jobsV2.reports.partial", "Still counting — these numbers are not final yet.")}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
