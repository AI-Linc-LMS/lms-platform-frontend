"use client";

import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  enforcedOnly,
  statedOnly,
  type CheckStatus,
  type EligibilityCheck,
  type EligibilitySummary,
} from "@/lib/jobs-v2/eligibility";
import { J, R, TYPE, focusRing } from "./jobsTokens";
import { JCard } from "./Surfaces";
import { JButton } from "./JButton";

export type { CheckStatus, EligibilityCheck, EligibilitySummary };

/**
 * "Can I actually apply to this?" — the section none of the five boards we benchmarked has, and
 * the first question every Indian student asks.
 *
 * We own the rule and its inputs, so we print both: what the role asks for, and what is on the
 * student's own profile, side by side, with a deep link to the field that fixes a gap. A gate
 * you cannot act on is just a rejection.
 *
 * **The enforcement distinction is not optional.** `get_eligible_to_apply` checks courses and
 * college mappings only; the passout year and the three percentage gates are collected, shown,
 * and never enforced at apply time. So the headline verdict and the Apply button's disabled
 * state read ENFORCED checks only, and everything else renders under "Stated by the employer"
 * with the honest framing. Telling a student "you are not eligible" when the button in fact
 * works — or the reverse — is worse than showing no card at all.
 */

const STATUS_ICON: Record<CheckStatus, string> = {
  pass: "mdi:check-circle",
  fail: "mdi:alert-circle-outline",
  unknown: "mdi:help-circle-outline",
};

const STATUS_COLOR: Record<CheckStatus, string> = {
  pass: J.successFg,
  fail: J.warnFg,
  unknown: J.ink4,
};

/* ==========================================================================
 * One check row
 * ======================================================================== */

