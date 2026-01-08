"use client";

import { Box, Typography, Paper, Chip } from "@mui/material";
import { AttendanceActivity } from "@/lib/services/admin/admin-attendance.service";

interface ActivityDetailsCardProps {
  activity: AttendanceActivity;
}

export function ActivityDetailsCard({ activity }: ActivityDetailsCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        mb: 0,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#6b7280",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            Code
          </Typography>
          <Chip
            label={activity.code}
            sx={{
              bgcolor: "#eef2ff",
              color: "#6366f1",
              fontWeight: 600,
              fontFamily: "monospace",
              mt: 0.5,
              display: "block",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              height: { xs: 24, sm: 32 },
            }}
          />
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#6b7280",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            Duration
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5, 
              fontWeight: 500,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {activity.duration_minutes} minutes
          </Typography>
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#6b7280",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            Status
          </Typography>
          <Box
            sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}
          >
            <Chip
              label={activity.is_active ? "Active" : "Inactive"}
              size="small"
              sx={{
                bgcolor: activity.is_active ? "#d1fae5" : "#fee2e2",
                color: activity.is_active ? "#065f46" : "#991b1b",
                fontWeight: 600,
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                height: { xs: 20, sm: 24 },
              }}
            />
            {activity.is_valid && (
              <Chip
                label="Valid"
                size="small"
                sx={{
                  bgcolor: "#dbeafe",
                  color: "#1e40af",
                  fontWeight: 600,
                  fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  height: { xs: 20, sm: 24 },
                }}
              />
            )}
          </Box>
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#6b7280",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            Created
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {formatDate(activity.created_at)}
          </Typography>
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#6b7280",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            Expires At
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {formatDate(activity.expires_at)}
          </Typography>
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#6b7280",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            Created By
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {activity.created_by_name}
          </Typography>
        </Box>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: "#6b7280",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            Attendees Count
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 0.5, 
              fontWeight: 500,
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            }}
          >
            {activity.attendees_count}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

