"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  AttendanceActivity,
  adminAttendanceService,
} from "@/lib/services/admin/admin-attendance.service";

interface SessionSummaryCardProps {
  activity: AttendanceActivity;
  onSave: (data: {
    title?: string;
    topic_covered?: string;
    assignments_given?: string;
    hands_on_coding?: string;
    additional_comments?: string;
  }) => void;
  onActivityUpdated?: (activity: AttendanceActivity) => void;
}

export function SessionSummaryCard({
  activity,
  onSave,
  onActivityUpdated,
}: SessionSummaryCardProps) {
  const { showToast } = useToast();
  const [syncingRecording, setSyncingRecording] = useState(false);
  const [syncingAttendance, setSyncingAttendance] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    topic_covered: "",
    assignments_given: "",
    hands_on_coding: "",
    additional_comments: "",
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        topic_covered: activity.topic_covered || "",
        assignments_given: activity.assignments_given || "",
        hands_on_coding: activity.hands_on_coding || "",
        additional_comments: activity.additional_comments || "",
      });
    }
  }, [activity]);

  const handleSave = async () => {
    setSaving(true);
    const formatPoints = (text: string): string => {
      if (!text.trim()) return "";
      const points = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      return points.join("\n");
    };

    await onSave({
      topic_covered: formatPoints(formData.topic_covered),
      assignments_given: formatPoints(formData.assignments_given),
      hands_on_coding: formatPoints(formData.hands_on_coding),
      additional_comments: formatPoints(formData.additional_comments),
    });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      topic_covered: activity.topic_covered || "",
      assignments_given: activity.assignments_given || "",
      hands_on_coding: activity.hands_on_coding || "",
      additional_comments: activity.additional_comments || "",
    });
    setEditing(false);
  };

  const formatPoints = (text: string | null | undefined): string[] => {
    if (!text) return [];
    return text.split("\n").filter((line) => line.trim());
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSyncRecording = async () => {
    try {
      setSyncingRecording(true);
      const result = await adminAttendanceService.syncRecording(activity.id);
      if (result.data?.zoom_recording_url) {
        const updated = await adminAttendanceService.getAttendanceActivity(
          activity.id
        );
        onActivityUpdated?.(updated);
        showToast(result.message || "Recording synced", "success");
      } else {
        showToast(
          result.message || "Recording still processing.",
          "info"
        );
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to sync recording";
      showToast(typeof msg === "string" ? msg : JSON.stringify(msg), "error");
    } finally {
      setSyncingRecording(false);
    }
  };

  const handleSyncAttendance = async () => {
    try {
      setSyncingAttendance(true);
      const result = await adminAttendanceService.syncAttendance(activity.id);
      const count = result.data?.synced_count;
      showToast(
        count != null
          ? `${result.message} (${count} synced)`
          : result.message || "Attendance synced",
        "success"
      );
      const updated = await adminAttendanceService.getAttendanceActivity(
        activity.id
      );
      onActivityUpdated?.(updated);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to sync attendance";
      showToast(typeof msg === "string" ? msg : JSON.stringify(msg), "error");
    } finally {
      setSyncingAttendance(false);
    }
  };

  const attendees = activity.attendees || [];
  const zoomParticipants = activity.zoom_participants || [];
  const hasRecording = Boolean(activity.zoom_recording_url?.trim());
  const showZoomParticipants =
    activity.is_zoom &&
    (zoomParticipants.length > 0 || Boolean(activity.zoom_meeting_id));

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {activity.is_zoom && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#111827",
              fontSize: { xs: "1rem", sm: "1.25rem" },
              mb: 2,
            }}
          >
            Live Session Data
          </Typography>

          <Typography
            variant="subtitle2"
            sx={{ color: "#6b7280", fontWeight: 600, mb: 1, mt: 2 }}
          >
            App Attendees
          </Typography>
          <TableContainer
            component={Box}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 1,
              mb: 2,
              overflow: "auto",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                    Marked At
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} sx={{ color: "#6b7280", py: 2 }}>
                      No attendees yet
                    </TableCell>
                  </TableRow>
                ) : (
                  attendees.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell sx={{ fontSize: "0.8125rem" }}>
                        {a.user_name}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8125rem" }}>
                        {a.user_email}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8125rem" }}>
                        {formatDate(a.marked_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {showZoomParticipants && (
            <>
              <Typography
                variant="subtitle2"
                sx={{ color: "#6b7280", fontWeight: 600, mb: 1 }}
              >
                Zoom Participants
              </Typography>
              <TableContainer
                component={Box}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                  mb: 2,
                  overflow: "auto",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                        Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                        Email
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                        Join Time
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                        Leave Time
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {zoomParticipants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ color: "#6b7280", py: 2 }}>
                          No Zoom participants yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      zoomParticipants.map((p, idx) => (
                        <TableRow key={p.id ?? idx}>
                          <TableCell sx={{ fontSize: "0.8125rem" }}>
                            {p.name}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8125rem" }}>
                            {p.user_email ?? p.email ?? "—"}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8125rem" }}>
                            {formatDate(p.join_time)}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.8125rem" }}>
                            {formatDate(p.leave_time)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2, flexWrap: "wrap" }}>
            {hasRecording ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<IconWrapper icon="mdi:play-circle" size={18} />}
                onClick={() =>
                  window.open(activity.zoom_recording_url!, "_blank")
                }
                sx={{
                  bgcolor: "#6366f1",
                  "&:hover": { bgcolor: "#4f46e5" },
                }}
              >
                Watch Recording
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                disabled={syncingRecording}
                startIcon={
                  syncingRecording ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <IconWrapper icon="mdi:sync" size={18} />
                  )
                }
                onClick={handleSyncRecording}
                sx={{ borderColor: "#6366f1", color: "#6366f1" }}
              >
                {syncingRecording ? "Syncing..." : "Sync Recording"}
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              disabled={syncingAttendance}
              startIcon={
                syncingAttendance ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <IconWrapper icon="mdi:account-sync" size={18} />
                )
              }
              onClick={handleSyncAttendance}
              sx={{ borderColor: "#6366f1", color: "#6366f1" }}
            >
              {syncingAttendance ? "Syncing..." : "Sync Attendance"}
            </Button>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 2,
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "#111827",
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
        >
          Session Summary
        </Typography>
        {!editing && (
          <Button
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:pencil" size={18} />}
            onClick={() => setEditing(true)}
            size="small"
            sx={{
              color: "#6366f1",
              borderColor: "#6366f1",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              alignSelf: { xs: "flex-start", sm: "auto" },
            }}
          >
            Edit
          </Button>
        )}
      </Box>
      {editing ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Topic Covered"
            multiline
            rows={4}
            value={formData.topic_covered}
            onChange={(e) =>
              setFormData({ ...formData, topic_covered: e.target.value })
            }
            fullWidth
            size="small"
            placeholder="Enter each point on a new line"
            helperText="Enter each point on a new line (point-wise format)"
          />
          <TextField
            label="Assignments Given"
            multiline
            rows={4}
            value={formData.assignments_given}
            onChange={(e) =>
              setFormData({
                ...formData,
                assignments_given: e.target.value,
              })
            }
            fullWidth
            size="small"
            placeholder="Enter each point on a new line"
            helperText="Enter each point on a new line (point-wise format)"
          />
          <TextField
            label="Hands-on Coding"
            multiline
            rows={4}
            value={formData.hands_on_coding}
            onChange={(e) =>
              setFormData({
                ...formData,
                hands_on_coding: e.target.value,
              })
            }
            fullWidth
            size="small"
            placeholder="Enter each point on a new line"
            helperText="Enter each point on a new line (point-wise format)"
          />
          <TextField
            label="Additional Comments"
            multiline
            rows={4}
            value={formData.additional_comments}
            onChange={(e) =>
              setFormData({
                ...formData,
                additional_comments: e.target.value,
              })
            }
            fullWidth
            size="small"
            placeholder="Enter each point on a new line"
            helperText="Enter each point on a new line (point-wise format)"
          />
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: "flex-end",
              flexDirection: { xs: "column-reverse", sm: "row" },
            }}
          >
            <Button
              onClick={handleCancel}
              variant="outlined"
              size="small"
              fullWidth
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                maxWidth: { xs: "100%", sm: "auto" },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={saving}
              size="small"
              fullWidth
              sx={{
                bgcolor: "#6366f1",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                maxWidth: { xs: "100%", sm: "auto" },
              }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {formatPoints(activity.topic_covered).length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#6b7280", fontWeight: 600, mb: 1 }}
              >
                Topic Covered
              </Typography>
              {formatPoints(activity.topic_covered)[0] && (
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, mb: 1, color: "#111827" }}
                >
                  {formatPoints(activity.topic_covered)[0]}
                </Typography>
              )}
              {formatPoints(activity.topic_covered).length > 1 && (
                <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                  {formatPoints(activity.topic_covered)
                    .slice(1)
                    .map((point, index) => (
                      <li key={index}>
                        <Typography variant="body2">{point}</Typography>
                      </li>
                    ))}
                </Box>
              )}
            </Box>
          )}
          {formatPoints(activity.assignments_given).length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#6b7280", fontWeight: 600, mb: 1 }}
              >
                Assignments Given
              </Typography>
              <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                {formatPoints(activity.assignments_given).map(
                  (point, index) => (
                    <li key={index}>
                      <Typography variant="body2">{point}</Typography>
                    </li>
                  )
                )}
              </Box>
            </Box>
          )}
          {formatPoints(activity.hands_on_coding).length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#6b7280", fontWeight: 600, mb: 1 }}
              >
                Hands-on Coding
              </Typography>
              <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                {formatPoints(activity.hands_on_coding).map((point, index) => (
                  <li key={index}>
                    <Typography variant="body2">{point}</Typography>
                  </li>
                ))}
              </Box>
            </Box>
          )}
          {formatPoints(activity.additional_comments).length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#6b7280", fontWeight: 600, mb: 1 }}
              >
                Additional Comments
              </Typography>
              <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                {formatPoints(activity.additional_comments).map(
                  (point, index) => (
                    <li key={index}>
                      <Typography variant="body2">{point}</Typography>
                    </li>
                  )
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
