"use client";

import { Chip } from "@mui/material";
import { memo } from "react";
import type { ApplicationStatus } from "@/lib/job-portal-v2";

const statusConfig: Record<
  ApplicationStatus,
  { label: string; color: "default" | "primary" | "success" | "error" }
> = {
  applied: { label: "Applied", color: "default" },
  shortlisted: { label: "Shortlisted", color: "primary" },
  rejected: { label: "Rejected", color: "error" },
  selected: { label: "Selected", color: "success" },
};

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: "small" | "medium";
}

const StatusBadgeComponent = ({ status, size = "small" }: StatusBadgeProps) => {
  const config = statusConfig[status] ?? {
    label: status,
    color: "default" as const,
  };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{
        textTransform: "capitalize",
        fontWeight: 600,
      }}
    />
  );
};

export const StatusBadge = memo(StatusBadgeComponent);
StatusBadge.displayName = "StatusBadge";
