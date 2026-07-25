"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Chip,
  Button,
  Collapse,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MeetingStatusChip } from "@/components/live-sessions/ui/LiveSessionUI";
import {
  adminLiveActivitiesService,
  OccurrenceTimelineResponse,
  RosterStudent,
} from "@/lib/services/admin/admin-live-activities.service";
import { formatDurationSeconds } from "@/lib/utils/date-utils";

function fmtDate(s: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Per-student status for one occurrence - "Missed" only once THAT occurrence has ended. */
function studentStatus(s: RosterStudent, occStatus: string, t: (k: string, d: string) => string) {
  if (s.attended) return { label: t("adminLiveSessions.attended", "Joined"), color: "var(--success-500)" };
  if (occStatus === "ended" || occStatus === "expired")
    return { label: t("adminLiveSessions.missed", "Missed"), color: "var(--warning-500)" };
  if (occStatus === "live")
    return { label: t("adminLiveSessions.notJoinedYet", "Not joined yet"), color: "var(--font-secondary)" };
  return { label: t("adminLiveSessions.upcoming", "Not started"), color: "var(--font-secondary)" };
}

interface Props {
  liveClassId: number;
  onOpenRecording?: (url: string) => void;
}

/**
 * Recurring-series timeline: one card per occurrence (date) showing its status, who joined that
 * specific date (per-occurrence roster) vs missed, and whether its own recording / transcript is
 * ready. Renders nothing for a single (non-recurring) session - the series roster covers those.
 */
export function LiveSessionOccurrenceTimeline({ liveClassId, onOpenRecording }: Props) {
  const { t } = useTranslation("common");
  const [data, setData] = useState<OccurrenceTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await adminLiveActivitiesService.getOccurrenceTimeline(liveClassId));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  useEffect(() => {
    void load();
  }, [load]);

  const syncOne = async (occId: number) => {
    try {
      setSyncingId(occId);
      await adminLiveActivitiesService.syncAttendance(liveClassId, occId);
      await load();
      setOpenId(occId);
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (!data || !data.is_recurring || data.occurrence_count === 0) return null;

  const tableCellSx = { fontSize: "0.72rem", verticalAlign: "middle", py: 0.6 } as const;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconWrapper icon="mdi:calendar-multiselect" size={18} color="var(--accent-indigo)" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
            {t("adminLiveSessions.timelineTitle", "Session timeline")}
          </Typography>
        </Box>
        <Chip
          label={t("adminLiveSessions.timelineCount", "{{count}} sessions", { count: data.occurrence_count })}
          size="small"
          sx={{
            fontWeight: 700,
            fontSize: "0.72rem",
            bgcolor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
            color: "var(--accent-indigo)",
          }}
        />
      </Box>

      <Box sx={{ position: "relative", pl: 2.5 }}>
        {/* vertical spine */}
        <Box
          sx={{
            position: "absolute",
            left: 7,
            top: 6,
            bottom: 6,
            width: 2,
            bgcolor: "color-mix(in srgb, var(--border-default) 90%, transparent)",
          }}
        />
        {data.occurrences.map((occ) => {
          const open = openId === occ.id;
          const ended = occ.status === "ended" || occ.status === "expired";
          const nodeColor =
            occ.status === "live"
              ? "var(--success-500)"
              : ended
                ? "var(--accent-indigo)"
                : "var(--font-secondary)";
          return (
            <Box key={occ.id} sx={{ position: "relative", mb: 1.5 }}>
              {/* timeline node */}
              <Box
                sx={{
                  position: "absolute",
                  left: -2.5 * 8 + 3,
                  top: 14,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: nodeColor,
                  border: "2px solid var(--card-bg)",
                  boxShadow: "0 0 0 2px color-mix(in srgb, var(--border-default) 80%, transparent)",
                }}
              />
              <Paper
                variant="outlined"
                sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "var(--card-bg)" }}
              >
                <Box
                  role="button"
                  onClick={() => setOpenId(open ? null : occ.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.25,
                    cursor: "pointer",
                    flexWrap: "wrap",
                    "&:hover": { bgcolor: "color-mix(in srgb, var(--accent-indigo) 5%, transparent)" },
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--font-primary)" }}>
                    {fmtDate(occ.date)}
                  </Typography>
                  <MeetingStatusChip status={occ.status} />
                  <Box sx={{ flex: 1 }} />
                  <Chip
                    label={t("adminLiveSessions.rosterJoinedOfEnrolled", "{{joined}} of {{enrolled}} joined", {
                      joined: occ.joined_count,
                      enrolled: occ.enrolled_count,
                    })}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      bgcolor:
                        occ.joined_count > 0
                          ? "color-mix(in srgb, var(--success-500) 15%, transparent)"
                          : "color-mix(in srgb, var(--border-default) 40%, transparent)",
                      color: occ.joined_count > 0 ? "var(--success-500)" : "var(--font-secondary)",
                    }}
                  />
                  {occ.has_recording && (
                    <IconWrapper icon="mdi:play-circle" size={16} color="var(--accent-indigo)" />
                  )}
                  {occ.has_transcript && (
                    <IconWrapper icon="mdi:text-box-check" size={16} color="var(--accent-indigo)" />
                  )}
                  <IconWrapper icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} color="var(--font-secondary)" />
                </Box>

                <Collapse in={open} unmountOnExit>
                  <Box sx={{ px: 1.25, pb: 1.25 }}>
                    {occ.enrolled_count === 0 ? (
                      <Typography variant="body2" sx={{ color: "var(--font-secondary)", py: 1 }}>
                        {t("adminLiveSessions.rosterNoStudents", "No students are enrolled in this course yet.")}
                      </Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ overflow: "hidden" }}>
                        <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                          <TableHead>
                            <TableRow sx={{ bgcolor: "var(--surface)" }}>
                              <TableCell sx={{ fontWeight: 700, ...tableCellSx, width: "40%" }}>
                                {t("adminLiveSessions.name", "Name")}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, ...tableCellSx, width: "36%" }}>
                                {t("adminLiveSessions.email", "Email")}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, ...tableCellSx, width: "12%" }}>
                                {t("adminLiveSessions.status", "Status")}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, ...tableCellSx, width: "12%" }}>
                                {t("adminLiveSessions.duration", "Duration")}
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[...occ.students]
                              .sort((a, b) => Number(b.attended) - Number(a.attended))
                              .map((s) => {
                                const st = studentStatus(s, occ.status, t);
                                return (
                                  <TableRow key={s.user_profile_id}>
                                    <TableCell sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.name}>
                                      {s.name}
                                    </TableCell>
                                    <TableCell sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.email}>
                                      {s.email}
                                    </TableCell>
                                    <TableCell sx={tableCellSx}>
                                      <Chip
                                        label={st.label}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: "0.68rem",
                                          fontWeight: 600,
                                          bgcolor: `color-mix(in srgb, ${st.color} 16%, transparent)`,
                                          color: st.color,
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell sx={tableCellSx}>
                                      {s.attended ? formatDurationSeconds(s.duration_seconds) : "-"}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}

                    {occ.unmatched_participants.length > 0 && (
                      <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontStyle: "italic", display: "block", mt: 1 }}>
                        {t("adminLiveSessions.rosterUnmatched", "Unmatched participants ({{count}})", {
                          count: occ.unmatched_participants.length,
                        })}
                      </Typography>
                    )}

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.25, flexWrap: "wrap" }}>
                      {ended && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => void syncOne(occ.id)}
                          disabled={syncingId === occ.id}
                          startIcon={
                            syncingId === occ.id ? (
                              <CircularProgress size={13} color="inherit" />
                            ) : (
                              <IconWrapper icon="mdi:sync" size={15} />
                            )
                          }
                          sx={{ textTransform: "none", fontSize: "0.74rem", fontWeight: 700, borderRadius: 999 }}
                        >
                          {t("adminLiveSessions.syncAttendance", "Sync attendance")}
                        </Button>
                      )}
                      {occ.has_recording && occ.recording_url && (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => onOpenRecording?.(occ.recording_url as string)}
                          startIcon={<IconWrapper icon="mdi:play-circle-outline" size={15} />}
                          sx={{ textTransform: "none", fontSize: "0.74rem", fontWeight: 700 }}
                        >
                          {t("adminLiveSessions.viewRecording", "Recording")}
                        </Button>
                      )}
                      {occ.attendance_synced_at && (
                        <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                          {t("adminLiveSessions.lastSynced", "Synced")} {fmtDate(occ.attendance_synced_at)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Collapse>
              </Paper>
            </Box>
          );
        })}
      </Box>

      <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontStyle: "italic", display: "block", mt: 1.5 }}>
        {data.reliability_note}
      </Typography>
    </Box>
  );
}
