"use client";

import { Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export function LiveSessionsEmptyState() {
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
        No live sessions at the moment
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280" }}>
        There are no Zoom live sessions scheduled. Check back later or contact
        your instructor.
      </Typography>
    </Paper>
  );
}
