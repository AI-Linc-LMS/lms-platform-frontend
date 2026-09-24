"use client";

import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import { InfoButton, RiskCriteriaContent } from "@/components/common/InfoPopover";
import {
  STUDENT_SIGNALS,
  type SegmentKey,
  type SignalKey,
} from "@/lib/utils/student-risk";
import { PHONE_INFO_TAP } from "./mobile";

/**
 * The segment presets on a phone: one scrolling row of 44px pills instead of two wrapped rows
 * of 31px ones, with the "how is this calculated" button grown to a 44px target.
 *
 * The pills come from STUDENT_SIGNALS, the one table the popover is also built from, so the
 * phone can never be missing a chip the popover documents.
 */
export function PhoneStudentSegments({
  segment,
  counts,
  onSegmentChange,
}: {
  segment: SegmentKey;
  /** How many students each chip returns, from the same predicate the filter uses. */
  counts?: Record<SignalKey, number>;
  onSegmentChange: (key: SegmentKey) => void;
}) {
  const { t } = useTranslation("common");
  return (
    <Box data-tour-id="students-segments" data-testid="phone-student-segments" sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, mb: 0.5 }}>
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
          }}
        >
          {t("studentSegments.heading", "Segments")}
        </Typography>
        <Box sx={PHONE_INFO_TAP}>
          <InfoButton ariaLabel={t("studentSegments.infoAriaLabel", "How segments are calculated")}>
            <RiskCriteriaContent />
          </InfoButton>
        </Box>
      </Box>
      <ScrollRow ariaLabel={t("studentSegments.heading", "Segments")}>
        {STUDENT_SIGNALS.map((seg) => {
          const active = segment === seg.key;
          const count = counts?.[seg.key];
          const label = t(seg.labelKey, seg.label);
          return (
            <Box
              key={seg.key}
              component="button"
              type="button"
              aria-pressed={active}
              data-testid={`segment-chip-${seg.key}`}
              onClick={() => onSegmentChange(seg.key)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                minHeight: 44,
                px: 1.75,
                borderRadius: 999,
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                border: "1px solid",
                borderColor: active ? seg.color : "var(--border-default)",
                color: active ? "#fff" : "var(--font-secondary)",
                background: active ? seg.color : "var(--card-bg)",
              }}
            >
              <IconWrapper icon={seg.icon} size={18} />
              {label}
              {count != null && (
                <Box
                  component="span"
                  data-testid={`segment-count-${seg.key}`}
                  aria-label={t("studentSegments.countAria", { defaultValue: "{{count}} students", count })}
                  sx={{
                    ml: 0.25,
                    px: 0.75,
                    borderRadius: 999,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    background: active
                      ? "rgba(255,255,255,0.24)"
                      : "color-mix(in srgb, var(--font-secondary) 14%, transparent)",
                  }}
                >
                  {count}
                </Box>
              )}
            </Box>
          );
        })}
      </ScrollRow>
    </Box>
  );
}
