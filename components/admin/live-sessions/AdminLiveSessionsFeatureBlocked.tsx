"use client";

import Link from "next/link";
import { Paper, Typography, Button } from "@mui/material";

export function AdminLiveSessionsFeatureBlocked() {
  return (
    <Paper
      sx={{
        p: 5,
        textAlign: "center",
        borderRadius: 2,
        border: "1px solid var(--border-default)",
      }}
    >
      <Typography variant="h6" sx={{ color: "var(--font-muted)", mb: 1 }}>
        Live sessions are not enabled for your profile
      </Typography>
      <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 2 }}>
        This feature is not available. Contact your administrator if you
        believe this is an error.
      </Typography>
      <Button component={Link} href="/admin/dashboard" variant="contained">
        Back to admin dashboard
      </Button>
    </Paper>
  );
}
