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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { TranscriptContent } from "./LiveSessionTranscriptSection";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MeetingStatusChip, RoleChip } from "@/components/live-sessions/ui/LiveSessionUI";
import { AssignParticipantDialog } from "./AssignParticipantDialog";
import {
  adminLiveActivitiesService,
  LiveSessionTranscriptResponse,
  OccurrenceTimelineResponse,
  TimelineOccurrence,
  RosterStudent,
  UnmatchedParticipant,
} from "@/lib/services/admin/admin-live-activities.service";
import { formatDurationSeconds } from "@/lib/utils/date-utils";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { formatSessionTime, toLocalInputInZone } from "@/lib/utils/session-time";
import { useToast } from "@/components/common/Toast";

const OCC_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * One sitting's date, in the SESSION's zone — the same formatter the detail page's header uses.
 * This list previously rendered in the admin's browser zone with no label, directly under a header
 * stamped with the session's zone, so one page showed occurrence times two different ways.
 */
function fmtOccurrence(s: string | null, timezone?: string | null) {
  return formatSessionTime(s, timezone, { format: OCC_FORMAT });
}

/**
 * A SYSTEM timestamp (when a sync ran), deliberately left in the admin's own browser zone and
 * deliberately unlabelled: stamping an audit event with the session's timezone would assert
 * something false about when it happened.
 */
function fmtSyncedAt(s: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleString("en-US", OCC_FORMAT);
}

/** Per-student status for one occurrence - "Missed" only once THAT occurrence has ended, and
 *  never for someone who joined the batch after this sitting happened. */
function studentStatus(s: RosterStudent, occStatus: string, t: (k: string, d: string) => string) {
  if (s.attended)
    return {
      label: s.manual
        ? t("adminLiveSessions.presentManual", "Present (manual)")
        : t("adminLiveSessions.attended", "Joined"),
      color: "var(--success-500)",
    };
  if (s.enrolled_after_session)
    return { label: t("adminLiveSessions.notYetEnrolled", "Not yet enrolled"), color: "var(--font-secondary)" };
  if (occStatus === "ended" || occStatus === "expired")
    return { label: t("adminLiveSessions.missed", "Missed"), color: "var(--warning-500)" };
  if (occStatus === "live")
    return { label: t("adminLiveSessions.notJoinedYet", "Not joined yet"), color: "var(--font-secondary)" };
  return { label: t("adminLiveSessions.upcoming", "Not started"), color: "var(--font-secondary)" };
}

interface Props {
  liveClassId: number;
  /** Series title, the fallback when a date has no per-date topic_name of its own. */
  seriesTitle?: string;
  /** The series' scheduling zone - reschedules are entered and sent in this zone. */
  timezone?: string | null;
  /**
   * Play ONE date's recording. Deliberately an occurrence, not a URL: `recording_url` is Zoom's
   * HTML share page (share_url + ?pwd=), which can only ever be navigated to - the playable MP4 is
   * resolved server-side from the occurrence id by the streaming proxy.
   */
  onPlayOccurrence?: (occ: TimelineOccurrence) => void;
  /** Called after a date was renamed/rescheduled/cancelled, so the parent can refresh. */
  onChanged?: () => void;
}

/**
 * Recurring-series timeline: one card per occurrence (date) showing its status, who joined that
 * specific date (per-occurrence roster) vs missed, and whether its own recording / transcript is
 * ready. Renders nothing for a single (non-recurring) session - the series roster covers those.
 */
