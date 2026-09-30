"use client";

import { Icon } from "@iconify/react";
import { Box, ButtonBase, Chip, Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

import type { AdminAdaptiveCourseWeekAssessment } from "@/lib/services/admin/admin-adaptive-course.service";

import {
  weekAssessmentHref,
  weekAssessmentSummary,
  weekAssessmentTypeLabel,
} from "./weekAssessmentLinks";

/**
 * A week's checkpoint / final papers, inside the admin course tree.
 *
 * These were invisible here. Assessments hang off the journey layout rather than off the module, and
 * this tree is built from modules, so an admin had no sign that a week even HAD a paper -- while
 * learners were sitting it. Every action an admin asked for (open it, edit its questions, read the
 * submissions and marks) lives on the assessment edit page behind a `?tab=`, so each row links
 * straight there.
 */
export function WeekAssessments({
  assessments,
}: {
  assessments: AdminAdaptiveCourseWeekAssessment[] | undefined;
}) {
  const router = useRouter();
  // Undefined means an older backend that does not report them; empty means the week has none.
  // Neither is worth a row of chrome, so render nothing either way.
  if (!assessments?.length) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 1 }}>
      {assessments.map((a) => {
        const summary = weekAssessmentSummary(a);
        return (
          <Box
            key={a.node_id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
              px: 1.25,
              py: 0.9,
              borderRadius: 2,
              border: "1px solid",
              borderColor: a.is_active ? "rgba(245,158,11,0.35)" : "rgba(239,68,68,0.45)",
              background: a.is_active ? "rgba(245,158,11,0.06)" : "rgba(239,68,68,0.06)",
            }}
          >
            <Icon
              icon={a.type === "week_final" ? "mdi:flag-checkered" : "mdi:clipboard-check-outline"}
              width={16}
              style={{ color: a.is_active ? "#f59e0b" : "#ef4444", flexShrink: 0 }}
            />
            {/* minWidth 0 so a long title truncates instead of pushing the actions off the row. */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{ fontSize: "0.82rem", fontWeight: 800, lineHeight: 1.3 }}
                noWrap
                title={a.title}
              >
                {weekAssessmentTypeLabel(a.type)}: {a.title}
              </Typography>
              {summary && (
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.secondary" }}>
                  {summary}
                </Typography>
              )}
            </Box>
            <Tooltip
              title={
                a.submission_count === 0
                  ? "Nobody has finished this paper yet"
                  : `${a.submission_count} learner${a.submission_count === 1 ? "" : "s"} finished it`
              }
            >
              <Chip
                size="small"
                label={`${a.submission_count} submitted`}
                sx={{ fontSize: "0.7rem", fontWeight: 700, height: 22 }}
              />
            </Tooltip>
            {(
              [
                ["view", "mdi:eye-outline", "View"],
                ["questions", "mdi:playlist-edit", "Questions"],
                ["submissions", "mdi:chart-box-outline", "Submissions & marks"],
              ] as const
            ).map(([action, icon, label]) => (
              <ButtonBase
                key={action}
                onClick={() => router.push(weekAssessmentHref(a, action))}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.4,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  border: "1px solid",
                  borderColor: "divider",
                  flexShrink: 0,
                }}
              >
                <Icon icon={icon} width={14} />
                {label}
              </ButtonBase>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
