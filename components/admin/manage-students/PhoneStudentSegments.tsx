"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import { InfoButton, RiskCriteriaContent } from "@/components/common/InfoPopover";
import type { SegmentKey } from "@/lib/utils/student-risk";
import { PHONE_INFO_TAP } from "./mobile";

/** The engagement-health presets, shared by the desktop wrap row and the phone scroll row. */
export const STUDENT_SEGMENTS: Array<{ key: SegmentKey; label: string; icon: string; color: string }> = [
  { key: "at_risk", label: "At risk", icon: "mdi:alert-circle-outline", color: "var(--danger-500, #ef4444)" },
  { key: "inactive", label: "Inactive 30d", icon: "mdi:sleep", color: "#f59e0b" },
  { key: "low_completion", label: "Low completion", icon: "mdi:chart-line-variant", color: "#a855f7" },
  { key: "high_performers", label: "High performers", icon: "mdi:trophy-outline", color: "#10b981" },
];

/**
 * The segment presets on a phone: one scrolling row of 44px pills instead of two wrapped rows
 * of 31px ones, with the "how is this calculated" button grown to a 44px target.
 */
export function PhoneStudentSegments({
  segment,
  onSegmentChange,
}: {
  segment: SegmentKey;
  onSegmentChange: (key: SegmentKey) => void;
}) {
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
          Segments
        </Typography>
        <Box sx={PHONE_INFO_TAP}>
          <InfoButton ariaLabel="How segments are calculated">
            <RiskCriteriaContent />
          </InfoButton>
        </Box>
      </Box>
      <ScrollRow ariaLabel="Segments">
        {STUDENT_SEGMENTS.map((seg) => {
          const active = segment === seg.key;
          return (
            <Box
              key={seg.key}
              component="button"
              type="button"
              aria-pressed={active}
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
              {seg.label}
            </Box>
          );
        })}
      </ScrollRow>
    </Box>
  );
}
