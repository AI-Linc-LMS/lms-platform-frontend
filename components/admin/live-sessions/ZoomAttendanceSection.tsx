"use client";

import { useEffect, useState, useCallback } from "react";
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
        showToast(res.message || "Failed to sync attendance", "error");
        return;
      }
      const d = res.data;
      const msg = d
        ? `Synced ${d.total_participants} participant${d.total_participants !== 1 ? "s" : ""} (${d.new_records} new)`
        : res.message || "Attendance synced";
      showToast(msg, "success");
      await fetchAttendance();
    } catch {
      showToast("Failed to sync attendance", "error");
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
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151" }}>
          Attendance ({count} participant{count !== 1 ? "s" : ""})
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
            Sync attendance
          </Button>
        )}
      </Box>
      <Typography variant="caption" sx={{ color: "#9ca3af", mb: 1.5, display: "block" }}>
        {syncedAt
          ? `Last synced: ${formatDateTimeShort(syncedAt)}`
          : "Never synced"}
      </Typography>
      <Typography variant="caption" sx={{ color: "#6b7280", mb: 1.5, display: "block", fontStyle: "italic" }}>
        Attendance is synced automatically when the meeting ends. Use &quot;Sync attendance&quot; to refresh or if sync hasn&apos;t run yet.
      </Typography>

      {count === 0 && neverSynced && (
        <Typography variant="body2" sx={{ color: "#6b7280", py: 1 }}>
          No attendance data. Click &quot;Sync attendance&quot; to fetch from Zoom.
        </Typography>
      )}
      {count === 0 && !neverSynced && (
        <Typography variant="body2" sx={{ color: "#6b7280", py: 1 }}>
          No participants found for this meeting.
        </Typography>
      )}

      {participants.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ overflow: "hidden" }}>
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "24%" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "24%" }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "16%" }}>Join</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "16%" }}>Leave</TableCell>
                <TableCell sx={{ fontWeight: 600, ...tableCellSx, width: "20%" }}>Duration</TableCell>
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
