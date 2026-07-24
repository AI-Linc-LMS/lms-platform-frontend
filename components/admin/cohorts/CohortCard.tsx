"use client";

import { Box, ButtonBase, IconButton, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { CohortListItem, CohortStatus } from "@/lib/services/admin/admin-cohorts.service";

const STATUS: Record<CohortStatus, { label: string; color: string; bar: string }> = {
  draft: { label: "Draft", color: "var(--warning-500, #f59e0b)", bar: "linear-gradient(90deg, #f59e0b, #fbbf24)" },
  scheduled: { label: "Scheduled", color: "var(--accent-indigo, #6366f1)", bar: "linear-gradient(90deg, var(--accent-indigo, #6366f1), var(--ai-violet, #7c3aed))" },
  active: { label: "Active", color: "var(--success-500, #5fa564)", bar: "var(--gradient-ai)" },
  completed: { label: "Completed", color: "var(--tone-proctored, #06b6d4)", bar: "linear-gradient(90deg, #06b6d4, #0ea5e9)" },
  archived: { label: "Archived", color: "var(--font-tertiary, #6b7280)", bar: "linear-gradient(90deg, #9ca3af, #6b7280)" },
};

function MiniStat({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <Box sx={{ flex: 1, px: 1.5, py: 1.25, textAlign: "center" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
        <Icon icon={icon} width={14} style={{ color: "var(--ai-violet, #7c3aed)" }} />
        <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1rem", color: "var(--font-primary)" }}>
          {value}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: "0.68rem", color: "var(--font-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}

export function CohortCard({
  cohort,
  onOpen,
  onArchive,
}: {
  cohort: CohortListItem;
  onOpen: () => void;
  onArchive: () => void;
}) {
  const s = STATUS[cohort.status];
  return (
    <Box
      onClick={onOpen}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
        borderRadius: "16px",
        overflow: "hidden",
        bgcolor: "var(--card-bg)",
        border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.08)",
        transition: "box-shadow 180ms ease, transform 180ms ease",
        "&:hover": {
          boxShadow: "0 14px 32px -18px color-mix(in srgb, var(--font-primary) 40%, transparent)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ height: 5, background: s.bar }} />
      <Box sx={{ p: 2.25, display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: s.color }} />
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: s.color }}>
            {s.label}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {cohort.code && (
            <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--font-tertiary)" }}>
              {cohort.code}
            </Typography>
          )}
          <Box onClick={(e) => e.stopPropagation()}>
            <IconButton size="small" onClick={onArchive} aria-label="Archive cohort" sx={{ color: "var(--font-tertiary)", "&:hover": { color: "var(--error-500, #ea4335)" } }}>
              <Icon icon="mdi:archive-outline" width={17} />
            </IconButton>
          </Box>
        </Box>

        <Typography sx={{ fontFamily: "var(--font-jakarta)", fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.25, color: "var(--font-primary)" }}>
          {cohort.name}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box
          sx={{
            display: "flex",
            mt: 2,
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)",
            "& > *:not(:last-child)": { borderRight: "1px solid color-mix(in srgb, var(--border-default) 55%, transparent)" },
          }}
        >
          <MiniStat icon="mdi:account-multiple" value={cohort.member_count} label="Members" />
          <MiniStat icon="mdi:cube-outline" value={cohort.artifact_count} label="Assignments" />
          <MiniStat
            icon="mdi:calendar-range"
            value={cohort.start_date ? cohort.start_date.slice(5) : "-"}
            label="Starts"
          />
        </Box>

        <ButtonBase
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          sx={{
            mt: 1.75,
            py: 1,
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "0.88rem",
            color: "var(--ai-violet, #7c3aed)",
            border: "1px solid color-mix(in srgb, var(--ai-violet, #7c3aed) 30%, transparent)",
            "&:hover": { bgcolor: "color-mix(in srgb, var(--ai-violet, #7c3aed) 8%, transparent)" },
          }}
        >
          Open
        </ButtonBase>
      </Box>
    </Box>
  );
}
