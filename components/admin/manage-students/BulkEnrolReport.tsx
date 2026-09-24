"use client";

import { useMemo } from "react";
import { Box, Button, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ResponsiveDialog } from "@/components/common/mobile/ResponsiveDialog";
import { PHONE } from "@/components/common/mobile/phone";
import type {
  BulkEnrolResponse,
  BulkEnrolResultRow,
  Student,
} from "@/lib/services/admin/admin-student.service";
import { SHEET_BUTTON_SX } from "./mobile";

/* ==========================================================================
 * What a bulk enrol actually did, per learner.
 *
 * Some of a selection is always already enrolled, and some of it is always refused - a learner
 * outside a course manager's scope, a deactivated account, a paid course. A toast reading
 * "37 ok" hides every one of those, so the admin who picked 37 rows never learns that 6 of them
 * got nothing. This is the same information the endpoint already returns, grouped by what
 * happened and by the reason the server gave, with the learners named.
 * ======================================================================== */

export interface BulkEnrolReportProps {
  open: boolean;
  onClose: () => void;
  action: "enroll" | "unenroll";
  report: BulkEnrolResponse | null;
  /** The selection, so a row's student_id can be shown as a name. */
  students: Student[];
  /** Course / batch id -> the name the admin picked. */
  targetName: (row: BulkEnrolResultRow) => string;
}

type Group = { key: string; tone: "good" | "neutral" | "bad"; title: string; names: string[] };

const NAMES_SHOWN = 8;

const TONE_COLOR: Record<Group["tone"], string> = {
  good: "#10b981",
  neutral: "var(--font-secondary)",
  bad: "#ef4444",
};

export function BulkEnrolReport({
  open,
  onClose,
  action,
  report,
  students,
  targetName,
}: BulkEnrolReportProps) {
  const { t } = useTranslation("common");

  const nameFor = useMemo(() => {
    const byId = new Map(students.map((s) => [s.id, s.name || s.email || `#${s.id}`]));
    return (id: number) => byId.get(id) ?? `#${id}`;
  }, [students]);

  const groups = useMemo<Group[]>(() => {
    if (!report) return [];
    const enrolling = action === "enroll";
    const buckets = new Map<string, Group>();
    for (const row of report.results) {
      // An older backend answers without `outcome`; fall back to its status so the dialog still
      // says something true rather than rendering an empty report.
      const outcome = row.outcome ?? (row.status === "ok" ? (enrolling ? "enrolled" : "unenrolled") : "error");
      let tone: Group["tone"] = "neutral";
      let title: string;
      switch (outcome) {
        case "enrolled":
          tone = "good";
          title = t("bulkEnrol.groupEnrolled", { target: targetName(row) });
          break;
        case "unenrolled":
          tone = "good";
          title = t("bulkEnrol.groupUnenrolled", { target: targetName(row) });
          break;
        case "already_enrolled":
          title = t("bulkEnrol.groupAlready", { target: targetName(row) });
          break;
        case "not_enrolled":
          title = t("bulkEnrol.groupNotIn", { target: targetName(row) });
          break;
        default:
          tone = "bad";
          // The server writes these for a person to read; showing its words means a new refusal
          // reason needs no frontend release to be explained.
          title = row.detail || t("bulkEnrol.groupRefusedFallback");
      }
      const key = `${outcome}|${title}`;
      const group = buckets.get(key) ?? { key, tone, title, names: [] };
      const label = nameFor(row.student_id);
      if (!group.names.includes(label)) group.names.push(label);
      buckets.set(key, group);
    }
    const order: Record<Group["tone"], number> = { bad: 0, neutral: 1, good: 2 };
    return [...buckets.values()].sort((a, b) => order[a.tone] - order[b.tone]);
  }, [report, action, nameFor, targetName, t]);

  if (!report) return null;

  const enrolling = action === "enroll";
  const changed = enrolling ? (report.enrolled ?? report.succeeded) : (report.unenrolled ?? report.succeeded);
  const already = (enrolling ? report.already_enrolled : report.not_enrolled) ?? 0;
  const refused = (report.refused ?? 0) + (report.errors ?? 0);

  const tiles: Array<{ label: string; value: number; tone: Group["tone"] }> = [
    { label: enrolling ? t("bulkEnrol.statEnrolled") : t("bulkEnrol.statRemoved"), value: changed, tone: "good" },
    { label: enrolling ? t("bulkEnrol.statAlready") : t("bulkEnrol.statWasNotIn"), value: already, tone: "neutral" },
    { label: t("bulkEnrol.statRefused"), value: refused, tone: "bad" },
  ];

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      data-testid="bulk-enrol-report"
      title={refused > 0 ? t("bulkEnrol.reportTitlePartial") : t("bulkEnrol.reportTitle")}
      description={t("bulkEnrol.reportSubtitle")}
      hideCloseButton
      footer={
        <Button variant="contained" onClick={onClose} sx={SHEET_BUTTON_SX}>
          {t("bulkEnrol.done")}
        </Button>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 1,
          mb: 2,
          // 3 tiles at 360px leave ~104px each; the label wraps rather than pushing the row wide.
          [PHONE]: { gap: 0.75 },
        }}
      >
        {tiles.map((tile) => (
          <Box
            key={tile.label}
            sx={{
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              px: 1.25,
              py: 1,
              minWidth: 0,
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: TONE_COLOR[tile.tone], lineHeight: 1.2 }}>
              {tile.value}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.3,
                color: "var(--font-secondary)",
                overflowWrap: "anywhere",
              }}
            >
              {tile.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {groups.map((group) => (
          <Box
            key={group.key}
            sx={{
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              borderLeft: `3px solid ${TONE_COLOR[group.tone]}`,
              p: 1.25,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.75 }}>
              <IconWrapper
                icon={
                  group.tone === "bad"
                    ? "mdi:alert-circle-outline"
                    : group.tone === "good"
                      ? "mdi:check-circle-outline"
                      : "mdi:information-outline"
                }
                size={18}
              />
              <Typography sx={{ flex: 1, fontWeight: 700, fontSize: "0.9rem", color: "var(--font-primary)", overflowWrap: "anywhere" }}>
                {group.title}
              </Typography>
              <Chip size="small" label={group.names.length} sx={{ fontWeight: 700 }} />
            </Box>
            <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)", overflowWrap: "anywhere" }}>
              {group.names.slice(0, NAMES_SHOWN).join(", ")}
              {group.names.length > NAMES_SHOWN
                ? ` ${t("bulkEnrol.andMore", { n: group.names.length - NAMES_SHOWN })}`
                : ""}
            </Typography>
          </Box>
        ))}
      </Box>
    </ResponsiveDialog>
  );
}
