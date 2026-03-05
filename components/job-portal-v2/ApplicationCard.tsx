"use client";

import { Paper, Typography, Box, Button } from "@mui/material";
import Link from "next/link";
import { memo } from "react";
import { StatusBadge } from "./StatusBadge";
import type { Application, ApplicationStatus } from "@/lib/job-portal-v2";

interface ApplicationCardProps {
  application: Application;
}

const ApplicationCardComponent = ({ application }: ApplicationCardProps) => {
  const status = (application.status ?? "applied") as ApplicationStatus;
  const appliedDate = application.applied_at
    ? new Date(application.applied_at).toLocaleDateString()
    : "";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {application.job_role ?? "Job"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {application.job_company_name ?? "Company"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Applied: {appliedDate}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexShrink: 0,
            alignSelf: { xs: "flex-start", sm: "center" },
          }}
        >
          <StatusBadge status={status} />
          <Button
            variant="outlined"
            size="small"
            component={Link}
            href={`/job-portal/job?id=${application.job}`}
            sx={{
              borderColor: "#6366f1",
              color: "#6366f1",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#4f46e5",
                backgroundColor: "rgba(99, 102, 241, 0.05)",
              },
            }}
          >
            View Job
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export const ApplicationCard = memo(ApplicationCardComponent);
ApplicationCard.displayName = "ApplicationCard";
