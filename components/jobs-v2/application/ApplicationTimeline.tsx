"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { JobApplicationV2 } from "@/lib/services/jobs-v2.service";
import { formatDate, toDate } from "@/lib/jobs-v2/format";
import { humanizePipelineValue, resolveAppStatus } from "@/lib/jobs-v2/status";
import { J, R, TYPE } from "@/components/jobs-v2/ui";

/**
 * The application timeline.
 *
 * This is the audit's sharpest finding made visible: `internal_shortlisting`,
 * `shortlisted_by_hr`, `drive`, `round_1`-`round_4`, `offered` and `reason_not_shortlisted` are
 * all on `JobApplicationV2` and **not one of them was ever shown to the learner**. A rejected
 * learner was told "Rejected" and nothing else, on a screen that already had the reason in
 * memory.
 *
 * **Only stages present on the record render.** A job with two rounds must not display an empty
 * "Round 4" — inventing a stage the employer never ran would be a different kind of lie.
 */

export type TimelineState = "done" | "current" | "upcoming" | "missed";

export interface TimelineNode {
  key: string;
  label: string;
  /** The employer's own value for the stage, when it is not a date. */
  value?: string | null;
  /** A date, when the stage's value parsed as one. */
  date?: string | null;
  state: TimelineState;
  icon: string;
}

/** A stage value that reads as a date renders as a date; anything else renders verbatim. */
function splitValue(raw: string): { value: string | null; date: string | null } {
  const trimmed = raw.trim();
  // Only ISO-ish strings: "Yes" and "2 rounds" must never be handed to Date().
  if (/^\d{4}-\d{2}-\d{2}([T ]|$)/.test(trimmed) && toDate(trimmed)) {
    return { value: null, date: formatDate(trimmed) };
  }
  // The same formatter the admin pipeline uses, so "hr selected" is not "HR Selected" on one
  // surface and "hr selected" on the other.
  return { value: humanizePipelineValue(trimmed), date: null };
}

const STAGES: Array<{ key: keyof JobApplicationV2; labelKey: string; fallback: string; icon: string }> = [
  {
    key: "internal_shortlisting",
    labelKey: "jobsV2.timeline.internalShortlisting",
    fallback: "Internal shortlisting",
    icon: "mdi:clipboard-text-search-outline",
  },
  {
    key: "shortlisted_by_hr",
    labelKey: "jobsV2.timeline.shortlistedByHr",
    fallback: "Shortlisted by HR",
    icon: "mdi:account-check-outline",
  },
  { key: "drive", labelKey: "jobsV2.timeline.drive", fallback: "Drive", icon: "mdi:calendar-star" },
  { key: "round_1", labelKey: "jobsV2.timeline.round1", fallback: "Round 1", icon: "mdi:numeric-1-circle-outline" },
  { key: "round_2", labelKey: "jobsV2.timeline.round2", fallback: "Round 2", icon: "mdi:numeric-2-circle-outline" },
  { key: "round_3", labelKey: "jobsV2.timeline.round3", fallback: "Round 3", icon: "mdi:numeric-3-circle-outline" },
  { key: "round_4", labelKey: "jobsV2.timeline.round4", fallback: "Round 4", icon: "mdi:numeric-4-circle-outline" },
  { key: "offered", labelKey: "jobsV2.timeline.offered", fallback: "Offered", icon: "mdi:trophy-outline" },
];

