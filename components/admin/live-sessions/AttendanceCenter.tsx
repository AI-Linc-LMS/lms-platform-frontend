"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { RoleChip } from "@/components/live-sessions/ui/LiveSessionUI";
import { AssignParticipantDialog } from "./AssignParticipantDialog";
import {
  adminLiveActivitiesService,
  AttendanceSuggestionRow,
  AttendanceSuggestionsResponse,
  LiveClassOccurrence,
  LiveSessionRosterResponse,
  RosterStudent,
  UnmatchedParticipant,
  ZoomAttendanceResponse,
} from "@/lib/services/admin/admin-live-activities.service";
import { formatDurationSeconds } from "@/lib/utils/date-utils";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { aggregateParticipants } from "@/lib/utils/attendance-utils";

interface Props {
  liveClassId: number;
  isRecurring: boolean;
  /** The detail payload's occurrences, when it carries them; the component falls back to the
   *  timeline endpoint for the date list otherwise. */
  occurrences?: LiveClassOccurrence[] | null;
  meetingStatus?: string | null;
  cohortName?: string | null;
}

interface DateOption {
  id: number;
  date: string | null;
  title?: string | null;
}

/** "just now" / "42 min ago" / "3h ago" / "2 days ago". Called from load handlers, not render. */
function relTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

function fmtOccDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function fmtClock(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "var(--success-500)",
  medium: "var(--accent-indigo)",
  low: "var(--font-secondary)",
};

/**
 * The one attendance surface for a session: my cohort, THIS class (date-scoped for a recurring
 * series), who attended, search, mark. Replaces four stacked tables - roster, staff, an
 * every-night union of unmatched guests, and a separate raw-participants dump - with one roster
 * table plus a suggestion-driven identification queue (the ranking engine finally has a caller)
 * and a collapsed audit view of the raw Zoom records.
 */
