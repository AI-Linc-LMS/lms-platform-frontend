"use client";

import { Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface BreadcrumbSegment {
  label: string;
  /** Route to push when clicked; the last segment is usually static (no href). */
  href?: string;
}

/**
 * Compact "Admin › Assessments › …" trail for the assessment-management routes
 * (redesign mockup shell). Deliberately rendered inside the page content - the
 * global AppBar is shared by every role/page and stays untouched.
 */
export function AssessmentBreadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  const router = useRouter();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5, flexWrap: "wrap" }}>
      {segments.map((seg, i) => {
        const last = i === segments.length - 1;
        return (
          <Box key={`${seg.label}-${i}`} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              onClick={() => { if (seg.href) router.push(seg.href); }}
              sx={{
                fontSize: "0.82rem",
                fontWeight: last ? 700 : 500,
                color: last ? "var(--font-primary)" : "var(--font-tertiary)",
                cursor: seg.href ? "pointer" : "default",
                "&:hover": seg.href ? { color: "var(--accent-indigo)", textDecoration: "underline" } : {},
              }}
            >
              {seg.label}
            </Typography>
            {!last ? <IconWrapper icon="mdi:chevron-right" size={15} color="var(--font-tertiary)" /> : null}
          </Box>
        );
      })}
    </Box>
  );
}
