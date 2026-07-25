"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminLiveActivitiesService,
  GoogleParticipantsResponse,
  GoogleParticipantIdentity,
} from "@/lib/services/admin/admin-live-activities.service";
import { formatDurationSeconds } from "@/lib/utils/date-utils";

interface Props {
  liveClassId: number;
}

const IDENTITY_META: Record<
  GoogleParticipantIdentity,
  { label: string; icon: string; color: string }
> = {
  signed_in: { label: "Google user", icon: "mdi:account-check-outline", color: "var(--success-500)" },
  anonymous: { label: "Guest", icon: "mdi:account-question-outline", color: "var(--warning-500)" },
  phone: { label: "Dial-in", icon: "mdi:phone-outline", color: "var(--font-tertiary)" },
};

/**
 * Google Meet attendance roster (admin/instructor). Unlike Zoom there is NO manual sync - the
 * backend poller fills the roster shortly after the meeting ends. IMPORTANT: the Meet API gives
 * no participant email, so the name is "as it appeared in the meeting" and the enrolled-student
 * link (shown as a chip) is a best-effort NAME match only, absent for guests and dial-ins.
 */
export function GoogleMeetParticipantsSection({ liveClassId }: Props) {
  const { t } = useTranslation("common");
  const [data, setData] = useState<GoogleParticipantsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      setData(await adminLiveActivitiesService.getGoogleParticipants(liveClassId));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const formatDateTimeShort = (s: string | null | undefined) =>
    !s ? "-" : new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const formatTimeOnly = (s: string | null | undefined) =>
    !s ? "-" : new Date(s).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });

  if (loading) {
    return (
      <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const participants = data?.participants ?? [];
  const count = participants.length;
  const syncState = data?.sync_state ?? "pending";
  const syncedAt = data?.synced_at;

  const cellSx = { fontSize: "0.75rem", verticalAlign: "middle" } as const;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          {t("adminLiveSessions.participantsSection", "Participants ({{count}})", { count })}
        </Typography>
      </Box>

      <Typography variant="caption" sx={{ color: "var(--font-tertiary)", mb: 1.5, display: "block" }}>
        {syncedAt
          ? t("adminLiveSessions.lastSynced", { date: formatDateTimeShort(syncedAt) })
          : t("adminLiveSessions.googleRosterAuto", "Fills in automatically a few minutes after the meeting ends.")}
      </Typography>

      {/* State messaging when the table is empty */}
      {count === 0 && syncState === "pending" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
          <CircularProgress size={14} />
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            {t("adminLiveSessions.googleRosterPending", "Waiting for Google to finalize the attendee list after the meeting…")}
          </Typography>
        </Box>
      )}
      {count === 0 && syncState === "synced" && (
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", py: 1 }}>
          {t("adminLiveSessions.googleRosterEmpty", "No participants were recorded for this meeting.")}
        </Typography>
      )}
      {count === 0 && syncState === "unavailable" && (
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", py: 1 }}>
          {t("adminLiveSessions.googleRosterUnavailable", "No attendance is available - the meeting doesn't appear to have taken place.")}
        </Typography>
      )}

      {count > 0 && (
        <>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", mb: 1.5, display: "block", fontStyle: "italic" }}>
            {t("adminLiveSessions.googleRosterHint", "Names are shown as they appeared in Meet. Google doesn't share attendee emails, so the enrolled-student link is a best-effort name match.")}
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ overflow: "hidden" }}>
            <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--surface)" }}>
                  <TableCell sx={{ fontWeight: 600, ...cellSx, width: "28%" }}>{t("adminLiveSessions.name", "Name")}</TableCell>
                  <TableCell sx={{ fontWeight: 600, ...cellSx, width: "18%" }}>{t("adminLiveSessions.type", "Type")}</TableCell>
                  <TableCell sx={{ fontWeight: 600, ...cellSx, width: "14%" }}>{t("adminLiveSessions.join", "Join")}</TableCell>
                  <TableCell sx={{ fontWeight: 600, ...cellSx, width: "14%" }}>{t("adminLiveSessions.leave", "Leave")}</TableCell>
                  <TableCell sx={{ fontWeight: 600, ...cellSx, width: "13%" }}>{t("adminLiveSessions.duration", "Duration")}</TableCell>
                  <TableCell sx={{ fontWeight: 600, ...cellSx, width: "13%" }}>{t("adminLiveSessions.student", "Student")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((p) => {
                  const meta = IDENTITY_META[p.identity_type] ?? IDENTITY_META.signed_in;
                  return (
                    <TableRow key={p.id}>
                      <TableCell
                        sx={{ ...cellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={p.display_name || undefined}
                      >
                        {p.display_name || "-"}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <IconWrapper icon={meta.icon} size={14} color={meta.color} />
                          <span style={{ color: "var(--font-secondary)" }}>{meta.label}</span>
                        </Box>
                      </TableCell>
                      <TableCell sx={cellSx} title={formatDateTimeShort(p.earliest_start_time)}>
                        {formatTimeOnly(p.earliest_start_time)}
                      </TableCell>
                      <TableCell sx={cellSx} title={formatDateTimeShort(p.latest_end_time)}>
                        {formatTimeOnly(p.latest_end_time)}
                      </TableCell>
                      <TableCell sx={cellSx}>{formatDurationSeconds(p.duration_seconds ?? 0)}</TableCell>
                      <TableCell sx={cellSx}>
                        {p.matched_student ? (
                          <Chip
                            size="small"
                            label={p.matched_student.name}
                            title={p.matched_student.email}
                            sx={{ height: 20, fontSize: "0.68rem", bgcolor: "color-mix(in srgb, var(--success-500) 14%, transparent)", color: "var(--success-500)" }}
                          />
                        ) : (
                          <span style={{ color: "var(--font-tertiary)" }}>-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