export function AttendanceCenter({ liveClassId, isRecurring, occurrences, meetingStatus, cohortName }: Props) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();

  // ---- date selection -----------------------------------------------------------------------
  const [dateOptions, setDateOptions] = useState<DateOption[] | null>(isRecurring ? null : []);
  // undefined = not decided yet (recurring lists load first); null = series-level / single.
  const [selectedOcc, setSelectedOcc] = useState<number | null | undefined>(isRecurring ? undefined : null);

  useEffect(() => {
    if (!isRecurring) return;
    let cancelled = false;
    const finish = (opts: DateOption[]) => {
      if (cancelled) return;
      // Past, non-cancelled sittings only - roll-call is about classes that happened. Most
      // recent first, and the default selection.
      const now = Date.now();
      const past = opts
        .filter((o) => o.date && new Date(o.date).getTime() <= now)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setDateOptions(past);
      setSelectedOcc(past.length > 0 ? past[0].id : null);
    };
    const fromDetail = (occurrences ?? []).filter(
      (o) => o.status !== "cancelled" && o.meeting_status !== "cancelled"
    );
    if (fromDetail.length > 0) {
      finish(fromDetail.map((o) => ({ id: o.id, date: o.occurrence_datetime, title: o.topic_name })));
      return;
    }
    adminLiveActivitiesService
      .getOccurrenceTimeline(liveClassId)
      .then((res) =>
        finish(
          res.occurrences
            .filter((o) => o.status !== "cancelled")
            .map((o) => ({ id: o.id, date: o.date, title: o.topic_name }))
        )
      )
      .catch(() => finish([]));
    return () => {
      cancelled = true;
    };
  }, [isRecurring, occurrences, liveClassId]);

  // ---- data ---------------------------------------------------------------------------------
  const [roster, setRoster] = useState<LiveSessionRosterResponse | null>(null);
  const [loadingRoster, setLoadingRoster] = useState(true);
  const [syncedLabel, setSyncedLabel] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AttendanceSuggestionsResponse | null>(null);
  const [raw, setRaw] = useState<ZoomAttendanceResponse | null>(null);
  const [rawOpen, setRawOpen] = useState(false);
  const [identifyOpen, setIdentifyOpen] = useState(true);

  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<UnmatchedParticipant | null>(null);

  const loadRoster = useCallback(async (occ: number | null) => {
    try {
      setLoadingRoster(true);
      const res = await adminLiveActivitiesService.getRoster(liveClassId, occ);
      setRoster(res);
      setSyncedLabel(relTime(res.synced_at));
    } catch {
      setRoster(null);
      setSyncedLabel(null);
    } finally {
      setLoadingRoster(false);
    }
  }, [liveClassId]);

  const loadSuggestions = useCallback(async (occ: number | null) => {
    try {
      setSuggestions(await adminLiveActivitiesService.getAttendanceSuggestions(liveClassId, occ));
    } catch {
      setSuggestions(null);
    }
  }, [liveClassId]);

  const loadRaw = useCallback(async (occ: number | null) => {
    try {
      setRaw(await adminLiveActivitiesService.getZoomAttendance(liveClassId, occ));
    } catch {
      setRaw(null);
    }
  }, [liveClassId]);

  // Everything below the picker is scoped to the selected date.
  useEffect(() => {
    if (selectedOcc === undefined) return;
    void loadRoster(selectedOcc);
    void loadSuggestions(selectedOcc);
    if (rawOpen) void loadRaw(selectedOcc);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rawOpen has its own effect below
  }, [selectedOcc, loadRoster, loadSuggestions, loadRaw]);

  // Raw records are an audit view - fetched only once someone opens them.
  useEffect(() => {
    if (rawOpen && raw === null && selectedOcc !== undefined) void loadRaw(selectedOcc);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires on open only
  }, [rawOpen]);

  const refreshAll = useCallback(async () => {
    if (selectedOcc === undefined) return;
    await Promise.all([
      loadRoster(selectedOcc),
      loadSuggestions(selectedOcc),
      rawOpen ? loadRaw(selectedOcc) : Promise.resolve(),
    ]);
  }, [selectedOcc, rawOpen, loadRoster, loadSuggestions, loadRaw]);

  // ---- actions ------------------------------------------------------------------------------
  const handleSync = async () => {
    try {
      setSyncing(true);
      await adminLiveActivitiesService.syncAttendance(liveClassId, selectedOcc ?? undefined);
      await refreshAll();
      showToast(t("adminLiveSessions.attendanceSyncedShort", "Attendance synced."), "success");
    } catch (e) {
      showToast(getAxiosErrorDetail(e, t("adminLiveSessions.failedToSyncAttendance", "Failed to sync attendance")), "error");
    } finally {
      setSyncing(false);
    }
  };

  /** present:true = manual present · present:false = absent override · clear:true = remove mark. */
  const handleMark = async (studentId: number, input: { present?: boolean; clear?: boolean }) => {
    try {
      setMarkingId(studentId);
      await adminLiveActivitiesService.markAttendance(liveClassId, {
        student_id: studentId,
        ...(selectedOcc ? { occurrence_id: selectedOcc } : {}),
        ...input,
      });
      await refreshAll();
    } catch (e) {
      showToast(getAxiosErrorDetail(e, t("adminLiveSessions.markFailed", "Could not update attendance")), "error");
    } finally {
      setMarkingId(null);
    }
  };

  /** One-click confirm of a ranked candidate: the real Zoom row (true duration) attaches to the
   *  student, and the alias teaches next week's auto-match. */
  const handleConfirm = async (row: AttendanceSuggestionRow, studentId: number, studentName: string) => {
    const key = `${row.participant_id}:${studentId}`;
    try {
      setConfirmingKey(key);
      await adminLiveActivitiesService.identifyParticipant(liveClassId, {
        participant_id: row.participant_id,
        student_id: studentId,
        ...(selectedOcc ? { occurrence_id: selectedOcc } : {}),
      });
      showToast(
        t("adminLiveSessions.participantIdentified", "Attendance recorded for {{name}}. This Zoom name will auto-match next time.", { name: studentName }),
        "success"
      );
      await refreshAll();
    } catch (e) {
      showToast(getAxiosErrorDetail(e, t("adminLiveSessions.identifyFailed", "Couldn't assign this participant.")), "error");
    } finally {
      setConfirmingKey(null);
    }
  };

  // ---- derived ------------------------------------------------------------------------------
  const sessionEnded =
    Boolean(roster?.session_ended) || meetingStatus === "ended" || meetingStatus === "expired";

  const students = useMemo(() => {
    const rows = [...(roster?.students ?? [])].sort((a, b) => Number(b.attended) - Number(a.attended));
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [roster, search]);

  const rawParticipants = useMemo(() => aggregateParticipants(raw?.participants ?? []), [raw]);

  const tableCellSx = { fontSize: "0.75rem", verticalAlign: "middle" } as const;

  const rowStatus = (s: RosterStudent): { label: string; color: string } => {
    if (s.attended) {
      return s.manual
        ? { label: t("adminLiveSessions.presentMarked", "Present (marked)"), color: "var(--success-500)" }
        : { label: t("adminLiveSessions.attended", "Attended"), color: "var(--success-500)" };
    }
    if (s.overridden) return { label: t("adminLiveSessions.absentOverridden", "Absent (overridden)"), color: "var(--error-500)" };
    if (s.enrolled_after_session) return { label: t("adminLiveSessions.notYetEnrolled", "Not yet enrolled"), color: "var(--font-secondary)" };
    if (sessionEnded) return { label: t("adminLiveSessions.missed", "Missed"), color: "var(--warning-500)" };
    if (roster?.session_started) return { label: t("adminLiveSessions.notJoinedYet", "Not joined yet"), color: "var(--font-secondary)" };
    return { label: t("adminLiveSessions.upcoming", "Not started"), color: "var(--font-secondary)" };
  };

  // ---- render -------------------------------------------------------------------------------
  if (loadingRoster && !roster) {
    return (
      <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!roster || !roster.course_tagged) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 1 }}>
          {t("adminLiveSessions.attendanceCenter", "Attendance")}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
          {t("adminLiveSessions.rosterNoCourse", "Tag this session to a course or cohort to see who joined and who missed it.")}
        </Typography>
      </Box>
    );
  }

  const unidentifiedCount = suggestions?.unidentified_count ?? 0;

  return (
    <Box>
      {/* Header: what + which date */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
          {t("adminLiveSessions.attendanceCenter", "Attendance")}
        </Typography>
        {cohortName && (
          <Chip
            icon={<IconWrapper icon="mdi:account-group" size={13} />}
            label={cohortName}
            size="small"
            sx={{ fontWeight: 700, fontSize: "0.72rem", bgcolor: "color-mix(in srgb, var(--ai-violet, #7c3aed) 14%, transparent)", color: "var(--ai-violet, #7c3aed)" }}
          />
        )}
        <Box sx={{ flex: 1 }} />
        {isRecurring && (dateOptions?.length ?? 0) > 0 && (
          <TextField
            select
            size="small"
            value={selectedOcc == null ? "" : String(selectedOcc)}
            onChange={(e) => setSelectedOcc(e.target.value === "" ? null : Number(e.target.value))}
            sx={{ minWidth: 260 }}
            label={t("adminLiveSessions.classDate", "Class date")}
          >
            {dateOptions!.map((o) => (
              <MenuItem key={o.id} value={String(o.id)}>
                {fmtOccDate(o.date)}
                {o.title ? ` · ${o.title}` : ""}
              </MenuItem>
            ))}
          </TextField>
        )}
        {isRecurring && dateOptions !== null && dateOptions.length === 0 && (
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            {t("adminLiveSessions.noPastDates", "No sittings have happened yet.")}
          </Typography>
        )}
      </Box>

      {/* Summary strip: joined count, honest sync state, per-date sync, live search */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1, flexWrap: "wrap" }}>
        <Chip
          label={t("adminLiveSessions.rosterJoinedOfEnrolled", "{{joined}} of {{enrolled}} joined", {
            joined: roster.joined_count,
            enrolled: roster.enrolled_count,
          })}
          size="small"
          sx={{ fontWeight: 700, fontSize: "0.75rem", bgcolor: "color-mix(in srgb, var(--success-500) 16%, transparent)", color: "var(--success-500)" }}
        />
        <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
          {syncedLabel
            ? t("adminLiveSessions.syncedRel", "Synced {{when}}", { when: syncedLabel })
            : t("adminLiveSessions.notSyncedForDate", "Not synced yet for this date")}
        </Typography>
        {roster.sync_available && (
          <Button
            size="small"
            variant="outlined"
            disabled={syncing}
            onClick={() => void handleSync()}
            startIcon={syncing ? <CircularProgress size={13} color="inherit" /> : <IconWrapper icon="mdi:sync" size={15} />}
            sx={{ textTransform: "none", fontSize: "0.74rem", fontWeight: 700, borderRadius: 999 }}
          >
            {t("adminLiveSessions.syncAttendance", "Sync attendance")}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <TextField
          size="small"
          placeholder={t("adminLiveSessions.searchStudents", "Search name or email…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220 }}
          InputProps={{ startAdornment: <IconWrapper icon="mdi:magnify" size={16} color="var(--font-tertiary)" /> }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontStyle: "italic", display: "block", mb: 1.5 }}>
        {t(
          "adminLiveSessions.zoomCaptureNote",
          "Zoom's report captures web and app joins alike. Device type isn't available on this tenant's Zoom plan."
        )}
      </Typography>

      {/* THE roster table */}
      {roster.enrolled_count === 0 ? (
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", py: 1 }}>
          {t("adminLiveSessions.rosterNoStudents", "No students are enrolled in this course yet.")}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ overflow: "hidden" }}>
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "var(--surface)" }}>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "24%" }}>{t("adminLiveSessions.name", "Name")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "24%" }}>{t("adminLiveSessions.email", "Email")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "34%" }}>{t("adminLiveSessions.status", "Status")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "18%" }}>{t("adminLiveSessions.time", "Time")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ ...tableCellSx, color: "var(--font-secondary)", py: 2, textAlign: "center" }}>
                    {t("adminLiveSessions.noStudentsMatch", "No students match your search.")}
                  </TableCell>
                </TableRow>
              )}
              {students.map((s) => {
                const st = rowStatus(s);
                const busy = markingId === s.user_profile_id;
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
                          sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600, bgcolor: `color-mix(in srgb, ${st.color} 16%, transparent)`, color: st.color }}
                        />
                        <RoleChip role={s.role} />
                        {sessionEnded && !s.attended && !s.overridden && (
                          <Button size="small" disabled={busy} onClick={() => void handleMark(s.user_profile_id, { present: true })}
                            sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: "0.65rem", textTransform: "none", fontWeight: 700 }}>
                            {t("adminLiveSessions.markPresent", "Mark present")}
                          </Button>
                        )}
                        {sessionEnded && s.attended && !s.manual && (
                          <Button size="small" color="inherit" disabled={busy} onClick={() => void handleMark(s.user_profile_id, { present: false })}
                            sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: "0.65rem", textTransform: "none", fontWeight: 700, color: "var(--error-500)" }}>
                            {t("adminLiveSessions.markAbsent", "Mark absent")}
                          </Button>
                        )}
                        {sessionEnded && ((s.attended && s.manual) || s.overridden) && (
                          <Button size="small" color="inherit" disabled={busy} onClick={() => void handleMark(s.user_profile_id, { clear: true })}
                            sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: "0.65rem", textTransform: "none", color: "var(--font-secondary)" }}>
                            {t("adminLiveSessions.undo", "Undo")}
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={tableCellSx}>
                      {s.attended ? (
                        <Box>
                          {formatDurationSeconds(s.duration_seconds)}
                          {s.join_time && (
                            <Typography component="span" variant="caption" sx={{ color: "var(--font-tertiary)", display: "block" }}>
                              {fmtClock(s.join_time)}–{fmtClock(s.leave_time)}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Needs identification - the suggestion queue (replaces the unmatched wall) */}
      {unidentifiedCount > 0 && (
        <Box sx={{ mt: 2, borderRadius: 2, border: "1px solid color-mix(in srgb, var(--warning-500) 35%, transparent)", overflow: "hidden" }}>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setIdentifyOpen((o) => !o)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setIdentifyOpen((o) => !o); }}
            sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, cursor: "pointer", bgcolor: "color-mix(in srgb, var(--warning-500) 8%, transparent)" }}
          >
            <IconWrapper icon="mdi:account-question-outline" size={17} color="var(--warning-500)" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--font-primary)" }}>
              {t("adminLiveSessions.needsIdentification", "Needs identification ({{count}})", { count: unidentifiedCount })}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconWrapper icon={identifyOpen ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} color="var(--font-secondary)" />
          </Box>
          <Collapse in={identifyOpen} unmountOnExit>
            <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.25 }}>
              {suggestions?.note && (
                <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                  {suggestions.note}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontStyle: "italic" }}>
                {t("adminLiveSessions.identifyTeaches", "Confirming teaches the platform the student's Zoom name, so future classes match automatically.")}
              </Typography>
              {(suggestions?.unmatched ?? []).map((row) => (
                <Box key={row.participant_id} sx={{ p: 1.1, borderRadius: 2, border: "1px solid var(--border-default)" }}>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--font-primary)" }} noWrap>
                      {row.name || t("adminLiveSessions.noName", "(no name)")}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                      {formatDurationSeconds(row.duration_seconds)}
                      {row.email ? ` · ${row.email}` : ""}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.75, flexWrap: "wrap" }}>
                    {row.candidates.length === 0 && (
                      <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                        {t("adminLiveSessions.noLikelyMatch", "No likely match on this roster.")}
                      </Typography>
                    )}
                    {row.candidates.map((c) => {
                      const color = c.ambiguous ? "var(--warning-500)" : CONFIDENCE_COLOR[c.confidence];
                      const busy = confirmingKey === `${row.participant_id}:${c.student_id}`;
                      return (
                        <Tooltip key={c.student_id} title={c.reason}>
                          <Chip
                            size="small"
                            disabled={Boolean(confirmingKey)}
                            onClick={() => void handleConfirm(row, c.student_id, c.name)}
                            icon={busy ? <CircularProgress size={11} color="inherit" /> : <IconWrapper icon="mdi:check" size={13} color={color} />}
                            label={`${c.name}${c.ambiguous ? " · unsure" : ` · ${c.confidence}`}`}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              color,
                              bgcolor: `color-mix(in srgb, ${color} 12%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                    <Button
                      size="small"
                      onClick={() =>
                        setAssignFor({
                          participant_id: row.participant_id,
                          name: row.name,
                          email: row.email,
                          duration_seconds: row.duration_seconds,
                          join_time: row.join_time,
                          leave_time: null,
                        })
                      }
                      sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: "0.7rem", textTransform: "none", fontWeight: 700, color: "var(--font-secondary)" }}
                    >
                      {t("adminLiveSessions.someoneElse", "Someone else…")}
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Staff & hosts: one compact chip row, never counted among students */}
      {(roster.staff_participants?.length ?? 0) > 0 && (
        <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-secondary)" }}>
            {t("adminLiveSessions.staffAndHostsInline", "Staff & hosts:")}
          </Typography>
          {roster.staff_participants!.map((p, i) => (
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

      {/* Raw Zoom join records - collapsed audit view */}
      <Box sx={{ mt: 1.5, borderRadius: 2, border: "1px solid var(--border-default)", overflow: "hidden" }}>
        <Box
          role="button"
          tabIndex={0}
          onClick={() => setRawOpen((o) => !o)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setRawOpen((o) => !o); }}
          sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, cursor: "pointer", "&:hover": { bgcolor: "color-mix(in srgb, var(--accent-indigo) 4%, transparent)" } }}
        >
          <IconWrapper icon="mdi:file-search-outline" size={16} color="var(--font-secondary)" />
          <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-secondary)" }}>
            {t("adminLiveSessions.rawRecords", "All Zoom join records (audit)")}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconWrapper icon={rawOpen ? "mdi:chevron-up" : "mdi:chevron-down"} size={18} color="var(--font-secondary)" />
        </Box>
        <Collapse in={rawOpen} unmountOnExit>
          <Box sx={{ px: 1.5, pb: 1.5 }}>
            {raw === null ? (
              <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={18} />
              </Box>
            ) : rawParticipants.length === 0 ? (
              <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                {t("adminLiveSessions.noRawRecords", "No join records for this date.")}
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ overflow: "hidden" }}>
                <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "var(--surface)" }}>
                      <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "30%" }}>{t("adminLiveSessions.name", "Name")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "30%" }}>{t("adminLiveSessions.email", "Email")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "13%" }}>{t("adminLiveSessions.join", "Join")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "13%" }}>{t("adminLiveSessions.leave", "Leave")}</TableCell>
                      <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "14%" }}>{t("adminLiveSessions.duration", "Duration")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rawParticipants.map((p, idx) => (
                      <TableRow key={p.id ?? idx}>
                        <TableCell sx={{ ...tableCellSx, overflow: "hidden" }} title={p.name !== "-" ? p.name : undefined}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                            <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</Box>
                            <RoleChip role={p.role} />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.email !== "-" ? p.email : undefined}>
                          {p.email}
                        </TableCell>
                        <TableCell sx={tableCellSx}>{fmtClock(p.join_time)}</TableCell>
                        <TableCell sx={tableCellSx}>{fmtClock(p.leave_time)}</TableCell>
                        <TableCell sx={tableCellSx}>{formatDurationSeconds(p.duration_seconds)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Collapse>
      </Box>

      {assignFor && (
        <AssignParticipantDialog
          liveClassId={liveClassId}
          participant={assignFor}
          students={roster.students}
          occurrenceId={selectedOcc ?? undefined}
          onClose={() => setAssignFor(null)}
          onDone={refreshAll}
        />
      )}
    </Box>
  );
}
