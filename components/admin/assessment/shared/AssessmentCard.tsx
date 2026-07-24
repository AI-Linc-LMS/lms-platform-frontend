"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { Assessment } from "@/lib/services/admin/admin-assessment.service";
import { StatusChip } from "./AssessmentStatusChip";
import { DifficultyBalanceMeter, type DifficultyBalance } from "./DifficultyBalanceMeter";

/** Derive a display status from the list-item flags/times (no single status field exists). */
export function deriveAssessmentStatus(a: Assessment): {
  key: "draft" | "scheduled" | "closed" | "active" | "inactive";
  label: string;
  tone: "success" | "warning" | "error" | "info" | "neutral";
} {
  if (a.is_draft) return { key: "draft", label: "Draft", tone: "warning" };
  const now = Date.now();
  const start = a.start_time ? new Date(a.start_time).getTime() : null;
  const end = a.end_time ? new Date(a.end_time).getTime() : null;
  if (start && start > now) return { key: "scheduled", label: "Scheduled", tone: "info" };
  if (end && end < now) return { key: "closed", label: "Closed", tone: "neutral" };
  if (a.is_active) return { key: "active", label: "Active", tone: "success" };
  return { key: "inactive", label: "Inactive", tone: "neutral" };
}

function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <Box sx={{ textAlign: "center", flex: 1, minWidth: 0 }}>
      <Typography
        sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.2, color: "var(--font-primary)" }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.78rem" }}>
        {label}
      </Typography>
    </Box>
  );
}

interface AssessmentCardProps {
  assessment: Assessment;
  onClick?: (a: Assessment) => void;
  /** Optional per-row extras the hub may compute. */
  aiAuthored?: boolean;
  difficultyBalance?: DifficultyBalance;
  /** Top-right action slot (e.g. the row overflow menu). */
  actionSlot?: React.ReactNode;
}

const STATUS_ACCENT: Record<string, string> = {
  active: "var(--success-500)",
  scheduled: "var(--accent-indigo)",
  draft: "var(--warning-500)",
  closed: "var(--font-tertiary)",
  inactive: "var(--font-tertiary)",
};

