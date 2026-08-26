"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

import { PageShell } from "@/components/common/PageShell";
import { ModulePageHeader } from "@/components/common/ModulePageHeader";
import { StatStrip } from "@/components/admin/assessment/shared/StatStrip";
import interviewService, { type AdminSessionRow } from "@/lib/services/interview.service";

/**
 * Every realtime interview attempt for this tenant, for the reviewer.
 *
 * The list leads with the two things a reviewer actually scans for: grades that are stuck
 * (failed state) and sittings the integrity checks flagged. Both get filter chips rather
 * than being buried in a column, because "show me everything flagged this week" is the job.
 */

const VERDICT_TONE: Record<string, string> = {
  clean: "var(--accent-green, #16a34a)",
  flagged: "var(--accent-amber, #d97706)",
  failed: "var(--accent-red, #dc2626)",
};

const FILTERS = [
  { key: "", label: "All" },
  { key: "flagged", label: "Flagged" },
  { key: "failed", label: "Integrity failed" },
] as const;

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function gradeText(row: AdminSessionRow): string {
  if (row.status === "voided") return "Voided";
  if (row.grade.state === "graded" && typeof row.grade.percentage === "number") {
    return `${Math.round(row.grade.percentage)}%`;
  }
  if (row.grade.state === "failed") return "Grading stuck";
  if (row.status === "abandoned") return "Abandoned";
  return "Being marked";
}

export default function AdminInterviewSessionsPage() {
  const router = useRouter();
  // Result kept WITH the filter it answers, so "loading" is derived (no synchronous
  // setState inside the effect, which the strict hooks lint rightly flags).
  const [data, setData] = useState<{ verdict: string; rows: AdminSessionRow[] } | null>(null);
  const [verdict, setVerdict] = useState<string>("");
  const [failed, setFailed] = useState(false);
  const rows = data && data.verdict === verdict ? data.rows : null;

  useEffect(() => {
    let cancelled = false;
    interviewService.admin
      .sessions(verdict ? { verdict } : {})
      .then((sessions) => {
        if (!cancelled) setData({ verdict, rows: sessions });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [verdict]);

  const stats = useMemo(() => {
    if (!rows) return null;
    const graded = rows.filter((r) => r.grade.state === "graded");
    const percentages = graded
      .map((r) => r.grade.percentage)
      .filter((p): p is number => typeof p === "number");
    return [
      { label: "Attempts", value: rows.length, icon: "solar:microphone-3-bold-duotone" },
      { label: "Graded", value: graded.length, icon: "solar:check-circle-bold-duotone" },
      {
        label: "Flagged",
        value: rows.filter((r) => r.integrity !== "clean").length,
        icon: "solar:flag-bold-duotone",
        tone: "var(--accent-amber, #d97706)",
      },
      {
        label: "Grading stuck",
        value: rows.filter((r) => r.grade.state === "failed").length,
        icon: "solar:danger-triangle-bold-duotone",
        tone: "var(--accent-red, #dc2626)",
      },
      {
        label: "Average",
        value: percentages.length
          ? `${Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)}%`
          : "—",
        icon: "solar:chart-2-bold-duotone",
      },
    ];
  }, [rows]);

  return (
    <PageShell maxWidth={1180}>
      <ModulePageHeader
        eyebrow="Interview management"
        title="Interview attempts"
        description="Every realtime interview sitting for your learners: how it was graded, what the integrity checks made of it, and the ones that need a reviewer's eyes."
        accent="indigo"
        icon="solar:clipboard-list-bold-duotone"
      />

      {stats ? (
        <Box sx={{ mb: 3 }}>
          <StatStrip items={stats} />
        </Box>
      ) : null}

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        {FILTERS.map((filter) => {
          const active = verdict === filter.key;
          return (
            <Box
              key={filter.key}
              component="button"
              onClick={() => setVerdict(filter.key)}
              sx={{
                all: "unset",
                cursor: "pointer",
                px: 1.75,
                py: 0.6,
                borderRadius: 999,
                fontSize: "0.82rem",
                fontWeight: 500,
                color: active ? "var(--accent-purple)" : "var(--font-secondary)",
                border: "1px solid",
                borderColor: active ? "var(--accent-purple)" : "var(--border-default)",
                bgcolor: active
                  ? "color-mix(in srgb, var(--accent-purple) 8%, transparent)"
                  : "transparent",
                transition: "border-color 150ms ease, background-color 150ms ease",
                "&:focus-visible": {
                  boxShadow: "0 0 0 2px var(--card-bg), 0 0 0 4px var(--accent-purple)",
                },
              }}
            >
              {filter.label}
            </Box>
          );
        })}
      </Box>

      {failed ? (
        <Box
          sx={{
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: "var(--font-secondary)" }}>
            Could not load attempts. Refresh to try again.
          </Typography>
        </Box>
      ) : rows === null ? (
        <Box
          sx={{
            height: 320,
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            opacity: 0.7,
          }}
        />
      ) : rows.length === 0 ? (
        <Box
          sx={{
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            p: 5,
            textAlign: "center",
          }}
        >
          <Icon icon="solar:inbox-line-duotone" width={34} color="var(--font-tertiary)" />
          <Typography sx={{ mt: 1.5, fontWeight: 500, color: "var(--font-primary)" }}>
            No attempts {verdict ? "match this filter" : "yet"}.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--border-default)",
            bgcolor: "var(--card-bg)",
            overflow: "hidden",
          }}
        >
          {rows.map((row) => (
            <Box
              key={row.session_id}
              component="button"
              onClick={() => router.push(`/admin/admin-mock-interview/sessions/${row.session_id}`)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
                px: 2.5,
                py: 1.75,
                cursor: "pointer",
                borderBottom: "1px solid var(--border-default)",
                transition: "background-color 150ms ease",
                "&:last-of-type": { borderBottom: "none" },
                "&:hover": { bgcolor: "var(--hover-bg, rgba(0,0,0,0.03))" },
                "&:focus-visible": {
                  boxShadow: "inset 0 0 0 2px var(--accent-purple)",
                },
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1.4 }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.92rem",
                    color: "var(--font-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.student.name}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)" }}>
                  {row.student.email}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 0, flex: 1.6, display: { xs: "none", md: "block" } }}>
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    color: "var(--font-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.title || row.topic}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)" }}>
                  {dateFormat.format(new Date(row.created_at))}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, width: 96 }}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: VERDICT_TONE[row.integrity] ?? "var(--font-tertiary)",
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)" }}>
                  {row.integrity}
                </Typography>
              </Box>
              <Typography
                sx={{
                  width: 104,
                  textAlign: "right",
                  fontSize: "0.9rem",
                  fontWeight: row.grade.state === "graded" ? 600 : 500,
                  fontFamily: "var(--font-mono, monospace)",
                  fontVariantNumeric: "tabular-nums",
                  color:
                    row.grade.state === "failed"
                      ? "var(--accent-red, #dc2626)"
                      : "var(--font-primary)",
                }}
              >
                {gradeText(row)}
              </Typography>
              <Icon icon="solar:alt-arrow-right-linear" width={16} color="var(--font-tertiary)" />
            </Box>
          ))}
        </Box>
      )}
    </PageShell>
  );
}