export function LiveSessionOccurrenceTimeline({ liveClassId, seriesTitle, timezone, onPlayOccurrence, onChanged }: Props) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [data, setData] = useState<OccurrenceTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ occ: TimelineOccurrence; mode: "rename" | "reschedule" } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<TimelineOccurrence | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Roll-call state: which `${occId}:${studentId}` mark is in flight, and which unmatched row is
  // being attached to a student (dialog carries its occurrence for occurrence_id).
  const [markingKey, setMarkingKey] = useState<string | null>(null);
  const [assign, setAssign] = useState<{ occ: TimelineOccurrence; participant: UnmatchedParticipant } | null>(null);
  // Which date's notes are open, and that date's transcript once fetched (per-date, never the
  // series-level one - a series' transcript belongs to whichever sitting synced last).
  const [notesFor, setNotesFor] = useState<TimelineOccurrence | null>(null);

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
    } catch (e) {
      // Previously there was no catch at all here: a failed per-occurrence sync spun the button
      // and then looked exactly like a successful one that found nobody.
      showToast(getAxiosErrorDetail(e, "Couldn't sync attendance for this session."), "error");
    } finally {
      setSyncingId(null);
    }
  };

  /** Manual mark for one student on ONE date - this is the week-by-week roll-call. */
  const markOne = async (occ: TimelineOccurrence, studentId: number, input: { present?: boolean; clear?: boolean }) => {
    const key = `${occ.id}:${studentId}`;
    try {
      setMarkingKey(key);
      await adminLiveActivitiesService.markAttendance(liveClassId, {
        student_id: studentId,
        occurrence_id: occ.id,
        ...input,
      });
      await load();
      setOpenId(occ.id);
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't update attendance for this date."), "error");
    } finally {
      setMarkingKey(null);
    }
  };

  const cancelOne = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      const res = await adminLiveActivitiesService.cancelOccurrence(liveClassId, cancelTarget.id);
      const warnings = res.data?.warnings ?? [];
      showToast(
        warnings.length
          ? `${t("adminLiveSessions.occurrenceCancelled", "This date was cancelled.")} ${warnings.join(" ")}`
          : t("adminLiveSessions.occurrenceCancelled", "This date was cancelled."),
        warnings.length ? "warning" : "success"
      );
      setCancelTarget(null);
      await load();
      onChanged?.();
    } catch (e) {
      // 409 = "can't be edited safely", 502 = Zoom refused; both carry their reason in the body.
      showToast(getAxiosErrorDetail(e, t("adminLiveSessions.occurrenceCancelFailed", "Couldn't cancel this date.")), "error");
    } finally {
      setCancelling(false);
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
                    {fmtOccurrence(occ.date, timezone)}
                  </Typography>
                  {/* Per-date title (AI-titled after transcript sync, or renamed by an admin);
                      blank inherits the series title. */}
                  {(occ.topic_name || seriesTitle) && (
                    <Typography
                      noWrap
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.78rem",
                        maxWidth: 280,
                        color: occ.topic_name ? "var(--font-primary)" : "var(--font-secondary)",
                      }}
                    >
                      {occ.topic_name || seriesTitle}
                    </Typography>
                  )}
                  <MeetingStatusChip status={occ.status} />
                  <Box sx={{ flex: 1 }} />
                  <Chip
                    label={t("adminLiveSessions.rosterJoinedOfEnrolled", "{{joined}} of {{enrolled}} joined", {
                      joined: occ.joined_count,
                      enrolled: occ.eligible_count ?? occ.enrolled_count,
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
                  {/* These read as buttons, so they are buttons. stopPropagation is required: the
                      header Box is the row's expand/collapse toggle, and without it a click would
                      also open the accordion underneath the dialog. */}
                  {occ.has_recording && (
                    <Tooltip title={t("adminLiveSessions.playRecording", "Play recording")}>
                      <IconButton
                        size="small"
                        aria-label={t("adminLiveSessions.playRecording", "Play recording")}
                        onClick={(e) => { e.stopPropagation(); onPlayOccurrence?.(occ); }}
                      >
                        <IconWrapper icon="mdi:play-circle" size={16} color="var(--accent-indigo)" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {(occ.has_transcript || occ.has_summary) && (
                    <Tooltip title={t("adminLiveSessions.sessionNotes", "Session notes")}>
                      <IconButton
                        size="small"
                        aria-label={t("adminLiveSessions.sessionNotes", "Session notes")}
                        onClick={(e) => { e.stopPropagation(); setNotesFor(occ); }}
                      >
                        <IconWrapper icon="mdi:text-box-check" size={16} color="var(--accent-indigo)" />
                      </IconButton>
                    </Tooltip>
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
                              <TableCell sx={{ fontWeight: 700, ...tableCellSx, width: "27%" }}>
                                {t("adminLiveSessions.name", "Name")}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, ...tableCellSx, width: "26%" }}>
                                {t("adminLiveSessions.email", "Email")}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, ...tableCellSx, width: "35%" }}>
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
                                const busy = markingKey === `${occ.id}:${s.user_profile_id}`;
                                return (
                                  <TableRow key={s.user_profile_id}>
                                    <TableCell sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.name}>
                                      {s.name}
                                    </TableCell>
                                    <TableCell sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.email}>
                                      {s.email}
                                    </TableCell>
                                    <TableCell sx={tableCellSx}>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
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
                                        <RoleChip role={s.role} />
                                        {s.overridden && (
                                          <Chip
                                            label={t("adminLiveSessions.overridden", "Overridden")}
                                            size="small"
                                            sx={{
                                              height: 20, fontSize: "0.66rem", fontWeight: 700,
                                              bgcolor: "color-mix(in srgb, var(--error-500) 14%, transparent)",
                                              color: "var(--error-500)",
                                            }}
                                          />
                                        )}
                                        {/* The week-by-week roll-call: mark THIS date once it has
                                            ended - present, absent-override, or clear the mark. */}
                                        {ended && !s.attended && !s.overridden && (
                                          <Button
                                            size="small"
                                            disabled={busy}
                                            onClick={() => void markOne(occ, s.user_profile_id, { present: true })}
                                            sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: "0.64rem", textTransform: "none", fontWeight: 700 }}
                                          >
                                            {t("adminLiveSessions.markPresent", "Mark present")}
                                          </Button>
                                        )}
                                        {ended && s.attended && !s.manual && (
                                          <Button
                                            size="small"
                                            color="inherit"
                                            disabled={busy}
                                            onClick={() => void markOne(occ, s.user_profile_id, { present: false })}
                                            sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: "0.64rem", textTransform: "none", fontWeight: 700, color: "var(--error-500)" }}
                                          >
                                            {t("adminLiveSessions.markAbsent", "Mark absent")}
                                          </Button>
                                        )}
                                        {ended && ((s.attended && s.manual) || s.overridden) && (
                                          <Button
                                            size="small"
                                            color="inherit"
                                            disabled={busy}
                                            onClick={() => void markOne(occ, s.user_profile_id, { clear: true })}
                                            sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: "0.64rem", textTransform: "none", color: "var(--font-secondary)" }}
                                          >
                                            {t("adminLiveSessions.undo", "Undo")}
                                          </Button>
                                        )}
                                      </Box>
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

                    {/* Staff & hosts who were in THIS sitting (not counted as students). */}
                    {(occ.staff_participants?.length ?? 0) > 0 && (
                      <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-secondary)" }}>
                          {t("adminLiveSessions.staffAndHostsInline", "Staff & hosts:")}
                        </Typography>
                        {occ.staff_participants!.map((p, i) => (
                          <Box key={i} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                            <RoleChip role={p.role} />
                            <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                              {p.name || p.email}
                              {p.duration_seconds ? ` · ${formatDurationSeconds(p.duration_seconds)}` : ""}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {occ.unmatched_participants.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontStyle: "italic", display: "block" }}>
                          {t("adminLiveSessions.rosterUnmatched", "Unmatched participants ({{count}})", {
                            count: occ.unmatched_participants.length,
                          })}
                        </Typography>
                        {occ.unmatched_participants.map((p, idx) => (
                          <Box key={p.participant_id ?? idx} sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.4 }}>
                            <Typography variant="caption" sx={{ color: "var(--font-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.name || t("adminLiveSessions.noName", "(no name)")}
                              {" · "}
                              {formatDurationSeconds(p.duration_seconds)}
                            </Typography>
                            {/* Attach THIS date's join to a student - keeps the real duration and
                                auto-matches the name on later dates. */}
                            {p.participant_id != null && occ.students.length > 0 && (
                              <Button
                                size="small"
                                onClick={() => setAssign({ occ, participant: p })}
                                sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: "0.64rem", textTransform: "none", fontWeight: 700 }}
                              >
                                {t("adminLiveSessions.assignToStudent", "Assign to student")}
                              </Button>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.25, flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setEditing({ occ, mode: "rename" })}
                        startIcon={<IconWrapper icon="mdi:form-textbox" size={15} />}
                        sx={{ textTransform: "none", fontSize: "0.74rem", fontWeight: 700, borderRadius: 999 }}
                      >
                        {t("adminLiveSessions.renameOccurrence", "Rename")}
                      </Button>
                      {/* Moving a class only makes sense before it starts. */}
                      {occ.status === "scheduled" && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setEditing({ occ, mode: "reschedule" })}
                          startIcon={<IconWrapper icon="mdi:calendar-clock" size={15} />}
                          sx={{ textTransform: "none", fontSize: "0.74rem", fontWeight: 700, borderRadius: 999 }}
                        >
                          {t("adminLiveSessions.rescheduleOccurrence", "Reschedule")}
                        </Button>
                      )}
                      {/* Cancelling a LIVE class is the case an admin needs most — a session
                          running with a broken join link, or one that should not be happening.
                          This used to be gated on "scheduled" alongside Reschedule, so the moment
                          a class went live both buttons vanished and the admin was stuck watching
                          it. The backend has always accepted it. */}
                      {(occ.status === "scheduled" || occ.status === "live") && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => setCancelTarget(occ)}
                          startIcon={<IconWrapper icon="mdi:calendar-remove" size={15} />}
                          sx={{ textTransform: "none", fontSize: "0.74rem", fontWeight: 700, borderRadius: 999 }}
                        >
                          {occ.status === "live"
                            ? t("adminLiveSessions.cancelLiveOccurrence", "End and cancel this date")
                            : t("adminLiveSessions.cancelOccurrence", "Cancel this date")}
                        </Button>
                      )}
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
                      {/* Not gated on recording_url: that field is Zoom's share PAGE, while in-app
                          playback resolves the MP4 server-side from the occurrence id. */}
                      {occ.has_recording && (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => onPlayOccurrence?.(occ)}
                          startIcon={<IconWrapper icon="mdi:play-circle-outline" size={15} />}
                          sx={{ textTransform: "none", fontSize: "0.74rem", fontWeight: 700 }}
                        >
                          {t("adminLiveSessions.viewRecording", "Recording")}
                        </Button>
                      )}
                      {occ.attendance_synced_at && (
                        <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                          {/* The locale string is "Last synced: {{date}}" - the timestamp must go in
                              the VALUES argument; passing it as the 2nd arg makes it a defaultValue
                              and leaves the raw {{date}} token on screen. */}
                          {t("adminLiveSessions.lastSynced", "Last synced: {{date}}", {
                            date: fmtSyncedAt(occ.attendance_synced_at),
                          })}
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

      {assign && (
        <AssignParticipantDialog
          liveClassId={liveClassId}
          participant={assign.participant}
          students={assign.occ.students}
          occurrenceId={assign.occ.id}
          onClose={() => setAssign(null)}
          onDone={async () => {
            await load();
            setOpenId(assign.occ.id);
            onChanged?.();
          }}
        />
      )}

      {editing && (
        <EditOccurrenceDialog
          liveClassId={liveClassId}
          occ={editing.occ}
          mode={editing.mode}
          seriesTitle={seriesTitle}
          timezone={timezone}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            onChanged?.();
          }}
        />
      )}

      {notesFor && (
        <OccurrenceNotesDialog
          liveClassId={liveClassId}
          occ={notesFor}
          seriesTitle={seriesTitle}
          timezone={timezone}
          onClose={() => setNotesFor(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title={t("adminLiveSessions.cancelOccurrenceTitle", "Cancel this date?")}
        message={t(
          "adminLiveSessions.cancelOccurrenceDesc",
          "Only this date is cancelled - the series and its other dates stay. Zoom is updated and students stop seeing this sitting. This can't be undone."
        )}
        confirmText={cancelling ? t("adminLiveSessions.cancelling", "Cancelling…") : t("adminLiveSessions.cancelOccurrence", "Cancel this date")}
        cancelText={t("adminLiveSessions.keepIt", "Keep it")}
        confirmColor="error"
        onConfirm={() => void cancelOne()}
        onCancel={() => setCancelTarget(null)}
      />
    </Box>
  );
}

/** One date's AI summary + transcript, fetched per occurrence. Reuses the transcript tab's own
 *  renderer so the two admin surfaces can never drift apart. */
function OccurrenceNotesDialog({
  liveClassId,
  occ,
  seriesTitle,
  timezone,
  onClose,
}: {
  liveClassId: number;
  occ: TimelineOccurrence;
  seriesTitle?: string;
  /** The series' zone, so this date is stamped like every other surface. Unlike the edit dialog,
   *  this one was never handed it. */
  timezone?: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("common");
  const [data, setData] = useState<LiveSessionTranscriptResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminLiveActivitiesService.getTranscript(liveClassId, occ.id);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [liveClassId, occ.id]);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {occ.topic_name?.trim() || seriesTitle || t("adminLiveSessions.sessionNotes", "Session notes")}
        <Typography variant="caption" sx={{ display: "block", color: "var(--font-secondary)", fontWeight: 500 }}>
          {fmtOccurrence(occ.date, timezone)}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={26} />
          </Box>
        ) : data ? (
          <TranscriptContent data={data} />
        ) : (
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            {t("adminLiveSessions.transcriptLoadFailed", "Couldn't load this date's transcript.")}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          {t("adminLiveSessions.close", "Close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Edit ONE date of a recurring series. Two modes so each action stays a one-field decision:
 * "rename" edits the per-date title (blank inherits the series title), "reschedule" moves the
 * date and/or its duration. Time is entered as a wall-clock in the SERIES' own zone and sent
 * naive+timezone, matching the sessions/update contract.
 */
function EditOccurrenceDialog({ liveClassId, occ, mode, seriesTitle, timezone, onClose, onSaved }: {
  liveClassId: number;
  occ: TimelineOccurrence;
  mode: "rename" | "reschedule";
  seriesTitle?: string;
  timezone?: string | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [topic, setTopic] = useState(occ.topic_name ?? "");
  const [datetime, setDatetime] = useState(() => (occ.date ? toLocalInputInZone(occ.date, timezone || undefined) : ""));
  const [duration, setDuration] = useState(occ.duration_minutes || 60);
  const [saving, setSaving] = useState(false);

  const rename = mode === "rename";
  const valid = rename ? true : Boolean(datetime) && duration >= 1 && duration <= 480;

  const handleSave = async () => {
    if (!valid || saving) return;
    try {
      setSaving(true);
      await adminLiveActivitiesService.updateOccurrence(
        liveClassId,
        occ.id,
        rename
          ? { topic_name: topic.trim() } // "" clears the override back to the series title
          : {
              occurrence_datetime: datetime,
              ...(timezone ? { timezone } : {}),
              duration_minutes: duration,
            }
      );
      showToast(
        rename
          ? t("adminLiveSessions.occurrenceRenamed", "Date renamed.")
          : t("adminLiveSessions.occurrenceRescheduled", "Date rescheduled."),
        "success"
      );
      await onSaved();
    } catch (e) {
      // 502 carries Zoom's own refusal, 409 the safety reason - show the server's words.
      showToast(
        getAxiosErrorDetail(
          e,
          rename
            ? t("adminLiveSessions.occurrenceRenameFailed", "Couldn't rename this date.")
            : t("adminLiveSessions.occurrenceRescheduleFailed", "Couldn't reschedule this date.")
        ),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "18px",
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--card-bg)",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.02rem", color: "var(--font-primary)" }}>
        {rename
          ? t("adminLiveSessions.renameOccurrenceTitle", "Rename this date")
          : t("adminLiveSessions.rescheduleOccurrenceTitle", "Reschedule this date")}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            {fmtOccurrence(occ.date, timezone)}
          </Typography>
          {rename ? (
            <TextField
              label={t("adminLiveSessions.occurrenceTopic", "Title for this date")}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={seriesTitle}
              fullWidth
              size="small"
              helperText={t("adminLiveSessions.occurrenceTopicHelp", "Leave blank to use the series title.")}
            />
          ) : (
            <>
              <TextField
                label={t("adminLiveSessions.classDateAndTime", "Date and time")}
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                helperText={t("adminLiveSessions.occurrenceTimeInZone", "Wall-clock time in {{zone}}. Zoom and students are updated.", {
                  zone: timezone || t("adminLiveSessions.theSessionZone", "the session's timezone"),
                })}
              />
              <TextField
                label={t("adminLiveSessions.durationMinutes", "Duration (minutes)")}
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.min(480, Math.max(1, Number(e.target.value) || 60)))}
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 480 }}
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ borderRadius: "12px", textTransform: "none", color: "var(--font-secondary)" }}>
          {t("adminLiveSessions.cancel", "Cancel")}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={!valid || saving}
          sx={{
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            background: "var(--accent-indigo)",
            color: "#fff",
            "&:hover": { background: "var(--accent-indigo-dark)" },
          }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : t("adminLiveSessions.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
