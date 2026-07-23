"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  type EmailTrigger,
  type LiveSessionEmailStatus,
} from "@/lib/services/admin/admin-live-activities.service";

const STATUS_TONE: Record<EmailTrigger["status"], string> = {
  scheduled: "var(--accent-indigo, #6366f1)",
  sent: "var(--success-500, #5fa564)",
  failed: "var(--error-500, #ea4335)",
  cancelled: "var(--font-tertiary, #6b7280)",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/** Manual/configurable live-session emails: an auto-reminders opt-in toggle, a "Send now" +
 *  schedule-a-time trigger, and the full send status (invite/reminders + each scheduled/sent send). */
export function LiveSessionEmailPanel({ liveClassId }: { liveClassId: number }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<LiveSessionEmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await adminLiveActivitiesService.getEmailStatus(liveClassId));
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(
    async (fn: () => Promise<unknown>, okMsg: string) => {
      setBusy(true);
      try {
        await fn();
        showToast(okMsg, "success");
        await load();
      } catch {
        showToast("Something went wrong — please try again.", "error");
      } finally {
        setBusy(false);
      }
    },
    [showToast, load],
  );

  if (loading) {
    return (
      <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (!status) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 1, flexWrap: "wrap" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          Emails
        </Typography>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={status.auto_reminders_enabled}
              disabled={busy}
              onChange={(e) =>
                void run(
                  () => adminLiveActivitiesService.triggerEmail(liveClassId, { auto_reminders_enabled: e.target.checked }),
                  e.target.checked ? "Auto reminders on" : "Auto reminders off",
                )
              }
            />
          }
          label={<Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>Auto reminders (24h + 1h)</Typography>}
        />
      </Box>

      <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 1.5 }}>
        Emails are manual by default — nothing is sent unless you trigger it here (or turn on auto reminders).
      </Typography>

      {/* Trigger controls */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Button
          size="small"
          variant="contained"
          disabled={busy}
          startIcon={<IconWrapper icon="mdi:email-fast-outline" size={15} />}
          onClick={() =>
            void run(() => adminLiveActivitiesService.triggerEmail(liveClassId, { send_now: true }), "Email sending…")
          }
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
        >
          Send email now
        </Button>
        <TextField
          type="datetime-local"
          size="small"
          value={scheduleAt}
          onChange={(e) => setScheduleAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 210 }}
        />
        <Button
          size="small"
          variant="outlined"
          disabled={busy || !scheduleAt}
          startIcon={<IconWrapper icon="mdi:calendar-plus" size={15} />}
          onClick={() =>
            void run(
              () =>
                adminLiveActivitiesService.triggerEmail(liveClassId, {
                  scheduled_times: [new Date(scheduleAt).toISOString()],
                }),
              "Scheduled",
            ).then(() => setScheduleAt(""))
          }
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
        >
          Schedule
        </Button>
      </Box>

      {/* Log: invite + reminders */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1.5 }}>
        {([
          ["Invite", status.invite],
          ["24h reminder", status.reminder_24h],
          ["1h reminder", status.reminder_1h],
        ] as const).map(([label, log]) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.8rem" }}>
            <IconWrapper
              icon={log?.sent_at ? "mdi:email-check-outline" : "mdi:email-outline"}
              size={14}
              color={log?.sent_at ? "var(--success-500)" : "var(--font-tertiary)"}
            />
            <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
              {label}:{" "}
              {log?.sent_at
                ? `${log.recipients_count} recipients · ${fmt(log.sent_at)}${log.failures_count ? ` · ${log.failures_count} failed` : ""}`
                : "not sent"}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Scheduled + sent triggers */}
      {status.triggers.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
            Triggers
          </Typography>
          {status.triggers.map((tr) => (
            <Box
              key={tr.id}
              sx={{
                display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75,
                borderRadius: 2, bgcolor: "var(--card-bg)", border: "1px solid var(--border-default)",
              }}
            >
              <Chip
                label={tr.status}
                size="small"
                sx={{
                  height: 20, fontSize: "0.68rem", fontWeight: 700, textTransform: "capitalize",
                  bgcolor: `color-mix(in srgb, ${STATUS_TONE[tr.status]} 15%, transparent)`,
                  color: STATUS_TONE[tr.status],
                }}
              />
              <Typography variant="caption" sx={{ color: "var(--font-secondary)", flexGrow: 1 }}>
                {tr.status === "sent"
                  ? `${tr.recipients_count} recipients · ${fmt(tr.sent_at)}`
                  : `for ${fmt(tr.scheduled_for)}`}
              </Typography>
              {tr.status === "scheduled" && (
                <Button
                  size="small"
                  color="inherit"
                  disabled={busy}
                  onClick={() =>
                    void run(() => adminLiveActivitiesService.cancelEmailTrigger(liveClassId, tr.id), "Cancelled")
                  }
                  sx={{ minWidth: 0, px: 1, fontSize: "0.68rem", textTransform: "none", color: "var(--font-secondary)" }}
                >
                  Cancel
                </Button>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
