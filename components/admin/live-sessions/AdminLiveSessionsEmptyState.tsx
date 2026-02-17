"use client";

import { Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export function AdminLiveSessionsEmptyState() {
  return (
    <Paper
      sx={{
        p: 5,
        textAlign: "center",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
      }}
    >
      <IconWrapper
        icon="mdi:video-off-outline"
        size={72}
        color="#9ca3af"
      />
      <Typography variant="h6" sx={{ color: "#374151", mt: 2, mb: 1 }}>
        No live sessions yet
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
        There are no Zoom live sessions at the moment.
      </Typography>
      <Typography variant="body2" sx={{ color: "#9ca3af" }}>
        Create a live session to get started.
      </Typography>
    </Paper>
  );
}
