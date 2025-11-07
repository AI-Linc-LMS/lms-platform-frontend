import React from "react";
import {
  Drawer,
  IconButton,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import { X, ClipboardList, ListChecks, NotebookPen, MessageSquare } from "lucide-react";
import {
  AttendanceActivity,
  AttendanceActivityDetail,
} from "../../../services/attendanceApis";

interface SessionTrackingSummaryPanelProps {
  open: boolean;
  onClose: () => void;
  activity?: AttendanceActivityDetail | null;
  activityMeta?: AttendanceActivity | null;
}

const displayOrPlaceholder = (value?: string | null, placeholder?: string) => {
  if (value && value.trim().length > 0) {
    return value;
  }
  return placeholder ?? "Not recorded";
};

const SessionTrackingSummaryPanel: React.FC<SessionTrackingSummaryPanelProps> = ({
  open,
  onClose,
  activity,
  activityMeta,
}) => {
  const trackingCards = [
    {
      label: "Topics Covered",
      value: displayOrPlaceholder(activity?.topic_covered, "No topics captured"),
      icon: <ClipboardList size={18} />,
    },
    {
      label: "Assignments Given",
      value: displayOrPlaceholder(
        activity?.assignments_given,
        "No assignments shared"
      ),
      icon: <ListChecks size={18} />,
    },
    {
      label: "Hands-on Coding",
      value: displayOrPlaceholder(
        activity?.hands_on_coding,
        "No hands-on coding notes"
      ),
      icon: <NotebookPen size={18} />,
    },
    {
      label: "Additional Comments",
      value: displayOrPlaceholder(
        activity?.additional_comments,
        "No additional comments"
      ),
      icon: <MessageSquare size={18} />,
    },
  ];

  const name = activityMeta?.name ?? activity?.name;
  const code = activityMeta?.code ?? activity?.code;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} keepMounted>
      <Box
        sx={{
          width: { xs: "90vw", sm: 420 },
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 45%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
            px: 3,
          }}
        >
          <div>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Session Tracking Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {name || "Untitled Activity"}
            </Typography>
          </div>
          <IconButton onClick={onClose} size="small">
            <X size={18} />
          </IconButton>
        </Box>
        <Divider />

        <Box sx={{ px: 3, py: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(23, 98, 122, 0.12)",
              backgroundColor: "rgba(23, 98, 122, 0.05)",
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Session Overview
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {code && (
                <Chip
                  label={`Code: ${code}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {activity?.created_by_name && (
                <Chip
                  label={`Facilitator: ${activity.created_by_name}`}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "rgba(148, 163, 184, 0.4)" }}
                />
              )}
              {activity?.created_at && (
                <Chip
                  label={`Created: ${new Date(activity.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "rgba(148, 163, 184, 0.4)" }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 2 }}>
            {trackingCards.map(({ label, value, icon }) => (
              <Box
                key={label}
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(203, 213, 225, 0.7)",
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 2px rgba(148, 163, 184, 0.2)",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: "rgba(23, 98, 122, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary-600)",
                    }}
                  >
                    {icon}
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {label}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-line",
                    color: value.startsWith("No ") ? "text.secondary" : "text.primary",
                  }}
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>

          {!activity && (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                color: "text.secondary",
                borderRadius: 2,
                border: "1px dashed rgba(148, 163, 184, 0.5)",
              }}
            >
              No session tracking data available yet.
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default SessionTrackingSummaryPanel;

