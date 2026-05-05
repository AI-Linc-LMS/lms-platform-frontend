"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
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
import { useToast } from "@/components/common/Toast";
import {
  adminLiveActivitiesService,
  ZoomAttendanceResponse,
} from "@/lib/services/admin/admin-live-activities.service";
import { formatDurationSeconds } from "@/lib/utils/date-utils";
import { aggregateParticipants } from "@/lib/utils/attendance-utils";

interface ZoomAttendanceSectionProps {
  liveClassId: number;
}

export function ZoomAttendanceSection({ liveClassId }: ZoomAttendanceSectionProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [data, setData] = useState<ZoomAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminLiveActivitiesService.getZoomAttendance(liveClassId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [liveClassId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await adminLiveActivitiesService.syncAttendance(liveClassId);
      if (res.status === "error") {
        showToast(res.message || t("adminLiveSessions.failedToSyncAttendance"), "error");
        return;
      }
      const d = res.data;
      const msg = d
        ? t("adminLiveSessions.syncedParticipants", { count: d.total_participants, new: d.new_records })
        : res.message || t("adminLiveSessions.attendanceSynced");
      showToast(msg, "success");
      await fetchAttendance();
    } catch {
      showToast(t("adminLiveSessions.failedToSyncAttendance"), "error");
    } finally {
      setSyncing(false);
    }
  };

  const formatDateTimeShort = (s: string | null | undefined) => {
    if (!s) return "—";
    return new Date(s).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /** Compact time only for table (fits layout without scroll). */
  const formatTimeOnly = (s: string | null | undefined) => {
    if (!s) return "—";
    return new Date(s).toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const rawParticipants = data?.participants ?? [];
  const participants = aggregateParticipants(rawParticipants);
  const count = participants.length;
  const syncedAt = data?.synced_at;
  const syncAvailable = data?.sync_available ?? false;
  const neverSynced = syncedAt == null;

  const tableCellSx = {
    fontSize: "0.75rem",
    verticalAlign: "middle",
  } as const;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          {t("adminLiveSessions.attendanceSection", { count })}
        </Typography>
        {syncAvailable && (
          <Button
            variant="outlined"
            size="small"
            disabled={syncing}
            onClick={handleSync}
            startIcon={
              syncing ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <IconWrapper icon="mdi:sync" size={16} />
              )
            }
            sx={{ textTransform: "none", fontSize: "0.75rem" }}
          >
            {t("adminLiveSessions.syncAttendance")}
          </Button>
        )}
      </Box>
      <Typography
        variant="caption"
        sx={{ color: "var(--font-tertiary)", mb: 1.5, display: "block" }}
      >
        {syncedAt
          ? t("adminLiveSessions.lastSynced", { date: formatDateTimeShort(syncedAt) })
          : t("adminLiveSessions.neverSynced")}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "var(--font-secondary)",
          mb: 1.5,
          display: "block",
          fontStyle: "italic",
        }}
      >
        {t("adminLiveSessions.attendanceSyncHint")}
      </Typography>

      {count === 0 && neverSynced && (
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", py: 1 }}>
          {t("adminLiveSessions.noAttendanceData")}
        </Typography>
      )}
      {count === 0 && !neverSynced && (
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", py: 1 }}>
          {t("adminLiveSessions.noParticipantsFound")}
        </Typography>
      )}

      {participants.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ overflow: "hidden" }}>
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "var(--surface)" }}>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "24%" }}>{t("adminLiveSessions.name")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "24%" }}>{t("adminLiveSessions.email")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "16%" }}>{t("adminLiveSessions.join")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "16%" }}>{t("adminLiveSessions.leave")}</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "20%" }}>{t("adminLiveSessions.duration")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((p, idx) => (
                <TableRow key={p.id ?? idx}>
                  <TableCell
                    sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={p.name !== "—" ? p.name : undefined}
                  >
                    {p.name}
                  </TableCell>
                  <TableCell
                    sx={{ ...tableCellSx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={p.email !== "—" ? p.email : undefined}
                  >
                    {p.email}
                  </TableCell>
                  <TableCell sx={{ ...tableCellSx }} title={formatDateTimeShort(p.join_time)}>
                    {formatTimeOnly(p.join_time)}
                  </TableCell>
                  <TableCell sx={{ ...tableCellSx }} title={formatDateTimeShort(p.leave_time)}>
                    {formatTimeOnly(p.leave_time)}
                  </TableCell>
                  <TableCell sx={{ ...tableCellSx }}>
                    {formatDurationSeconds(p.duration_seconds)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
