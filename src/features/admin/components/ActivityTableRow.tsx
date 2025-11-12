import React, { useState } from "react";
import { TableRow, TableCell, IconButton, Chip, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  AttendanceActivity,
  updateSessionTracking,
} from "../../../services/attendanceApis";
import SessionTrackingModal from "./SessionTrackingModal";
import { ClipboardList, FileText } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "../../../contexts/ToastContext";

interface SessionTrackingData {
  topicsCovered: string;
  assignmentsGiven: string;
  handsOnCoding: string;
  additionalComments: string;
}

interface ActivityTableRowProps {
  activity: AttendanceActivity;
  onViewRecords: (activity: AttendanceActivity) => void;
  onShowSummary: (activity: AttendanceActivity, forceRefresh?: boolean) => void;
}

const ActivityTableRow: React.FC<ActivityTableRowProps> = ({
  activity,
  onViewRecords,
  onShowSummary,
}) => {
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const clientId = Number(import.meta.env.VITE_CLIENT_ID);

  const trackingMutation = useMutation({
    mutationFn: async (data: SessionTrackingData) => {
      return updateSessionTracking(clientId, activity.id, {
        topic_covered: data.topicsCovered,
        assignments_given: data.assignmentsGiven || undefined,
        hands_on_coding: data.handsOnCoding || undefined,
        additional_comments: data.additionalComments || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance-activities", clientId],
      });
      setTrackingModalOpen(false);
      success(
        "Session Tracking Saved",
        "Session tracking data has been saved successfully."
      );
      onShowSummary(activity, true);
    },
    onError: (err) => {
      console.error("Failed to save session tracking:", err);
      error("Failed to Save", "Could not save session tracking data. Please try again.");
    },
  });

  const handleSaveTracking = (data: SessionTrackingData) => {
    trackingMutation.mutate(data);
  };

  const hasTrackingData = Boolean(
    activity.topic_covered ||
    activity.assignments_given ||
    activity.hands_on_coding ||
    activity.additional_comments
  );

  return (
    <>
      <TableRow>
        <TableCell sx={{ fontFamily: "inherit" }}>{activity.name}</TableCell>
        <TableCell sx={{ fontFamily: "inherit" }}>
          {activity.is_active && activity.code ? (
            <span className="font-mono font-bold text-lg text-[var(--primary-500)]">
              {activity.code}
            </span>
          ) : (
            "-"
          )}
        </TableCell>
        <TableCell sx={{ fontFamily: "inherit" }}>
          {activity.duration_minutes || "-"}
        </TableCell>
        <TableCell sx={{ fontFamily: "inherit" }}>
          <Chip
            sx={{ fontFamily: "inherit" }}
            label={activity.is_valid ? "Valid" : "Expired"}
            color={activity.is_valid ? "success" : "error"}
            size="small"
          />
        </TableCell>
        <TableCell sx={{ fontFamily: "inherit" }}>
          {activity.created_by_name || "-"}
        </TableCell>
        <TableCell sx={{ fontFamily: "inherit" }}>
          {new Date(activity.created_at).toLocaleString("en-IN", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </TableCell>
        <TableCell sx={{ fontFamily: "inherit" }}>
          {new Date(activity.expires_at).toLocaleString("en-IN", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </TableCell>
        <TableCell sx={{ fontFamily: "inherit" }}>
          {activity.attendees_count || 0}
        </TableCell>
        <TableCell align="center" sx={{ fontFamily: "inherit" }}>
          <div className="flex gap-1 justify-center">
            <Tooltip title="Edit Session Tracking" arrow>
              <IconButton
                size="small"
                onClick={() => setTrackingModalOpen(true)}
                sx={{
                  color: hasTrackingData ? "var(--primary-600)" : "#9CA3AF",
                  backgroundColor: hasTrackingData
                    ? "rgba(23, 98, 122, 0.08)"
                    : "transparent",
                  border: hasTrackingData ? "1px solid rgba(23, 98, 122, 0.12)" : "1px solid transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(23, 98, 122, 0.12)",
                    color: "var(--primary-600)",
                    borderColor: "rgba(23, 98, 122, 0.24)",
                  },
                }}
              >
                <ClipboardList size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Session Summary" arrow>
              <IconButton
                size="small"
                onClick={() => onShowSummary(activity)}
                sx={{
                  color: hasTrackingData ? "var(--primary-500)" : "#9CA3AF",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(23, 98, 122, 0.08)",
                    color: "var(--primary-600)",
                  },
                }}
              >
                <FileText size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Attendance Records" arrow>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onViewRecords(activity)}
                sx={{
                  color: "var(--primary-500)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(23, 98, 122, 0.08)",
                    color: "var(--primary-600)",
                  },
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>

      <SessionTrackingModal
        open={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        activityName={activity.name}
        activityId={activity.id}
        onSave={handleSaveTracking}
        initialData={{
          topic_covered: activity.topic_covered,
          assignments_given: activity.assignments_given,
          hands_on_coding: activity.hands_on_coding,
          additional_comments: activity.additional_comments,
        }}
      />
    </>
  );
};

export default ActivityTableRow;
