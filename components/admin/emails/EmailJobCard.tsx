"use client";

import { Box, Typography, ButtonBase, CircularProgress } from "@mui/material";
import { Icon } from "@iconify/react";
import type { EmailJob } from "@/lib/services/admin/admin-email-jobs.service";
import type { AssessmentEmailJob } from "@/lib/services/admin/admin-assessment-email-jobs.service";

type AnyJob = EmailJob | AssessmentEmailJob;

/** Status → semantic color + icon. Reserved status hues, never the accent. */
export function statusTone(status: string): { color: string; bg: string; icon: string; label: string } {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "success" || s === "sent")
    return { color: "var(--success-500)", bg: "color-mix(in srgb, var(--success-500) 14%, transparent)", icon: "mdi:check-circle", label: status };
  if (s === "failed" || s === "error")
    return { color: "var(--error-500)", bg: "color-mix(in srgb, var(--error-500) 14%, transparent)", icon: "mdi:alert-circle", label: status };
  if (s === "in_progress" || s === "sending")
    return { color: "var(--accent-indigo)", bg: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)", icon: "mdi:progress-clock", label: status };
  return { color: "var(--warning-500)", bg: "color-mix(in srgb, var(--warning-500) 14%, transparent)", icon: "mdi:clock-outline", label: status || "—" };
}

/** How the job was triggered → a small provenance chip. Reminders are the point of the new feature. */
export function triggerChip(source?: string): { label: string; icon: string; color: string } | null {
  if (!source) return null;
  const s = source.toLowerCase();
  if (s.startsWith("reminder")) {
    // reminder_120m -> "2h", 360 -> "6h", 720 -> "12h", 1440 -> "1d"
    const m = /reminder_(\d+)m/.exec(s);
    const map: Record<string, string> = { "120": "2h", "360": "6h", "720": "12h", "1440": "1d" };
    const lead = m ? map[m[1]] ?? `${m[1]}m` : "";
    return { label: lead ? `Reminder · ${lead} before` : "Reminder", icon: "mdi:bell-ring-outline", color: "var(--accent-indigo)" };
  }
  if (s.includes("publish")) return { label: "On publish", icon: "mdi:rocket-launch-outline", color: "#a855f7" };
  if (s.includes("create")) return { label: "On create", icon: "mdi:plus-circle-outline", color: "#0ea5e9" };
  if (s === "manual") return { label: "Manual", icon: "mdi:cursor-default-click-outline", color: "var(--font-secondary)" };
  return null;
}

interface Props {
  job: AnyJob;
  displayName: string;
  createdLabel: string;
  isFailed: boolean;
  retrying: boolean;
  onView: () => void;
  onRetry: () => void;
  /** Assessment jobs carry per-job counts; generic jobs don't. */
  showMetrics?: boolean;
}

function Metric({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }} title={label}>
      <Icon icon={icon} width={15} style={{ color }} />
      <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--font-primary)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", color: "var(--font-tertiary, var(--font-secondary))" }}>{label}</Typography>
    </Box>
  );
}

export function EmailJobCard({ job, displayName, createdLabel, isFailed, retrying, onView, onRetry, showMetrics }: Props) {
  const tone = statusTone(job.status);
  const trig = triggerChip((job as { trigger_source?: string }).trigger_source);
  const aj = job as AssessmentEmailJob;
  const total = aj.total_emails;
  const ok = aj.successful_count;
  const failed = aj.failed_count;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 4,
        border: "1px solid var(--border-default)",
        background: "color-mix(in srgb, var(--card-bg) 75%, transparent)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        height: "100%",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 20px 40px -24px color-mix(in srgb, var(--font-primary) 40%, transparent)",
        },
      }}
    >
      {/* header: name + status pill */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Typography
          sx={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--font-primary)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
          title={displayName}
        >
          {displayName}
        </Typography>
        <Box
          sx={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4, borderRadius: 999, bgcolor: tone.bg }}
        >
          <Icon icon={tone.icon} width={13} style={{ color: tone.color }} />
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: tone.color, textTransform: "capitalize" }}>
            {tone.label}
          </Typography>
        </Box>
      </Box>

      {/* provenance chip */}
      {trig ? (
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, alignSelf: "flex-start", px: 0.9, py: 0.3, borderRadius: 999, border: `1px solid color-mix(in srgb, ${trig.color} 35%, transparent)` }}>
          <Icon icon={trig.icon} width={13} style={{ color: trig.color }} />
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: trig.color }}>{trig.label}</Typography>
        </Box>
      ) : null}

      {/* metrics (assessment jobs only) */}
      {showMetrics && (total != null || ok != null || failed != null) ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 0.25 }}>
          <Metric icon="mdi:account-group-outline" value={total ?? 0} label="recipients" color="var(--accent-indigo)" />
          <Metric icon="mdi:check-circle-outline" value={ok ?? 0} label="sent" color="var(--success-500)" />
          {(failed ?? 0) > 0 ? (
            <Metric icon="mdi:close-circle-outline" value={failed ?? 0} label="failed" color="var(--error-500)" />
          ) : null}
        </Box>
      ) : null}

      {/* footer: created + actions */}
      <Box sx={{ mt: "auto", pt: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography sx={{ fontSize: "0.72rem", color: "var(--font-tertiary, var(--font-secondary))" }} title={createdLabel}>
          {createdLabel}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75 }}>
          {isFailed ? (
            <ButtonBase
              onClick={onRetry}
              disabled={retrying}
              sx={{ px: 1.5, py: 0.6, borderRadius: 999, fontSize: "0.78rem", fontWeight: 700, color: "var(--error-500)", border: "1px solid color-mix(in srgb, var(--error-500) 40%, transparent)", display: "inline-flex", alignItems: "center", gap: 0.5, "&:hover": { bgcolor: "color-mix(in srgb, var(--error-500) 8%, transparent)" } }}
            >
              {retrying ? <CircularProgress size={13} color="inherit" /> : <Icon icon="mdi:refresh" width={14} />}
              Retry
            </ButtonBase>
          ) : null}
          <ButtonBase
            onClick={onView}
            sx={{ px: 1.75, py: 0.6, borderRadius: 999, fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-indigo)", border: "1px solid color-mix(in srgb, var(--accent-indigo) 40%, transparent)", display: "inline-flex", alignItems: "center", gap: 0.5, "&:hover": { bgcolor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" } }}
          >
            <Icon icon="mdi:eye-outline" width={14} />
            View
          </ButtonBase>
        </Box>
      </Box>
    </Box>
  );
}