function formatOpens(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * Rich hub card for one assessment: a top status accent bar, status/AI/proctored/paid chips,
 * title + course, question/duration/section mini-stats, and either a difficulty bar or an
 * "Opens …" line for scheduled. Draft cards are visually dashed. Replaces the list table row.
 */
export function AssessmentCard({
  assessment,
  onClick,
  aiAuthored,
  difficultyBalance,
  actionSlot,
}: AssessmentCardProps) {
  const status = deriveAssessmentStatus(assessment);
  const accent = STATUS_ACCENT[status.key];
  const isDraft = status.key === "draft";
  const sections = (assessment.quiz_sections_count || 0) + (assessment.coding_sections_count || 0);
  const course = assessment.courses?.[0]?.title;
  const college = assessment.colleges?.[0];
  const opens = status.key === "scheduled" ? formatOpens(assessment.start_time) : null;
  // Prefer the caller's overrides, else the list-endpoint fields (redesign).
  const aiOn = aiAuthored ?? assessment.is_ai_generated ?? false;
  const balance = difficultyBalance ?? assessment.difficulty_breakdown;
  const hasBalance = !!balance && balance.easy + balance.medium + balance.hard > 0;
  const passRate = assessment.pass_rate;

  return (
    <Box
      onClick={() => onClick?.(assessment)}
      sx={{
        position: "relative",
        borderRadius: "16px",
        bgcolor: "var(--card-bg)",
        border: isDraft
          ? "1.5px dashed color-mix(in srgb, var(--warning-500) 45%, var(--border-default) 55%)"
          : "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s ease, transform 0.15s ease",
        "&:hover": onClick
          ? {
              boxShadow: "0 14px 32px -18px color-mix(in srgb, var(--font-primary) 40%, transparent)",
              transform: "translateY(-2px)",
            }
          : {},
      }}
    >
      {/* status top accent bar (mockup): AI gradient for active, indigo→violet scheduled,
          amber draft, gray closed */}
      <Box
        sx={{
          height: 5,
          background:
            status.key === "active"
              ? "var(--gradient-ai)"
              : status.key === "scheduled"
              ? "linear-gradient(90deg, var(--accent-indigo), var(--ai-violet))"
              : status.key === "draft"
              ? "linear-gradient(90deg, var(--warning-500), color-mix(in srgb, var(--warning-500) 45%, #fff))"
              : "color-mix(in srgb, var(--font-tertiary) 45%, transparent)",
        }}
      />
      {/* header: status + badges + title + course (mockup) */}
      <Box sx={{ px: 2.5, pt: 2.25, pb: isDraft ? 0.5 : 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
            <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: accent }} />
            <Typography sx={{ fontSize: "0.83rem", fontWeight: 700, color: accent }}>
              {status.label}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {aiOn ? (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.4,
                px: 1,
                height: 24,
                borderRadius: 999,
                color: "#fff",
                background: "var(--gradient-ai)",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              <IconWrapper icon="mdi:auto-fix" size={13} /> AI
            </Box>
          ) : null}
          {assessment.proctoring_enabled ? (
            <StatusChip label="Proctored" tone="proctored" icon="mdi:shield-check-outline" />
          ) : null}
          {assessment.is_paid ? <StatusChip label="Paid" tone="warning" icon="mdi:currency-inr" /> : null}
          {actionSlot ? <Box onClick={(e) => e.stopPropagation()}>{actionSlot}</Box> : null}
        </Box>

        <Typography
          sx={{
            fontWeight: 800,
            fontFamily: "var(--font-jakarta)",
            fontSize: "1.2rem",
            color: "var(--font-primary)",
            lineHeight: 1.25,
          }}
        >
          {assessment.title}
        </Typography>
        {course || college ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.6, minWidth: 0 }}>
            <IconWrapper icon="mdi:bookmark-outline" size={15} color="var(--font-tertiary)" />
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {[course, college].filter(Boolean).join(" · ")}
            </Typography>
          </Box>
        ) : null}
      </Box>

      {isDraft ? (
        /* Draft card: amber "continue setup" panel instead of stats (mockup) */
        <Box sx={{ px: 2.5, pb: 2.5, pt: 1.25 }}>
          <Box
            sx={{
              px: 2,
              py: 1.6,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "color-mix(in srgb, var(--warning-500) 13%, var(--card-bg) 87%)",
              color: "var(--warning-600, var(--warning-500))",
            }}
          >
            <IconWrapper icon="mdi:pencil-outline" size={16} />
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, flexGrow: 1 }}>
              Draft: continue setup
            </Typography>
            <IconWrapper icon="mdi:arrow-right" size={17} />
          </Box>
        </Box>
      ) : (
        <>
          {/* mini-stats band - EDGE-TO-EDGE rules + full-height dividers (mockup) */}
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              borderTop: "1px solid var(--border-default)",
              borderBottom: "1px solid var(--border-default)",
              py: 1.5,
            }}
          >
            <MiniStat value={assessment.total_questions ?? 0} label="Questions" />
            <Box sx={{ width: "1px", my: -1.5, bgcolor: "var(--border-default)" }} />
            <MiniStat value={`${assessment.duration_minutes}m`} label="Duration" />
            <Box sx={{ width: "1px", my: -1.5, bgcolor: "var(--border-default)" }} />
            <MiniStat value={sections} label="Sections" />
          </Box>

          {/* footer: opens (scheduled) | submissions + pass% + difficulty bar */}
          <Box sx={{ px: 2.5, pt: 1.75, pb: 2.25 }}>
            {opens ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "var(--accent-indigo)" }}>
                <IconWrapper icon="mdi:calendar-clock" size={17} />
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 700 }}>Opens {opens}</Typography>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: hasBalance ? 1 : 0 }}>
                  <Typography sx={{ fontSize: "0.9rem", color: "var(--font-primary)" }}>
                    {assessment.submissions_count ?? 0} submissions
                  </Typography>
                  {typeof passRate === "number" ? (
                    <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--success-500)", fontFamily: "var(--font-mono)" }}>
                      {passRate}% pass
                    </Typography>
                  ) : null}
                </Box>
                {hasBalance ? <DifficultyBalanceMeter balance={balance!} legend={false} height={8} /> : null}
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