export function buildApplicationTimeline(
  application: JobApplicationV2,
  t: (key: string, options?: object) => string,
): TimelineNode[] {
  const nodes: TimelineNode[] = [
    {
      key: "applied",
      label: t("jobsV2.timeline.applied", { defaultValue: "Applied" }),
      date: application.applied_at ? formatDate(application.applied_at, { withTime: true }) : null,
      state: "done",
      icon: "mdi:send-check-outline",
    },
  ];

  for (const stage of STAGES) {
    const raw = application[stage.key];
    if (typeof raw !== "string" || !raw.trim()) continue;
    const { value, date } = splitValue(raw);
    nodes.push({
      key: String(stage.key),
      label: t(stage.labelKey, { defaultValue: stage.fallback }),
      value,
      date,
      state: "done",
      icon: stage.icon,
    });
  }

  // The tail node states where the application stands right now, from `status` — the one field
  // the learner was ever shown, given the context the other nine give it.
  const status = application.status;
  if (status === "rejected") {
    nodes.push({
      key: "outcome",
      label: t("jobsV2.timeline.notSelected", { defaultValue: "Not selected" }),
      state: "missed",
      icon: "mdi:close-circle-outline",
    });
  } else if (status === "selected") {
    nodes.push({
      key: "outcome",
      label: t("jobsV2.timeline.selected", { defaultValue: "Selected" }),
      state: "done",
      icon: "mdi:trophy-outline",
    });
  } else {
    nodes.push({
      key: "outcome",
      label: t(resolveAppStatus(status).labelKey),
      value: t("jobsV2.timeline.inProgress", { defaultValue: "Where it stands now" }),
      state: "current",
      icon: resolveAppStatus(status).icon,
    });
  }

  return nodes;
}

const TONES: Record<TimelineState, { fg: string; bg: string; bd: string }> = {
  done: { fg: J.successFg, bg: J.successBg, bd: J.successBd },
  current: { fg: J.azureDeep, bg: J.azureSoft, bd: J.azureBorder },
  upcoming: { fg: J.ink3, bg: J.surface2, bd: J.hairline },
  missed: { fg: J.dangerFg, bg: J.dangerBg, bd: J.dangerBd },
};

/**
 * A vertical rail on `xs` and a horizontal one at `md+` — **one tree, one `<ol>`**, with the
 * direction and the connector orientation both chosen by CSS at the breakpoint. No
 * `useMediaQuery`, so there is no orientation snap on hydration (section 7.1).
 */
export function ApplicationTimeline({ nodes }: { nodes: TimelineNode[] }) {
  const { t } = useTranslation("common");

  return (
    <Box
      component="ol"
      aria-label={t("jobsV2.timeline.label", { defaultValue: "Application progress" })}
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { md: "stretch" },
      }}
    >
      {nodes.map((node, index) => {
        const tone = TONES[node.state];
        const last = index === nodes.length - 1;
        return (
          <Box
            component="li"
            key={node.key}
            aria-current={node.state === "current" ? "step" : undefined}
            sx={{
              flex: { md: 1 },
              minWidth: 0,
              display: "flex",
              flexDirection: { xs: "row", md: "column" },
              gap: { xs: 1.5, md: 1 },
              pb: { xs: last ? 0 : 2.5, md: 0 },
            }}
          >
            {/* ---- the rail: marker plus connector ---------------------- */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                alignSelf: { xs: "stretch", md: "auto" },
                width: { md: "100%" },
                flexShrink: 0,
              }}
            >
              <Box
                aria-hidden
                className={node.state === "current" ? "j-grad-hairline" : undefined}
                data-revealed={node.state === "current" ? "true" : undefined}
                sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: tone.bg,
                  color: tone.fg,
                  border: `1px solid ${tone.bd}`,
                  overflow: "hidden",
                }}
              >
                <IconWrapper icon={node.icon} size={18} />
              </Box>
              {!last && (
                <Box
                  aria-hidden
                  sx={{
                    flex: 1,
                    alignSelf: "stretch",
                    width: { xs: 2, md: "auto" },
                    minHeight: { xs: 16, md: 0 },
                    height: { md: 2 },
                    mx: { md: 1 },
                    my: { xs: 0.5, md: 0 },
                    marginInlineStart: { xs: "15px", md: 1 },
                    bgcolor: node.state === "missed" ? J.hairline : J.hairlineStrong,
                    borderRadius: R.pill,
                  }}
                />
              )}
            </Box>

            {/* ---- the content ------------------------------------------ */}
            <Box sx={{ minWidth: 0, pb: { md: 0.5 } }}>
              <Typography sx={{ ...TYPE.h4, color: node.state === "missed" ? J.ink3 : J.ink }}>
                {node.label}
              </Typography>
              {node.value && (
                <Typography sx={{ ...TYPE.small, mt: 0.25, whiteSpace: "pre-wrap" }}>{node.value}</Typography>
              )}
              {node.date && (
                <Typography sx={{ ...TYPE.mono, mt: 0.25, color: J.ink3 }}>{node.date}</Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
