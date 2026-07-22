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
  Button,
} from "@mui/material";
import {
  adminLiveActivitiesService,
  LiveSessionRosterResponse,
} from "@/lib/services/admin/admin-live-activities.service";
import { formatDurationSeconds } from "@/lib/utils/date-utils";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";

interface LiveSessionRosterSectionProps {
  liveClassId: number;
}

/**
 * Admin "who joined vs who didn't" view: enrolled roster joined against synced Zoom participants
 * (matched by email), plus unmatched guests. Complements ZoomAttendanceSection (raw participant list).
 */
export function LiveSessionRosterSection({ liveClassId }: LiveSessionRosterSectionProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [data, setData] = useState<LiveSessionRosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminLiveActivitiesService.getRoster(liveClassId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  const handleSendInvites = useCallback(async () => {
    try {
      setSending(true);
      const res = await adminLiveActivitiesService.sendInvites(liveClassId);
      showToast(
        res.message || t("adminLiveSessions.invitesSent", "Invites sent"),
        res.status === "success" ? "success" : "error"
      );
      // the send is async server-side; refresh the invite status shortly after.
      if (res.status === "success") setTimeout(() => { void fetchRoster(); }, 2500);
    } catch {
      showToast(t("adminLiveSessions.invitesFailed", "Could not send invites"), "error");
    } finally {
      setSending(false);
    }
  }, [liveClassId, showToast, t, fetchRoster]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  if (loading) {
    return (
      <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!data || !data.course_tagged) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)", mb: 1 }}>
          {t("adminLiveSessions.rosterTitle", "Attendance roster")}
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
          {t("adminLiveSessions.rosterNoCourse", "Tag this session to a course to see who joined and who missed it.")}
        </Typography>
      </Box>
    );
  }

  const tableCellSx = { fontSize: "0.75rem", verticalAlign: "middle" } as const;
  const students = [...data.students].sort(
    (a, b) => Number(b.attended) - Number(a.attended)
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          {t("adminLiveSessions.rosterTitle", "Attendance roster")}
        </Typography>
        <Chip
          label={t("adminLiveSessions.rosterJoinedOfEnrolled", "{{joined}} of {{enrolled}} joined", {
            joined: data.joined_count,
            enrolled: data.enrolled_count,
          })}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: "0.75rem",
            bgcolor: "color-mix(in srgb, var(--success-500) 16%, transparent)",
            color: "var(--success-500)",
          }}
        />
      </Box>

      {/* Invite status + resend control */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <IconWrapper
            icon={data.invite_status?.sent_at ? "mdi:email-check-outline" : "mdi:email-outline"}
            size={15}
            color={data.invite_status?.sent_at ? "var(--success-500)" : "var(--font-secondary)"}
          />
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            {data.invite_status?.sent_at
              ? t("adminLiveSessions.invitedSummary", "Invited {{n}} · sent {{when}}", {
                  n: data.invite_status.recipients_count,
                  when: new Date(data.invite_status.sent_at).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  }),
                }) + (data.invite_status.failures_count ? ` · ${data.invite_status.failures_count} failed` : "")
              : t("adminLiveSessions.notInvitedYet", "Students not invited yet")}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          disabled={sending || !data.invite_status?.can_send}
          onClick={() => void handleSendInvites()}
          startIcon={sending ? <CircularProgress size={13} color="inherit" /> : <IconWrapper icon="mdi:email-fast-outline" size={15} />}
          sx={{ textTransform: "none", fontSize: "0.74rem", fontWeight: 700, borderRadius: 999 }}
        >
          {data.invite_status?.sent_at
            ? t("adminLiveSessions.resendInvites", "Resend invites")
            : t("adminLiveSessions.inviteStudents", "Invite students")}
        </Button>
      </Box>

      {data.enrolled_count === 0 ? (
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", py: 1 }}>
          {t("adminLiveSessions.rosterNoStudents", "No students are enrolled in this course yet.")}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ overflow: "hidden" }}>
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "var(--surface)" }}>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "34%" }}>{t("adminLiveSessions.name", "Name")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "32%" }}>{t("adminLiveSessions.email", "Email")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "18%" }}>{t("adminLiveSessions.status", "Status")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "16%" }}>{t("adminLiveSessions.duration", "Duration")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.user_profile_id}>
                  <TableCell
                    sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={s.name}
                  >
                    {s.name}
                  </TableCell>
                  <TableCell
                    sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={s.email}
                  >
                    {s.email}
                  </TableCell>
                  <TableCell sx={{ ...tableCellSx }}>
                    {(() => {
                      // "Missed" only once the session has actually ended. Before that a non-attendee
                      // is Upcoming (not started) or Not joined yet (live) — never "missed".
                      const st = s.attended
                        ? { label: t("adminLiveSessions.attended", "Joined"), color: "var(--success-500)" }
                        : data.session_ended
                          ? { label: t("adminLiveSessions.missed", "Missed"), color: "var(--warning-500)" }
                          : data.session_started
                            ? { label: t("adminLiveSessions.notJoinedYet", "Not joined yet"), color: "var(--font-secondary)" }
                            : { label: t("adminLiveSessions.upcoming", "Not started"), color: "var(--font-secondary)" };
                      return (
                        <Chip
                          label={st.label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            bgcolor: `color-mix(in srgb, ${st.color} 16%, transparent)`,
                            color: st.color,
                          }}
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell sx={{ ...tableCellSx }}>
                    {s.attended ? formatDurationSeconds(s.duration_seconds) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {data.unmatched_participants.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--font-primary)", display: "block", mb: 0.5 }}>
            {t("adminLiveSessions.rosterUnmatched", "Unmatched participants ({{count}})", {
              count: data.unmatched_participants.length,
            })}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontStyle: "italic", display: "block", mb: 1 }}>
            {data.reliability_note}
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ overflow: "hidden" }}>
            <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--surface)" }}>
                  <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "40%" }}>{t("adminLiveSessions.name", "Name")}</TableCell>
                  <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "44%" }}>{t("adminLiveSessions.email", "Email")}</TableCell>
                  <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "16%" }}>{t("adminLiveSessions.duration", "Duration")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.unmatched_participants.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell
                      sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={p.name}
                    >
                      {p.name || "—"}
                    </TableCell>
                    <TableCell
                      sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={p.email}
                    >
                      {p.email || "—"}
                    </TableCell>
                    <TableCell sx={{ ...tableCellSx }}>
                      {formatDurationSeconds(p.duration_seconds)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