function CheckRow({ check, last }: { check: EligibilityCheck; last: boolean }) {
  const { t } = useTranslation("common");

  const yours =
    check.yours ??
    (t("jobsV2.eligibility.notOnProfile", {
      defaultValue: "not on your profile",
    }) as string);

  return (
    <Box
      component="li"
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        py: 1,
        borderBottom: last ? "none" : `1px solid ${J.hairlineSoft}`,
        minWidth: 0,
      }}
    >
      <Box
        aria-hidden
        sx={{ display: "inline-flex", flexShrink: 0, mt: "1px", color: STATUS_COLOR[check.status] }}
      >
        <IconWrapper icon={STATUS_ICON[check.status]} size={16} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography component="span" sx={{ ...TYPE.bodyStrong, minWidth: 0 }}>
            {check.label}
          </Typography>
          {/* Both inputs, always: what the role asks for, and what we hold. A number a student
              cannot check is a number we do not print. */}
          <Typography component="span" sx={{ ...TYPE.micro, color: J.ink3 }}>
            {t("jobsV2.eligibility.needsYours", {
              requirement: check.requirement,
              yours,
              defaultValue: "needs {{requirement}} · yours {{yours}}",
            })}
          </Typography>
        </Box>

        {/* A gate you cannot act on is just a rejection. */}
        {check.fixHref && check.status !== "pass" && (
          <Box sx={{ mt: 0.5 }}>
            <JButton variant="quiet" size="sm" href={check.fixHref} endIcon="mdi:arrow-right">
              {t("jobsV2.eligibility.addToProfile", { defaultValue: "Add it to your profile" })}
            </JButton>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ==========================================================================
 * EligibilityChecklist — the shortlisting gate table
 * ======================================================================== */

export interface EligibilityChecklistProps {
  checks: EligibilityCheck[];
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * The full gate table, positioned BELOW the requirement bullets on the detail page: it is the
 * shortlisting gate, not part of the pitch. Its summary (`EligibilityCard`) is what sits at the
 * top of the pane.
 */
export function EligibilityChecklist({ checks, sx, ...rest }: EligibilityChecklistProps) {
  const { t } = useTranslation("common");
  if (!checks.length) return null;

  const enforced = enforcedOnly(checks);
  const stated = statedOnly(checks);

  return (
    <Box {...rest} sx={[{ minWidth: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {enforced.length > 0 && (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {enforced.map((check, i) => (
            <CheckRow key={check.key} check={check} last={i === enforced.length - 1} />
          ))}
        </Box>
      )}

      {stated.length > 0 && (
        <Box sx={{ mt: enforced.length ? 2 : 0 }}>
          <Typography sx={{ ...TYPE.label, mb: 0.25 }}>
            {t("jobsV2.eligibility.statedByEmployer", {
              defaultValue: "Stated by the employer",
            })}
          </Typography>
          {/* The honest framing. Without it, a student who fails a percentage gate believes the
              button will not work — and it will. */}
          <Typography sx={{ ...TYPE.micro, color: J.ink4, mb: 0.75 }}>
            {t("jobsV2.eligibility.statedHint", {
              defaultValue:
                "The employer says they check this. We do not block your application on it.",
            })}
          </Typography>
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {stated.map((check, i) => (
              <CheckRow key={check.key} check={check} last={i === stated.length - 1} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

/* ==========================================================================
 * EligibilityCard — the verdict, above everything
 * ======================================================================== */

export interface EligibilityCardProps {
  summary: EligibilitySummary;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

/**
 * Renders `null` when `eligible === null` (signed out, no profile) **or** when there are no
 * checks. We never print a judgement of a student whose data we do not have, and a verdict with
 * nothing behind it is a claim we cannot show the working for.
 */
export function EligibilityCard({ summary, sx, ...rest }: EligibilityCardProps) {
  const { t } = useTranslation("common");

  if (summary.eligible === null || summary.checks.length === 0) return null;

  const eligible = summary.eligible;
  const headline = eligible
    ? (t("jobsV2.eligibility.canApply", { defaultValue: "You can apply to this role" }) as string)
    : (t("jobsV2.eligibility.cannotApply", {
        defaultValue: "You cannot apply to this role yet",
      }) as string);

  const tone = eligible ? J.successFg : J.warnFg;

  return (
    <JCard
      {...rest}
      accent={eligible ? "azure" : "none"}
      role="region"
      aria-label={t("jobsV2.eligibility.regionLabel", { defaultValue: "Eligibility" }) as string}
      sx={[
        {
          borderColor: eligible ? J.azureBorder : J.warnBd,
          borderStyle: eligible ? "solid" : "dashed",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
        <Box
          aria-hidden
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: R.ctl,
            bgcolor: eligible ? J.successBg : J.warnBg,
            color: tone,
          }}
        >
          <IconWrapper icon={eligible ? "mdi:check" : "mdi:alert-outline"} size={18} />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ ...TYPE.h3, color: tone }}>{headline}</Typography>

          {/* The named blocking criterion. "Not eligible" with no reason is a dead end. */}
          {!eligible && summary.reason && (
            <Typography sx={{ ...TYPE.small, mt: 0.25 }}>{summary.reason}</Typography>
          )}

          {/* Why this role is in this student's list at all — backed by the actual rule. */}
          {summary.visibilityReason && (
            <Typography sx={{ ...TYPE.small, mt: 0.25, color: J.ink3 }}>
              {summary.visibilityReason}
            </Typography>
          )}
        </Box>
      </Box>

      <EligibilityChecklist checks={summary.checks} sx={{ mt: 1.5 }} />
    </JCard>
  );
}

/**
 * The compact "Eligible" / "Not eligible" line for a surface with no room for the card — the
 * hero bar, say. It reads ENFORCED state only, exactly like the Apply button.
 */
export function EligibilityBadgeLine({ summary }: { summary: EligibilitySummary }) {
  const { t } = useTranslation("common");
  if (summary.eligible === null) return null;
  const eligible = summary.eligible;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        ...TYPE.micro,
        // TYPE.micro carries the muted ink; the verdict's own colour has to win.
        color: eligible ? J.successFg : J.warnFg,
        ...focusRing,
      }}
      title={summary.reason ?? undefined}
    >
      <IconWrapper icon={eligible ? "mdi:check-circle" : "mdi:alert-circle-outline"} size={14} />
      {eligible
        ? (t("jobsV2.eligibility.eligible", { defaultValue: "Eligible" }) as string)
        : (t("jobsV2.notEligible", { defaultValue: "Not eligible to apply" }) as string)}
    </Box>
  );
}
