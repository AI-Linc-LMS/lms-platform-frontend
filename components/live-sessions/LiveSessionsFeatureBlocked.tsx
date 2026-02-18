"use client";

import Link from "next/link";
import { Paper, Typography, Button } from "@mui/material";

export function LiveSessionsFeatureBlocked() {
  return (
    <Paper
      sx={{
        p: 5,
        textAlign: "center",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
      }}
    >
      <Typography variant="h6" sx={{ color: "#374151", mb: 1 }}>
        Live sessions are not enabled for your organization
      </Typography>
      <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
        This feature is not available. Contact your administrator if you believe
        this is an error.
      </Typography>
      <Button component={Link} href="/dashboard" variant="contained">
        Back to dashboard
      </Button>
    </Paper>
  );
}
