import React, { useState } from "react";
import { TableRow, TableCell, IconButton, Chip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { AttendanceActivity } from "../../../services/attendanceApis";

interface ActivityTableRowProps {
  activity: AttendanceActivity;
  onViewRecords: (activity: AttendanceActivity) => void;
  onCopyCode: (code: string) => void;
}

const ActivityTableRow: React.FC<ActivityTableRowProps> = ({
  activity,
  onViewRecords,
  onCopyCode,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (activity.code) {
      onCopyCode(activity.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
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
          label={activity.is_active ? "Active" : "Inactive"}
          color={activity.is_active ? "success" : "error"}
          size="small"
        />
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
          {activity.is_active && activity.code && (
            <IconButton
              size="small"
              color={copied ? "success" : "primary"}
              onClick={handleCopy}
              title="Copy Code"
            >
              {copied ? (
                <CheckIcon fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          )}
          <IconButton
            size="small"
            color="primary"
            onClick={() => onViewRecords(activity)}
            title="View Attendees"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ActivityTableRow;
